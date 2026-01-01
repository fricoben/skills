import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// Max batches to fetch content for (to prevent timeout on large exports)
const MAX_CONTENT_BATCHES = 100

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const playerUuid = request.nextUrl.searchParams.get('player_uuid')
  const startTimeParam = request.nextUrl.searchParams.get('start_time')
  const endTimeParam = request.nextUrl.searchParams.get('end_time')

  if (!playerUuid) {
    return NextResponse.json({ error: 'Missing player_uuid parameter' }, { status: 400 })
  }

  if (!startTimeParam) {
    return NextResponse.json({ error: 'Missing start_time parameter' }, { status: 400 })
  }

  // Parse and normalize timestamps to ISO format
  const startTime = new Date(startTimeParam).toISOString()
  const endTime = endTimeParam ? new Date(endTimeParam).toISOString() : null

  try {
    // Find session_ids from findings table for this player in the time window
    // The findings table links player_uuid to session_id
    let findingsQuery = supabase
      .from('findings')
      .select('session_id')
      .eq('player_uuid', playerUuid)
      .gte('created_at', startTime)
    
    if (endTime) {
      findingsQuery = findingsQuery.lte('created_at', endTime)
    }

    const { data: findings, error: findingsError } = await findingsQuery

    // Get unique session_ids from findings
    let sessionIds: string[] = []
    if (!findingsError && findings && findings.length > 0) {
      sessionIds = [...new Set(findings.map(f => f.session_id).filter(Boolean))]
    }

    // If no findings, try to find sessions from batch_index directly via server_players
    // First get the server_id for this player
    if (sessionIds.length === 0) {
      const { data: serverPlayers, error: spError } = await supabase
        .from('server_players')
        .select('server_id')
        .eq('player_uuid', playerUuid)

      if (!spError && serverPlayers && serverPlayers.length > 0) {
        // Get batches from all servers where this player played
        const serverIds = [...new Set(serverPlayers.map(sp => sp.server_id))]
        
        let batchQuery = supabase
          .from('batch_index')
          .select('session_id')
          .in('server_id', serverIds)
          .gte('received_at', startTime)
        
        if (endTime) {
          batchQuery = batchQuery.lte('received_at', endTime)
        }

        const { data: directBatches, error: directError } = await batchQuery

        if (!directError && directBatches && directBatches.length > 0) {
          sessionIds = [...new Set(directBatches.map(b => b.session_id).filter(Boolean))]
        }
      }
    }

    if (sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'No session data found for the specified player and time window. The player may not have been tracked during this period.' },
        { status: 404 }
      )
    }

    // Query batch_index for matching logs by session_id and time
    let query = supabase
      .from('batch_index')
      .select('*')
      .in('session_id', sessionIds)
      .gte('received_at', startTime)
      .order('received_at', { ascending: true })

    if (endTime) {
      query = query.lte('received_at', endTime)
    }

    const { data: batches, error } = await query

    if (error) {
      console.error('Error querying batch_index:', error)
      throw new Error(error.message)
    }

    if (!batches || batches.length === 0) {
      return NextResponse.json(
        { error: 'No logs found for the specified player and time window' },
        { status: 404 }
      )
    }

    // Fetch log content in PARALLEL (major performance improvement)
    const apiUrl = process.env.ASYNCANTICHEAT_API_URL
    const batchesToFetch = batches.slice(0, MAX_CONTENT_BATCHES)
    
    // Parallel fetch function
    const fetchBatchContent = async (batch: typeof batches[0]): Promise<{ batch_id: string; metadata: unknown; content?: unknown }> => {
      const logEntry: { batch_id: string; metadata: unknown; content?: unknown } = {
        batch_id: batch.id,
        metadata: {
          server_id: batch.server_id,
          session_id: batch.session_id,
          s3_key: batch.s3_key,
          received_at: batch.received_at,
          event_count: batch.event_count,
          payload_bytes: batch.payload_bytes,
          min_ts: batch.min_ts,
          max_ts: batch.max_ts,
        },
      }

      if (!batch.s3_key) return logEntry

      // Try external API first
      if (apiUrl) {
        try {
          const response = await fetch(
            `${apiUrl}/internal/logs/download?key=${encodeURIComponent(batch.s3_key)}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.ASYNCANTICHEAT_INTERNAL_TOKEN}`,
              },
            }
          )

          if (response.ok) {
            const content = await response.json()
            logEntry.content = content
            return logEntry
          }
        } catch {
          // Fall through to Supabase Storage
        }
      }

      // Try Supabase Storage as fallback
      try {
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('anticheat-logs')
          .download(batch.s3_key)

        if (!storageError && storageData) {
          const text = await storageData.text()
          try {
            logEntry.content = JSON.parse(text)
          } catch {
            logEntry.content = text
          }
        }
      } catch {
        // Storage not configured, skip
      }

      return logEntry
    }

    // Execute all fetches in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 10
    const logsData: Array<{ batch_id: string; metadata: unknown; content?: unknown }> = []
    
    for (let i = 0; i < batchesToFetch.length; i += CONCURRENCY_LIMIT) {
      const chunk = batchesToFetch.slice(i, i + CONCURRENCY_LIMIT)
      const results = await Promise.all(chunk.map(fetchBatchContent))
      logsData.push(...results)
    }

    // Add metadata-only entries for batches beyond the limit
    if (batches.length > MAX_CONTENT_BATCHES) {
      for (const batch of batches.slice(MAX_CONTENT_BATCHES)) {
        logsData.push({
          batch_id: batch.id,
          metadata: {
            server_id: batch.server_id,
            session_id: batch.session_id,
            s3_key: batch.s3_key,
            received_at: batch.received_at,
            event_count: batch.event_count,
            payload_bytes: batch.payload_bytes,
            min_ts: batch.min_ts,
            max_ts: batch.max_ts,
            content_skipped: true,
            reason: `Content fetch limited to first ${MAX_CONTENT_BATCHES} batches`
          },
        })
      }
    }

    // Prepare export data
    const exportData = {
      player_uuid: playerUuid,
      time_window: {
        start: startTime,
        end: endTime || 'now',
      },
      total_batches: batches.length,
      batches_with_content: Math.min(batches.length, MAX_CONTENT_BATCHES),
      total_events: batches.reduce((sum, b) => sum + (b.event_count || 0), 0),
      exported_at: new Date().toISOString(),
      logs: logsData,
    }

    // Return as downloadable JSON
    const filename = `anticheat-logs-${playerUuid.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting logs:', error)
    return NextResponse.json(
      { error: 'Failed to export logs' },
      { status: 500 }
    )
  }
}

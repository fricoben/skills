import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

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

  const key = request.nextUrl.searchParams.get('key')

  if (!key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 })
  }

  try {
    // For now, we'll try to fetch the log data from the batch_index metadata
    // In a production setup, this would fetch from S3 or the object store
    
    // Option 1: Try to get from Supabase Storage (if configured)
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('anticheat-logs')
      .download(key)

    if (!storageError && storageData) {
      return new NextResponse(storageData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${key.split('/').pop() || 'batch.json'}"`,
        },
      })
    }

    // Option 2: The file might be stored on the AsyncAnticheat API server
    // In this case, we'd need to proxy the request through the API
    const apiUrl = process.env.ASYNCANTICHEAT_API_URL
    if (apiUrl) {
      const response = await fetch(`${apiUrl}/internal/logs/download?key=${encodeURIComponent(key)}`, {
        headers: {
          'Authorization': `Bearer ${process.env.ASYNCANTICHEAT_INTERNAL_TOKEN}`,
        },
      })

      if (response.ok) {
        const data = await response.blob()
        return new NextResponse(data, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${key.split('/').pop() || 'batch.json'}"`,
          },
        })
      }
    }

    // Option 3: Return metadata about the batch if we can't get the actual file
    const { data: batchData } = await supabase
      .from('batch_index')
      .select('*')
      .eq('s3_key', key)
      .single()

    if (batchData) {
      // Return the batch metadata as JSON
      const metadata = {
        id: batchData.id,
        server_id: batchData.server_id,
        player_uuid: batchData.player_uuid,
        session_id: batchData.session_id,
        s3_key: batchData.s3_key,
        batch_timestamp: batchData.batch_timestamp,
        received_at: batchData.received_at,
        packet_count: batchData.packet_count,
        byte_size: batchData.byte_size,
        processing_status: batchData.processing_status,
        metadata: batchData.metadata,
        _note: 'Full log data is stored on the API server. Configure S3 or proxy through AsyncAnticheat API to enable downloads.',
      }

      return new NextResponse(JSON.stringify(metadata, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="batch-${batchData.id.slice(0, 8)}.json"`,
        },
      })
    }

    return NextResponse.json(
      { error: 'Log not found. The file may be stored on the AsyncAnticheat API server.' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error downloading log:', error)
    return NextResponse.json(
      { error: 'Failed to download log' },
      { status: 500 }
    )
  }
}

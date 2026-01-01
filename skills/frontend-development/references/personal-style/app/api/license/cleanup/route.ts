import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// Cleanup duplicate licenses - keeps only the oldest license per transaction_id
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const admin = getSupabaseAdmin()

  // Get user from session
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all licenses for this user
  const { data: licenses, error: licensesError } = await admin
    .from('licenses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (licensesError || !licenses) {
    return NextResponse.json({ error: 'Failed to fetch licenses' }, { status: 500 })
  }

  // Group by transaction_id and find duplicates
  const seenTransactionIds = new Map<string, string>() // transaction_id -> first license id
  const duplicateIds: string[] = []

  for (const license of licenses) {
    const txId = license.metadata?.transaction_id
    if (txId) {
      if (seenTransactionIds.has(txId)) {
        // This is a duplicate - mark for deletion
        duplicateIds.push(license.id)
      } else {
        // First occurrence - keep it
        seenTransactionIds.set(txId, license.id)
      }
    }
  }

  // Delete duplicates
  if (duplicateIds.length > 0) {
    const { error: deleteError } = await admin
      .from('licenses')
      .delete()
      .in('id', duplicateIds)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete duplicates' }, { status: 500 })
    }
  }

  return NextResponse.json({
    success: true,
    deleted: duplicateIds.length,
    remaining: licenses.length - duplicateIds.length
  })
}


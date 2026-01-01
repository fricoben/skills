import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  getDiscordIdFromIdentities,
  getInsiderRoleId,
  removeMemberRole
} from '@/lib/discord'
import { NextResponse } from 'next/server'

export async function POST() {
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

  // Check if user is a beta member
  const { data: membership } = await admin
    .from('beta_members')
    .select('id, left_at')
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.left_at) {
    return NextResponse.json(
      { error: 'You are not a beta member' },
      { status: 400 }
    )
  }

  // Leave the beta program (soft delete)
  const { error: updateError } = await admin
    .from('beta_members')
    .update({ left_at: new Date().toISOString() })
    .eq('id', membership.id)

  if (updateError) {
    console.error('Failed to leave beta:', updateError)
    return NextResponse.json(
      { error: 'Failed to leave beta program' },
      { status: 500 }
    )
  }

  // Remove Discord insider role if connected
  const discordId = getDiscordIdFromIdentities(user.identities)
  const insiderRoleId = getInsiderRoleId()

  if (discordId && insiderRoleId) {
    const roleResult = await removeMemberRole(discordId, insiderRoleId)
    if (!roleResult.success) {
      console.error('Failed to remove insider role:', roleResult.error)
      // Don't fail the request - membership is already updated
    }
  }

  return NextResponse.json({ success: true })
}

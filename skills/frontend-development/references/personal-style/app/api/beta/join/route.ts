import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  getDiscordIdFromIdentities,
  getInsiderRoleId,
  addMemberRole
} from '@/lib/discord'
import { NextResponse } from 'next/server'

const MAX_BETA_MEMBERS = parseInt(process.env.BETA_MAX_MEMBERS || '100', 10)

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

  // TEMPORARILY DISABLED: License check for beta access
  // const { data: licenses } = await admin
  //   .from('licenses')
  //   .select('id')
  //   .eq('user_id', user.id)
  //   .eq('is_active', true)
  //   .limit(1)
  //
  // if (!licenses || licenses.length === 0) {
  //   return NextResponse.json(
  //     { error: 'You need an active license to join the beta program' },
  //     { status: 403 }
  //   )
  // }

  // Check if already a member
  const { data: existingMembership } = await admin
    .from('beta_members')
    .select('id, left_at')
    .eq('user_id', user.id)
    .single()

  if (existingMembership && !existingMembership.left_at) {
    return NextResponse.json(
      { error: 'You are already a beta member' },
      { status: 400 }
    )
  }

  // Check available spots (count active members)
  const { count } = await admin
    .from('beta_members')
    .select('*', { count: 'exact', head: true })
    .is('left_at', null)

  if (count !== null && count >= MAX_BETA_MEMBERS) {
    return NextResponse.json(
      { error: 'Beta program is currently full. Please try again later.' },
      { status: 400 }
    )
  }

  // Join or rejoin the beta program
  if (existingMembership) {
    // Rejoin: clear left_at and update joined_at
    const { error: updateError } = await admin
      .from('beta_members')
      .update({ left_at: null, joined_at: new Date().toISOString() })
      .eq('id', existingMembership.id)

    if (updateError) {
      console.error('Failed to rejoin beta:', updateError)
      return NextResponse.json(
        { error: 'Failed to join beta program' },
        { status: 500 }
      )
    }
  } else {
    // New membership
    const { error: insertError } = await admin
      .from('beta_members')
      .insert({ user_id: user.id })

    if (insertError) {
      console.error('Failed to join beta:', insertError)
      return NextResponse.json(
        { error: 'Failed to join beta program' },
        { status: 500 }
      )
    }
  }

  // Add Discord insider role if connected
  const discordId = getDiscordIdFromIdentities(user.identities)
  const insiderRoleId = getInsiderRoleId()

  if (discordId && insiderRoleId) {
    const roleResult = await addMemberRole(discordId, insiderRoleId)
    if (!roleResult.success) {
      console.error('Failed to add insider role:', roleResult.error)
      // Don't fail the request - membership is already created
    }
  }

  return NextResponse.json({ success: true })
}

import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  getDiscordIdFromIdentities,
  getDiscordRolesForLicenseTypes,
  removeMemberRoles
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

  // Find Discord identity
  const discordIdentity = user.identities?.find((i) => i.provider === 'discord')
  if (!discordIdentity) {
    return NextResponse.json(
      { error: 'Discord not connected' },
      { status: 400 }
    )
  }

  const discordId = getDiscordIdFromIdentities(user.identities)

  // Get user's active licenses to know which roles to remove
  const { data: licenses } = await admin
    .from('licenses')
    .select('id, license_type')
    .eq('user_id', user.id)
    .eq('is_active', true)

  // Unlink Discord identity first - if this fails, we haven't changed anything
  const { error: unlinkError } = await supabase.auth.unlinkIdentity(
    discordIdentity
  )

  if (unlinkError) {
    console.error('Failed to unlink Discord:', unlinkError)
    return NextResponse.json(
      { error: 'Failed to unlink Discord' },
      { status: 500 }
    )
  }

  // Remove Discord roles from the old account (best effort - identity is already unlinked)
  // Licenses stay active - when user connects a new Discord, roles will be re-added via auth callback
  if (discordId && licenses && licenses.length > 0) {
    const licenseTypes = licenses.map((l) => l.license_type)
    const roleIds = getDiscordRolesForLicenseTypes(licenseTypes)

    if (roleIds.length > 0) {
      const roleResult = await removeMemberRoles(discordId, roleIds)
      if (!roleResult.success) {
        console.error('Failed to remove Discord roles:', roleResult.errors)
        // Don't fail - the unlink was successful, roles are just orphaned
      }
    }
  }

  return NextResponse.json({ success: true })
}

import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { BetaClient } from './beta-client'

export const metadata = {
  title: 'Beta Program',
  robots: 'noindex, nofollow'
}

export default async function BetaPage() {
  const supabase = await createClient()
  const admin = getSupabaseAdmin()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  let profile = null
  let licenses: Array<{
    id: string
    license_type: string
    is_active: boolean
  }> = []
  let isBetaMember = false
  let spotsRemaining: number | null = null

  if (user) {
    // Get profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = profileData

    // Get licenses
    const { data: licensesData } = await supabase
      .from('licenses')
      .select('id, license_type, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
    licenses = licensesData || []

    // Check beta membership
    const { data: membership } = await admin
      .from('beta_members')
      .select('id, left_at')
      .eq('user_id', user.id)
      .single()
    
    isBetaMember = !!(membership && !membership.left_at)
  }

  // Get spots remaining (visible to everyone)
  const MAX_BETA_MEMBERS = parseInt(process.env.BETA_MAX_MEMBERS || '100', 10)
  const { count } = await admin
    .from('beta_members')
    .select('*', { count: 'exact', head: true })
    .is('left_at', null)

  spotsRemaining = count !== null ? MAX_BETA_MEMBERS - count : null

  return (
    <BetaClient
      user={user}
      profile={profile}
      licenses={licenses}
      isBetaMember={isBetaMember}
      spotsRemaining={spotsRemaining}
    />
  )
}

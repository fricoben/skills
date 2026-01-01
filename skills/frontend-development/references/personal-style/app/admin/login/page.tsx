import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { AdminLoginClient } from './login-client'

export const metadata = {
  title: 'Admin Login',
  robots: 'noindex, nofollow'
}

export default async function AdminLoginPage() {
  const supabase = await createClient()
  const admin = getSupabaseAdmin()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (user) {
    // Check if user is admin or manager
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin' || profile?.role === 'manager') {
      redirect('/admin/members')
    }
  }

  return <AdminLoginClient user={user} />
}

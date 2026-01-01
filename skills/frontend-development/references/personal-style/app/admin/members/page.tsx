import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { AdminShell } from '../components/admin-shell'
import { MembersContent } from './members-content'

export const metadata = {
  title: 'Members | Admin Dashboard',
  robots: 'noindex, nofollow'
}

export default async function MembersPage() {
  const supabase = await createClient()
  const admin = getSupabaseAdmin()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Check if user is admin or manager
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    redirect('/')
  }

  return (
    <AdminShell user={user}>
      <MembersContent />
    </AdminShell>
  )
}

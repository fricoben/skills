import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { AdminShell } from '../../components/admin-shell'
import { LogsContent } from './logs-content'

export default async function LogsPage() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Check for admin or manager role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    redirect('/')
  }

  return (
    <AdminShell user={user}>
      <LogsContent />
    </AdminShell>
  )
}

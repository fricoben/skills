import { redirect } from 'next/navigation'

// Redirect to new location in AsyncAnticheat section
export default function ReportsPage() {
  redirect('/admin/anticheat/reports')
}

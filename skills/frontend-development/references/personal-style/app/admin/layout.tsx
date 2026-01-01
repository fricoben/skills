export const metadata = {
  title: 'Admin Dashboard',
  robots: 'noindex, nofollow'
}

export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Auth is checked in individual pages (members/page.tsx checks for admin role)
  // Login page needs to be accessible without auth
  return <>{children}</>
}

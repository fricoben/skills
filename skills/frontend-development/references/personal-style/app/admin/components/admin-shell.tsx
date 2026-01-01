'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import styles from './admin-shell.module.css'

interface AdminShellProps {
  children: React.ReactNode
  user: User
}

interface NavItem {
  href: string
  label: string
  icon: string
}

interface NavSection {
  id: string
  label: string
  icon: string
  items: NavItem[]
}

const topNavItems: NavItem[] = [
  { href: '/admin/members', label: 'Members', icon: '👥' },
  { href: '/admin/beta', label: 'Beta Program', icon: '🚀' },
]

const navSections: NavSection[] = [
  {
    id: 'asyncanticheat',
    label: 'AsyncAnticheat',
    icon: '🛡️',
    items: [
      { href: '/admin/anticheat/servers', label: 'Servers', icon: '🖥️' },
      { href: '/admin/anticheat/reports', label: 'Reports', icon: '📋' },
      { href: '/admin/anticheat/logs', label: 'Logs', icon: '📊' },
    ]
  }
]

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  // Auto-expand section if current path is within it
  useEffect(() => {
    navSections.forEach((section) => {
      const isInSection = section.items.some(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      )
      if (isInSection) {
        setExpandedSections((prev) => ({ ...prev, [section.id]: true }))
      }
    })
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/admin" className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>Admin</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          {/* Top level nav items */}
          {topNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            )
          })}

          {/* Collapsible sections */}
          {navSections.map((section) => {
            const isExpanded = expandedSections[section.id]
            const isSectionActive = section.items.some(
              (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
            )

            return (
              <div key={section.id} className={styles.navSection}>
                <button
                  className={`${styles.navSectionHeader} ${isSectionActive ? styles.navSectionHeaderActive : ''}`}
                  onClick={() => toggleSection(section.id)}
                >
                  <span className={styles.navIcon}>{section.icon}</span>
                  <span className={styles.navLabel}>{section.label}</span>
                  <span className={`${styles.navChevron} ${isExpanded ? styles.navChevronOpen : ''}`}>
                    ›
                  </span>
                </button>
                {isExpanded && (
                  <div className={styles.navSubItems}>
                    {section.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`${styles.navSubItem} ${isActive ? styles.navSubItemActive : ''}`}
                        >
                          <span className={styles.navSubIcon}>{item.icon}</span>
                          <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.user}>
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className={styles.userAvatarImg}
              />
            ) : (
              <div className={styles.userAvatar}>
                {(user.email || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin'}
              </div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
          </div>
          <button onClick={handleSignOut} className={styles.signoutBtn}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}

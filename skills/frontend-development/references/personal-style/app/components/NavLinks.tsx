'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties, ReactNode, ReactElement } from 'react'

function NavLink({
  href,
  children
}: {
  href: string
  children: ReactNode
}): ReactElement {
  const pathname = usePathname() ?? '/'
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

  const style: CSSProperties = {
    marginRight: 12,
    textDecoration: isActive ? 'none' : 'underline',
    opacity: isActive ? 0.6 : 1
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      style={style}
    >
      {children as ReactNode}
    </Link>
  )
}

export default function NavLinks(): ReactElement {
  return (
    <>
      <NavLink href="/posts">Posts</NavLink>
      <NavLink href="/art">Art</NavLink>
      <NavLink href="/quests">Quests</NavLink>
    </>
  )
}

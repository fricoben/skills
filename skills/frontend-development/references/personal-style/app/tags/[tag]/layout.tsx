import type { ReactNode } from 'react'

export default function PostsLayout({
  children
}: {
  children: ReactNode
}): ReactNode {
  return <div className="is-posts">{children}</div>
}

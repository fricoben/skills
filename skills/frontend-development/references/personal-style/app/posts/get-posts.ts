import { getPageMap } from 'nextra/page-map'
import type { PageMapItem, MdxFile } from 'nextra'
import type { BlogMetadata } from 'nextra-theme-blog'

type PostFrontMatter = {
  title?: string
  date?: string
  tag?: string | string[]
  description?: string
  author?: string
  type?: string
}

export type PostListItem = {
  route: string
  frontMatter: BlogMetadata
  tagRaw?: string | string[]
}

export function normalizeTags(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value))
    return (value as unknown[]).filter(Boolean) as string[]
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export async function getPosts(): Promise<PostListItem[]> {
  const pageMap = await getPageMap()
  const posts: PostListItem[] = []

  function walk(items: PageMapItem[]): void {
    if (!Array.isArray(items)) return
    for (const item of items) {
      const route: string = (item as any)?.route || (item as any)?.href || ''
      const fmUnknown = ((item as any)?.frontMatter || (item as any)?.data) as
        | Record<string, unknown>
        | undefined

      const type =
        typeof fmUnknown?.['type'] === 'string'
          ? (fmUnknown!['type'] as string)
          : undefined
      if (route.startsWith('/posts/') && type === 'post') {
        const title =
          typeof fmUnknown?.['title'] === 'string'
            ? (fmUnknown!['title'] as string)
            : undefined
        const date =
          typeof fmUnknown?.['date'] === 'string'
            ? (fmUnknown!['date'] as string)
            : undefined
        const description =
          typeof fmUnknown?.['description'] === 'string'
            ? (fmUnknown!['description'] as string)
            : undefined
        const author =
          typeof fmUnknown?.['author'] === 'string'
            ? (fmUnknown!['author'] as string)
            : undefined
        const tagRaw = ((): string | string[] | undefined => {
          const v = fmUnknown?.['tag']
          if (typeof v === 'string' || Array.isArray(v)) return v
          return undefined
        })()

        posts.push({
          route,
          frontMatter: {
            title,
            date,
            description,
            author
          },
          tagRaw
        })
      }
      if ((item as any)?.children) walk((item as any).children)
    }
  }

  walk(pageMap as unknown as PageMapItem[])

  const toMs = (d?: string): number => {
    if (!d) return 0
    const t = new Date(d).getTime()
    return Number.isFinite(t) ? t : 0
  }

  posts.sort((a, b) => toMs(b.frontMatter.date) - toMs(a.frontMatter.date))
  return posts
}

export async function getTags(): Promise<string[]> {
  const posts = await getPosts()
  const set = new Set<string>()
  for (const post of posts) {
    for (const t of normalizeTags(post.tagRaw)) set.add(t)
  }
  return Array.from(set)
}

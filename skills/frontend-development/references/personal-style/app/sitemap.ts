import type { MetadataRoute } from 'next'
import { getPosts, getTags } from './posts/get-posts'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '') ||
    'https://example.com'

  const now = new Date()

  const staticPaths = [
    { path: '/', changeFrequency: 'daily' as const, priority: 1 },
    { path: '/posts', changeFrequency: 'daily' as const, priority: 0.8 },
    { path: '/art', changeFrequency: 'weekly' as const, priority: 0.6 },
    { path: '/quests', changeFrequency: 'weekly' as const, priority: 0.6 }
  ]

  const posts = await getPosts()
  const tags = await getTags()

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }))

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}${post.route}`,
    lastModified: post.frontMatter.date ? new Date(post.frontMatter.date) : now,
    changeFrequency: 'weekly',
    priority: 0.7
  }))

  const tagEntries: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${baseUrl}/tags/${encodeURIComponent(tag)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5
  }))

  return [...staticEntries, ...postEntries, ...tagEntries]
}

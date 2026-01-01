import Link from 'next/link'
import { PostCard } from 'nextra-theme-blog'
import { getPosts, normalizeTags } from './get-posts'
import type { Metadata } from 'next'
import type { ReactElement } from 'react'
import type { BlogMetadata } from 'nextra-theme-blog'

export const metadata: Metadata = {
  title: 'Posts'
}

export default async function PostsPage(): Promise<ReactElement> {
  const posts = await getPosts()
  const allTags: Record<string, number> = {}

  for (const post of posts) {
    for (const tag of normalizeTags(post.tagRaw)) {
      allTags[tag] ??= 0
      allTags[tag] += 1
    }
  }
  return (
    <div data-pagefind-ignore="all">
      <h1 className="bypass-is-posts">{metadata.title as string}</h1>
      <div
        className="not-prose"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}
      >
        {Object.entries(allTags).map(([tag, count]) => (
          <Link key={tag} href={`/tags/${tag}`} className="nextra-tag">
            {tag} ({count})
          </Link>
        ))}
      </div>
      {posts.map((post) => (
        <PostCard
          key={post.route}
          post={post as { route: string; frontMatter: BlogMetadata }}
        />
      ))}
    </div>
  )
}

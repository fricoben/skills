import { PostCard } from 'nextra-theme-blog'
import { getPosts, getTags, normalizeTags } from '../../posts/get-posts'

export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}) {
  const params = await props.params
  return {
    title: `Posts Tagged with “${decodeURIComponent(params.tag)}”`
  }
}

export async function generateStaticParams() {
  const allTags = await getTags()
  return [...new Set(allTags)].map((tag) => ({ tag }))
}

export default async function TagPage(props: {
  params: Promise<{ tag: string }>
}) {
  const params = await props.params
  const { title } = await generateMetadata({ params } as any)
  const posts = await getPosts()
  return (
    <>
      <h1 className="bypass-is-posts">{title as string}</h1>
      {posts
        .filter((post) =>
          normalizeTags(post.tagRaw).includes(decodeURIComponent(params.tag))
        )
        .map((post) => (
          <PostCard
            key={post.route}
            post={{ route: post.route, frontMatter: post.frontMatter }}
          />
        ))}
    </>
  )
}

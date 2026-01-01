export const dynamic = 'force-static'

export async function GET(): Promise<Response> {
  // Nextra v4 blog theme exposes RSS route via /feed.xml by default when using content posts
  // This placeholder returns 404 if not configured
  return new Response('RSS not configured', { status: 404 })
}

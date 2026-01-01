import { Suspense } from 'react'
import { getTweet } from 'react-tweet/api'
import type { Tweet as TweetData } from 'react-tweet/api'
import {
  type TweetProps,
  type TwitterComponents,
  TweetNotFound,
  TweetSkeleton,
  TweetBody,
  TweetMedia,
  enrichTweet
} from 'react-tweet'

function XLogo() {
  return (
    <svg
      className="ts-x"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M18.244 2H21.5l-7.5 8.57L22.5 22h-7.02l-5.49-6.44L3.5 22H.244l7.98-9.11L.5 2h7.02l5.02 5.89L18.244 2Zm-2.46 18h1.95L8.27 4h-1.95l9.46 16Z"
        fill="currentColor"
      />
    </svg>
  )
}

function MinimalTweet({
  tweet: t,
  components,
  size
}: {
  tweet: TweetData
  components?: TwitterComponents
  size: number
}) {
  const tweet = enrichTweet(t)
  const hasMedia = Boolean(tweet.mediaDetails?.length)
  const sizePx = Math.max(1, Math.round(size))

  // Build canonical tweet URL
  const id = (tweet as any).id_str ?? (tweet as any).id
  const user = (tweet as any).user?.screen_name ?? (tweet as any).user?.username
  const href = user
    ? `https://x.com/${user}/status/${id}`
    : `https://x.com/i/web/status/${id}`

  if (!hasMedia) {
    return (
      <div
        className="bypass-is-posts ts-container ts-text"
        style={{ ['--ts-size' as any]: `${sizePx}px` }}
      >
        <a
          className="ts-stretched"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open on X"
        />
        <div className="ts-caption" style={{ position: 'static' }}>
          <TweetBody tweet={tweet} />
        </div>
        <style>{`
          .ts-container.ts-text {
            position: relative;
            width: min(100%, var(--ts-size, 600px));
            margin: 1rem auto;
          }
          .ts-stretched { position: absolute; inset: 0; z-index: 3; }
          .ts-caption { font-size: 0.9rem; line-height: 1.35; }
        `}</style>
      </div>
    )
  }

  return (
    <div
      className="bypass-is-posts ts-container"
      style={{ ['--ts-size' as any]: `${sizePx}px` }}
    >
      <a
        className="ts-stretched"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open on X"
      />
      <div className="ts-media">
        <TweetMedia tweet={tweet} components={components} />
      </div>
      <div className="ts-xwrap">
        <XLogo />
      </div>
      <div className="ts-gradient" />
      <div className="ts-caption">
        <TweetBody tweet={tweet} />
      </div>
      <style>{`
        .ts-container {
          position: relative;
          width: min(100%, var(--ts-size, 600px));
          max-height: var(--ts-size, 600px);
          margin: 1rem auto;
          border-radius: 12px;
          overflow: hidden;
        }
        .ts-stretched { position: absolute; inset: 0; z-index: 3; }
        .ts-media { position: relative; }
        .ts-container :is(img, video) {
          width: 100% !important;
          height: auto !important;
          object-fit: contain !important;
          object-position: center center !important;
          max-width: 100% !important;
          max-height: none !important;
          display: block !important;
        }
        .ts-container :is(figure, span, a) { display: block; height: auto;  margin: 0; }

        .ts-xwrap {
          position: absolute;
          top: 24px;
          left: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255,255,255,0.75);
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
          z-index: 4;
          pointer-events: none; /* badge stays visible but click passes to link */
        }
        .ts-x { width: 18px; height: 18px; color: #111; }
        html.dark .ts-xwrap,
        :root.dark .ts-xwrap,
        [data-theme='dark'] .ts-xwrap { background: rgba(0,0,0,0.65); }
        html.dark .ts-x,
        :root.dark .ts-x,
        [data-theme='dark'] .ts-x { color: #fff; }

        .ts-gradient {
          position: absolute;
          inset: auto 0 0 0;
          height: 58%;
          pointer-events: none;
          background: linear-gradient(
            to top,
            rgba(255, 255, 255, 0.94) 0%,
            rgba(255, 255, 255, 0.74) 45%,
            rgba(255, 255, 255, 0.0) 100%
          );
        }
        .ts-caption {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 0.85rem 1rem 1.05rem 1rem;
          color: #111;
        }

        .ts-caption, .ts-caption * {
             font-size: 1.0rem; 
        }

        .ts-caption a { color: inherit; text-decoration: underline; }

        html.dark .ts-gradient,
        :root.dark .ts-gradient,
        [data-theme='dark'] .ts-gradient {
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.86) 0%,
            rgba(0, 0, 0, 0.62) 45%,
            rgba(0, 0, 0, 0.0) 100%
          );
        }
        html.dark .ts-caption,
        :root.dark .ts-caption,
        [data-theme='dark'] .ts-caption { color: #fff; }

        @media (prefers-color-scheme: dark) {
          :root:not(.light):not([data-theme='light']) .ts-gradient {
            background: linear-gradient(
              to top,
              rgba(0, 0, 0, 0.86) 0%,
              rgba(0, 0, 0, 0.62) 45%,
              rgba(0, 0, 0, 0.0) 100%
            );
          }
          :root:not(.light):not([data-theme='light']) .ts-caption { color: #fff; }
        }
      `}</style>
    </div>
  )
}

const TweetSimpleContent = async ({
  id,
  components,
  onError,
  scale
}: TweetProps & { scale?: number }) => {
  const tweet = id
    ? await getTweet(id).catch((err) => {
        if (onError) {
          onError(err)
        } else {
          console.error(err)
        }
      })
    : undefined

  if (!tweet) {
    const NotFound = components?.TweetNotFound || TweetNotFound
    return <NotFound />
  }

  const baseSize = 600
  const size = baseSize * (scale ?? 1)

  return <MinimalTweet tweet={tweet} components={components} size={size} />
}

export default function TweetSimple({
  fallback = <TweetSkeleton />,
  scale = 1,
  ...props
}: TweetProps & { scale?: number }) {
  return (
    <Suspense fallback={fallback}>
      {/* @ts-ignore: Async components are valid in the app directory */}
      <TweetSimpleContent {...props} scale={scale} />
    </Suspense>
  )
}

'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import type { Photo } from './types'
import { useTheme } from 'next-themes'

export default function PhotoGallery({
  photos,
  view = 'grid'
}: {
  photos: Photo[]
  view?: 'grid' | 'large'
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const singleColumn = view === 'large'

  const decodeHtml = (s: string): string => {
    return s
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
        String.fromCharCode(parseInt(h, 16))
      )
  }

  const open = useCallback((index: number) => setActiveIndex(index), [])
  const close = useCallback(() => setActiveIndex(null), [])

  useEffect(() => {
    if (activeIndex === null) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setActiveIndex((i) => {
          if (i === null) return i
          return (i + 1) % photos.length
        })
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setActiveIndex((i) => {
          if (i === null) return i
          return (i - 1 + photos.length) % photos.length
        })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, photos.length, close])

  // Theme is read via next-themes; no extra effect required

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: singleColumn
            ? '1fr'
            : 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem',
          alignItems: 'start'
        }}
      >
        {photos.map((p, i) => (
          <figure key={`${p.src}-${view}`} style={{ margin: 0 }}>
            <button
              type="button"
              onClick={(e) => {
                open(i)
                ;(e.currentTarget as HTMLButtonElement).blur()
              }}
              style={{
                appearance: 'none',
                border: 0,
                background: 'transparent',
                padding: 0,
                cursor: 'zoom-in',
                display: 'block',
                width: '100%',
                outline: 'none',
                position: 'relative',
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                borderRadius: 8
              }}
            >
              <Image
                src={p.src}
                alt={p.caption ?? 'Photo'}
                fill
                sizes={
                  singleColumn
                    ? '100vw'
                    : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                }
                style={{ objectFit: 'cover', borderRadius: 8 }}
                quality={95}
                loading="lazy"
              />
            </button>
            {(p.locationLabel || p.caption) && (
              <figcaption
                style={{
                  color: '#69778c',
                  fontSize: '0.9rem',
                  marginTop: '0.5rem'
                }}
              >
                {p.locationLabel || p.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            cursor: 'zoom-out',
            padding: 0
          }}
        >
          <div
            onClick={close}
            style={{
              position: 'relative',
              width: '100vw',
              height: '100vh',
              margin: 0,
              display: 'grid',
              placeItems: 'center'
            }}
          >
            {(() => {
              const p = photos[activeIndex]
              return (
                <div
                  onClick={close}
                  style={{
                    position: 'relative',
                    width: '100vw',
                    height: '100vh'
                  }}
                >
                  <Image
                    src={p.src}
                    alt={p.caption ?? 'Photo preview'}
                    fill
                    sizes="100vw"
                    style={{
                      objectFit: 'contain',
                      objectPosition: 'center',
                      margin: 0
                    }}
                    priority
                  />
                  {p.caption && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: '10px 14px',
                        background: isDark
                          ? 'rgba(0,0,0,0.45)'
                          : 'rgba(255,255,255,0.45)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        color: isDark ? '#fff' : '#000',
                        textAlign: 'center',
                        fontSize: '0.95rem',
                        lineHeight: 1.4,
                        pointerEvents: 'none',
                        maxWidth: '100%',
                        margin: '0 auto'
                      }}
                    >
                      {decodeHtml(p.caption)}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
}

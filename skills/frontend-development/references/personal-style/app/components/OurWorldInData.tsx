import type { ReactElement, CSSProperties } from 'react'

type OurWorldInDataProps = {
  src: string
  title?: string
  height?: number
  allow?: string
  className?: string
  style?: CSSProperties
}

export default function OurWorldInData({
  src,
  title = 'Our World in Data chart',
  height = 600,
  allow = 'web-share; clipboard-write',
  className,
  style
}: OurWorldInDataProps): ReactElement {
  const mergedStyle: CSSProperties = {
    ['--owid-height' as any]: `${height}px`,
    ...(style || {})
  }

  return (
    <div
      className={`bypass-is-posts owid-frame ${className ?? ''}`.trim()}
      style={mergedStyle}
    >
      <iframe
        src={src}
        loading="lazy"
        title={title}
        className="owid-iframe"
        allow={allow}
      />
    </div>
  )
}

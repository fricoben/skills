// MDX components mapping for Next.js MDX runtime
// See: https://nextjs.org/docs/app/building-your-application/configuring/mdx#mdx-components
import type { MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'
import { Tweet } from 'react-tweet'
import TweetSimple from './app/components/TweetSimple'
import OurWorldInData from './app/components/OurWorldInData'
import { createElement } from 'react'
import type {
  ReactElement,
  ReactNode,
  ElementType,
  ComponentPropsWithoutRef
} from 'react'

type MdxImageProps = Omit<ImageProps, 'src'> & {
  src: string | any
  alt?: string
}

function MdxImage({
  src,
  alt = '',
  width,
  height,
  sizes,
  style,
  ...rest
}: MdxImageProps & { style?: React.CSSProperties }): ReactElement {
  const mergedStyle = { borderRadius: 12, ...(style || {}) }
  if (typeof src === 'string') {
    return (
      <Image
        src={src}
        alt={alt}
        width={width ?? 1200}
        height={height ?? 800}
        sizes={sizes ?? '(min-width: 768px) 600px, 100vw'}
        style={mergedStyle}
        {...rest}
      />
    )
  }
  return (
    <Image
      src={src as any}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes ?? '(min-width: 768px) 600px, 100vw'}
      style={mergedStyle}
      {...rest}
    />
  )
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  function getNodeText(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number')
      return String(node)
    if (Array.isArray(node)) return node.map(getNodeText).join('')
    if (node && typeof node === 'object' && (node as any).props?.children) {
      return getNodeText((node as any).props.children)
    }
    return ''
  }

  function slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/['`’]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }

  function createHeading<T extends ElementType>(Tag: T) {
    return ({
      id,
      children,
      ...props
    }: { id?: string; children?: ReactNode } & ComponentPropsWithoutRef<T>) => {
      const fallbackId = slugify(getNodeText(children ?? ''))
      const finalId = id || fallbackId || undefined
      return createElement(
        Tag as any,
        { id: finalId, ...(props as any) },
        children as ReactNode
      )
    }
  }

  return {
    img: MdxImage,
    Tweet,
    TweetSimple,
    OurWorldInData,
    h2: createHeading('h2'),
    h3: createHeading('h3'),
    h4: createHeading('h4'),
    h5: createHeading('h5'),
    h6: createHeading('h6'),
    ...components
  }
}

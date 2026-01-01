# Quiet Ink Style - Technical Reference

Intimate, minimalist frontends with serif typography for personal sites and blogs.

## Reference Project
See `personal-style/` directory.

## Core Stack

```json
{
  "next": "^15.5.7",
  "react": "^18.3.1",
  "nextra": "^4.6.1",
  "nextra-theme-blog": "^4.6.1",
  "katex": "^0.16.27",
  "react-tweet": "^3.2.2"
}
```

## Font Assets

Download and place in `public/fonts/`:
- **Inter:** https://github.com/rsms/inter/releases
  - `Inter-roman.latin.var.woff2`
  - `Inter-italic.latin.var.woff2`
- **ET Book:** https://github.com/edwardtufte/et-book
  - `etbookot-roman-webfont.woff2`
  - `etbookot-italic-webfont.woff2`
  - `etbookot-bold-webfont.woff2`
  - `et-book-semi-bold-old-style-figures.woff`

## Typography CSS (styles/main.css)

```css
/* Inter Variable - UI font */
@font-face {
  font-family: 'Inter var';
  font-style: normal;
  font-weight: 100 900;
  font-display: block;
  src: url(/fonts/Inter-roman.latin.var.woff2) format('woff2');
}
@font-face {
  font-family: 'Inter var';
  font-style: italic;
  font-weight: 100 900;
  font-display: block;
  src: url(/fonts/Inter-italic.latin.var.woff2) format('woff2');
}

/* ET Book - Reading font */
@font-face {
  font-family: 'ET Book';
  src: url(/fonts/etbookot-roman-webfont.woff2) format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'ET Book';
  src: url(/fonts/et-book-semi-bold-old-style-figures.woff) format('woff');
  font-weight: 600;
  font-display: swap;
}
@font-face {
  font-family: 'ET Book';
  src: url(/fonts/etbookot-bold-webfont.woff2) format('woff2');
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'ET Book';
  src: url(/fonts/etbookot-italic-webfont.woff2) format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}

/* Base body - Inter for UI */
body {
  font-family: 'Inter var', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: subpixel-antialiased;
  font-feature-settings: 'case' 1, 'cpsp' 1, 'dlig' 1, 'cv01' 1, 'cv02', 'cv03' 1, 'cv04' 1;
  font-variation-settings: 'wght' 450;
  letter-spacing: -0.02em;
}

b, strong, h3, h4, h5, h6 { font-variation-settings: 'wght' 650; }
h1 { font-variation-settings: 'wght' 850; }
h2 { font-variation-settings: 'wght' 750; }

@media screen and (min-device-pixel-ratio: 1.5) {
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* Posts/Articles - ET Book for reading */
.is-posts {
  font-family: 'ET Book', Georgia, serif;
  font-size: clamp(1.0625rem, 1.02rem + 0.28vw, 1.2rem);
  line-height: 1.45;
  font-variant-numeric: oldstyle-nums proportional-nums;
}

.is-posts h1 {
  font-size: clamp(2.86rem, 5.85vw, 3.9rem);
  font-variant-numeric: lining-nums proportional-nums;
}

.is-posts h2 {
  font-size: clamp(2.08rem, 4.16vw, 2.73rem);
  font-style: italic;
  font-weight: 400;
}
```

## Color Palette

```css
:root {
  --text-primary: #111;
  --text-secondary: #666;
  --text-muted: #999;
  --background: #fff;
  --background-subtle: #fafafa;
  --link: #0074de;
  --border: rgba(0, 0, 0, 0.06);
}

html.dark {
  --text-primary: #eee;
  --text-secondary: #aaa;
  --text-muted: #777;
  --background: #000;
  --background-elevated: #161616;
  --background-subtle: #111;
  --border: rgba(255, 255, 255, 0.08);
}
```

## Styling Approach

**CSS Modules only - NO Tailwind:**

```css
/* Component.module.css */
.card {
  background: var(--background-subtle);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.25rem;
}

.cardTitle {
  composes: card;
  font-family: 'ET Book', Georgia, serif;
}

:global(html.dark) .card {
  background: var(--background-elevated);
}
```

## Shadow Philosophy

```css
/* Subtle, ambient */
box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);

/* Dark mode */
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
```

## Border Radius Scale

- `6px` - Buttons
- `8px` - Inputs
- `10px` - Cards
- `12px` - Images
- `14px` - Modals
- `16px` - Large panels
- `24px` - Full-height cards

## Nextra Blog Config

```tsx
// theme.config.tsx
import type { NextraBlogTheme } from 'nextra-theme-blog'

const config: NextraBlogTheme = {
  footer: (
    <small style={{ display: 'block', marginTop: '8rem' }}>
      <time>{new Date().getFullYear()}</time> © Your Name.
      <a href="/feed.xml">RSS</a>
    </small>
  ),
  readMore: 'Read more →',
  darkMode: true,
}
export default config
```

## Posts Layout Wrapper

```tsx
// app/posts/layout.tsx
export default function PostsLayout({ children }: { children: React.ReactNode }) {
  return <div className="is-posts">{children}</div>
}
```

## Design Principles

1. Serif for reading (ET Book for posts)
2. Sans-serif for UI (Inter for navigation)
3. Generous whitespace (8rem margins)
4. Subtle shadows (0.04-0.06 opacity)
5. Content-first (no decorations)
6. Dark mode as first-class citizen
7. No gradients (flat surfaces)
8. Fluid typography with clamp()
9. Oldstyle numerals in body text
10. CSS Modules only (no Tailwind)

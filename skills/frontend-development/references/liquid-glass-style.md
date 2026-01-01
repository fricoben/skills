# Liquid Glass Style - Technical Reference

Premium, polished frontends with glass morphism effects for SaaS products and dashboards.

## Package Manager

**Always use `bun`** (not npm/yarn/pnpm):

```bash
bun create next-app my-app
bun add nextra nextra-theme-docs @remixicon/react
bun dev
```

## Core Stack

```json
{
  "next": "^16.0.7",
  "react": "^19.2.1",
  "nextra": "^4.6.1",
  "nextra-theme-docs": "^4.6.1",
  "tailwindcss": "^4.1.0",
  "@tailwindcss/postcss": "^4.1.0",
  "@radix-ui/react-dialog": "^1.1.4",
  "@radix-ui/react-tooltip": "^1.1.8",
  "@remixicon/react": "^4.7.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0"
}
```

## Nextra 4.x Configuration

```javascript
// next.config.mjs
import nextra from "nextra";

const withNextra = nextra({
  contentDirBasePath: "/docs",
});

export default withNextra({
  reactStrictMode: true,
});
```

## PostCSS Config

```javascript
// postcss.config.mjs
export default { plugins: { "@tailwindcss/postcss": {} } };
```

## Complete globals.css Template

```css
@import "tailwindcss";

:root {
  /* Background layers */
  --background: 18 18 20;           /* #121214 charcoal */
  --background-elevated: 28 28 30;
  --background-tertiary: 44 44 46;

  /* Text hierarchy */
  --foreground: 255 255 255;
  --foreground-secondary: 168 168 174;
  --foreground-tertiary: 116 116 123;
  --foreground-muted: 78 78 84;

  /* Borders - very subtle */
  --border: 255 255 255 / 0.06;
  --border-elevated: 255 255 255 / 0.08;

  /* Accent - customize as needed */
  --accent: 99 102 241;             /* #6366F1 indigo (default) */
  --accent-hover: 129 140 248;      /* lighter variant */
  --accent-foreground: 255 255 255;

  /* Semantic colors */
  --success: 34 197 94;
  --warning: 234 179 8;
  --error: 239 68 68;

  /* Glow & ring */
  --glow: var(--accent) / 0.18;
  --ring: var(--accent) / 0.4;
}

html {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  background: rgb(var(--background));
  color: rgb(var(--foreground));
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: inherit;
  text-decoration: none;
}

/* Glass morphism */
.glass {
  background: rgb(var(--background-elevated) / 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.glass-subtle {
  background: rgb(var(--background-elevated) / 0.5);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* Surface levels */
.surface-0 { background: rgb(var(--background)); }
.surface-1 { background: rgb(var(--background-elevated)); }
.surface-2 { background: rgb(var(--background-tertiary)); }

/* Text utilities */
.text-muted { color: rgb(var(--foreground-secondary)); }
.text-subtle { color: rgb(var(--foreground-tertiary)); }
.text-accent { color: rgb(var(--accent)); }

/* Border utility */
.border-subtle { border-color: rgb(var(--border)); }

/* Aurora background - adds visual depth */
.bg-aurora {
  background:
    radial-gradient(1200px 600px at 10% -10%, rgb(var(--accent) / 0.16), transparent 60%),
    radial-gradient(800px 500px at 90% 10%, rgb(var(--accent) / 0.12), transparent 55%),
    radial-gradient(900px 700px at 50% 110%, rgba(255, 255, 255, 0.05), transparent 60%);
}

/* Grid pattern overlay */
.bg-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 48px 48px;
}

/* Animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in { animation: fade-in 150ms ease-out; }
.animate-slide-up { animation: slide-up 200ms ease-out; }

/* Tabular numbers for stats */
.tabular-nums { font-variant-numeric: tabular-nums; }

/* Selection color */
::selection { background: rgb(var(--accent) / 0.3); }
```

## Common Accent Presets

```css
/* Indigo (default - technical/developer) */
--accent: 99 102 241;
--accent-hover: 129 140 248;

/* Amber (warm - creative/consumer) */
--accent: 232 168 85;
--accent-hover: 240 188 111;

/* Green (monitoring/success) */
--accent: 34 197 94;
--accent-hover: 74 222 128;

/* Blue (trust/enterprise) */
--accent: 59 130 246;
--accent-hover: 96 165 250;
```

## Utility Helper

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

## Component Patterns

**Button (primary):**
```tsx
<button className="px-5 py-3 rounded-lg bg-[rgb(var(--accent))] text-white font-semibold shadow-[0_12px_30px_rgb(var(--glow))] hover:-translate-y-0.5 transition">
  Launch Console
</button>
```

**Button (secondary):**
```tsx
<button className="glass-panel px-5 py-3 rounded-lg border border-white/10 text-white/80 hover:-translate-y-0.5 transition">
  Read Docs
</button>
```

**Card:**
```tsx
<div className="glass-panel rounded-xl p-5">
  <p className="text-xs uppercase tracking-[0.25em] text-subtle">Label</p>
  <p className="mt-3 text-lg font-semibold">Title</p>
  <p className="mt-2 text-sm text-muted">Description text.</p>
</div>
```

**Stat Panel:**
```tsx
<div className="glass-subtle rounded-xl border border-white/5 px-4 py-3">
  <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">Active Sensors</p>
  <p className="text-2xl font-light tabular-nums">3,482</p>
  <span className="text-xs text-accent">+12%</span>
</div>
```

**Page Layout with Aurora:**
```tsx
<div className="min-h-screen bg-aurora">
  <div className="bg-grid">
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* content */}
    </div>
  </div>
</div>
```

**Nav with Glass:**
```tsx
<nav className="glass-panel flex items-center justify-between rounded-2xl px-6 py-4">
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-xl bg-[rgb(var(--accent))] flex items-center justify-center shadow-[0_0_30px_rgb(var(--glow))]">
      <RiStackLine className="h-5 w-5 text-black/90" />
    </div>
    <span className="font-semibold">Product Name</span>
  </div>
  {/* links */}
</nav>
```

## Design Principles

1. Dark mode first (or dark-only)
2. Single accent color (customizable via CSS variable)
3. Borders at 0.06-0.08 opacity
4. Blur: 20px primary, 12px subtle
5. Animations: 150-200ms, ease-out
6. No pure black (#121214 minimum)
7. Use aurora + grid backgrounds for depth
8. Remixicon for all icons

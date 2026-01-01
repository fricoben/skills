---
name: frontend-development
description: >
  Creates frontends in two signature styles: "Liquid Glass" (premium SaaS with glass morphism, dashboards, docs) or "Quiet Ink" (intimate personal sites with serif typography).
  Trigger terms: frontend, website, landing page, dashboard, documentation, blog, portfolio, Next.js, React, Tailwind, Nextra.
---

## When to Use
- Creating a new frontend (landing page, dashboard, docs, blog, portfolio)
- Styling an existing Next.js/React project to match Thomas's design preferences
- Setting up Nextra documentation

## When NOT to Use
- Backend-only work with no UI
- Projects that must match an external design system

## Style Selection

| Style | Codename | When to Use |
|-------|----------|-------------|
| **Liquid Glass** | Professional | SaaS, dashboards, documentation sites |
| **Quiet Ink** | Personal | Blogs, portfolios, writing-focused sites |

### Quick Decision (2 Questions)

1. **"Is this for a product/business or personal use?"**
   - Product/Business → **Liquid Glass**
   - Personal/Blog → **Quiet Ink**

2. **"What accent color?"** (if Liquid Glass)
   - Default: Indigo `#6366F1` (technical/developer tools)
   - Warm: Amber `#e8a855` (creative/consumer products)
   - Custom: Any hex color works (e.g., green `#22c55e`)

## Liquid Glass Style

Premium glass morphism for SaaS. See `references/liquid-glass-style.md` for full spec.

**Stack:** Next.js 16, React 19, Tailwind CSS v4, Nextra 4.x (for docs), Remixicon

**Package manager:** Always use `bun` (not npm/yarn/pnpm)

**Key characteristics:**
- Glass panels: `backdrop-filter: blur(20px) saturate(180%)`
- Aurora gradients for visual depth
- Grid overlay pattern
- Borders at 0.06-0.08 opacity
- Single accent color (customizable)
- No pure black: Use `#121214`
- Dark mode first (or dark-only)

**Reference projects:**
- Cool (indigo): `references/professional-cool/` (asyncanticheat)
- Warm (amber): `references/professional-warm/` (shard)

## Quiet Ink Style

Intimate serif typography for personal sites. See `references/quiet-ink-style.md` for full spec.

**Stack:** Next.js 15, React 18, nextra-theme-blog, KaTeX, react-tweet

**Package manager:** Always use `bun` (not npm/yarn/pnpm)

**Key characteristics:**
- Serif for reading: ET Book font
- Sans-serif for UI: Inter variable font
- CSS Modules only (NO Tailwind)
- Generous whitespace
- Oldstyle numerals in body text

**Reference project:** `references/personal-style/` (thomas.md)

## Customizing Accent Colors

To use a custom accent (e.g., green for "Pandora Monitoring"):

```css
:root {
  /* Convert hex to RGB space-separated values */
  --accent: 34 197 94;           /* #22c55e green */
  --accent-hover: 74 222 128;    /* lighter variant */
  --glow: 34 197 94 / 0.18;      /* for glow effects */
}
```

## Outputs / Definition of Done

- Project scaffolded with correct dependencies
- Design tokens in globals.css (CSS variables)
- Glass effects, aurora background, grid pattern in place
- At least one page rendering correctly
- Nextra configured correctly (if docs needed)

## Procedure

1. Determine style via quick decision above
2. Read the appropriate reference:
   - `references/liquid-glass-style.md` for Liquid Glass
   - `references/quiet-ink-style.md` for Quiet Ink
3. Study the corresponding project in `references/`
4. Copy globals.css content
5. Build components following reference patterns

## Checks & Guardrails

- Verify glass effects render (backdrop-filter support)
- Confirm aurora/grid backgrounds visible
- Check responsive behavior
- Validate color contrast for accessibility

## References

- `references/liquid-glass-style.md` - Liquid Glass technical spec
- `references/quiet-ink-style.md` - Quiet Ink technical spec
- `references/professional-cool/` - Liquid Glass cool variant
- `references/professional-warm/` - Liquid Glass warm variant
- `references/personal-style/` - Quiet Ink reference

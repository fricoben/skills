---
name: vibetracking-style
description: >
  Front-end style guide for the Vibe Tracking project. Defines the visual design
  system including colors, typography, buttons, cards, and illustration style.
  Trigger terms: vibe tracking, vibetracking, vibe-tracking, style guide,
  design system, UI style, front-end style, color palette, typography.
internal: true
---

## Overview

This style guide defines the playful, modern, and vibrant design language for Vibe Tracking. The aesthetic combines pastel candy colors with bold black accents, creating a fun yet professional Web3/crypto vibe.

## Color Palette

### Primary Colors

| Color Name | Hex | RGB | Usage |
|------------|-----|-----|-------|
| **Candy Pink** | `#FEA6CC` | `rgb(254, 166, 204)` | Primary accent, cards, tags |
| **Sky Blue** | `#B3D8F5` | `rgb(179, 216, 245)` | Secondary accent, cards, tags |
| **Mint Green** | `#AAE7C0` | `rgb(170, 231, 192)` | CTA buttons, success states, tags |
| **Lemon Yellow** | `#F0F69B` | `rgb(240, 246, 155)` | Highlights, tags, accents |

### Neutral Colors

| Color Name | Hex | RGB | Usage |
|------------|-----|-----|-------|
| **Charcoal Black** | `#232323` | `rgb(35, 35, 35)` | Text, borders, shadows |
| **Off-White** | `#EEF0F2` | `rgb(238, 240, 242)` | Page background |
| **Pure White** | `#FFFFFF` | `rgb(255, 255, 255)` | Cards, widgets, clean backgrounds |

### Extended Palette

| Color Name | Hex | RGB | Usage |
|------------|-----|-----|-------|
| **Soft Pink** | `#FED1E5` | `rgb(254, 209, 229)` | Light pink variant |
| **Light Blue** | `#AFD4F1` | `rgb(175, 212, 241)` | Light blue variant |
| **Coral Pink** | `#FEA6CC` (30% opacity) | `rgba(254, 166, 204, 0.31)` | Subtle backgrounds |
| **Pool Blue** | `#A8D4E6` | Light cyan/teal | Footer/pool background |

## Typography

### Font Family
- **Primary Font**: `Rubik, sans-serif`
- **Fallback**: System sans-serif stack

### Font Weights
- **Black/Heavy**: `900` - Main headlines (H1)
- **Semi-Bold**: `600` - Buttons, CTAs, emphasis
- **Medium**: `500` - Subheadings (H2, H3, H4)
- **Regular**: `400` - Body text

### Type Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **H1** | `48px` | `900` | `1.2` | Hero headlines |
| **H2** | `36px` | `500` | `1.3` | Section titles |
| **H3** | `24px` | `500` | `1.4` | Subsection headers |
| **H4** | `18px` | `600` | `1.4` | Card titles |
| **Body** | `16px` | `400` | `1.6` | Paragraph text |
| **Small** | `14px` | `400` | `1.5` | Captions, labels |

### Text Color
- Primary text: `#232323` (Charcoal Black)
- All text uses high contrast against backgrounds

## Buttons

### Primary Button (CTA)
```css
.btn-primary {
  background-color: #AAE7C0; /* Mint Green */
  color: #232323;
  font-family: 'Rubik', sans-serif;
  font-weight: 600;
  font-size: 16px;
  padding: 14px 24px;
  border-radius: 10px;
  border: none;
  box-shadow: 0px 4px 0px 0px #232323; /* Bottom shadow for depth */
  cursor: pointer;
  text-transform: uppercase;
}

.btn-primary:hover {
  transform: translateY(2px);
  box-shadow: 0px 2px 0px 0px #232323;
}

.btn-primary:active {
  transform: translateY(4px);
  box-shadow: none;
}
```

### Secondary Button (Nav Pills)
```css
.btn-secondary {
  background-color: #FFFFFF;
  color: #232323;
  font-family: 'Rubik', sans-serif;
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #232323;
  box-shadow: 0px 4px 0px 0px #232323;
  cursor: pointer;
}
```

### Key Button Characteristics
- **Border radius**: `10px` (consistent rounded corners)
- **Box shadow**: `0px 4px 0px 0px #232323` (solid bottom shadow for 3D/retro feel)
- **Text**: Uppercase, semi-bold
- **Hover effect**: Button "presses down" (translateY + reduced shadow)

## Cards & Containers

### Feature Card
```css
.card {
  background-color: #FFFFFF;
  border-radius: 10px;
  border: 1px solid #232323;
  box-shadow: 0px 4px 0px 0px #232323;
  padding: 24px;
}
```

### Colored Info Box
Used for feature highlights, key points sections:
```css
.info-box-pink {
  background-color: #FEA6CC;
  border-radius: 10px;
  border: 1px solid #232323;
  padding: 20px;
}

.info-box-blue {
  background-color: #B3D8F5;
  border-radius: 10px;
  border: 1px solid #232323;
  padding: 20px;
}

.info-box-green {
  background-color: #AAE7C0;
  border-radius: 10px;
  border: 1px solid #232323;
  padding: 20px;
}

.info-box-yellow {
  background-color: #F0F69B;
  border-radius: 10px;
  border: 1px solid #232323;
  padding: 20px;
}
```

### Widget/Panel (e.g., countdown, form containers)
```css
.widget {
  background-color: #FFFFFF;
  border-radius: 20px;
  border: 1px solid #232323;
  padding: 30px;
  box-shadow: 0px 4px 0px 0px #232323;
}
```

## Tags & Pills

### Category Tags
```css
.tag {
  display: inline-block;
  padding: 10px 16px;
  border-radius: 10px;
  font-family: 'Rubik', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #232323;
  text-transform: uppercase;
  box-shadow: 0px 4px 0px 0px #232323;
}

.tag-pink { background-color: #FEA6CC; }
.tag-blue { background-color: #B3D8F5; }
.tag-green { background-color: #AAE7C0; }
.tag-yellow { background-color: #F0F69B; }
```

## Navigation

### Header Navigation Pills
- White background with black border
- 10px border-radius
- Bottom box-shadow for 3D effect
- Pill-shaped, evenly spaced
- Active state can use colored background

### Scrolling Marquee/Ticker
- Background: `#FEA6CC` (Candy Pink)
- Text: `#232323` (Charcoal Black)
- Uppercase text
- Continuous horizontal scroll animation
- Used for announcements/highlights

## Illustrations & Graphics Style

### Character Illustration Style
- **Art style**: Modern cartoon/vector illustration
- **Colors**: Pastel palette matching brand colors (pink, blue, yellow, mint)
- **Line work**: Clean black outlines (`#232323`)
- **Features**: Friendly, approachable characters with exaggerated expressions
- **Props**: Whimsical elements (unicorns, pool floats, tropical drinks, sunglasses)
- **Setting**: Playful scenarios (pool party, relaxing, celebrating)

### Icon Style
- Clean, simple line icons
- Black stroke color (`#232323`)
- Can use colored fills from the palette
- Rounded corners to match overall aesthetic

### Decorative Elements
- Floating objects (coins, stars, sparkles)
- Gradient backgrounds (subtle pink to blue)
- Pool/water patterns for footer backgrounds
- Confetti or celebration elements

## Layout Patterns

### Hero Section
- Two-column layout (content left, widget/illustration right)
- Large bold headline
- Subheading text
- Category tags below headline
- CTA button or widget panel

### Section Layout
- Centered section titles
- Cards in grid (2-4 columns)
- Generous padding between sections
- Alternating background colors (white, off-white, colored sections)

### Roadmap/Timeline
- Horizontal or vertical timeline
- Phase cards with colored headers
- Bullet point lists for milestones
- Illustrations within each phase

### FAQ Accordion
- Clean accordion style
- Full-width items
- Uppercase questions
- Expandable with smooth animation

## Spacing System

| Name | Value | Usage |
|------|-------|-------|
| `xs` | `4px` | Tight spacing |
| `sm` | `8px` | Icon gaps, inline elements |
| `md` | `16px` | Card padding, element gaps |
| `lg` | `24px` | Section padding |
| `xl` | `32px` | Large gaps |
| `2xl` | `48px` | Section margins |
| `3xl` | `64px` | Major section breaks |

## Border & Shadow System

### Border
- **Color**: `#232323` (Charcoal Black)
- **Width**: `1px` (consistent)
- **Style**: `solid`
- **Radius**: `10px` (default), `20px` (large widgets)

### Box Shadow
- **Standard**: `0px 4px 0px 0px #232323` (solid bottom shadow)
- Creates a retro/3D "lifted" appearance
- Applied to: buttons, cards, tags, widgets

## Animation Guidelines

### Transitions
- Duration: `200ms` to `300ms`
- Easing: `ease-out` or `ease-in-out`
- Common properties: `transform`, `box-shadow`, `background-color`

### Hover Effects
- Buttons: Press down effect (translateY)
- Cards: Subtle lift or scale
- Links: Color transition

### Marquee Animation
- Continuous horizontal scroll
- Smooth, consistent speed
- Seamless loop

## Responsive Considerations

### Breakpoints
- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `> 1024px`

### Mobile Adjustments
- Stack columns vertically
- Reduce heading sizes
- Full-width cards
- Hamburger navigation
- Touch-friendly button sizes (min 44px)

## CSS Variables (Recommended)

```css
:root {
  /* Primary Colors */
  --color-pink: #FEA6CC;
  --color-blue: #B3D8F5;
  --color-green: #AAE7C0;
  --color-yellow: #F0F69B;

  /* Neutrals */
  --color-black: #232323;
  --color-white: #FFFFFF;
  --color-bg: #EEF0F2;

  /* Typography */
  --font-primary: 'Rubik', sans-serif;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-black: 900;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Borders & Shadows */
  --border-radius: 10px;
  --border-radius-lg: 20px;
  --border-color: #232323;
  --box-shadow: 0px 4px 0px 0px #232323;

  /* Transitions */
  --transition-fast: 200ms ease-out;
  --transition-normal: 300ms ease-in-out;
}
```

## Summary

The Vibe Tracking design system is characterized by:
1. **Playful pastel colors** - Pink, blue, green, yellow palette
2. **Bold black accents** - Borders, text, and solid shadows
3. **3D retro feel** - Bottom box-shadows on interactive elements
4. **Rounded corners** - Consistent 10px radius
5. **Strong typography** - Rubik font, bold headlines, uppercase accents
6. **Cartoon illustrations** - Friendly characters with matching color palette
7. **Clean, modern layout** - Generous spacing, card-based design

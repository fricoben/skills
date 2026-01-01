# thomas.md

Personal website and central license/payment management hub.

## Tech Stack

- **Framework**: Next.js 15 App Router + Nextra (blog theme)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth
- **Payments**: Stripe + PayPal webhooks
- **Email**: Nodemailer (SMTP)
- **Workflows**: Vercel Workflow SDK (durable async tasks)
- **Deploy**: Vercel (auto-deploys from `main`)
- **Package Manager**: Bun (no lockfile, use `bun install`)

## Commands

```bash
bun install        # Install dependencies
bun dev            # Start dev server
bun run build      # Production build
```

## Project Structure

```
app/
├── api/
│   ├── stripe/webhook/     # Stripe payment handling
│   ├── paypal/webhook/     # PayPal payment handling
│   ├── license/            # License claiming endpoints
│   └── beta/               # Beta program (join/leave)
├── license/                # License claiming UI
├── beta/                   # Beta program UI
├── posts/                  # Blog posts (MDX)
├── photos/                 # Art gallery
├── quests/                 # Quest pages
└── workflows/              # Vercel Workflow SDK tasks
lib/
├── supabase.ts             # Admin client (bypasses RLS)
├── supabase-server.ts      # User auth client
├── discord.ts              # Discord role management
├── email.ts                # SMTP transport
├── email-templates.ts      # Email HTML/text templates
└── payments.ts             # Payment processing logic
migrations/                 # SQL migrations (apply manually)
styles/                     # Global CSS
```

## Conventions

### Page Structure

Server/client component pattern:
- `page.tsx` - Server component (data fetching)
- `*-client.tsx` - Client component (interactivity)
- `*.module.css` - CSS modules for styling

### API Routes

```typescript
// User auth (respects RLS)
import { createClient } from '@/lib/supabase-server'

// Admin operations (bypasses RLS)
import { getSupabaseAdmin } from '@/lib/supabase'
```

Return `NextResponse.json()` with appropriate status codes.

### Database

- Supabase with Row Level Security (RLS) enabled
- Admin client for backend operations bypasses RLS
- Migrations in `migrations/` folder, apply manually via Supabase SQL editor

### License Types

| Type | Discord Role | Description |
|------|--------------|-------------|
| `oraxen` | Oraxen | Oraxen plugin license |
| `oraxen_studio` | - | Oraxen Studio web app (granted free with Oraxen) |
| `hackedserver` | HackedServer | HackedServer plugin license |

### Payment Webhooks

Both Stripe and PayPal handlers call `processPayment()`:
1. Store payment with duplicate detection (transaction_id)
2. Send thank-you email with license claim URL
3. Start 7-day follow-up workflow

### Email System

- SMTP via nodemailer
- Templates in `lib/email-templates.ts`
- Embedded signature images (CID attachments)

### Workflows

Vercel Workflow SDK with `'use step'` directive:
- `purchase-followup.ts` - 7-day follow-up
  - Checks if user registered
  - Grants free Oraxen Studio for Oraxen purchases
  - Sends review request email

## Database Schema

Shared Supabase at `dmtwdyasmifhjsxmqslv.supabase.co`

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles linked to auth.users |
| `licenses` | User license records |
| `paypal_payments` | PayPal webhook payment records |
| `stripe_payments` | Stripe webhook payment records |
| `beta_members` | Beta program membership |
| `paypal_webhook_logs` | Raw PayPal webhook payloads |

## Environment Variables

### Frontend (public)

```
NEXT_PUBLIC_SUPABASE_URL=https://dmtwdyasmifhjsxmqslv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Backend (secret)

```
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# PayPal
PAYPAL_WEBHOOK_ID=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Discord
DISCORD_BOT_TOKEN=...
DISCORD_SERVER_ID=...
DISCORD_ORAXEN_ROLE_ID=...
DISCORD_HACKEDSERVER_ROLE_ID=...
DISCORD_INSIDER_ROLE_ID=...

# SMTP
SMTP_SERVER=...
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_TOKEN=...
SMTP_FROM_NAME=Thomas

# Beta
BETA_MAX_MEMBERS=100
```

## Beta Program

- Users need active license to join
- Limited spots (`BETA_MAX_MEMBERS`)
- Grants Discord "Insider" role
- Soft delete via `left_at` column
- Endpoints: `POST /api/beta/join`, `POST /api/beta/leave`

## Secrets

Local development uses `secrets.json` at workspace root (shared across projects).
Access values via jq:

```bash
jq '.projects.thomas_md | keys' secrets.json
jq -r '.projects.thomas_md.stripe_secret_key' secrets.json
jq -r '.shared.supabase.service_role_key' secrets.json
```

Never commit secret values. Wire code to read from env vars.

## Code Style

- TypeScript with strict mode
- Prettier config in package.json (no semicolons, single quotes)
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Files: `kebab-case.ts` or `PascalCase.tsx`

## Git

- Commit types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Branch naming: `feat/description`, `fix/description`
- Auto-deploys from `main`

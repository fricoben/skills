# Supabase Database

Single shared Supabase instance for all projects.

---

## Connection Details

| Property | Value |
|----------|-------|
| **Project URL** | `https://dmtwdyasmifhjsxmqslv.supabase.co` |
| **Region** | EU (Frankfurt, `eu-central-1`) |
| **Direct DB** | `postgresql://postgres:***@db.dmtwdyasmifhjsxmqslv.supabase.co:5432/postgres` |
| **Pooler** | `postgresql://postgres.dmtwdyasmifhjsxmqslv:***@aws-0-eu-central-1.pooler.supabase.com:6543/postgres` |

---

## Tables by Project

### thomas.md (Licenses & Payments)

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profiles linked to auth.users | Yes |
| `licenses` | Oraxen/HackedServer/Studio licenses | Yes |
| `paypal_payments` | PayPal webhook transactions | Yes |
| `stripe_payments` | Stripe webhook transactions | Yes |
| `beta_members` | Beta program membership | Yes |

### Oraxen Studio

| Table | Purpose | RLS |
|-------|---------|-----|
| `workspaces` | User workspaces | Yes |
| `items` | Custom Minecraft items | Yes |
| `assets` | 2D/3D assets (textures, models) | Yes |
| `item_assets` | Junction: items ↔ assets | Yes |
| `texture_generation_usage` | Daily AI texture limits | Yes |
| `blueprints` | Published item blueprints | Yes |
| `blueprint_items` | Items in blueprints | Yes |
| `blueprint_sections` | Blueprint organization | Yes |

### MCServerJars

| Table | Purpose | RLS |
|-------|---------|-----|
| `jar_projects` | Server software (Paper, Spigot) | No (public read) |
| `minecraft_versions` | Version registry | No |
| `jar_builds` | Downloadable builds | No |
| `jar_sync_logs` | Indexer history | No |
| `nms_version_mappings` | NMS version mappings | No |
| `changelogs` | Auto-generated changelogs | Yes |

### AsyncAnticheat

| Table | Purpose | RLS |
|-------|---------|-----|
| `servers` | Registered MC servers | Yes |
| `players` | Player UUIDs | Yes |
| `findings` | Cheat detections | Yes |
| `batch_index` | Packet batch metadata | Yes |
| `module_dispatches` | Dispatch logs | No |
| `server_modules` | Detection modules per server | Yes |
| `module_player_state` | Persisted player state | No |
| `cheat_observations` | Manual observations | Yes |
| `false_positive_reports` | User FP reports | Yes |

### Custom Capes / SkinMotion

| Table | Purpose | RLS |
|-------|---------|-----|
| `cape_accounts` | Minecraft accounts with capes | No |
| `texture_cache` | Cached texture signatures | No |
| `skinmotions` | Animated skin configs | Yes |
| `skin_frames` | Animation frames | Yes |
| `player_tokens` | Auth tokens | Yes |

### Calorily (iOS App)

| Table | Purpose | RLS |
|-------|---------|-----|
| `calorily_meals` | Meal records | Yes |
| `calorily_ingredients` | Ingredients per meal | Yes |
| `calorily_nutrition` | Nutrition data | Yes |
| `calorily_daily_goals` | User goals | Yes |
| `calorily_analysis_logs` | AI analysis logs | No |

---

## Storage Buckets

| Bucket | Public | Size Limit | Purpose |
|--------|--------|------------|---------|
| `textures` | No | None | Oraxen Studio textures |
| `models` | No | None | 3D models |
| `workspace-files` | Yes | 50MB | Exported workspace files |
| `jars` | Yes | 200MB | Cached JAR downloads |

---

## Edge Functions

| Function | Purpose |
|----------|---------|
| `analyze-meal` | Calorily iOS food analysis |

---

## Environment Variables

### Frontend (public, safe to expose)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://dmtwdyasmifhjsxmqslv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Backend (secret, server-side only)
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
DATABASE_URL=postgresql://postgres:***@db.dmtwdyasmifhjsxmqslv.supabase.co:5432/postgres
```

---

## Schema Retrieval Script

Run this SQL in Supabase SQL Editor to get full schema as JSON:

```sql
WITH fk_info AS (
  SELECT jsonb_agg(jsonb_build_object(
    'table', table_name,
    'column', fk_column,
    'foreign_key_name', foreign_key_name,
    'reference_table', reference_table,
    'reference_column', reference_column,
    'fk_def', fk_def
  )) AS fk_metadata
  FROM (
    SELECT
      c.conname AS foreign_key_name,
      conrelid::regclass::text AS table_name,
      a.attname AS fk_column,
      confrelid::regclass::text AS reference_table,
      af.attname AS reference_column,
      pg_get_constraintdef(c.oid) AS fk_def
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    WHERE c.contype = 'f' AND n.nspname = 'public'
  ) x
),
pk_info AS (
  SELECT jsonb_agg(jsonb_build_object(
    'table', conrelid::regclass::text,
    'column', pk_column,
    'pk_def', pg_get_constraintdef(c.oid)
  )) AS pk_metadata
  FROM (
    SELECT
      c.oid,
      c.conrelid,
      unnest(string_to_array(substring(pg_get_constraintdef(c.oid) FROM '\((.*?)\)'), ',')) AS pk_column
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    WHERE c.contype = 'p' AND n.nspname = 'public'
  ) c
),
columns AS (
  SELECT jsonb_agg(jsonb_build_object(
    'table', table_name,
    'name', column_name,
    'ordinal_position', ordinal_position,
    'type', data_type,
    'nullable', is_nullable = 'YES',
    'default', column_default
  )) AS cols_metadata
  FROM information_schema.columns
  WHERE table_schema = 'public'
),
tables AS (
  SELECT jsonb_agg(jsonb_build_object(
    'table', table_name,
    'rows', COALESCE(s.n_live_tup, 0),
    'type', table_type
  )) AS tbls_metadata
  FROM information_schema.tables t
  LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname
  WHERE table_schema = 'public'
),
indexes AS (
  SELECT jsonb_agg(jsonb_build_object(
    'table', t.relname,
    'index_name', i.relname,
    'column', a.attname,
    'unique', ix.indisunique
  )) AS indexes_metadata
  FROM pg_index ix
  JOIN pg_class t ON t.oid = ix.indrelid
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
),
enum_types AS (
  SELECT
    typname,
    'enum' AS kind,
    ARRAY_AGG(e.enumlabel ORDER BY e.enumsortorder) AS values
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
  GROUP BY typname
),
composite_fields AS (
  SELECT
    t.typname,
    jsonb_agg(jsonb_build_object(
      'field', a.attname,
      'type', format_type(a.atttypid, a.atttypmod)
    ) ORDER BY a.attnum) AS fields
  FROM pg_type t
  JOIN pg_class c ON c.oid = t.typrelid
  JOIN pg_attribute a ON a.attrelid = c.oid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE t.typtype = 'c'
    AND c.relkind = 'c'
    AND n.nspname = 'public'
    AND a.attnum > 0 AND NOT a.attisdropped
  GROUP BY t.typname
),
custom_types AS (
  SELECT jsonb_agg(jsonb_build_object(
    'type', typname,
    'kind', kind,
    'values', values,
    'fields', fields
  )) AS custom_types_metadata
  FROM (
    SELECT typname, kind, values, NULL::jsonb AS fields FROM enum_types
    UNION ALL
    SELECT typname, 'composite', NULL, fields FROM composite_fields
  ) all_types
)
SELECT jsonb_build_object(
  'schema', 'public',
  'tables', tbls_metadata,
  'columns', cols_metadata,
  'primary_keys', pk_metadata,
  'foreign_keys', fk_metadata,
  'indexes', indexes_metadata,
  'custom_types', custom_types_metadata
) AS metadata_json
FROM fk_info, pk_info, columns, tables, indexes, custom_types;
```

---

## Migrations

Migrations are applied manually via Supabase SQL Editor.

Migration files stored in: `thomas.md/migrations/`

```bash
# Copy migration to clipboard
cat thomas.md/migrations/003_add_beta_members.sql | pbcopy
# Then paste into Supabase SQL Editor
```

---

## Common Patterns

### New Project Tables

When adding tables for a new project:

1. **Prefix tables** with project name (e.g., `calorily_meals`)
2. **Enable RLS** unless intentionally public-read
3. **Link to auth.users** via user_id foreign key
4. **Add timestamps**: `created_at`, `updated_at`

```sql
CREATE TABLE myapp_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE myapp_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own items"
ON myapp_items FOR ALL
USING (auth.uid() = user_id);
```

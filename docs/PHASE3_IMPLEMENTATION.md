# Phase 3 — Implementation Guide

Scaling, API keys, and community moderation. Use this guide when the registry grows beyond ~1k models or when you need stricter access control.

---

## 1. Database Migration (Supabase/PostgreSQL)

### When to migrate

- Registry exceeds ~1,000 models
- Need full-text search across descriptions
- Need versioning / audit trail per model
- Need real-time updates without redeploy

### Schema (Supabase)

```sql
-- models table
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  origin_country TEXT NOT NULL,
  openness_level TEXT NOT NULL CHECK (openness_level IN ('Open Weights', 'API')),
  data_residency BOOLEAN DEFAULT FALSE,
  compliance_tags TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  task_categories TEXT[] DEFAULT '{}',
  description TEXT,
  home_page TEXT,
  huggingface_id TEXT,
  hf_downloads INT,
  hf_likes INT,
  context_window INT,
  training_cutoff TEXT,
  vram_4bit_gb INT,
  vram_8bit_gb INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search
CREATE INDEX idx_models_search ON models USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(provider, '') || ' ' || COALESCE(description, ''))
);

-- model_changelog for audit trail
CREATE TABLE model_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT REFERENCES models(id),
  action TEXT NOT NULL, -- 'created' | 'updated' | 'deleted'
  changed_by TEXT,
  diff JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- api_keys for rate limiting
CREATE TABLE api_keys (
  key_hash TEXT PRIMARY KEY,
  label TEXT,
  rate_limit_per_min INT DEFAULT 300,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration script

1. Export `registry.json` to CSV
2. Run `psql` or Supabase SQL editor to create tables
3. Import data: `COPY models FROM 'registry.csv' WITH CSV HEADER`
4. Update `registryLoader.ts` to use Supabase client instead of static import
5. Add `getModels()` that queries `supabase.from('models').select('*')`

---

## 2. API Key Support

### Flow

1. Admin creates key in Supabase `api_keys` table (store hash, not plaintext)
2. Client sends `Authorization: Bearer <key>` or `X-API-Key: <key>`
3. Middleware validates and applies rate limit

### Implementation sketch

```ts
// src/app/lib/apiAuth.ts
export async function validateApiKey(key: string | null): Promise<{ valid: boolean; limit: number }> {
  if (!key) return { valid: false, limit: 60 }; // anonymous: 60/min
  const hash = await hashKey(key);
  const row = await supabase.from('api_keys').select('rate_limit_per_min').eq('key_hash', hash).single();
  return row ? { valid: true, limit: row.rate_limit_per_min } : { valid: false, limit: 60 };
}
```

### Rate limiting

- Use Vercel KV, Upstash Redis, or in-memory (single-instance) for counters
- Key: `ratelimit:${ipOrKey}:${minute}`
- Increment on each request; reject if over limit

---

## 3. Community Moderator Role

### Supabase Auth

1. Create `profiles` table with `role` column: `admin` | `moderator` | `user`
2. RLS policies: moderators can update `models` but not delete; admins can do both
3. Admin UI: invite moderators by email; set role in `profiles`

### Permission matrix

| Action           | User | Moderator | Admin |
|------------------|------|-----------|-------|
| View models      | ✓    | ✓         | ✓     |
| Submit dispute   | ✓    | ✓         | ✓     |
| Edit model       | —    | ✓         | ✓     |
| Delete model     | —    | —         | ✓     |
| Manage moderators| —    | —         | ✓     |

---

## 4. Checklist

- [ ] Create Supabase project and tables
- [ ] Run migration script (JSON → PostgreSQL)
- [ ] Update `registryLoader` to use Supabase
- [ ] Add `api_keys` table and validation
- [ ] Add rate-limit middleware to `/api/*`
- [ ] Add `profiles.role` and RLS
- [ ] Update admin UI for moderator management

---

*Reference: [ROADMAP.md](../ROADMAP.md)*

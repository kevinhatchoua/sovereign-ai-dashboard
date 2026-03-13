# Sovereign AI Dashboard — Roadmap

A living document for making the dashboard more **flexible**, **scalable**, and **community-driven**, with APIs and integrations for external services.

---

## 1. Public API (High Priority)

Enable other tools, dashboards, and scripts to consume the registry programmatically.

### Endpoints to Add

| Endpoint | Method | Description |
|----------|--------|--------------|
| `/api/models` | GET | List all models with optional filters (`?jurisdiction=EU`, `?openness=Open Weights`, `?provider=Mistral`) |
| `/api/models/[id]` | GET | Single model by ID |
| `/api/models/search` | GET | Full-text search (`?q=llama`) |
| `/api/stats` | GET | Aggregate stats (counts, compliance breakdown) for dashboards |
| `/api/export` | GET | Bulk export as JSON or CSV (`?format=json|csv`) |

### Design Principles

- **Read-only**: No mutations via public API (submissions go through GitHub PRs or admin UI)
- **Versioned**: Support `?v=1` or `Accept: application/vnd.sovereignai.v1+json` for future compatibility
- **Rate limiting**: Optional API key for higher limits; anonymous for reasonable use
- **CORS**: Allow `*` or configurable origins for embeddable widgets

### Example Response Shape

```json
{
  "models": [...],
  "meta": { "total": 234, "jurisdiction": "EU", "page": 1 }
}
```

---

## 2. Integrations & Connectors

### Outbound (Dashboard → External Services)

| Service | Use Case |
|---------|----------|
| **Hugging Face** | Sync `hf_downloads`, `hf_likes`; fetch new model metadata (already in place via scripts) |
| **European Open Source AI Index** | Import/merge models from [osai-index.eu](https://osai-index.eu) |
| **Slack/Webhook** | Notify when new models are added or compliance status changes |
| **GitHub** | Auto-open PRs for model updates; trigger sync workflows |

### Inbound (External Services → Dashboard)

| Integration | Use Case |
|--------------|----------|
| **Webhook receiver** | Accept model submissions from external tools (e.g. internal registries) |
| **OAuth** | Let users sign in with GitHub, Google for community contributions |
| **Embeddable widget** | `<iframe>` or JS snippet for embedding compliance badges on other sites |

### Embeddable Badge Example

```html
<!-- Embed on model docs, READMEs -->
<script src="https://sovereign-ai-dashboard.vercel.app/embed.js" 
        data-model="llama-3.1" data-jurisdiction="EU"></script>
```

---

## 3. Community-Driven Features

### Contribution Flow

- **GitHub Issues** → Model submissions, compliance disputes (already in place)
- **Crowdsourced voting** → Sovereignty scores (already in place via VoteButtons)
- **Dispute queue** → Admin reviews flagged models; community can add evidence

### Enhancements

| Feature | Description |
|---------|--------------|
| **Community moderators** | Trusted reviewers (beyond admin) with limited edit rights |
| **Model changelog** | Public history of changes per model (audit trail) |
| **RSS/Atom feed** | Feed of new models and compliance updates for subscribers |
| **Discord/Slack community** | Real-time discussion channel linked from README |

### Data Governance

- **Attribution**: Every model edit shows who approved it and when
- **Verification**: Require source links for compliance claims (e.g. BSI audit, EU register)
- **Fork-friendly**: Clear JSON schema so others can fork and merge changes

---

## 4. Scalability & Flexibility

### Data Layer

| Current | Future Option |
|---------|---------------|
| Static `registry.json` | **PostgreSQL/Supabase** for large catalogs (10k+ models), full-text search, versioning |
| In-memory filtering | **Edge caching** (Vercel KV, Redis) for hot queries |
| Scripts for HF sync | **Scheduled jobs** (Vercel Cron, GitHub Actions) for nightly sync |

### Architecture

- **Headless mode**: API-first; optional separate frontend (e.g. React, Vue, static) |
- **Plugin system**: Allow community to add custom compliance rules, scoring logic |
- **Multi-registry**: Support multiple registries (e.g. `eu`, `global`) with different schemas

### Performance

- **Incremental static regeneration (ISR)** for `/api/models` if using static JSON
- **CDN** for static assets and API responses
- **Pagination** for large result sets (`?page=1&limit=50`)

---

## 5. Implementation Phases

### Phase 1 — Quick Wins ✅ Delivered

- [x] Add `/api/models` (GET, JSON, optional filters)
- [x] Add `/api/models/[id]` for single model
- [x] Add `/api/stats` for dashboard stats
- [x] Document API in README

### Phase 2 — Integrations ✅ Delivered

- [x] Add `/api/export?format=csv|json`
- [x] Add webhook receiver (`/api/webhook/submit`, `X-Webhook-Secret`)
- [x] Add embeddable badge (`/embed.js`)
- [x] Add RSS feed (`/api/feed/models`)

### Phase 3 — Scale & Community (Planned)

- [ ] Migrate to Supabase/PostgreSQL if registry grows beyond 1k models
- [ ] Add API key support for rate limits
- [ ] Add community moderator role
- [ ] Add changelog/audit trail per model

See [docs/PHASE3_IMPLEMENTATION.md](docs/PHASE3_IMPLEMENTATION.md) for schema and implementation guide.

---

## 6. API Key & Rate Limits (Optional)

For public API, consider:

- **Anonymous**: 60 req/min per IP
- **API key** (free): 300 req/min
- **API key** (sponsor): Higher limits

Store keys in Supabase or env; validate via `Authorization: Bearer <key>` or `X-API-Key`.

---

## 7. Open Standards

- **JSON Schema** for registry format (publish at `schema.json`)
- **OpenAPI/Swagger** spec for API documentation
- **License**: Clear licensing for data (e.g. CC-BY) and code (MIT)

---

*Last updated: 2026. Share feedback via [GitHub Discussions](https://github.com/kevinhatchoua/sovereign-ai-dashboard/discussions) or [Issues](https://github.com/kevinhatchoua/sovereign-ai-dashboard/issues).*

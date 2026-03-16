# Data sources and validation

All data shown on the Sovereign AI Dashboard must be **validated, real, and backed by reputable sources**. This document describes where each type of data comes from and how it is verified.

## Model registry (`src/data/registry.json`)

- **Source of truth:** Entries must be backed by at least one of:
  - Official model cards or documentation (e.g. Hugging Face model pages, provider blogs)
  - Government or regulatory databases where applicable
  - Legal or compliance audits cited in the PR
- **Verification:** See [CONTRIBUTING.md](CONTRIBUTING.md). Every registry update must cite a public government database, official model card, or legal audit. No synthetic or placeholder data may be used in the production registry.
- **Scripts:** The script `scripts/add_models.js` generates **synthetic, dev-only** data (e.g. fictional model names). Its output must **not** be merged into the production registry; it is for local/testing use only.

## Community showcase

- **Primary:** Hugging Face Spaces API (spaces that match our criteria).
- **Fallback:** Curated `communityShowcase.json` when the API is unavailable or for featured entries. Entries should reference real, public Spaces or projects.

## News

- **Source:** RSS feeds from reputable providers: Hugging Face blog, Mistral, Meta AI, Google AI. No user-generated or unvetted content; we only consume feeds from these official sources.

## Games and referenced models

- **Games:** Curated list in `src/data/games.json` with links to real, open-source or documented projects (e.g. Hugging Face, GitHub). Not scraped from the open web.
- **Referenced models:** Curated list in `src/data/referencedModels.json` for models referenced on the site but not in the main catalog. Entries should point to real models and official docs.

## Environmental and ethics data

- **Ethics score:** Computed from registry fields (openness, data residency, compliance tags, documentation). No external API.
- **Environmental impact:** We do not yet display per-model carbon or energy data. When we do, it will come only from validated sources (e.g. provider model cards, peer‑reviewed studies, or tools like Hugging Face’s carbon footprint documentation). See the [Learn](/learn#environmental) page and model detail panel.

## Summary

| Data type        | Source(s)                                      | Validation                          |
|------------------|------------------------------------------------|-------------------------------------|
| Model registry   | HF, provider docs, government DBs, audits     | CONTRIBUTING verification; no synthetic data |
| Community showcase | HF Spaces API, curated JSON                 | Real Spaces / projects only         |
| News             | HF, Mistral, Meta, Google RSS                 | Official feeds only                 |
| Games / referenced | Curated JSON with real links                | Curated; real repos/docs            |
| Ethics score     | Derived from registry                         | Registry must be sourced            |
| Environmental    | Not yet used; future: model cards, studies   | To be sourced when added            |

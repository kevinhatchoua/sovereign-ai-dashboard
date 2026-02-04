# 🌍 Sovereign AI Transparency Dashboard

**Empowering users to navigate AI localization, data residency, and regional compliance.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Compliance: EU AI Act 2026](https://img.shields.io/badge/Compliance-EU_AI_Act_2026-blue)](https://artificialintelligenceact.eu/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## 📖 The Problem

As of 2026, artificial intelligence is no longer "borderless." Nations are passing strict laws (EU AI Act, India DPDP, CCPA) that mandate where data can be stored and how models must be governed. For developers and enterprises, knowing which LLM is safe to use in a specific country is a legal minefield.

## 🚀 The Solution

This open-source dashboard provides a real-time, community-verified registry of AI models and their "Sovereign Status."

### Key Features

- **Geographic Filtering:** Instantly see which models comply with your local data protection laws.
- **Sovereignty Score:** A proprietary metric based on data residency, model openness, and infrastructure autonomy.
- **Comparison Matrix:** Side-by-side legal risk analysis for top-tier models (Llama, Mistral, GPT, etc.).
- **Automated Watcher:** A GitHub Action that monitors regulatory changes and alerts the community to compliance shifts.

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Data:** JSON-first architecture for easy open-source contributions
- **Compliance Engine:** Custom TypeScript logic mapped to 2026 legislative articles

## 🚦 Getting Started

1. **Clone the repo:** `git clone https://github.com/kevinhatchoua/sovereign-ai-dashboard.git`
2. **Install:** `npm install`
3. **Run:** `npm run dev`
4. **Visit:** `localhost:3000`

## 🔒 Security

- **Voting:** Honeypot, browser fingerprinting, and 30-second rate limiting protect against bot manipulation.
- **Admin Dashboard:** `/admin` is protected by Supabase Auth. Add your email to `admin_emails` in Supabase to grant access. Enable MFA in Supabase Dashboard for additional security.
- **CSP:** Content Security Policy headers mitigate XSS and clickjacking.
- See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## 🤝 Community & Governance

This is a **public good** project. We rely on legal experts and developers to keep the `registry.json` updated. See our [CONTRIBUTING.md](CONTRIBUTING.md) for data verification standards.

---

*Disclaimer: This tool is for informational purposes only and does not constitute legal advice.*

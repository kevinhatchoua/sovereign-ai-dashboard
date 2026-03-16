# Contributing to the Sovereign AI Dashboard

Thank you for helping us build a more transparent AI ecosystem! We welcome contributions from developers, legal experts, and AI researchers.

## ⚖️ The Verification Law

In this project, we prioritize **Proof over Opinion**.

- **Real data only:** All data on the site must be **validated, real, and backed by reputable sources**. No synthetic, placeholder, or mock data in production. See [DATA_SOURCES.md](DATA_SOURCES.md) for where each type of data comes from and how it is verified.
- **Data Submissions:** All updates to `registry.json` must be accompanied by a link to a public government database, official model card, or legal audit.
- **AI-Assisted Code:** If you use Cursor/Claude/ChatGPT to generate code for this repo, you **must** disclose it in your PR and verify the logic yourself. "The AI said so" is not a valid explanation for a legal compliance filter.

## 🛠️ How to Contribute

### 1. Adding New Models

To add a model to the `registry.json`, follow the schema strictly:

- **`data_residency`**: Boolean. Must be true ONLY if the model can be run entirely on-prem or in a dedicated sovereign cloud partition.
- **`compliance_tags`**: Use standard codes (e.g., `EU-AI-ACT-ART-53`, `IN-DPDP-2025`).

### 2. Updating Legal Logic

If a new law is passed (e.g., a new US State privacy law), update `src/app/lib/complianceEngine.ts`.

- Every new rule must include a comment citing the specific legislative article.

### 3. Reporting Issues

- Use the **Compliance Gap** issue template if you find a model that is flagged incorrectly.
- Provide a link to the source of truth.

## 🚀 Technical Setup

1. Fork the repo.
2. Run `npm install`.
3. Create a branch: `git checkout -b legal/add-[jurisdiction]`.
4. Run tests: `npm test` (Ensure no compliance logic is broken).

## 📜 Code of Conduct

We follow the Contributor Covenant. We are a community of policy-wonks and code-monks—be respectful and evidence-based.

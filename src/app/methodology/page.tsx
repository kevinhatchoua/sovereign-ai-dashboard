import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/app/components/SiteHeader";

export const metadata = {
  title: "Open Methodology | Sovereign AI",
  description:
    "How we assess sovereignty: Four Dimensions, Readiness levels, and Cloud Act exposure. Transparent, auditable methodology.",
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-slate-200 [.light_&]:bg-white [.light_&]:text-slate-900">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          Open Methodology
        </h1>
        <p className="mb-2 text-slate-600">
          Our assessment is based on publicly available frameworks and designed for
          transparency. We welcome community input and corrections.
        </p>
        <p className="mb-2 text-sm text-slate-500">
          Last updated: January 2026. Licensed for transparency and audit.
        </p>

        <hr className="my-8 border-slate-200" />

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Four Dimensions of Sovereignty (McKinsey)
          </h2>
          <p className="mb-4 text-slate-600">
            We map each model against McKinsey&apos;s framework for assessing sovereign AI
            posture:
          </p>
          <ul className="space-y-4">
            <li>
              <strong className="text-slate-900">Data Sovereignty:</strong> Where does
              the data live? Can it be accessed by foreign jurisdictions (e.g., under
              the US Cloud Act)? We score based on data residency, GDPR compliance, and
              Cloud Act exposure.
            </li>
            <li>
              <strong className="text-slate-900">Operational Sovereignty:</strong> Who
              manages the stack? Can you run it if the provider cuts access? Open-weights
              models score higher; API-only models are provider-dependent.
            </li>
            <li>
              <strong className="text-slate-900">Technological Sovereignty:</strong> Do
              you own the underlying code or is it a "black box" proprietary model?
              Open-weights and auditable models score higher.
            </li>
            <li>
              <strong className="text-slate-900">Infrastructure Sovereignty:</strong> Do
              you have control over the physical compute (GPUs) and energy sources?
              Self-hostable models with domestic deployment options score higher.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Sovereignty Readiness Levels
          </h2>
          <p className="mb-4 text-slate-600">
            Inspired by Red Hat Digital Sovereignty Readiness and SUSE SEAL frameworks.
            We compute an average across the Four Dimensions and apply a Cloud Act
            penalty where applicable:
          </p>
          <ul className="space-y-2">
            <li>
              <strong className="text-emerald-700">Advanced (75–100):</strong> Strong
              posture across dimensions; suitable for high-sensitivity use cases.
            </li>
            <li>
              <strong className="text-amber-700">Intermediate (50–74):</strong> Moderate
              posture; review jurisdiction and hosting options.
            </li>
            <li>
              <strong className="text-slate-700">Foundation (0–49):</strong> Baseline;
              may require additional controls for sovereign deployment.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            US Cloud Act Exposure
          </h2>
          <p className="mb-4 text-slate-600">
            US-based providers may be subject to the Clarifying Lawful Overseas Use of
            Data (CLOUD) Act, which can compel disclosure of data in certain
            circumstances. We flag models from US-based providers or with US origin for
            transparency. This does not imply illegality—it is an informational risk
            indicator for organizations with strict data sovereignty requirements.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Data Sources & Governance
          </h2>
          <p className="mb-4 text-slate-600">
            Model metadata is sourced from public registries, provider documentation,
            and Hugging Face. Compliance tags are derived from jurisdictional
            requirements (EU AI Act, India DPDP, US Executive Order). We support
            community corrections via the Report Compliance Dispute flow.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            References
          </h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>McKinsey & Company: Four Dimensions of Sovereignty</li>
            <li>Red Hat: Digital Sovereignty Readiness Assessment (2026)</li>
            <li>SUSE: Cloud Sovereignty Framework Self-Assessment (2026)</li>
            <li>Forrester: Digital Sovereignty Assessment Tool</li>
            <li>NuEnergy.ai: Sovereignty Assessment Framework (CAISIC)</li>
          </ul>
        </section>

        <div className="mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to catalog
          </Link>
        </div>
      </main>
    </div>
  );
}

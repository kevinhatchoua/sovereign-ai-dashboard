import Link from "next/link";
import { ArrowLeft, Database, Cpu, Code, Server, ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/app/components/SiteHeader";
import { DataSovereigntyIllustration } from "@/app/components/DataSovereigntyIllustration";

export const metadata = {
  title: "Open Methodology | Sovereign AI",
  description:
    "How we assess sovereignty: Four Dimensions, Readiness levels, and Cloud Act exposure. Transparent, auditable methodology.",
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen text-slate-200 [.light_&]:text-slate-900">
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto max-w-3xl px-4 py-12 sm:px-6"
        tabIndex={-1}
        role="main"
        aria-label="Open methodology content"
      >
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-white [.light_&]:text-slate-900">
              Open Methodology
            </h1>
            <p className="mb-2 text-slate-200 [.light_&]:text-slate-700">
              Our assessment is based on publicly available frameworks and designed for
              transparency. We welcome community input and corrections.
            </p>
            <p className="mb-2 text-sm text-slate-300 [.light_&]:text-slate-600">
              Last updated: January 2026. Licensed for transparency and audit.
            </p>
          </div>
          <div className="shrink-0" aria-hidden="true">
            <DataSovereigntyIllustration className="h-20 w-32 text-slate-400 [.light_&]:text-slate-500" />
          </div>
        </div>

        <hr className="my-8 border-slate-600 [.light_&]:border-slate-200" aria-hidden="true" />

        <section className="mb-10" aria-labelledby="dimensions-heading">
          <h2 id="dimensions-heading" className="mb-4 flex items-center gap-2 text-xl font-semibold text-white [.light_&]:text-slate-900">
            <Database className="h-5 w-5 shrink-0 text-blue-500 [.light_&]:text-blue-600" aria-hidden="true" />
            Four Dimensions of Sovereignty (McKinsey)
          </h2>
          <p className="mb-4 text-slate-200 [.light_&]:text-slate-700">
            We map each model against McKinsey&apos;s framework for assessing sovereign AI
            posture:
          </p>
          <ul className="space-y-4 text-slate-200 [.light_&]:text-slate-700" role="list">
            <li className="flex gap-3">
              <Database className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 [.light_&]:text-slate-500" aria-hidden="true" />
              <span>
                <strong className="text-white [.light_&]:text-slate-900">Data Sovereignty:</strong>{" "}
                Where does the data live? Can it be accessed by foreign jurisdictions (e.g., under
                the US Cloud Act)? We score based on data residency, GDPR compliance, and
                Cloud Act exposure.
              </span>
            </li>
            <li className="flex gap-3">
              <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 [.light_&]:text-slate-500" aria-hidden="true" />
              <span>
                <strong className="text-white [.light_&]:text-slate-900">Operational Sovereignty:</strong>{" "}
                Who manages the stack? Can you run it if the provider cuts access? Open-weights
                models score higher; API-only models are provider-dependent.
              </span>
            </li>
            <li className="flex gap-3">
              <Code className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 [.light_&]:text-slate-500" aria-hidden="true" />
              <span>
                <strong className="text-white [.light_&]:text-slate-900">Technological Sovereignty:</strong>{" "}
                Do you own the underlying code or is it a &quot;black box&quot; proprietary model?
                Open-weights and auditable models score higher.
              </span>
            </li>
            <li className="flex gap-3">
              <Server className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 [.light_&]:text-slate-500" aria-hidden="true" />
              <span>
                <strong className="text-white [.light_&]:text-slate-900">Infrastructure Sovereignty:</strong>{" "}
                Do you have control over the physical compute (GPUs) and energy sources?
                Self-hostable models with domestic deployment options score higher.
              </span>
            </li>
          </ul>
        </section>

        <section className="mb-10" aria-labelledby="readiness-heading">
          <h2 id="readiness-heading" className="mb-4 flex items-center gap-2 text-xl font-semibold text-white [.light_&]:text-slate-900">
            <Server className="h-5 w-5 shrink-0 text-blue-500 [.light_&]:text-blue-600" aria-hidden="true" />
            Sovereignty Readiness Levels
          </h2>
          <p className="mb-4 text-slate-200 [.light_&]:text-slate-700">
            Inspired by Red Hat Digital Sovereignty Readiness and SUSE SEAL frameworks.
            We compute an average across the Four Dimensions and apply a Cloud Act
            penalty where applicable:
          </p>
          <ul className="space-y-2 text-slate-200 [.light_&]:text-slate-700" role="list">
            <li>
              <strong className="text-blue-400 [.light_&]:text-blue-700">Advanced (75–100):</strong>{" "}
              Strong posture across dimensions; suitable for high-sensitivity use cases.
            </li>
            <li>
              <strong className="text-indigo-400 [.light_&]:text-indigo-700">Intermediate (50–74):</strong>{" "}
              Moderate posture; review jurisdiction and hosting options.
            </li>
            <li>
              <strong className="text-slate-400 [.light_&]:text-slate-700">Foundation (0–49):</strong>{" "}
              Baseline; may require additional controls for sovereign deployment.
            </li>
          </ul>
        </section>

        <section className="mb-10" aria-labelledby="cloud-act-heading">
          <h2 id="cloud-act-heading" className="mb-4 flex items-center gap-2 text-xl font-semibold text-white [.light_&]:text-slate-900">
            <ShieldAlert className="h-5 w-5 shrink-0 text-sky-500 [.light_&]:text-sky-600" aria-hidden="true" />
            US Cloud Act Exposure
          </h2>
          <p className="mb-4 text-slate-200 [.light_&]:text-slate-700">
            US-based providers may be subject to the Clarifying Lawful Overseas Use of
            Data (CLOUD) Act, which can compel disclosure of data in certain
            circumstances. We flag models from US-based providers or with US origin for
            transparency. This does not imply illegality—it is an informational risk
            indicator for organizations with strict data sovereignty requirements.
          </p>
        </section>

        <section className="mb-10" aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="mb-4 text-xl font-semibold text-white [.light_&]:text-slate-900">
            Data Sources &amp; Governance
          </h2>
          <p className="mb-4 text-slate-200 [.light_&]:text-slate-700">
            Model metadata is sourced from public registries, provider documentation,
            and Hugging Face. Compliance tags are derived from jurisdictional
            requirements (EU AI Act, India DPDP, US Executive Order). We support
            community corrections via the Report Compliance Dispute flow.
          </p>
        </section>

        <section aria-labelledby="references-heading">
          <h2 id="references-heading" className="mb-4 text-xl font-semibold text-white [.light_&]:text-slate-900">
            References
          </h2>
          <ul className="space-y-2 text-sm text-slate-200 [.light_&]:text-slate-700" role="list">
            <li>McKinsey &amp; Company: Four Dimensions of Sovereignty</li>
            <li>Red Hat: Digital Sovereignty Readiness Assessment (2026)</li>
            <li>SUSE: Cloud Sovereignty Framework Self-Assessment (2026)</li>
            <li>Forrester: Digital Sovereignty Assessment Tool</li>
            <li>NuEnergy.ai: Sovereignty Assessment Framework (CAISIC)</li>
          </ul>
        </section>

        <nav className="mt-12" aria-label="Back to catalog">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 [.light_&]:focus-visible:ring-offset-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to catalog
          </Link>
        </nav>
      </main>
    </div>
  );
}

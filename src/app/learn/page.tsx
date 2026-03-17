import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Shield,
  Server,
  Scale,
  Database,
  MapPin,
  AlertTriangle,
  ExternalLink,
  Gamepad2,
  Leaf,
  LayoutDashboard,
  BookMarked,
  Library,
  Wrench,
} from "lucide-react";
import { SiteHeader } from "@/app/components/SiteHeader";
import { LearnPageNav } from "@/app/components/LearnPageNav";
import referencedModelsData from "@/data/referencedModels.json";

const ext = (href: string, label: string) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline [.light_&]:text-blue-600">
    {label}
    <ExternalLink className="ml-1 inline h-3.5 w-3.5" aria-hidden />
  </a>
);

export const metadata = {
  title: "Learn | Sovereign AI",
  description:
    "Understand sovereignty, readiness levels, Cloud Act, ethics score, compliance tags, regulation, frameworks, and tools. Guide to the metrics we use and where to learn more.",
};

const SECTIONS = [
  {
    id: "sovereignty",
    icon: Shield,
    title: "What is Sovereignty?",
    content: (
      <>
        <p className="mb-3">
          <strong>Sovereign AI</strong> means AI systems you can own, control, and deploy on your own
          infrastructure—without depending on foreign providers or cloud vendors. Nations are passing
          laws (EU AI Act, India DPDP, CCPA) that mandate where data lives and how models are
          governed.
        </p>
        <p>
          We assess models across four dimensions (Data, Operational, Technological, Infrastructure)
          and combine them into a <strong>Sovereignty Readiness</strong> score. Higher scores mean
          stronger posture for sovereign deployment.
        </p>
      </>
    ),
  },
  {
    id: "readiness-levels",
    icon: Scale,
    title: "Readiness Levels",
    content: (
      <>
        <p className="mb-4">
          We map each model to one of three levels, inspired by Red Hat and SUSE frameworks:
        </p>
        <ul className="space-y-3 text-slate-200 [.light_&]:text-slate-700" role="list">
          <li>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-500/70 bg-transparent px-2.5 py-0.5 text-xs font-medium text-slate-500 [.light_&]:border-slate-400 [.light_&]:text-slate-600">
              Advanced (75–100)
            </span>
            <span className="ml-2">
              Strong posture across all dimensions. Suitable for high-sensitivity use cases
              (health, finance, defense).
            </span>
          </li>
          <li>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-500/70 bg-transparent px-2.5 py-0.5 text-xs font-medium text-slate-500 [.light_&]:border-slate-400 [.light_&]:text-slate-600">
              Intermediate (50–74)
            </span>
            <span className="ml-2">
              Moderate posture. Review jurisdiction and hosting options before deployment.
            </span>
          </li>
          <li>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-500/70 bg-transparent px-2.5 py-0.5 text-xs font-medium text-slate-500 [.light_&]:border-slate-400 [.light_&]:text-slate-600">
              Foundation (0–49)
            </span>
            <span className="ml-2">
              Baseline. May require additional controls for sovereign deployment.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "cloud-act",
    icon: AlertTriangle,
    title: "Cloud Act Exposure",
    content: (
      <>
        <p className="mb-3">
          The <strong>US Cloud Act</strong> (Clarifying Lawful Overseas Use of Data) can compel
          US-based providers to disclose data in certain circumstances. We flag models from
          US-based providers or with US origin as having Cloud Act exposure.
        </p>
        <p>
          This is an <em>informational risk indicator</em> for organizations with strict data
          sovereignty requirements. It does not imply illegality—it helps you make informed
          decisions when jurisdiction matters.
        </p>
      </>
    ),
  },
  {
    id: "ethics-score",
    icon: BookOpen,
    title: "Ethics Score",
    content: (
      <>
        <p className="mb-3">
          Our <strong>Ethics Score</strong> (0–100) combines two pillars:
        </p>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-slate-200 [.light_&]:text-slate-700">
          <li>
            <strong>Data Sovereignty (50%):</strong> Open weights, data residency, sovereign
            deployment support
          </li>
          <li>
            <strong>Transparency (50%):</strong> Openness, compliance tags, documentation (e.g.,
            training cutoff), community adoption
          </li>
        </ul>
        <p className="mb-2">Color coding:</p>
        <ul className="space-y-1 text-slate-200 [.light_&]:text-slate-700" role="list">
          <li>
            <span className="font-medium text-emerald-500 [.light_&]:text-emerald-700">
              Green (&gt;70):
            </span>{" "}
            Strong ethics posture
          </li>
          <li>
            <span className="font-medium text-amber-500 [.light_&]:text-amber-700">
              Amber (40–70):
            </span>{" "}
            Moderate; review before use
          </li>
          <li>
            <span className="font-medium text-red-500 [.light_&]:text-red-700">
              Red (&lt;40):
            </span>{" "}
            Limited signals; proceed with caution
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "environmental",
    icon: Leaf,
    title: "Environmental Impact",
    content: (
      <>
        <p className="mb-3">
          Training and running large language models has a real environmental footprint (energy use,
          carbon emissions). We do not yet include environmental impact in our Ethics Score or as a
          separate metric, because we require <strong>validated, attributable data</strong>—e.g.
          from provider model cards, peer‑reviewed studies, or tools like the{" "}
          <a
            href="https://huggingface.co/docs/transformers/main/en/model_doc/bigbird_pegasus#environmental-impact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline [.light_&]:text-blue-600"
          >
            Hugging Face carbon footprint
          </a>{" "}
          documentation.
        </p>
        <p className="mb-3">
          When such data is available and cited, we may show it in the model detail panel and
          optionally fold it into the ethics score or a dedicated environmental section. Reputable
          sources we consider: ML CO2 impact research (e.g. Strubell et al., &quot;Energy and Policy
          Considerations for Deep Learning in NLP&quot;), provider sustainability reports, and
          official model cards.
        </p>
        <p className="text-sm text-slate-400 [.light_&]:text-slate-600">
          If you have a peer‑reviewed or official source for a model&apos;s carbon or energy data,
          please contribute it via our contribution guidelines.
        </p>
      </>
    ),
  },
  {
    id: "four-dimensions",
    icon: Database,
    title: "Four Dimensions of Sovereignty",
    content: (
      <>
        <p className="mb-4">
          Based on McKinsey&apos;s framework, we score each model across four dimensions:
        </p>
        <ul className="space-y-3 text-slate-200 [.light_&]:text-slate-700" role="list">
          <li>
            <strong className="text-white [.light_&]:text-slate-900">Data:</strong> Where does the
            data live? Cloud Act exposure? Data residency and GDPR compliance.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">Operational:</strong> Can you
            run it if the provider cuts access? Open-weights models score higher.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">Technological:</strong> Do you
            own the code or is it a black box? Open weights and auditable models score higher.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">Infrastructure:</strong> Do you
            control compute and energy? Self-hostable models with domestic options score higher.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "games",
    icon: Gamepad2,
    title: "Games & Game Development",
    content: (
      <>
        <p className="mb-3">
          Models tagged with <strong>Games</strong> are well-suited for game AI: NPC dialogue,
          procedural quest generation, and creative content. They typically support code and
          conversational tasks.
        </p>
        <p>
          Use the Games quick filter on the catalog to find models for building AI-powered games
          and interactive experiences.
        </p>
      </>
    ),
  },
  {
    id: "openness",
    icon: Server,
    title: "Openness: Local-hostable vs API",
    content: (
      <>
        <p className="mb-3">
          <strong>Local-hostable</strong> (Open Weights) models let you download and run the weights
          on your own infrastructure. You have full control—no dependency on a provider.
        </p>
        <p>
          <strong>API-only</strong> models are accessed via a provider&apos;s API. You depend on
          their infrastructure, terms, and jurisdiction. They score lower on operational and
          technological sovereignty.
        </p>
      </>
    ),
  },
  {
    id: "compliance-tags",
    icon: MapPin,
    title: "Compliance Tags",
    content: (
      <>
        <p className="mb-4">
          Tags indicate alignment with jurisdictional requirements. We derive these from provider
          documentation and public registries:
        </p>
        <ul className="space-y-2 text-slate-200 [.light_&]:text-slate-700" role="list">
          <li>
            <strong>GDPR:</strong> EU General Data Protection Regulation—data privacy and protection
            for EU residents.
          </li>
          <li>
            <strong>EU AI Act Ready:</strong> Alignment with the EU AI Act&apos;s requirements for
            high-risk AI systems.
          </li>
          <li>
            <strong>Data residency:</strong> Data stored within a specific geographic region (e.g.,
            EU-only).
          </li>
          <li>
            <strong>India Data Localization:</strong> Compliance with India&apos;s DPDP data
            localization requirements.
          </li>
          <li>
            <strong>Sovereign Deployment:</strong> Supports on-premises or sovereign cloud
            deployment for data control.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "referenced-models",
    icon: ExternalLink,
    title: "Referenced Models (Not in Catalog)",
    content: (
      <>
        <p className="mb-4">
          When we showcase community apps built with models outside our catalog, we list them here
          for transparency. These are referenced in the community banner and elsewhere.
        </p>
        <ul className="space-y-2 text-slate-200 [.light_&]:text-slate-700" role="list">
          {(referencedModelsData as { id: string; name: string; provider: string; link: string; note: string }[]).map(
            (m) => (
              <li key={m.id} className="flex flex-wrap items-baseline gap-2">
                <strong className="text-white [.light_&]:text-slate-900">{m.name}</strong>
                <span className="text-slate-500">({m.provider})</span>
                <a
                  href={m.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 [.light_&]:text-blue-600 [.light_&]:hover:text-blue-700"
                >
                  {m.provider} →
                </a>
                <span className="text-xs text-slate-500">— {m.note}</span>
              </li>
            )
          )}
        </ul>
      </>
    ),
  },
  {
    id: "how-to-use",
    icon: LayoutDashboard,
    title: "How to use this dashboard",
    content: (
      <>
        <p className="mb-3">
          This app helps you discover and compare <strong>open and sovereign AI models</strong> and
          stay informed on regulation and news.
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-slate-200 [.light_&]:text-slate-700">
          <li>
            <Link href="/" className="text-blue-400 hover:underline [.light_&]:text-blue-600">Catalog</Link>
            {" "}— Browse models, filter by sovereignty, ethics, provider, or task (e.g. Games). Use quick filters or the comparison matrix.
          </li>
          <li>
            <Link href="/dashboard" className="text-blue-400 hover:underline [.light_&]:text-blue-600">Dashboard</Link>
            {" "}— News & updates (AI, sovereignty, regulation), plus quick links to methodology and Learn.
          </li>
          <li>
            <Link href="/methodology" className="text-blue-400 hover:underline [.light_&]:text-blue-600">Methodology</Link>
            {" "}— How we score the four dimensions, readiness levels, and Cloud Act. Full references.
          </li>
          <li>
            <strong>Chatbot</strong> — Ask in natural language about models, or get a joke. We do not give opinions on current events; we suggest external search when needed.
          </li>
        </ul>
        <p className="text-sm text-slate-400 [.light_&]:text-slate-600">
          For admin access and chat log security, see our access and security documentation (linked in Tools & community below).
        </p>
      </>
    ),
  },
  {
    id: "regulation-law",
    icon: BookMarked,
    title: "Regulation & law",
    content: (
      <>
        <p className="mb-4">
          Sovereign AI and model deployment are shaped by data protection and AI regulation. Official and explanatory links:
        </p>
        <ul className="space-y-3 text-slate-200 [.light_&]:text-slate-700" role="list">
          <li>
            <strong className="text-white [.light_&]:text-slate-900">EU AI Act</strong> — {ext("https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689", "Regulation (EU) 2024/1689")} (Eur-Lex). Risk-based rules for AI systems in the EU.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">GDPR</strong> — {ext("https://gdpr-info.eu/", "GDPR full text")}. Data protection and residency for EU residents.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">US Cloud Act</strong> — {ext("https://www.justice.gov/opa/pr/department-justice-clarifies-lawful-overseas-use-data-act", "DoJ overview")}. Affects data held by US-based providers.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">India DPDP</strong> — {ext("https://www.meity.gov.in/data-protection-framework", "MeitY data protection")}. India&apos;s digital personal data and localization requirements.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">NIST AI RMF</strong> — {ext("https://www.nist.gov/itl/ai-risk-management-framework", "NIST AI RMF")}. Voluntary risk management framework for AI (US).
          </li>
        </ul>
        <p className="mt-4 text-sm text-slate-400 [.light_&]:text-slate-600">
          This dashboard is for informational use only and does not constitute legal advice. Always consult qualified counsel for compliance.
        </p>
      </>
    ),
  },
  {
    id: "frameworks-research",
    icon: Library,
    title: "Frameworks & research",
    content: (
      <>
        <p className="mb-4">
          Our methodology draws on public frameworks and research. Useful references:
        </p>
        <ul className="space-y-3 text-slate-200 [.light_&]:text-slate-700" role="list">
          <li>
            <strong className="text-white [.light_&]:text-slate-900">McKinsey — Four dimensions of sovereignty</strong> — Used for Data, Operational, Technological, and Infrastructure scoring. Search for &quot;sovereign AI&quot; or &quot;digital sovereignty&quot; on McKinsey for reports.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">Red Hat — Digital sovereignty readiness</strong> — {ext("https://www.redhat.com/en/topics/cloud-computing/what-is-digital-sovereignty", "Red Hat digital sovereignty")}. Aligns with our readiness level labels.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">SUSE — Cloud sovereignty framework</strong> — Public framework for sovereign cloud and on-prem deployment.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">Hugging Face — Model cards & docs</strong> — {ext("https://huggingface.co/docs", "Hugging Face docs")}. We use model cards and pipeline tags for openness and task labels.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">Environmental impact (ML)</strong> — Strubell et al., &quot;Energy and Policy Considerations for Deep Learning in NLP&quot; (e.g. {ext("https://arxiv.org/abs/1906.02243", "arXiv")}). We consider such sources when displaying carbon or energy data.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "tools-community",
    icon: Wrench,
    title: "Tools & community",
    content: (
      <>
        <p className="mb-4">
          Where to find models, run comparisons, and get help:
        </p>
        <ul className="space-y-3 text-slate-200 [.light_&]:text-slate-700" role="list">
          <li>
            <strong className="text-white [.light_&]:text-slate-900">Hugging Face Models</strong> — {ext("https://huggingface.co/models?pipeline_tag=text-generation", "Browse text-generation models")}. Many models in our catalog are hosted here.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">This app</strong> — <Link href="/" className="text-blue-400 hover:underline [.light_&]:text-blue-600">Catalog</Link>,{" "}
            <Link href="/methodology" className="text-blue-400 hover:underline [.light_&]:text-blue-600">Methodology</Link>,{" "}
            <Link href="/dashboard" className="text-blue-400 hover:underline [.light_&]:text-blue-600">Dashboard</Link>,{" "}
            <Link href="/games" className="text-blue-400 hover:underline [.light_&]:text-blue-600">AI Games</Link>.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">Access & security</strong> — How to access front-end, back-end, and databases; admin and chat log lockdown. See the <code className="rounded bg-slate-700/50 px-1.5 py-0.5 text-sm [.light_&]:bg-slate-200">docs/ACCESS_AND_SECURITY.md</code> file in the repo, or your deployment docs.
          </li>
          <li>
            <strong className="text-white [.light_&]:text-slate-900">Contribute</strong> — Corrections and suggestions for methodology or model data are welcome via the project&apos;s contribution guidelines (e.g. GitHub issues or PRs).
          </li>
        </ul>
      </>
    ),
  },
] as const;

const sectionList = SECTIONS.map(({ id, title }) => ({ id, title }));

export default function LearnPage() {
  return (
    <div className="min-h-screen text-slate-200 [.light_&]:text-slate-900">
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto max-w-6xl animate-fade-in px-4 py-12 sm:px-6"
        tabIndex={-1}
        role="main"
        aria-label="Learn about sovereignty metrics"
      >
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white [.light_&]:text-slate-900">
            Learn
          </h1>
          <p className="max-w-2xl text-slate-500 [.light_&]:text-slate-600">
            Quick reference for sovereignty, readiness levels, Cloud Act, ethics score, regulation, and where to find frameworks, research, and tools.
          </p>
        </div>

        {/* Mobile / tablet: horizontal jump-to */}
        <nav className="mb-10 lg:hidden" aria-label="Quick navigation">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500 [.light_&]:text-slate-600">
            Jump to
          </p>
          <ul className="flex flex-wrap gap-2" role="list">
            {SECTIONS.map(({ id, title }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="inline-flex rounded-lg bg-slate-800/60 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700/80 hover:text-white [.light_&]:bg-slate-200 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-300 [.light_&]:hover:text-slate-900"
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex gap-10 lg:gap-12">
          <LearnPageNav sections={sectionList} />

          <div className="min-w-0 flex-1 space-y-10">
          {SECTIONS.map(({ id, icon: Icon, title, content }) => (
            <section
              key={id}
              id={id}
              className="scroll-mt-24"
              aria-labelledby={`${id}-heading`}
            >
              <h2
                id={`${id}-heading`}
                className="mb-4 flex items-center gap-2 text-xl font-semibold text-white [.light_&]:text-slate-900"
              >
                <Icon className="h-5 w-5 shrink-0 text-blue-500 [.light_&]:text-blue-600" aria-hidden />
                {title}
              </h2>
              <div className="glass rounded-xl border-slate-700/50 p-5 [.light_&]:border-slate-200/60">
                {content}
              </div>
            </section>
          ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium !text-white no-underline hover:bg-blue-800 [.light_&]:bg-blue-600 [.light_&]:hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to catalog
          </Link>
          <Link
            href="/methodology"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 no-underline hover:bg-slate-700/80 [.light_&]:border-slate-300 [.light_&]:bg-slate-200 [.light_&]:text-slate-800 [.light_&]:hover:bg-slate-300"
          >
            Full methodology
          </Link>
        </div>
      </main>
    </div>
  );
}

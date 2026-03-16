"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  X,
  Cpu,
  Users,
  HardDrive,
  ChevronRight,
  AlertCircle,
  MapPin,
  Server,
  Cloud,
  Shield,
  Globe,
  Code,
  ExternalLink,
  Download,
  FileText,
} from "lucide-react";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";
import { computeEthicsScore, getEthicsScoreColorClasses } from "@/app/lib/ethicsScore";
import { getModelLinks, getModelDescription } from "@/app/lib/modelLinks";
import {
  getFourDimensions,
  getSovereigntyReadiness,
  hasCloudActExposure,
  getSovereigntyReadinessColorClasses,
  getOpennessColorClasses,
} from "@/app/lib/sovereigntyScore";
import { SOVEREIGN_PLATFORMS, getCompatiblePlatforms } from "@/app/lib/sovereignPlatforms";
import { ComplianceTooltip } from "@/app/components/ComplianceTooltip";
import type { Jurisdiction } from "@/app/lib/complianceEngine";
import { VoteButtons } from "@/app/components/VoteButtons";
import { DisputeModal } from "@/app/components/DisputeModal";
import { useDialogAccessibility } from "@/app/lib/useDialogAccessibility";

function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-500"
        points={points}
      />
    </svg>
  );
}

type ModelDetailPanelProps = {
  model: ComparisonModel | null;
  jurisdiction: Jurisdiction | null;
  onClose: () => void;
  openDisputeOnMount?: boolean;
};

export function ModelDetailPanel({
  model,
  jurisdiction,
  onClose,
  openDisputeOnMount = false,
}: ModelDetailPanelProps) {
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [executiveSummaryOpen, setExecutiveSummaryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  useDialogAccessibility(!!model, onClose, panelRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (model) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [model]);

  useEffect(() => {
    if (openDisputeOnMount) setDisputeModalOpen(true);
  }, [openDisputeOnMount]);

  if (!model) return null;

  const intel = model.intelligence;
  const TASK_LABELS: Record<string, string> = {
    "text-generation": "Text generation",
    conversational: "Conversational",
    code: "Code",
    "question-answering": "Q&A",
    summarization: "Summarization",
    vision: "Vision",
  };
  const LANG_LABELS: Record<string, string> = {
    en: "English", zh: "Chinese", fr: "French", de: "German",
    es: "Spanish", ar: "Arabic", hi: "Hindi", multilingual: "Multilingual",
  };
  const regions = ["EU", "US", "India"] as const;
  const hasEU = model.compliance_tags.some((t) => t.includes("EU") || t.includes("GDPR"));
  const hasUS = model.origin_country === "United States" || model.compliance_tags.some((t) => t.includes("US"));
  const hasIndia = model.compliance_tags.some((t) => t.includes("India"));
  const regionList = [hasEU && "EU", hasUS && "US", hasIndia && "India"].filter(Boolean) as string[];

  const panel = (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <aside
        ref={panelRef}
        className="glass-strong fixed inset-x-0 top-0 z-50 flex h-full max-h-[100dvh] w-full flex-col border-l border-slate-700/50 shadow-2xl [.light_&]:border-slate-200/60 sm:inset-x-auto sm:left-auto sm:right-0 sm:max-w-lg pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${model.name}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700/50 px-4 py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] [.light_&]:border-slate-200/60">
          <h2 className="min-w-0 truncate text-lg font-semibold text-white [.light_&]:text-slate-900">{model.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] shrink-0 touch-manipulation items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-100 [.light_&]:hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
          {/* Overview - always visible */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-slate-300 [.light_&]:text-slate-700">
              Overview
            </h3>
            <div className="glass space-y-3 rounded-xl border-slate-700/50 p-4 [.light_&]:border-slate-200/60">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getOpennessColorClasses(model.openness_level)}`}>
                  {model.openness_level === "Open Weights" ? <Server className="h-3.5 w-3.5" /> : <Cloud className="h-3.5 w-3.5" />}
                  {model.openness_level}
                </span>
                {model.data_residency && (
                  <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-400 [.light_&]:text-blue-800 [.light_&]:bg-blue-100">
                    Data residency
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-slate-500 [.light_&]:text-slate-600" />
                <span className="text-slate-200 [.light_&]:text-slate-800">{model.origin_country}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 [.light_&]:text-slate-600">{model.provider}</span>
              </div>
              <p className="text-sm text-slate-400 [.light_&]:text-slate-600">
                {getModelDescription(model)}
              </p>
              {regionList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {regions.map((r) => (
                    <span
                      key={r}
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${
                        regionList.includes(r)
                          ? "bg-slate-600/80 text-slate-200 [.light_&]:bg-slate-200 [.light_&]:text-slate-800"
                          : "bg-slate-700/40 text-slate-500 [.light_&]:bg-slate-200 [.light_&]:text-slate-700"
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      {r}
                    </span>
                  ))}
                </div>
              )}
              {model.compliance_tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {model.compliance_tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300 [.light_&]:bg-slate-200 [.light_&]:text-slate-800">
                      {tag}
                      <ComplianceTooltip term={tag} />
                    </span>
                  ))}
                </div>
              )}
              {model.languages.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-slate-500 [.light_&]:text-slate-600" />
                  <span className="text-xs text-slate-400 [.light_&]:text-slate-600">
                    {model.languages.slice(0, 6).map((l) => LANG_LABELS[l] ?? l).join(", ")}
                  </span>
                </div>
              )}
              {model.task_categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-slate-500 [.light_&]:text-slate-600" />
                  {model.task_categories.map((t) => (
                    <span key={t} className="rounded bg-slate-700/40 px-2 py-0.5 text-xs text-slate-400 [.light_&]:bg-slate-200 [.light_&]:text-slate-700">
                      {TASK_LABELS[t] ?? t}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60 pt-3 [.light_&]:border-slate-200">
                <span className="text-xs text-slate-500 [.light_&]:text-slate-600">Ethical Design Score:</span>
                <span className={`font-semibold ${getEthicsScoreColorClasses(computeEthicsScore(model))}`}>
                  {computeEthicsScore(model)}/100
                </span>
                <span className="text-xs text-slate-500 [.light_&]:text-slate-600">
                  (Data Sovereignty, Bias Mitigation, Transparency)
                </span>
              </div>
            </div>
          </section>

          {/* Resources - links and additional details */}
          {(() => {
            const links = getModelLinks(model);
            if (!links.learnMore && !links.download) return null;
            return (
              <section className="mb-6">
                <h3 className="mb-3 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                  Resources &amp; Links
                </h3>
                <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-4 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
                  {links.learnMore && (
                    <a
                      href={links.learnMore}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-600/60 bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/80 hover:text-white [.light_&]:border-slate-300 [.light_&]:bg-slate-100 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Official site / docs
                    </a>
                  )}
                  {links.download && (
                    <a
                      href={links.download}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-blue-600/40 bg-blue-600/10 px-3 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-600/20 [.light_&]:border-blue-600/60 [.light_&]:bg-blue-50 [.light_&]:text-blue-700 [.light_&]:hover:bg-blue-200"
                    >
                      <Download className="h-4 w-4" />
                      Download from Hugging Face
                    </a>
                  )}
                </div>
              </section>
            );
          })()}

          {/* Four Dimensions & Sovereignty Readiness */}
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                Sovereignty Assessment
              </h3>
              <Link
                href="/learn#readiness-levels"
                className="text-xs font-medium text-blue-400 hover:text-blue-300 [.light_&]:text-blue-600 [.light_&]:hover:text-blue-700"
              >
                Learn more
              </Link>
            </div>
            <div className="glass space-y-3 rounded-xl border-slate-700/50 p-4 [.light_&]:border-slate-200/60">
              {(() => {
                const readiness = getSovereigntyReadiness(model);
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 [.light_&]:text-slate-600">
                        Readiness
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getSovereigntyReadinessColorClasses(readiness.level)}`}
                      >
                        {readiness.label} ({readiness.score}/100)
                      </span>
                    </div>
                    {hasCloudActExposure(model) && (
                      <p className="text-xs text-slate-500 [.light_&]:text-slate-700">
                        US-based provider; may be subject to Cloud Act.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {getFourDimensions(model).map((d) => (
                        <div
                          key={d.dimension}
                          className="rounded bg-slate-700/40 p-2 [.light_&]:bg-slate-100"
                          title={d.description}
                        >
                          <p className="text-xs font-medium text-slate-300 [.light_&]:text-slate-800">
                            {d.label}
                          </p>
                          <p
                            className={`text-xs ${
                              d.level === "high"
                                ? "text-blue-500 [.light_&]:text-blue-700"
                                : d.level === "medium"
                                  ? "text-indigo-500 [.light_&]:text-indigo-700"
                                  : "text-slate-500 [.light_&]:text-slate-600"
                            }`}
                          >
                            {d.score}/100 · {d.level}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </section>

          {/* Supply chain & vendor risk */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
              Supply Chain & Vendor
            </h3>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 [.light_&]:text-slate-600">Provider origin</span>
                  <span className="text-slate-200 [.light_&]:text-slate-900">{model.origin_country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 [.light_&]:text-slate-600">Vendor lock-in</span>
                  <span className="text-slate-200 [.light_&]:text-slate-900">
                    {model.openness_level === "Open Weights"
                      ? "Low (self-hostable)"
                      : "High (API-dependent)"}
                  </span>
                </div>
                {model.openness_level === "Open Weights" && (
                  <p className="text-xs text-slate-500 [.light_&]:text-slate-600">
                    Open-weights models can run on your infrastructure; verify GPU supply chain for
                    domestic sourcing if required.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Platform compatibility */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
              Sovereign Platform Compatibility
            </h3>
            <div className="space-y-2">
              {getCompatiblePlatforms(model.openness_level).map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-slate-700 bg-slate-800/50 p-3 transition hover:bg-slate-700/50 [.light_&]:border-slate-200 [.light_&]:bg-slate-50 [.light_&]:hover:bg-slate-100"
                >
                  <p className="text-sm font-medium text-slate-200 [.light_&]:text-slate-900">
                    {p.name}
                  </p>
                  <p className="text-xs text-slate-500 [.light_&]:text-slate-600">
                    {p.description}
                  </p>
                </a>
              ))}
            </div>
          </section>

          {/* Community voting */}
          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
              <Users className="h-4 w-4" />
              Community Sovereignty Score
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <VoteButtons modelId={model.id} showSentiment />
            </div>
          </section>

          {/* Scraped metadata */}
          {intel && (
            <section className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                Model Intelligence
              </h3>
              <div className="grid gap-2">
                {(intel.hf_downloads != null || intel.hf_likes != null) && (
                  <div className="flex flex-wrap gap-3 text-sm">
                    {intel.hf_downloads != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 [.light_&]:text-slate-700">HF Downloads:</span>
                        <span className="text-slate-200 [.light_&]:text-slate-900">
                          {intel.hf_downloads.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {intel.hf_likes != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 [.light_&]:text-slate-700">HF Likes:</span>
                        <span className="text-slate-200 [.light_&]:text-slate-900">{intel.hf_likes.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
                {intel.context_window != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <ChevronRight className="h-4 w-4 text-slate-500 [.light_&]:text-slate-600" />
                    <span className="text-slate-400 [.light_&]:text-slate-700">Context:</span>
                    <span className="text-slate-200 [.light_&]:text-slate-900">
                      {(intel.context_window / 1000).toFixed(0)}k tokens
                    </span>
                  </div>
                )}
                {intel.training_cutoff && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 [.light_&]:text-slate-700">Training cutoff:</span>
                    <span className="text-slate-200 [.light_&]:text-slate-900">{intel.training_cutoff}</span>
                  </div>
                )}
                {intel.top_use_cases && intel.top_use_cases.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {intel.top_use_cases.map((uc) => (
                      <span
                        key={uc}
                        className="rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300 [.light_&]:bg-slate-200 [.light_&]:text-slate-800"
                      >
                        {uc}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Hardware readiness */}
          {intel && (intel.vram_4bit_gb != null || intel.ram_4bit_gb != null) && (
            <section className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                <Cpu className="h-4 w-4" />
                Can I Run This?
              </h3>
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
                <div className="grid gap-2 text-sm">
                  {intel.vram_4bit_gb != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 [.light_&]:text-slate-700">4-bit (VRAM):</span>
                      <span className="text-slate-200 [.light_&]:text-slate-900">
                        {intel.vram_4bit_gb} GB
                      </span>
                    </div>
                  )}
                  {intel.vram_8bit_gb != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 [.light_&]:text-slate-700">8-bit (VRAM):</span>
                      <span className="text-slate-200 [.light_&]:text-slate-900">
                        {intel.vram_8bit_gb} GB
                      </span>
                    </div>
                  )}
                  {intel.ram_4bit_gb != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 [.light_&]:text-slate-700">4-bit (RAM):</span>
                      <span className="text-slate-200 [.light_&]:text-slate-900">{intel.ram_4bit_gb} GB</span>
                    </div>
                  )}
                  {intel.ram_8bit_gb != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 [.light_&]:text-slate-700">8-bit (RAM):</span>
                      <span className="text-slate-200 [.light_&]:text-slate-900">{intel.ram_8bit_gb} GB</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Quantization support */}
          {intel && (intel.quantization_gguf || intel.quantization_exl2) && (
            <section className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                <HardDrive className="h-4 w-4" />
                Quantization Support
              </h3>
              <div className="flex gap-2">
                {intel.quantization_gguf && (
                  <span className="rounded bg-slate-700/60 px-2 py-1 text-xs text-slate-300 [.light_&]:bg-slate-200 [.light_&]:text-slate-800">
                    GGUF
                  </span>
                )}
                {intel.quantization_exl2 && (
                  <span className="rounded bg-slate-700/60 px-2 py-1 text-xs text-slate-300 [.light_&]:bg-slate-200 [.light_&]:text-slate-800">
                    EXL2
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Executive summary & Compliance dispute */}
          <section>
            <button
              type="button"
              onClick={() => setExecutiveSummaryOpen(true)}
              className="mb-3 flex w-full items-center gap-2 rounded-lg border border-slate-600/60 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/80 [.light_&]:border-slate-300 [.light_&]:bg-slate-100 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-200"
            >
              <FileText className="h-4 w-4 shrink-0" />
              View executive summary
            </button>
            <button
              type="button"
              onClick={() => setDisputeModalOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-blue-600/30 bg-blue-600/10 px-3 py-2 text-sm text-blue-400 hover:bg-blue-600/20 [.light_&]:border-blue-400 [.light_&]:bg-blue-50 [.light_&]:text-blue-800 [.light_&]:hover:bg-blue-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              Report Compliance Dispute
            </button>
            {disputeModalOpen && (
              <DisputeModal
                modelId={model.id}
                modelName={model.name}
                onClose={() => setDisputeModalOpen(false)}
              />
            )}
            {executiveSummaryOpen && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
                onClick={() => setExecutiveSummaryOpen(false)}
              >
                <div
                  className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Executive Summary</h3>
                    <button
                      type="button"
                      onClick={() => setExecutiveSummaryOpen(false)}
                      className="rounded p-2 text-slate-500 hover:bg-slate-100"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-3 text-sm text-slate-700">
                    <p><strong>{model.name}</strong> — {model.provider} ({model.origin_country})</p>
                    <p>{getModelDescription(model)}</p>
                    <p>Sovereignty Readiness: {getSovereigntyReadiness(model).label} ({getSovereigntyReadiness(model).score}/100)</p>
                    {hasCloudActExposure(model) && <p className="text-slate-600">US Cloud Act exposure</p>}
                    <p>Ethics Score: {computeEthicsScore(model)}/100</p>
                    <p>Openness: {model.openness_level} · Data residency: {model.data_residency ? "Yes" : "No"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                  >
                    Print / Save as PDF
                  </button>
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500 [.light_&]:text-slate-600">
              Use this if a model&apos;s sovereignty status has changed (e.g.,
              Terms of Service update).
            </p>
          </section>
        </div>
      </aside>
    </>
  );

  return mounted && typeof document !== "undefined"
    ? createPortal(panel, document.body)
    : null;
}

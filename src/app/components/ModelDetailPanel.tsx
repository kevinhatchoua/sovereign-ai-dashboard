"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Cpu,
  Gauge,
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
} from "lucide-react";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";
import { computeEthicsScore, getEthicsScoreColorClasses } from "@/app/lib/ethicsScore";
import { getModelLinks, getModelDescription } from "@/app/lib/modelLinks";
import { ComplianceTooltip } from "@/app/components/ComplianceTooltip";
import type { Jurisdiction } from "@/app/lib/complianceEngine";
import { VoteButtons } from "@/app/components/VoteButtons";
import { DisputeModal } from "@/app/components/DisputeModal";

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
  const [mounted, setMounted] = useState(false);

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
        className="fixed inset-x-0 top-0 z-50 flex h-full max-h-[100dvh] w-full flex-col border-l border-slate-700 bg-zinc-900 shadow-2xl [.light_&]:border-slate-300 [.light_&]:bg-white sm:inset-x-auto sm:left-auto sm:right-0 sm:max-w-lg pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        role="dialog"
        aria-label={`Details for ${model.name}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-4 py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] [.light_&]:border-slate-200">
          <h2 className="min-w-0 truncate text-lg font-semibold text-white [.light_&]:text-slate-900">{model.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] shrink-0 touch-manipulation rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-100 [.light_&]:hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
          {/* Overview - always visible */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-slate-300 [.light_&]:text-slate-700">
              Overview
            </h3>
            <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  model.openness_level === "Open Weights"
                    ? "bg-emerald-500/20 text-emerald-400 [.light_&]:text-emerald-700 [.light_&]:bg-emerald-100"
                    : "bg-amber-500/20 text-amber-400 [.light_&]:text-amber-800 [.light_&]:bg-amber-100"
                }`}>
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
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20 [.light_&]:border-emerald-500/60 [.light_&]:bg-emerald-100 [.light_&]:text-emerald-700 [.light_&]:hover:bg-emerald-200"
                    >
                      <Download className="h-4 w-4" />
                      Download from Hugging Face
                    </a>
                  )}
                </div>
              </section>
            );
          })()}

          {/* Community voting */}
          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
              <Users className="h-4 w-4" />
              Community Sovereignty Score
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <VoteButtons modelId={model.id} showSentiment />
              {intel?.download_trend && intel.download_trend.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 [.light_&]:text-slate-600">Trend:</span>
                  <Sparkline data={intel.download_trend} />
                </div>
              )}
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
                {intel.popularity_index && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-slate-500 [.light_&]:text-slate-600" />
                    <span className="text-slate-400 [.light_&]:text-slate-700">Popularity:</span>
                    <span className="text-slate-200 [.light_&]:text-slate-900">{intel.popularity_index}</span>
                  </div>
                )}
                {intel.inference_speed != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Gauge className="h-4 w-4 text-slate-500 [.light_&]:text-slate-600" />
                    <span className="text-slate-400 [.light_&]:text-slate-700">Inference:</span>
                    <span className="text-slate-200 [.light_&]:text-slate-900">
                      ~{intel.inference_speed} tok/s
                    </span>
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

          {/* Compliance dispute */}
          <section>
            <button
              type="button"
              onClick={() => setDisputeModalOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/20 [.light_&]:border-amber-400 [.light_&]:bg-amber-100 [.light_&]:text-amber-800 [.light_&]:hover:bg-amber-200"
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

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
} from "lucide-react";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";
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
};

export function ModelDetailPanel({
  model,
  jurisdiction,
  onClose,
}: ModelDetailPanelProps) {
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!model) return null;

  const intel = model.intelligence;

  const panel = (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-slate-700 bg-zinc-900 shadow-2xl"
        role="dialog"
        aria-label={`Details for ${model.name}`}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">{model.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Community voting */}
          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Users className="h-4 w-4" />
              Community Sovereignty Score
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <VoteButtons modelId={model.id} showSentiment />
              {intel?.download_trend && intel.download_trend.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Trend:</span>
                  <Sparkline data={intel.download_trend} />
                </div>
              )}
            </div>
          </section>

          {/* Scraped metadata */}
          {intel && (
            <section className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-slate-300">
                Model Intelligence
              </h3>
              <div className="grid gap-2">
                {(intel.hf_downloads != null || intel.hf_likes != null) && (
                  <div className="flex flex-wrap gap-3 text-sm">
                    {intel.hf_downloads != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">HF Downloads:</span>
                        <span className="text-slate-200">
                          {intel.hf_downloads.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {intel.hf_likes != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">HF Likes:</span>
                        <span className="text-slate-200">{intel.hf_likes.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
                {intel.popularity_index && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-400">Popularity:</span>
                    <span className="text-slate-200">{intel.popularity_index}</span>
                  </div>
                )}
                {intel.inference_speed != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Gauge className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-400">Inference:</span>
                    <span className="text-slate-200">
                      ~{intel.inference_speed} tok/s
                    </span>
                  </div>
                )}
                {intel.context_window != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-400">Context:</span>
                    <span className="text-slate-200">
                      {(intel.context_window / 1000).toFixed(0)}k tokens
                    </span>
                  </div>
                )}
                {intel.training_cutoff && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Training cutoff:</span>
                    <span className="text-slate-200">{intel.training_cutoff}</span>
                  </div>
                )}
                {intel.top_use_cases && intel.top_use_cases.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {intel.top_use_cases.map((uc) => (
                      <span
                        key={uc}
                        className="rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300"
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
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Cpu className="h-4 w-4" />
                Can I Run This?
              </h3>
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                <div className="grid gap-2 text-sm">
                  {intel.vram_4bit_gb != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">4-bit (VRAM):</span>
                      <span className="text-slate-200">
                        {intel.vram_4bit_gb} GB
                      </span>
                    </div>
                  )}
                  {intel.vram_8bit_gb != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">8-bit (VRAM):</span>
                      <span className="text-slate-200">
                        {intel.vram_8bit_gb} GB
                      </span>
                    </div>
                  )}
                  {intel.ram_4bit_gb != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">4-bit (RAM):</span>
                      <span className="text-slate-200">{intel.ram_4bit_gb} GB</span>
                    </div>
                  )}
                  {intel.ram_8bit_gb != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">8-bit (RAM):</span>
                      <span className="text-slate-200">{intel.ram_8bit_gb} GB</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Quantization support */}
          {intel && (intel.quantization_gguf || intel.quantization_exl2) && (
            <section className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                <HardDrive className="h-4 w-4" />
                Quantization Support
              </h3>
              <div className="flex gap-2">
                {intel.quantization_gguf && (
                  <span className="rounded bg-slate-700/60 px-2 py-1 text-xs text-slate-300">
                    GGUF
                  </span>
                )}
                {intel.quantization_exl2 && (
                  <span className="rounded bg-slate-700/60 px-2 py-1 text-xs text-slate-300">
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
              className="flex w-full items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/20"
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
            <p className="mt-2 text-xs text-slate-500">
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

"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { X, FileDown, Shield, Award, Cpu, BarChart3, Globe, Code, Info } from "lucide-react";
import { jsPDF } from "jspdf";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";
import type { Jurisdiction } from "@/app/lib/complianceEngine";
import { computeEthicsScore, getEthicsScoreColorClasses } from "@/app/lib/ethicsScore";
import {
  getSovereigntyReadiness,
  hasCloudActExposure,
  getFourDimensions,
} from "@/app/lib/sovereigntyScore";
import { useDialogAccessibility } from "@/app/lib/useDialogAccessibility";

const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  EU: "EU",
  IN: "India",
  US: "USA",
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English", zh: "Chinese", fr: "French", de: "German",
  es: "Spanish", ar: "Arabic", hi: "Hindi", multilingual: "Multilingual",
};

const TASK_LABELS: Record<string, string> = {
  "text-generation": "Text gen",
  conversational: "Conversational",
  code: "Code",
  games: "AI Games",
  "question-answering": "Q&A",
  summarization: "Summarization",
  vision: "Vision",
};

function getMinVramGb(m: ComparisonModel): number | null {
  const v4 = m.intelligence?.vram_4bit_gb;
  const v8 = m.intelligence?.vram_8bit_gb;
  if (v4 == null && v8 == null) return null;
  if (v4 != null && v8 != null) return Math.min(v4, v8);
  return v4 ?? v8 ?? null;
}

function getRiskGaps(
  models: ComparisonModel[],
  jurisdiction: Jurisdiction | null
): string[] {
  const gaps: string[] = [];
  const sovereignHosting = (m: ComparisonModel) =>
    m.openness_level === "Open Weights" ? "On-Prem" : "Cloud";
  const dataResidency = (m: ComparisonModel) =>
    m.data_residency ? "Yes" : "No";

  const sover = models.map(sovereignHosting);
  if (sover.length >= 2 && !sover.every((v) => v === sover[0])) {
    gaps.push(
      `Sovereign Hosting: ${models.map((m, i) => `${m.name}=${sover[i]}`).join(", ")}`
    );
  }
  const residency = models.map(dataResidency);
  if (residency.length >= 2 && !residency.every((v) => v === residency[0])) {
    gaps.push(
      `Data Residency: ${models.map((m, i) => `${m.name}=${residency[i]}`).join(", ")}`
    );
  }
  if (jurisdiction) {
    const legal = models.map((m) => m.compliance[jurisdiction]);
    if (legal.length >= 2 && !legal.every((v) => v === legal[0])) {
      gaps.push(
        `Legal (${JURISDICTION_LABEL[jurisdiction]}): ${models.map((m, i) => `${m.name}=${legal[i]}`).join(", ")}`
      );
    }
  }
  const openness = models.map((m) => m.openness_level);
  if (openness.length >= 2 && !openness.every((v) => v === openness[0])) {
    gaps.push(
      `Openness: ${models.map((m, i) => `${m.name}=${openness[i]}`).join(", ")}`
    );
  }
  return gaps;
}

function getSovereigntyVerdict(
  models: ComparisonModel[],
  jurisdiction: Jurisdiction | null
): { winner: ComparisonModel; reason: string } | null {
  if (models.length < 2) return null;
  const scores = models.map((m) => ({
    model: m,
    readiness: getSovereigntyReadiness(m).score,
    ethics: computeEthicsScore(m),
    cloudAct: hasCloudActExposure(m),
  }));
  const sorted = [...scores].sort((a, b) => {
    if (jurisdiction && a.cloudAct !== b.cloudAct) return a.cloudAct ? 1 : -1;
    return b.readiness - a.readiness || b.ethics - a.ethics;
  });
  const winner = sorted[0];
  const reasons: string[] = [];
  if (winner.readiness >= 75) reasons.push("Advanced sovereignty readiness");
  else if (winner.readiness >= 50) reasons.push("Intermediate sovereignty posture");
  if (!winner.cloudAct) reasons.push("no US Cloud Act exposure");
  if (winner.model.openness_level === "Open Weights")
    reasons.push("self-hostable for full control");
  if (winner.model.data_residency) reasons.push("data residency options");
  return {
    winner: winner.model,
    reason: reasons.length > 0 ? reasons.join(", ") : "highest combined sovereignty and ethics scores",
  };
}

function ComparisonRow<T>({
  label,
  models,
  getValue,
  formatValue = (v: T) => String(v),
  highlightMismatch = true,
  highlightBest = false,
  invertBest = false,
}: {
  label: string;
  models: ComparisonModel[];
  getValue: (m: ComparisonModel) => T;
  formatValue?: (v: T) => string;
  highlightMismatch?: boolean;
  highlightBest?: boolean;
  invertBest?: boolean;
}) {
  const values = models.map(getValue);
  const allMatch =
    !highlightMismatch ||
    values.length < 2 ||
    values.every((v) => v === values[0]);
  const numValues = values.map((v) => (typeof v === "number" ? v : 0));
  const hasNumeric = values.some((v) => typeof v === "number");
  const bestIdx: number =
    highlightBest && hasNumeric
      ? invertBest
        ? (() => {
            const withData = numValues.map((n, i) => ({ n, i })).filter((x) => x.n > 0);
            if (withData.length === 0) return -1;
            return withData.reduce((a, b) => (a.n < b.n ? a : b)).i;
          })()
        : numValues.reduce<number>((best, n, i) => (n > numValues[best] ? i : best), 0)
      : -1;

  return (
    <div
      className={`grid min-w-0 gap-4 border-b border-slate-700/60 px-4 py-3 last:border-b-0 [.light_&]:border-slate-200 ${
        !allMatch ? "bg-red-900/20 border-l-4 border-l-red-500 [.light_&]:bg-red-50 [.light_&]:border-l-red-500" : ""
      }`}
      style={{
        gridTemplateColumns: `minmax(7rem,1fr) repeat(${models.length}, minmax(5rem,1fr))`,
      }}
    >
      <span className="font-medium text-slate-300 [.light_&]:text-slate-700">{label}</span>
      {models.map((m, i) => (
        <span
          key={m.id}
          className={`text-sm ${
            bestIdx === i && highlightBest
              ? "font-semibold text-blue-600 [.light_&]:text-blue-700"
              : "text-slate-400 [.light_&]:text-slate-600"
          }`}
        >
          {formatValue(getValue(m))}
        </span>
      ))}
    </div>
  );
}

function LegalRow({
  label,
  models,
  jurisdiction,
}: {
  label: string;
  models: ComparisonModel[];
  jurisdiction: Jurisdiction | null;
}) {
  if (!jurisdiction) {
    return (
      <div
        className="grid min-w-0 gap-4 border-b border-slate-700/60 px-4 py-3 last:border-b-0 [.light_&]:border-slate-200"
        style={{
          gridTemplateColumns: `minmax(7rem,1fr) repeat(${models.length}, minmax(5rem,1fr))`,
        }}
      >
        <span className="font-medium text-slate-300 [.light_&]:text-slate-700">{label}</span>
        {models.map((m) => (
          <span key={m.id} className="text-sm text-slate-500">—</span>
        ))}
      </div>
    );
  }

  const values = models.map((m) => m.compliance[jurisdiction]);
  const allMatch = values.length < 2 || values.every((v) => v === values[0]);

  return (
    <div
      className={`grid gap-4 border-b border-slate-700/60 px-4 py-3 last:border-b-0 [.light_&]:border-slate-200 ${
        !allMatch ? "bg-red-900/20 border-l-4 border-l-red-500 [.light_&]:bg-red-50 [.light_&]:border-l-red-500" : ""
      }`}
      style={{
        gridTemplateColumns: `minmax(7rem,1fr) repeat(${models.length}, minmax(5rem,1fr))`,
      }}
    >
      <span className="font-medium text-slate-300 [.light_&]:text-slate-700">{label}</span>
      {models.map((m) => (
        <span key={m.id} className="text-sm text-slate-400 [.light_&]:text-slate-600">
          {m.compliance[jurisdiction]}
        </span>
      ))}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-700/60 bg-slate-800/30 px-4 py-2 [.light_&]:border-slate-200 [.light_&]:bg-slate-100">
      <Icon className="h-4 w-4 text-blue-600 [.light_&]:text-blue-600" />
      <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 [.light_&]:text-slate-700">
        {title}
      </span>
    </div>
  );
}

type ComparisonMatrixProps = {
  models: ComparisonModel[];
  jurisdiction: Jurisdiction | null;
  onClose: () => void;
};

export function ComparisonMatrix({
  models,
  jurisdiction,
  onClose,
}: ComparisonMatrixProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogAccessibility(true, onClose, dialogRef);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (models.length < 2) return null;

  const sovereignHosting = (m: ComparisonModel) =>
    m.openness_level === "Open Weights" ? "On-Prem" : "Cloud";
  const dataResidency = (m: ComparisonModel) => (m.data_residency ? "Yes" : "No");
  const openness = (m: ComparisonModel) => m.openness_level;
  const verdict = getSovereigntyVerdict(models, jurisdiction);

  const exportScorecard = useCallback(() => {
    const doc = new jsPDF();
    const lineH = 6;
    let y = 20;

    doc.setFontSize(18);
    doc.text("Sovereign AI Model Comparison", 20, y);
    y += lineH + 4;

    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Methodology: sovereign-ai-dashboard/methodology`, 20, y);
    y += lineH + 6;

    doc.setFontSize(11);
    doc.text("Jurisdiction", 20, y);
    y += lineH;
    doc.setFontSize(10);
    doc.text(jurisdiction ? JURISDICTION_LABEL[jurisdiction] : "Not selected", 20, y);
    y += lineH + 4;

    doc.setFontSize(11);
    doc.text("Models Compared", 20, y);
    y += lineH;
    doc.setFontSize(10);
    models.forEach((m) => {
      doc.text(`• ${m.name} (${m.provider}, ${m.origin_country})`, 20, y);
      y += lineH;
    });
    y += 4;

    const cols = models.length;
    const colW = 170 / cols;
    const headers = ["Attribute", ...models.map((m) => m.name)];
    doc.setFontSize(9);
    headers.forEach((h, i) => {
      doc.text(h.substring(0, 20), 20 + i * colW, y);
    });
    y += lineH + 2;

    const rows: [string, (m: ComparisonModel) => string][] = [
      ["Provider", (m) => m.provider],
      ["Origin", (m) => m.origin_country],
      ["Openness", (m) => m.openness_level],
      ["Data Residency", (m) => (m.data_residency ? "Yes" : "No")],
      ["Sovereignty", (m) => `${getSovereigntyReadiness(m).label} (${getSovereigntyReadiness(m).score})`],
      ["Ethics", (m) => String(computeEthicsScore(m))],
      ["Cloud Act", (m) => (hasCloudActExposure(m) ? "Yes" : "No")],
    ];
    rows.forEach(([label, getVal]) => {
      doc.text(label, 20, y);
      models.forEach((m, i) => {
        doc.text(getVal(m).substring(0, 15), 20 + (i + 1) * colW, y);
      });
      y += lineH;
    });
    y += 4;

    const riskGaps = getRiskGaps(models, jurisdiction);
    if (riskGaps.length > 0) {
      doc.setFontSize(11);
      doc.text("Risk Gaps Identified", 20, y);
      y += lineH;
      doc.setFontSize(9);
      riskGaps.forEach((gap) => {
        const lines = doc.splitTextToSize(gap, 170);
        lines.forEach((line: string) => {
          doc.text(line, 20, y);
          y += lineH;
        });
      });
      y += 4;
    }

    if (verdict) {
      doc.setFontSize(11);
      doc.text("Recommendation", 20, y);
      y += lineH;
      doc.setFontSize(9);
      const rec = `For ${jurisdiction ? JURISDICTION_LABEL[jurisdiction] : "sovereignty"}, ${verdict.winner.name} ranks strongest: ${verdict.reason}.`;
      doc.splitTextToSize(rec, 170).forEach((line: string) => {
        doc.text(line, 20, y);
        y += lineH;
      });
      y += 4;
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const disclaimer =
      "Transparency tool, not legal advice. Verify with your legal team. Data from public registries.";
    doc.splitTextToSize(disclaimer, 170).forEach((line: string) => {
      doc.text(line, 20, y);
      y += lineH;
    });
    doc.setTextColor(0, 0, 0);

    doc.save("Sovereign-AI-Comparison.pdf");
  }, [models, jurisdiction, verdict]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Model Comparison"
        className="glass-strong relative z-10 flex max-h-[90dvh] w-full flex-col rounded-t-2xl border border-b-0 border-slate-700/50 shadow-2xl sm:max-h-[85vh] sm:w-auto sm:min-w-[min(100vw-2rem,42rem)] sm:max-w-5xl sm:rounded-2xl sm:border [.light_&]:border-slate-200/60"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700/50 px-4 py-3 [.light_&]:border-slate-200/60">
          <h2 className="text-lg font-semibold text-white [.light_&]:text-slate-900">
            Model Comparison
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-100 [.light_&]:hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto" role="region" aria-label="Comparison table">
          {/* Header row */}
          <div
            className="grid min-w-0 gap-4 border-b-2 border-slate-700 bg-slate-800/50 px-4 py-4 [.light_&]:border-slate-200 [.light_&]:bg-slate-50"
            style={{
              gridTemplateColumns: `minmax(7rem,1fr) repeat(${models.length}, minmax(5rem,1fr))`,
            }}
          >
            <span className="text-sm font-medium text-slate-500 [.light_&]:text-slate-600">Model</span>
            {models.map((m) => (
              <div key={m.id}>
                <span className="block truncate font-semibold text-slate-200 [.light_&]:text-slate-900">
                  {m.name}
                </span>
                <span className="text-xs text-slate-500 [.light_&]:text-slate-600">
                  {m.provider} · {m.origin_country}
                </span>
              </div>
            ))}
          </div>

          {/* Organization */}
          <SectionHeader icon={Info} title="Organization" />
          <ComparisonRow label="Provider" models={models} getValue={(m) => m.provider} highlightMismatch={false} />
          <ComparisonRow label="Origin" models={models} getValue={(m) => m.origin_country} highlightMismatch={false} />

          {/* Compliance & Sovereignty */}
          <SectionHeader icon={Shield} title="Compliance & Sovereignty" />
          <ComparisonRow
            label="Sovereign Hosting"
            models={models}
            getValue={sovereignHosting}
            highlightMismatch={true}
          />
          <ComparisonRow
            label="Data Residency"
            models={models}
            getValue={dataResidency}
            highlightMismatch={true}
          />
          <LegalRow
            label={
              jurisdiction
                ? `Legal (${jurisdiction === "EU" ? "EU" : jurisdiction === "IN" ? "India" : "USA"})`
                : "Legal"
            }
            models={models}
            jurisdiction={jurisdiction}
          />
          <ComparisonRow label="Openness" models={models} getValue={openness} highlightMismatch={true} />
          <ComparisonRow
            label="Sovereignty Readiness"
            models={models}
            getValue={(m) => `${getSovereigntyReadiness(m).label} (${getSovereigntyReadiness(m).score})`}
            highlightBest={true}
            highlightMismatch={false}
          />
          <ComparisonRow
            label="Ethics Score"
            models={models}
            getValue={computeEthicsScore}
            formatValue={(v) => `${v}/100`}
            highlightBest={true}
            highlightMismatch={false}
          />
          <ComparisonRow
            label="Cloud Act Exposure"
            models={models}
            getValue={(m) => (hasCloudActExposure(m) ? "Yes" : "No")}
            highlightMismatch={true}
          />

          {/* Four Dimensions */}
          <SectionHeader icon={Award} title="Four Dimensions (McKinsey)" />
          {getFourDimensions(models[0]).map((d) => (
            <ComparisonRow
              key={d.dimension}
              label={d.label}
              models={models}
              getValue={(m) => getFourDimensions(m).find((x) => x.dimension === d.dimension)?.score ?? 0}
              formatValue={(v) => `${v}/100`}
              highlightBest={true}
              highlightMismatch={false}
            />
          ))}

          {/* Model Intelligence */}
          <SectionHeader icon={BarChart3} title="Model Intelligence" />
          <ComparisonRow
            label="HF Downloads"
            models={models}
            getValue={(m) => m.intelligence?.hf_downloads ?? 0}
            formatValue={(v) => (v > 0 ? v.toLocaleString() : "—")}
            highlightBest={true}
            highlightMismatch={false}
          />
          <ComparisonRow
            label="Context"
            models={models}
            getValue={(m) => m.intelligence?.context_window ?? 0}
            formatValue={(v) => (v > 0 ? `${(v / 1000).toFixed(0)}k` : "—")}
            highlightBest={true}
            highlightMismatch={false}
          />
          <ComparisonRow
            label="Min VRAM"
            models={models}
            getValue={(m) => getMinVramGb(m) ?? 0}
            formatValue={(v) => (v > 0 ? `${v} GB` : "—")}
            highlightBest={true}
            invertBest={true}
            highlightMismatch={false}
          />

          {/* Capabilities */}
          <SectionHeader icon={Globe} title="Capabilities" />
          <ComparisonRow
            label="Languages"
            models={models}
            getValue={(m) => m.languages.slice(0, 3).map((l) => LANGUAGE_LABELS[l] ?? l).join(", ")}
            highlightMismatch={false}
          />
          <ComparisonRow
            label="Tasks"
            models={models}
            getValue={(m) =>
              m.task_categories.slice(0, 3).map((t) => TASK_LABELS[t] ?? t).join(", ")
            }
            highlightMismatch={false}
          />
          <ComparisonRow
            label="Compliance Tags"
            models={models}
            getValue={(m) => m.compliance_tags.slice(0, 4).join(", ") || "—"}
            highlightMismatch={false}
          />
        </div>

        {/* Verdict & Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-700 px-4 py-4 [.light_&]:border-slate-200">
          {verdict && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 [.light_&]:border-blue-400 [.light_&]:bg-blue-50">
              <p className="text-sm font-medium text-blue-400 [.light_&]:text-blue-800">
                Recommendation
              </p>
              <p className="text-sm text-slate-300 [.light_&]:text-slate-700">
                For {jurisdiction ? `${JURISDICTION_LABEL[jurisdiction]} ` : ""}sovereignty,{" "}
                <strong>{verdict.winner.name}</strong> ranks strongest: {verdict.reason}.
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportScorecard}
                className="cta-secondary inline-flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" aria-hidden />
                Export PDF
              </button>
              <Link
                href="/methodology"
                className="cta-primary inline-flex items-center gap-1.5"
              >
                <Info className="h-3.5 w-3.5" />
                Methodology
              </Link>
            </div>
          </div>
          {jurisdiction && (
            <p className="text-xs text-slate-500 [.light_&]:text-slate-600">
              Rows highlighted in red indicate a legal risk gap. Green = best in category. Data from public
              registries; verify with your legal team.
            </p>
          )}
          <p className="text-xs italic text-slate-500 [.light_&]:text-slate-600">
            This is a transparency tool, not legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}

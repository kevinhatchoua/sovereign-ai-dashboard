"use client";

import { useCallback } from "react";
import { X, FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";
import type { Jurisdiction } from "@/app/lib/complianceEngine";

const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  EU: "EU",
  IN: "India",
  US: "USA",
};

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

function ComparisonRow<T>({
  label,
  models,
  getValue,
  formatValue = (v: T) => String(v),
  highlightMismatch = true,
}: {
  label: string;
  models: ComparisonModel[];
  getValue: (m: ComparisonModel) => T;
  formatValue?: (v: T) => string;
  highlightMismatch?: boolean;
}) {
  const values = models.map(getValue);
  const allMatch =
    !highlightMismatch ||
    values.length < 2 ||
    values.every((v) => v === values[0]);
  const colCount = Math.max(1, models.length) + 1;

  return (
    <div
      className={`grid gap-4 border-b border-slate-700/60 px-4 py-3 last:border-b-0 ${
        !allMatch ? "bg-red-900/20 border-l-4 border-l-red-500" : ""
      }`}
      style={{ gridTemplateColumns: `minmax(0, 1fr) repeat(${models.length}, minmax(0, 1fr))` }}
    >
      <span className="font-semibold text-slate-300">{label}</span>
      {models.map((m) => (
        <span key={m.id} className="text-sm text-slate-400">
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
        className="grid gap-4 border-b border-slate-700/60 px-4 py-3 last:border-b-0"
        style={{
          gridTemplateColumns: `minmax(0, 1fr) repeat(${models.length}, minmax(0, 1fr))`,
        }}
      >
        <span className="font-semibold text-slate-300">{label}</span>
        {models.map((m) => (
          <span key={m.id} className="text-sm text-slate-500">—</span>
        ))}
      </div>
    );
  }

  const values = models.map((m) => m.compliance[jurisdiction]);
  const allMatch =
    values.length < 2 || values.every((v) => v === values[0]);

  return (
    <div
      className={`grid gap-4 border-b border-slate-700/60 px-4 py-3 last:border-b-0 ${
        !allMatch ? "bg-red-900/20 border-l-4 border-l-red-500" : ""
      }`}
      style={{
        gridTemplateColumns: `minmax(0, 1fr) repeat(${models.length}, minmax(0, 1fr))`,
      }}
    >
      <span className="font-semibold text-slate-300">{label}</span>
      {models.map((m) => (
        <span key={m.id} className="text-sm text-slate-400">
          {m.compliance[jurisdiction]}
        </span>
      ))}
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
  if (models.length < 2) return null;

  const sovereignHosting = (m: ComparisonModel) =>
    m.openness_level === "Open Weights" ? "On-Prem" : "Cloud";
  const dataResidency = (m: ComparisonModel) =>
    m.data_residency ? "Yes" : "No";
  const openness = (m: ComparisonModel) => m.openness_level;

  const exportScorecard = useCallback(() => {
    const doc = new jsPDF();
    const lineH = 7;
    let y = 20;

    doc.setFontSize(18);
    doc.text("Sovereign AI Assessment", 20, y);
    y += lineH + 4;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, 20, y);
    y += lineH + 4;

    doc.setFontSize(12);
    doc.text("Jurisdiction", 20, y);
    y += lineH;
    doc.setFontSize(10);
    doc.text(
      jurisdiction ? JURISDICTION_LABEL[jurisdiction] : "Not selected",
      20,
      y
    );
    y += lineH + 4;

    doc.setFontSize(12);
    doc.text("Models Compared", 20, y);
    y += lineH;
    doc.setFontSize(10);
    models.forEach((m) => {
      doc.text(`• ${m.name} (${m.provider})`, 20, y);
      y += lineH;
    });
    y += 4;

    const riskGaps = getRiskGaps(models, jurisdiction);
    if (riskGaps.length > 0) {
      doc.setFontSize(12);
      doc.text("Risk Gaps Identified", 20, y);
      y += lineH;
      doc.setFontSize(10);
      riskGaps.forEach((gap) => {
        const lines = doc.splitTextToSize(gap, 170);
        lines.forEach((line: string) => {
          doc.text(line, 20, y);
          y += lineH;
        });
      });
      y += 4;
    }

    doc.setFontSize(11);
    const disclaimer =
      "This is a transparency tool, not legal advice. Verify compliance with your legal team and current regulations.";
    const disclaimerLines = doc.splitTextToSize(disclaimer, 170);
    y += lineH;
    doc.setTextColor(100, 100, 100);
    disclaimerLines.forEach((line: string) => {
      doc.text(line, 20, y);
      y += lineH;
    });
    doc.setTextColor(0, 0, 0);

    doc.save("Sovereign-AI-Assessment.pdf");
  }, [models, jurisdiction]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-4xl rounded-xl border border-slate-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">
            Comparison Matrix
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto">
          {/* Header row: label + model names */}
          <div
            className="grid gap-4 border-b border-slate-700 bg-slate-800/50 px-4 py-3 font-medium text-slate-300"
            style={{
              gridTemplateColumns: `minmax(0, 1fr) repeat(${models.length}, minmax(0, 1fr))`,
            }}
          >
            <span className="text-slate-500">Model</span>
            {models.map((m) => (
              <span key={m.id} className="truncate text-slate-200">
                {m.name}
              </span>
            ))}
          </div>

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
          <ComparisonRow
            label="Openness"
            models={models}
            getValue={openness}
            highlightMismatch={true}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-700 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={exportScorecard}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <FileDown className="h-4 w-4" aria-hidden />
              Export Scorecard
            </button>
          </div>
          {jurisdiction && (
            <p className="text-xs text-slate-500">
              Rows highlighted in red indicate a legal risk gap between models for
              the selected jurisdiction.
            </p>
          )}
          <p className="text-xs italic text-slate-500">
            This is a transparency tool, not legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}

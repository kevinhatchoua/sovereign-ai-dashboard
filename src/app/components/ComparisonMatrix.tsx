"use client";

import { X } from "lucide-react";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";
import type { Jurisdiction } from "@/app/lib/complianceEngine";

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

        {jurisdiction && (
          <p className="border-t border-slate-700 px-4 py-2 text-xs text-slate-500">
            Rows highlighted in red indicate a legal risk gap between models for
            the selected jurisdiction.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { X, ChevronRight, Shield, CheckCircle } from "lucide-react";
import { useDialogAccessibility } from "@/app/lib/useDialogAccessibility";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";

type AssessmentStep = "intro" | "jurisdiction" | "sensitivity" | "hosting" | "results";

const JURISDICTIONS = [
  { id: "EU", label: "EU / GDPR" },
  { id: "US", label: "United States" },
  { id: "IN", label: "India" },
  { id: "other", label: "Other / Multi-jurisdiction" },
];

const SENSITIVITY_OPTIONS = [
  { id: "high", label: "High (health, finance, defense)" },
  { id: "medium", label: "Medium (enterprise data)" },
  { id: "low", label: "Low (general use)" },
];

const HOSTING_OPTIONS = [
  { id: "onprem", label: "On-premises / air-gapped" },
  { id: "vpc", label: "Private cloud / VPC" },
  { id: "hybrid", label: "Hybrid" },
  { id: "cloud", label: "Public cloud acceptable" },
];

type AssessmentProps = {
  models: ComparisonModel[];
  onRecommend: (modelIds: string[]) => void;
  onClose: () => void;
  isOpen: boolean;
};

export function SovereigntyAssessment({
  models,
  onRecommend,
  onClose,
  isOpen,
}: AssessmentProps) {
  const [step, setStep] = useState<AssessmentStep>("intro");
  const [jurisdiction, setJurisdiction] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState<string | null>(null);
  const [hosting, setHosting] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogAccessibility(isOpen, onClose, dialogRef);

  const runRecommendation = () => {
    const filtered = models.filter((m) => {
      if (jurisdiction === "EU" && !m.compliance_tags.some((t) => t.includes("EU") || t.includes("GDPR")))
        return false;
      if (jurisdiction === "IN" && !m.compliance_tags.some((t) => t.includes("India"))) return false;
      if (sensitivity === "high" && m.openness_level !== "Open Weights") return false;
      if (hosting === "onprem" && m.openness_level !== "Open Weights") return false;
      return true;
    });
    onRecommend(filtered.slice(0, 20).map((m) => m.id));
    setStep("results");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        ref={dialogRef}
        className="glass-strong relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/60 shadow-2xl sm:max-w-md [.light_&]:border-slate-200/60"
        role="dialog"
        aria-modal="true"
        aria-label="Sovereignty Assessment"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-700/50 px-4 py-3 [.light_&]:border-slate-200/60">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white [.light_&]:text-slate-900">
            <Shield className="h-5 w-5 text-blue-600" aria-hidden />
            Sovereignty Assessment
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-800/60 [.light_&]:hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {step === "intro" && (
            <>
              <p className="mb-4 text-sm text-slate-400 [.light_&]:text-slate-600">
                This 2–3 minute assessment helps you find models aligned with your sovereignty needs. Based on
                McKinsey&apos;s Four Dimensions and industry frameworks (Red Hat, SUSE, Forrester).
              </p>
              <button
                type="button"
                onClick={() => setStep("jurisdiction")}
                className="glass flex w-full items-center justify-between rounded-xl border-slate-700/50 px-4 py-3 text-left text-sm font-medium text-slate-200 hover:bg-slate-800/60 [.light_&]:border-slate-300/70 [.light_&]:text-slate-900 [.light_&]:hover:bg-slate-100"
              >
                Start assessment
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === "jurisdiction" && (
            <>
              <p className="mb-3 text-sm font-medium text-slate-200 [.light_&]:text-slate-900">Primary jurisdiction?</p>
              <div className="space-y-2">
                {JURISDICTIONS.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      setJurisdiction(j.id);
                      setStep("sensitivity");
                    }}
                    className={`glass flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${
                      jurisdiction === j.id
                        ? "border-blue-600/70 bg-blue-600/20 text-blue-400 [.light_&]:bg-blue-50 [.light_&]:text-blue-900"
                        : "border-slate-700/50 text-slate-300 hover:bg-slate-800/60 [.light_&]:border-slate-200 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-50"
                    }`}
                  >
                    {j.label}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "sensitivity" && (
            <>
              <p className="mb-3 text-sm font-medium text-slate-200 [.light_&]:text-slate-900">Data sensitivity level?</p>
              <div className="space-y-2">
                {SENSITIVITY_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSensitivity(s.id);
                      setStep("hosting");
                    }}
                    className={`glass flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${
                      sensitivity === s.id
                        ? "border-blue-600/70 bg-blue-600/20 text-blue-400 [.light_&]:bg-blue-50 [.light_&]:text-blue-900"
                        : "border-slate-700/50 text-slate-300 hover:bg-slate-800/60 [.light_&]:border-slate-200 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-50"
                    }`}
                  >
                    {s.label}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "hosting" && (
            <>
              <p className="mb-3 text-sm font-medium text-slate-200 [.light_&]:text-slate-900">Preferred hosting?</p>
              <div className="space-y-2">
                {HOSTING_OPTIONS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setHosting(h.id);
                      runRecommendation();
                    }}
                    className={`glass flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${
                      hosting === h.id
                        ? "border-blue-600/70 bg-blue-600/20 text-blue-400 [.light_&]:bg-blue-50 [.light_&]:text-blue-900"
                        : "border-slate-700/50 text-slate-300 hover:bg-slate-800/60 [.light_&]:border-slate-200 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-50"
                    }`}
                  >
                    {h.label}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "results" && (
            <>
              <div className="mb-4 flex items-center gap-2 text-emerald-400 [.light_&]:text-emerald-600">
                <CheckCircle className="h-5 w-5" aria-hidden />
                <span className="font-medium">Assessment complete</span>
              </div>
              <p className="mb-4 text-sm text-slate-400 [.light_&]:text-slate-600">
                We&apos;ve filtered the catalog to models matching your profile. Check the results below.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
              >
                View recommended models
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useId } from "react";
import { Info } from "lucide-react";

const COMPLIANCE_DEFINITIONS: Record<string, string> = {
  GDPR: "EU General Data Protection Regulation: governs data privacy and protection for EU residents.",
  "EU AI Act Ready": "Indicates alignment with the EU AI Act's requirements for high-risk AI systems.",
  "Data residency": "Model data is stored within a specific geographic region (e.g., EU-only).",
  "India Data Localization": "Complies with India's data localization requirements under DPDP.",
  "Sovereign Deployment": "Supports on-premises or sovereign cloud deployment for data control.",
};

export function ComplianceTooltip({ term }: { term: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [open]);

  const definition = COMPLIANCE_DEFINITIONS[term];
  if (!definition) return null;

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className="ml-0.5 inline-flex min-h-[24px] min-w-[24px] items-center justify-center text-slate-500 hover:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 [.light_&]:text-slate-600 [.light_&]:hover:text-slate-700"
        aria-label={`Info about ${term}`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-0 z-50 mb-1 max-w-[220px] rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-300 shadow-xl [.light_&]:border-slate-300 [.light_&]:bg-slate-100 [.light_&]:text-slate-700"
        >
          {definition}
        </div>
      )}
    </div>
  );
}

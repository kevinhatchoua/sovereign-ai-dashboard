"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import type { Jurisdiction } from "@/app/lib/complianceEngine";

const JURISDICTION_OPTIONS: { value: Jurisdiction; label: string }[] = [
  { value: "EU", label: "EU" },
  { value: "IN", label: "India" },
  { value: "US", label: "USA" },
];

const JURISDICTION_TO_LABEL: Record<Jurisdiction, string> = {
  EU: "EU",
  IN: "India",
  US: "USA",
};

type RegionSelectorProps = {
  value: Jurisdiction | null;
  onChange: (jurisdiction: Jurisdiction) => void;
  placeholder?: string;
};

export function RegionSelector({
  value,
  onChange,
  placeholder = "Current Jurisdiction",
}: RegionSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = value ? JURISDICTION_TO_LABEL[value] : null;

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-[10rem] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 py-2.5 pl-3 pr-2.5 text-left text-sm text-slate-200 hover:bg-slate-800 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/50"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select current jurisdiction"
      >
        <MapPin className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        <span className="flex-1 truncate">
          {displayValue ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1 min-w-full rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl"
        >
          {JURISDICTION_OPTIONS.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                    isSelected
                      ? "bg-slate-700 text-white"
                      : "text-slate-300 hover:bg-slate-700/60"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

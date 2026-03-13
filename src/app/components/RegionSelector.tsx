"use client";

import { useState, useRef, useEffect, useId } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const triggerId = useId();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) setActiveIndex(JURISDICTION_OPTIONS.findIndex((o) => o.value === value) || 0);
  }, [open, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, JURISDICTION_OPTIONS.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onChange(JURISDICTION_OPTIONS[activeIndex].value);
        setOpen(false);
        break;
    }
  };

  const displayValue = value ? JURISDICTION_TO_LABEL[value] : null;

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        id={triggerId}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 py-2.5 pl-3 pr-2.5 text-left text-sm text-slate-200 hover:bg-slate-800 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/50 sm:min-w-[10rem] sm:w-auto touch-manipulation focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
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
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          className="absolute right-0 top-full z-50 mt-1 min-w-full rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl"
        >
          {JURISDICTION_OPTIONS.map((opt, i) => {
            const isSelected = value === opt.value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                id={`${listboxId}-option-${i}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
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

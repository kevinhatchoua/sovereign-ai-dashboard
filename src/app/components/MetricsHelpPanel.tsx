"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

export function MetricsHelpPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-4 rounded-xl border border-slate-700/50 bg-slate-800/30 [.light_&]:border-slate-200/60 [.light_&]:bg-slate-100/80">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={expanded}
        aria-controls="metrics-help-content"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-300 [.light_&]:text-slate-700">
          <BookOpen className="h-4 w-4 text-blue-500 [.light_&]:text-blue-600" aria-hidden />
          Understanding the metrics
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        )}
      </button>
      <div
        id="metrics-help-content"
        role="region"
        aria-labelledby="metrics-help-heading"
        className={`overflow-hidden transition-all ${expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="border-t border-slate-700/50 px-4 py-3 [.light_&]:border-slate-200/60">
          <p id="metrics-help-heading" className="text-xs text-slate-500 [.light_&]:text-slate-600">
            Quick reference for labels you&apos;ll see on model cards:
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-400 [.light_&]:text-slate-600">
            <li>
              <strong className="text-slate-300 [.light_&]:text-slate-800">Sovereignty:</strong>{" "}
              Advanced (75–100), Intermediate (50–74), Foundation (0–49)
            </li>
            <li>
              <strong className="text-slate-300 [.light_&]:text-slate-800">Cloud Act:</strong>{" "}
              US-based provider; may be subject to data requests
            </li>
            <li>
              <strong className="text-slate-300 [.light_&]:text-slate-800">Ethics Score:</strong>{" "}
               0–100; combines sovereignty + transparency
            </li>
            <li>
              <strong className="text-slate-300 [.light_&]:text-slate-800">Local-hostable:</strong>{" "}
              Open weights; can run on your infrastructure
            </li>
          </ul>
          <Link
            href="/learn"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 [.light_&]:text-blue-600 [.light_&]:hover:text-blue-700"
          >
            Full guide →
          </Link>
        </div>
      </div>
    </div>
  );
}

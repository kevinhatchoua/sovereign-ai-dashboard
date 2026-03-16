"use client";

import { useState, useRef, useEffect, useId, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
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
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.top - 4,
      left: rect.left,
    });
  }, []);

  useEffect(() => {
    if (open) {
      updatePosition();
      const handleScroll = () => updatePosition();
      window.addEventListener("scroll", handleScroll, true);
      return () => window.removeEventListener("scroll", handleScroll, true);
    } else {
      setPosition(null);
    }
  }, [open, updatePosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false);
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

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  useEffect(() => () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, []);

  const definition = COMPLIANCE_DEFINITIONS[term];
  if (!definition) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className="ml-0.5 inline-flex min-h-[24px] min-w-[24px] items-center justify-center text-slate-500 hover:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 [.light_&]:text-slate-600 [.light_&]:hover:text-slate-700"
        aria-label={`Info about ${term}`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open &&
        typeof document !== "undefined" &&
        position &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="fixed z-[9999] max-w-[240px] rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-300 shadow-xl [.light_&]:border-slate-300 [.light_&]:bg-slate-100 [.light_&]:text-slate-700"
            style={{
              top: position.top,
              left: position.left,
              transform: "translateY(-100%)",
            }}
          >
            <p className="mb-1.5">{definition}</p>
            <Link
              href="/learn#compliance-tags"
              className="font-medium text-blue-400 hover:text-blue-300 [.light_&]:text-blue-600 [.light_&]:hover:text-blue-700"
              onClick={() => setOpen(false)}
            >
              Learn more →
            </Link>
          </div>,
          document.body
        )}
    </>
  );
}

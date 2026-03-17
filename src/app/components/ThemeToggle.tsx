"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sun,
  Moon,
  Contrast,
  PanelTop,
  Check,
  ChevronDown,
} from "lucide-react";
import { useTheme, type ThemeId } from "./ThemeProvider";

const THEME_OPTIONS: { id: ThemeId; label: string; icon: React.ReactNode }[] = [
  { id: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
  { id: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
  {
    id: "high-contrast-light",
    label: "High contrast (light)",
    icon: <Contrast className="h-4 w-4" />,
  },
  {
    id: "high-contrast-dark",
    label: "High contrast (dark)",
    icon: <Contrast className="h-4 w-4" />,
  },
];

export function ThemeToggle() {
  const { theme, setTheme, glassMode, setGlassMode } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const CurrentIcon =
    theme === "dark" || theme === "high-contrast-dark" ? Moon : Sun;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glass flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-200/80 [.light_&]:hover:text-slate-900 [.light_&]:focus-visible:ring-offset-white [.solid-ui_&]:bg-[var(--app-surface-solid)] [.solid-ui_&]:hover:bg-slate-800/80 [.light.solid-ui_&]:hover:bg-slate-200/90"
        aria-label="Theme and display options"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <CurrentIcon className="h-4 w-4 shrink-0" aria-hidden />
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-xl border border-slate-700/60 bg-slate-900/95 py-2 shadow-xl backdrop-blur-xl [.light_&]:border-slate-200/80 [.light_&]:bg-white/95 [.solid-ui_&]:bg-slate-900 [.light.solid-ui_&]:bg-white"
          style={{ minWidth: "14rem" }}
        >
          <div className="border-b border-slate-700/50 px-3 py-2 [.light_&]:border-slate-200/60">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 [.light_&]:text-slate-500">
              Theme
            </span>
          </div>
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === opt.id}
              onClick={() => {
                setTheme(opt.id);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-800/70 [.light_&]:text-slate-800 [.light_&]:hover:bg-slate-100"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400 [.light_&]:bg-slate-200/80 [.light_&]:text-slate-600">
                {opt.icon}
              </span>
              <span className="min-w-0 flex-1">{opt.label}</span>
              {theme === opt.id && (
                <Check className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
              )}
            </button>
          ))}

          <div className="border-t border-slate-700/50 px-3 py-2 [.light_&]:border-slate-200/60">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 [.light_&]:text-slate-500">
              Display
            </span>
          </div>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={glassMode}
            onClick={() => setGlassMode(!glassMode)}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-800/70 [.light_&]:text-slate-800 [.light_&]:hover:bg-slate-100"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400 [.light_&]:bg-slate-200/80 [.light_&]:text-slate-600">
              <PanelTop className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">Glass mode</span>
            <span className="text-xs text-slate-500 [.light_&]:text-slate-500">
              {glassMode ? "On" : "Off"}
            </span>
            {glassMode && (
              <Check className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { SovereignLogo } from "./SovereignLogo";
import { RegionSelector } from "./RegionSelector";
import type { Jurisdiction } from "@/app/lib/complianceEngine";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/", label: "Models" },
  { href: "/games", label: "Games" },
  { href: "/learn", label: "Learn" },
  { href: "/methodology", label: "Methodology" },
] as const;

const linkBase =
  "rounded-lg px-3 py-1.5 text-sm transition sm:py-2 flex items-center touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 [.light_&]:focus-visible:ring-offset-white [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900";
const linkInactive =
  "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 [.light_&]:text-slate-700 [.light_&]:hover:text-slate-900 " +
  linkBase;
const linkActive =
  "bg-blue-600/20 font-medium text-blue-400 [.light_&]:bg-blue-50 [.light_&]:text-blue-900 " +
  linkBase;

export type SiteHeaderProps = {
  /** Main page: search + region + filter */
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showRegionSelector?: boolean;
  jurisdiction?: Jurisdiction | null;
  onJurisdictionChange?: (j: Jurisdiction | null) => void;
  showFilterButton?: boolean;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  /** Admin page: user email + sign out */
  adminExtras?: React.ReactNode;
};

export function SiteHeader({
  showSearch,
  searchValue = "",
  onSearchChange,
  showRegionSelector,
  jurisdiction,
  onJurisdictionChange,
  showFilterButton,
  sidebarOpen,
  onSidebarToggle,
  adminExtras,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return (
      <header className="border-b border-slate-800/50 bg-[var(--app-surface-solid)] [.light_&]:border-slate-200/60">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8" aria-label="Main">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold text-white [.light_&]:text-slate-900"
          >
            <SovereignLogo className="h-6 w-6 text-blue-600 [.light_&]:text-blue-600" />
            Sovereign AI
          </Link>
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200 [.light_&]:text-slate-600 [.light_&]:hover:text-slate-900"
          >
            Back to catalog
          </Link>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800/50 bg-[var(--app-surface-solid)] pt-[env(safe-area-inset-top)] [.light_&]:border-slate-200/60">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8" aria-label="Main">
        <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight text-white hover:text-slate-200 sm:text-lg [.light_&]:text-slate-900 [.light_&]:hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-lg [.light_&]:focus-visible:ring-offset-white"
          >
            <SovereignLogo className="h-5 w-5 shrink-0 text-blue-600 sm:h-6 sm:w-6 [.light_&]:text-blue-600" aria-hidden />
            <span className="truncate">Sovereign AI</span>
          </Link>
          <div className="hidden min-w-0 flex-wrap items-center gap-1 sm:flex sm:gap-2 lg:gap-3">
            {NAV_ITEMS.map(({ href, label }) => {
              const active =
                (href === "/" && pathname === "/") ||
                (href !== "/" && pathname?.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={active ? linkActive : linkInactive}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:basis-auto sm:flex-initial sm:pl-4 lg:pl-8">
          {adminExtras ? (
            adminExtras
          ) : (
            <>
              {showRegionSelector && onJurisdictionChange && (
                <div className="hidden shrink-0 sm:block">
                  <RegionSelector
                    value={jurisdiction ?? null}
                    onChange={onJurisdictionChange}
                    placeholder="Jurisdiction"
                  />
                </div>
              )}
              {showSearch && onSearchChange && (
                <div className="relative min-w-0 flex-1">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-slate-500 [.light_&]:text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="search"
                    placeholder="Search models..."
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full min-w-0 rounded-xl border border-slate-700/60 bg-slate-800/40 py-2.5 pl-10 pr-4 text-base text-slate-200 placeholder-slate-500 backdrop-blur-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/50 sm:py-2 [.light_&]:border-slate-300/80 [.light_&]:bg-white/60 [.light_&]:text-slate-900 [.light_&]:placeholder-slate-600 [.light_&]:focus:border-blue-600 [.light_&]:focus:ring-blue-600/30"
                    aria-label="Search models"
                  />
                </div>
              )}
            </>
          )}
          <div className="flex shrink-0 items-center gap-1">
            {!adminExtras && <ThemeToggle />}
            {showFilterButton && onSidebarToggle && (
              <button
                type="button"
                onClick={onSidebarToggle}
                className="glass flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800/60 lg:hidden [.light_&]:text-slate-800 [.light_&]:hover:bg-slate-200/80"
                aria-expanded={sidebarOpen}
                aria-label="Toggle filters"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="ml-1.5 sm:hidden">Filters</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

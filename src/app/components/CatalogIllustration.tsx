"use client";

/**
 * Illustration for catalog/dashboard: models as stacked layers with sovereignty badge.
 */
export function CatalogIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Stacked cards/layers */}
      <rect
        x="40"
        y="50"
        width="120"
        height="50"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        className="text-slate-600/40 [.light_&]:text-slate-400/50"
      />
      <rect
        x="50"
        y="40"
        width="120"
        height="50"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        className="text-slate-500/50 [.light_&]:text-slate-500/60"
      />
      <rect
        x="60"
        y="30"
        width="120"
        height="50"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        className="text-slate-400/60 [.light_&]:text-slate-600/70"
      />
      {/* Shield badge */}
      <path
        d="M100 20l20 8v12c0 8-6 14-20 14s-20-6-20-14V28l20-8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="text-blue-600 [.light_&]:text-blue-600"
      />
      <path
        d="M100 26l12 5v6c0 4-4 8-12 8s-12-4-12-8v-6l12-5z"
        fill="currentColor"
        className="text-blue-600/30 [.light_&]:text-blue-600/40"
      />
      {/* Dots on cards */}
      <circle cx="75" cy="55" r="2" fill="currentColor" className="text-slate-500/60" />
      <circle cx="85" cy="45" r="2" fill="currentColor" className="text-slate-500/60" />
      <circle cx="95" cy="35" r="2" fill="currentColor" className="text-slate-500/60" />
    </svg>
  );
}

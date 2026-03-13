"use client";

/**
 * Hero illustration: sovereignty + AI motif.
 * Shield with abstract neural/data nodes—evokes ownership, control, and intelligence.
 */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Shield outline */}
      <path
        d="M140 12L240 52v48c0 24-40 48-100 48S40 124 40 100V52L140 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-amber-500/40 [.light_&]:text-amber-600/50"
      />
      <path
        d="M140 28L220 60v36c0 20-32 40-80 40S60 116 60 96V60l80-32z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-amber-500/60 [.light_&]:text-amber-600/70"
      />
      {/* Central node */}
      <circle
        cx="140"
        cy="72"
        r="12"
        fill="currentColor"
        className="text-amber-500 [.light_&]:text-amber-600"
      />
      {/* Orbiting nodes */}
      {[
        { x: 100, y: 52 },
        { x: 180, y: 52 },
        { x: 100, y: 92 },
        { x: 180, y: 92 },
        { x: 72, y: 72 },
        { x: 208, y: 72 },
      ].map((p, i) => (
        <g key={i}>
          <line
            x1="140"
            y1="72"
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 2"
            className="text-slate-600/50 [.light_&]:text-slate-400/60"
          />
          <circle
            cx={p.x}
            cy={p.y}
            r="5"
            fill="currentColor"
            className="text-slate-500/70 [.light_&]:text-slate-500"
          />
        </g>
      ))}
      {/* Data flow arcs */}
      <path
        d="M100 52 Q140 40 180 52"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeDasharray="3 2"
        className="text-amber-500/30 [.light_&]:text-amber-500/40"
      />
      <path
        d="M100 92 Q140 104 180 92"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeDasharray="3 2"
        className="text-amber-500/30 [.light_&]:text-amber-500/40"
      />
    </svg>
  );
}

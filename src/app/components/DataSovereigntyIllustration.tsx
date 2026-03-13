"use client";

/**
 * Illustration for methodology / data sovereignty: four dimensions as connected nodes.
 */
export function DataSovereigntyIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Central hub */}
      <circle
        cx="100"
        cy="60"
        r="14"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="text-amber-500 [.light_&]:text-amber-600"
      />
      <circle
        cx="100"
        cy="60"
        r="6"
        fill="currentColor"
        className="text-amber-500 [.light_&]:text-amber-600"
      />
      {/* Four dimension nodes */}
      {[
        { x: 50, y: 30, label: "Data" },
        { x: 150, y: 30, label: "Ops" },
        { x: 50, y: 90, label: "Tech" },
        { x: 150, y: 90, label: "Infra" },
      ].map((p, i) => (
        <g key={i}>
          <line
            x1="100"
            y1="60"
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-slate-600/60 [.light_&]:text-slate-400"
          />
          <circle
            cx={p.x}
            cy={p.y}
            r="10"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-slate-500 [.light_&]:text-slate-600"
          />
          <circle
            cx={p.x}
            cy={p.y}
            r="4"
            fill="currentColor"
            className="text-amber-500/80 [.light_&]:text-amber-600"
          />
        </g>
      ))}
    </svg>
  );
}

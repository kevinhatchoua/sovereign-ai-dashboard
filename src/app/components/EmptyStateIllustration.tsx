"use client";

/**
 * Empty state: magnifying glass over empty result—suggests adjusting filters.
 */
export function EmptyStateIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Magnifying glass */}
      <circle
        cx="45"
        cy="35"
        r="18"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <line
        x1="58"
        y1="48"
        x2="75"
        y2="65"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Empty doc/card */}
      <rect
        x="50"
        y="25"
        width="50"
        height="45"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        fill="none"
      />
      {/* Question mark hint */}
      <text
        x="75"
        y="52"
        textAnchor="middle"
        fill="currentColor"
        fontSize="16"
        fontWeight="300"
        opacity="0.6"
      >
        ?
      </text>
    </svg>
  );
}

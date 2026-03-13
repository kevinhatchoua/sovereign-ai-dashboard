"use client";

/**
 * Sovereign AI logo: shield with neural node—combines sovereignty and AI.
 */
export function SovereignLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Shield */}
      <path
        d="M16 4L26 9v8c0 6-4 12-10 12S6 23 6 17V9l10-5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Inner shield / core */}
      <path
        d="M16 8L22 11v4c0 3-2 6-6 6s-6-3-6-6v-4l6-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Central AI node */}
      <circle cx="16" cy="14" r="3" fill="currentColor" />
    </svg>
  );
}

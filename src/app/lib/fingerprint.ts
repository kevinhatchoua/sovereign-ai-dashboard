/**
 * Browser fingerprint for anonymous user identification.
 * Combines screen resolution, user agent, and other stable signals
 * to generate a unique hash. Used as fallback when Supabase anonymous auth
 * is not available, and for rate-limiting consistency.
 */
function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h = h & h;
  }
  return Math.abs(h).toString(36);
}

export function getBrowserFingerprint(): string {
  if (typeof window === "undefined") return "";

  const parts: string[] = [
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String(navigator.language),
    String(new Date().getTimezoneOffset()),
    navigator.userAgent,
    String(navigator.hardwareConcurrency ?? 0),
  ];

  return simpleHash(parts.join("|"));
}

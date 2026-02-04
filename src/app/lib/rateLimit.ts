const RATE_LIMIT_KEY = "sovereign-vote-last";
const COOLDOWN_MS = 30_000; // 30 seconds

export function canVote(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const last = localStorage.getItem(RATE_LIMIT_KEY);
    if (!last) return true;
    const elapsed = Date.now() - parseInt(last, 10);
    return elapsed >= COOLDOWN_MS;
  } catch {
    return true;
  }
}

export function recordVote(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function getCooldownRemaining(): number {
  if (typeof window === "undefined") return 0;
  try {
    const last = localStorage.getItem(RATE_LIMIT_KEY);
    if (!last) return 0;
    const elapsed = Date.now() - parseInt(last, 10);
    const remaining = COOLDOWN_MS - elapsed;
    return Math.max(0, remaining);
  } catch {
    return 0;
  }
}

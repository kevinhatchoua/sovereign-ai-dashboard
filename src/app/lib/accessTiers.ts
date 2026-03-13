/**
 * Model access tiers: which models require signup or payment.
 * Models not listed default to "free" (guest can browse; select requires signup for non-default).
 *
 * - free: Guest can select (default model only). Registered users get full access.
 * - registered: Requires signup to select. No payment.
 * - premium: Requires subscription or one-time purchase.
 */

export type AccessTier = "free" | "registered" | "premium";

/** Model IDs that require registered account to select/use */
const REGISTERED_TIER_IDS = new Set<string>([
  "meta-llama-llama-3-2-3b-instruct",
  "meta-llama-llama-3-1-8b-instruct",
  "qwen3",
  "mistralai-mistral-7b-instruct-v0-2",
]);

/** Model IDs that require premium (payment) */
const PREMIUM_TIER_IDS = new Set<string>([
  // Add high-end/commercial model IDs when ready
]);

/**
 * Default model guests can "try" without signup.
 * Small, open model for demo purposes.
 */
export const DEFAULT_GUEST_MODEL_ID = "qwen-qwen2-5-0-5b-instruct"; // Small open model for guest try-it

export function getModelAccessTier(modelId: string): AccessTier {
  if (PREMIUM_TIER_IDS.has(modelId)) return "premium";
  if (REGISTERED_TIER_IDS.has(modelId)) return "registered";
  return "free";
}

/** Can guest select this model without signup? */
export function canGuestSelect(modelId: string): boolean {
  return modelId === DEFAULT_GUEST_MODEL_ID;
}

/** Does this model require payment? */
export function requiresPremium(modelId: string): boolean {
  return getModelAccessTier(modelId) === "premium";
}

/** Does this model require signup (but not payment)? */
export function requiresRegistered(modelId: string): boolean {
  const tier = getModelAccessTier(modelId);
  return tier === "registered" || (tier === "free" && !canGuestSelect(modelId));
}

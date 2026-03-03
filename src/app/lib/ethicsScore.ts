import type { ComparisonModel } from "./registryNormalizer";

/**
 * Ethical Design Score: weighted metric (0–100) based on:
 * - Data Sovereignty (40%): open weights, data residency, sovereign deployment
 * - Bias Mitigation (30%): placeholder until we have bias data; defaults to 50
 * - Transparency (30%): openness, compliance tags, documentation signals
 */
export function computeEthicsScore(model: ComparisonModel): number {
  let sovereignty = 0;
  if (model.openness_level === "Open Weights") sovereignty += 25;
  if (model.data_residency) sovereignty += 15;
  if (model.compliance_tags.some((t) => t.includes("Sovereign"))) sovereignty += 20;
  sovereignty = Math.min(40, sovereignty);

  const biasMitigation = 15; // Placeholder: 30% * 0.5 until we have bias data

  let transparency = 0;
  if (model.openness_level === "Open Weights") transparency += 15;
  if (model.compliance_tags.length > 0) transparency += 10;
  if (model.intelligence?.training_cutoff) transparency += 5;
  transparency = Math.min(30, transparency);

  return Math.round(sovereignty + biasMitigation + transparency);
}

/** Returns Tailwind classes for ethics score: green (>70), yellow (40–70), red (<40) */
export function getEthicsScoreColorClasses(score: number): string {
  if (score > 70) return "text-emerald-500/90 [.light_&]:text-emerald-700";
  if (score >= 40) return "text-amber-500/90 [.light_&]:text-amber-700";
  return "text-red-500/90 [.light_&]:text-red-700";
}

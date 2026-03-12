import type { ComparisonModel } from "./registryNormalizer";

/**
 * Ethical Design Score: weighted metric (0–100) based on validated signals only:
 * - Data Sovereignty (50%): open weights, data residency, sovereign deployment
 * - Transparency (50%): openness, compliance tags, documentation (training_cutoff)
 * Bias mitigation excluded until we have authoritative bias data.
 */
export function computeEthicsScore(model: ComparisonModel): number {
  let sovereignty = 0;
  if (model.openness_level === "Open Weights") sovereignty += 30;
  if (model.data_residency) sovereignty += 15;
  if (model.compliance_tags.some((t) => t.includes("Sovereign"))) sovereignty += 20;
  sovereignty = Math.min(50, sovereignty);

  let transparency = 0;
  if (model.openness_level === "Open Weights") transparency += 20;
  if (model.compliance_tags.length > 0) transparency += 15;
  if (model.intelligence?.training_cutoff) transparency += 10;
  if (model.intelligence?.hf_downloads != null) transparency += 5;
  transparency = Math.min(50, transparency);

  return Math.round(sovereignty + transparency);
}

/** Returns Tailwind classes for ethics score: green (>70), yellow (40–70), red (<40) */
export function getEthicsScoreColorClasses(score: number): string {
  if (score > 70) return "text-emerald-500/90 [.light_&]:text-emerald-700";
  if (score >= 40) return "text-amber-500/90 [.light_&]:text-amber-700";
  return "text-red-500/90 [.light_&]:text-red-700";
}

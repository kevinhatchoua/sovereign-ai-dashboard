import type { ComparisonModel } from "./registryNormalizer";

/** McKinsey Four Dimensions of Sovereignty */
export type SovereigntyDimension = "data" | "operational" | "technological" | "infrastructure";

export type DimensionScore = {
  dimension: SovereigntyDimension;
  label: string;
  score: number; // 0-100
  level: "low" | "medium" | "high";
  description: string;
};

/** US Cloud Act exposure: US-based providers may be subject to data requests */
const US_BASED_PROVIDERS = new Set([
  "OpenAI",
  "Anthropic",
  "Google",
  "Microsoft",
  "Meta",
  "Allen Institute for AI",
  "NVIDIA",
  "IBM",
  "Cohere",
  "Hugging Face",
  "01.AI",
  "Liquid AI",
  "Essential AI",
  "Replicate",
  "Amazon",
  "Baidu",
]);

export function hasCloudActExposure(model: ComparisonModel): boolean {
  return US_BASED_PROVIDERS.has(model.provider) || model.origin_country === "United States";
}

/** Compute Four Dimensions of Sovereignty (McKinsey framework) */
export function getFourDimensions(model: ComparisonModel): DimensionScore[] {
  const dimensions: DimensionScore[] = [];

  // Data Sovereignty: Where does the data live? Cloud Act exposure?
  let dataScore = 50;
  if (model.data_residency) dataScore += 25;
  if (!hasCloudActExposure(model)) dataScore += 15;
  if (model.compliance_tags.some((t) => t.includes("GDPR") || t.includes("Data residency")))
    dataScore += 10;
  dataScore = Math.min(100, dataScore);
  dimensions.push({
    dimension: "data",
    label: "Data",
    score: dataScore,
    level: dataScore >= 70 ? "high" : dataScore >= 40 ? "medium" : "low",
    description:
      dataScore >= 70
        ? "Strong data residency and low jurisdictional exposure"
        : dataScore >= 40
          ? "Moderate data controls; review jurisdiction"
          : "Data may be subject to foreign access requests",
  });

  // Operational Sovereignty: Can you run it if provider cuts access?
  let opScore = model.openness_level === "Open Weights" ? 70 : 20;
  if (model.openness_level === "Open Weights" && model.intelligence?.quantization_gguf)
    opScore += 15;
  if (model.compliance_tags.some((t) => t.includes("Sovereign"))) opScore += 15;
  opScore = Math.min(100, opScore);
  dimensions.push({
    dimension: "operational",
    label: "Operational",
    score: opScore,
    level: opScore >= 70 ? "high" : opScore >= 40 ? "medium" : "low",
    description:
      opScore >= 70
        ? "Self-hostable; full operational autonomy"
        : opScore >= 40
          ? "Partial autonomy; some dependencies"
          : "Provider-dependent; limited autonomy",
  });

  // Technological Sovereignty: Open vs proprietary?
  let techScore = model.openness_level === "Open Weights" ? 80 : 0;
  if (model.intelligence?.training_cutoff) techScore += 10;
  if (model.intelligence?.hf_downloads && model.intelligence.hf_downloads > 10000)
    techScore += 10;
  techScore = Math.min(100, techScore);
  dimensions.push({
    dimension: "technological",
    label: "Technological",
    score: techScore,
    level: techScore >= 70 ? "high" : techScore >= 40 ? "medium" : "low",
    description:
      techScore >= 70
        ? "Open weights; transparent and auditable"
        : techScore >= 40
          ? "Some transparency; review licensing"
          : "Proprietary; black-box model",
  });

  // Infrastructure Sovereignty: Control over compute location
  let infraScore = 40;
  if (model.origin_country !== "United States" && model.origin_country !== "China")
    infraScore += 20;
  if (model.openness_level === "Open Weights") infraScore += 25;
  if (model.compliance_tags.some((t) => t.includes("Sovereign") || t.includes("Data residency")))
    infraScore += 15;
  infraScore = Math.min(100, infraScore);
  dimensions.push({
    dimension: "infrastructure",
    label: "Infrastructure",
    score: infraScore,
    level: infraScore >= 70 ? "high" : infraScore >= 40 ? "medium" : "low",
    description:
      infraScore >= 70
        ? "Deploy on your infrastructure; domestic options"
        : infraScore >= 40
          ? "Moderate control; verify hosting options"
          : "Limited infrastructure control",
  });

  return dimensions;
}

/** Sovereignty Readiness: Foundation | Intermediate | Advanced (Red Hat / SUSE style) */
export type ReadinessLevel = "Foundation" | "Intermediate" | "Advanced";

export function getSovereigntyReadiness(model: ComparisonModel): {
  level: ReadinessLevel;
  score: number;
  label: string;
} {
  const dimensions = getFourDimensions(model);
  const avgScore =
    dimensions.reduce((acc, d) => acc + d.score, 0) / dimensions.length;
  const cloudActRisk = hasCloudActExposure(model) ? -10 : 0;
  const score = Math.round(Math.min(100, Math.max(0, avgScore + cloudActRisk)));

  if (score >= 75) return { level: "Advanced", score, label: "Advanced" };
  if (score >= 50) return { level: "Intermediate", score, label: "Intermediate" };
  return { level: "Foundation", score, label: "Foundation" };
}

/** Tailwind classes for sovereignty readiness — PatternFly blue/gray scale */
export function getSovereigntyReadinessColorClasses(level: ReadinessLevel): string {
  switch (level) {
    case "Advanced":
      return "bg-blue-600/20 text-blue-400 ring-1 ring-blue-600/30 [.light_&]:bg-blue-50 [.light_&]:text-blue-800 [.light_&]:ring-blue-400";
    case "Intermediate":
      return "bg-slate-500/25 text-slate-300 ring-1 ring-slate-500/30 [.light_&]:bg-slate-100 [.light_&]:text-slate-700 [.light_&]:ring-slate-400";
    case "Foundation":
      return "bg-slate-600/20 text-slate-400 ring-1 ring-slate-600/30 [.light_&]:bg-slate-200 [.light_&]:text-slate-600 [.light_&]:ring-slate-400";
  }
}

/** Tailwind classes for openness — PatternFly blue (self-hostable) / slate (API) */
export function getOpennessColorClasses(openness: "Open Weights" | "API"): string {
  return openness === "Open Weights"
    ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-600/30 [.light_&]:bg-blue-50 [.light_&]:text-blue-800 [.light_&]:ring-blue-400"
    : "bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/30 [.light_&]:bg-slate-200 [.light_&]:text-slate-700 [.light_&]:ring-slate-400";
}

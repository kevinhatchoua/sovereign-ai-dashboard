import { checkCompliance, type Jurisdiction } from "./complianceEngine";

/** Extended metadata for Model Intelligence Hub */
export type ModelIntelligence = {
  popularity_index?: string;
  inference_speed?: number;
  context_window?: number;
  training_cutoff?: string;
  vram_4bit_gb?: number;
  vram_8bit_gb?: number;
  ram_4bit_gb?: number;
  ram_8bit_gb?: number;
  quantization_gguf?: boolean;
  quantization_exl2?: boolean;
  download_trend?: number[];
  top_use_cases?: string[];
  /** From Hugging Face API (sync_hf_metrics.py) */
  hf_downloads?: number;
  hf_likes?: number;
};

/** Legacy registry entry (origin_country, openness_level, compliance_tags) */
type LegacyEntry = {
  id: string;
  name: string;
  provider: string;
  origin_country: string;
  openness_level: "Open Weights" | "API";
  data_residency: boolean;
  compliance_tags: string[];
  languages?: string[];
  task_categories?: string[];
} & Partial<ModelIntelligence>;

/** New registry entry (origin, openness, compliance object) */
type NewEntry = {
  id: string;
  name: string;
  provider: string;
  origin: string;
  openness: string;
  compliance: {
    EU_AI_Act?: string;
    India_DPDP?: string;
    US_Executive_Order?: string;
  };
  data_residency: boolean;
  languages?: string[];
  task_categories?: string[];
} & Partial<ModelIntelligence>;

export type RawRegistryEntry = LegacyEntry | NewEntry;

function isLegacyEntry(entry: RawRegistryEntry): entry is LegacyEntry {
  return "origin_country" in entry && "openness_level" in entry;
}

/** Normalized model for dashboard and comparison matrix. compliance keys match Jurisdiction (EU, IN, US). */
export type ComparisonModel = {
  id: string;
  name: string;
  provider: string;
  origin_country: string;
  openness_level: "Open Weights" | "API";
  data_residency: boolean;
  compliance_tags: string[];
  compliance: { EU: string; IN: string; US: string };
  languages: string[];
  task_categories: string[];
} & { intelligence?: ModelIntelligence };

function getComplianceStatusLegacy(
  entry: LegacyEntry,
  jurisdiction: Jurisdiction
): string {
  const result = checkCompliance(
    {
      openness_level: entry.openness_level,
      origin_country: entry.origin_country,
      data_residency: entry.data_residency,
      compliance_tags: entry.compliance_tags,
    },
    jurisdiction
  );
  if (result.isCompliant) return "Compliant";
  const req = result.issues[0]?.requirement ?? "Risk";
  return `Risk (${req})`;
}

export function normalizeToComparisonModel(
  entry: RawRegistryEntry
): ComparisonModel {
  if (isLegacyEntry(entry)) {
    const hasIntel =
      entry.popularity_index != null ||
      entry.vram_4bit_gb != null ||
      entry.hf_downloads != null;
    const intel: ModelIntelligence | undefined = hasIntel
      ? {
            popularity_index: entry.popularity_index,
            inference_speed: entry.inference_speed,
            context_window: entry.context_window,
            training_cutoff: entry.training_cutoff,
            vram_4bit_gb: entry.vram_4bit_gb,
            vram_8bit_gb: entry.vram_8bit_gb,
            ram_4bit_gb: entry.ram_4bit_gb,
            ram_8bit_gb: entry.ram_8bit_gb,
            quantization_gguf: entry.quantization_gguf,
            quantization_exl2: entry.quantization_exl2,
            download_trend: entry.download_trend,
            top_use_cases: entry.top_use_cases,
            hf_downloads: entry.hf_downloads,
            hf_likes: entry.hf_likes,
          }
        : undefined;
    return {
      id: entry.id,
      name: entry.name,
      provider: entry.provider,
      origin_country: entry.origin_country,
      openness_level: entry.openness_level,
      data_residency: entry.data_residency,
      compliance_tags: entry.compliance_tags ?? [],
      compliance: {
        EU: getComplianceStatusLegacy(entry, "EU"),
        IN: getComplianceStatusLegacy(entry, "IN"),
        US: getComplianceStatusLegacy(entry, "US"),
      },
      languages: entry.languages ?? [],
      task_categories: entry.task_categories ?? [],
      intelligence: intel,
    };
  }

  const newEntry = entry as NewEntry;
  const openness_level: "Open Weights" | "API" =
    newEntry.openness === "Fully Open" ? "Open Weights" : "API";
  const origin_country =
    newEntry.origin === "USA" ? "United States" : newEntry.origin;

  const eu = newEntry.compliance.EU_AI_Act ?? "—";
  const in_ = newEntry.compliance.India_DPDP ?? "—";
  const us = newEntry.compliance.US_Executive_Order ?? "—";

  const compliance_tags: string[] = [];
  if (eu.toLowerCase().includes("compliant") || eu.toLowerCase().includes("partial")) compliance_tags.push("EU AI Act Ready");
  if (in_.toLowerCase().includes("ready") || in_.toLowerCase().includes("compliant")) compliance_tags.push("India Data Localization");
  if (us.toLowerCase().includes("certified") || us.toLowerCase().includes("exempt")) compliance_tags.push("GDPR");

  const ne = newEntry as NewEntry & Partial<ModelIntelligence>;
  const hasIntel =
    ne.popularity_index != null || ne.vram_4bit_gb != null || ne.hf_downloads != null;
  const intel: ModelIntelligence | undefined = hasIntel
    ? {
        popularity_index: ne.popularity_index,
        inference_speed: ne.inference_speed,
        context_window: ne.context_window,
        training_cutoff: ne.training_cutoff,
        vram_4bit_gb: ne.vram_4bit_gb,
        vram_8bit_gb: ne.vram_8bit_gb,
        ram_4bit_gb: ne.ram_4bit_gb,
        ram_8bit_gb: ne.ram_8bit_gb,
        quantization_gguf: ne.quantization_gguf,
        quantization_exl2: ne.quantization_exl2,
        download_trend: ne.download_trend,
        top_use_cases: ne.top_use_cases,
        hf_downloads: ne.hf_downloads,
        hf_likes: ne.hf_likes,
      }
    : undefined;

  return {
    id: newEntry.id,
    name: newEntry.name,
    provider: newEntry.provider,
    origin_country,
    openness_level,
    data_residency: newEntry.data_residency,
    compliance_tags,
    compliance: { EU: eu, IN: in_, US: us },
    languages: newEntry.languages ?? [],
    task_categories: newEntry.task_categories ?? [],
    intelligence: intel,
  };
}

export function normalizeRegistry(entries: RawRegistryEntry[]): ComparisonModel[] {
  return entries.map(normalizeToComparisonModel);
}

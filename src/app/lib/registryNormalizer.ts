import { checkCompliance, type Jurisdiction } from "./complianceEngine";

/** Legacy registry entry (origin_country, openness_level, compliance_tags) */
type LegacyEntry = {
  id: string;
  name: string;
  provider: string;
  origin_country: string;
  openness_level: "Open Weights" | "API";
  data_residency: boolean;
  compliance_tags: string[];
};

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
};

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
  /** Per-jurisdiction status for comparison matrix (EU, IN, US). */
  compliance: { EU: string; IN: string; US: string };
};

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

  return {
    id: newEntry.id,
    name: newEntry.name,
    provider: newEntry.provider,
    origin_country,
    openness_level,
    data_residency: newEntry.data_residency,
    compliance_tags,
    compliance: { EU: eu, IN: in_, US: us },
  };
}

export function normalizeRegistry(entries: RawRegistryEntry[]): ComparisonModel[] {
  return entries.map(normalizeToComparisonModel);
}

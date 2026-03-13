import registryData from "@/data/registry.json";
import {
  normalizeRegistry,
  type ComparisonModel,
  type RawRegistryEntry,
} from "./registryNormalizer";
import { getSovereigntyReadiness, hasCloudActExposure } from "./sovereigntyScore";
import { computeEthicsScore } from "./ethicsScore";

const models: ComparisonModel[] = normalizeRegistry(
  registryData as RawRegistryEntry[]
);

/** Get all normalized models. Used by API routes and server components. */
export function getModels(): ComparisonModel[] {
  return models;
}

/** Get model by ID, or undefined if not found. */
export function getModelById(id: string): ComparisonModel | undefined {
  return models.find((m) => m.id === id);
}

/** Aggregate stats for /api/stats. */
export function getStats(jurisdiction?: "EU" | "IN" | "US") {
  const openWeights = models.filter((m) => m.openness_level === "Open Weights");
  const apiOnly = models.filter((m) => m.openness_level === "API");
  const cloudActExposed = models.filter(hasCloudActExposure);
  const byReadiness = models.reduce<Record<string, number>>((acc, m) => {
    const level = getSovereigntyReadiness(m).label;
    acc[level] = (acc[level] ?? 0) + 1;
    return acc;
  }, {});
  const avgEthics =
    models.length > 0
      ? Math.round(
          models.reduce((acc, m) => acc + computeEthicsScore(m), 0) /
            models.length
        )
      : 0;
  const byProvider = models.reduce<Record<string, number>>((acc, m) => {
    acc[m.provider] = (acc[m.provider] ?? 0) + 1;
    return acc;
  }, {});
  const byCountry = models.reduce<Record<string, number>>((acc, m) => {
    acc[m.origin_country] = (acc[m.origin_country] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: models.length,
    openWeights: openWeights.length,
    apiOnly: apiOnly.length,
    cloudActExposed: cloudActExposed.length,
    avgEthicsScore: avgEthics,
    byReadiness,
    byProvider,
    byCountry,
    jurisdiction: jurisdiction ?? null,
  };
}

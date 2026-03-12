/** Sovereign-ready platforms (Braintrust, Arize Phoenix, EDB Postgres AI, etc.) */
export const SOVEREIGN_PLATFORMS = [
  {
    id: "arize-phoenix",
    name: "Arize Phoenix",
    description: "Open-source, OpenTelemetry-native; fully self-hostable or air-gapped",
    url: "https://phoenix.arize.com",
    supportsOpenWeights: true,
  },
  {
    id: "edb-postgres-ai",
    name: "EDB Postgres AI",
    description: "Sovereign Assurance: private GenAI where your data resides",
    url: "https://www.enterprisedb.com",
    supportsOpenWeights: true,
  },
  {
    id: "braintrust",
    name: "Braintrust",
    description: "Data plane stays in your VPC; data never flows through their infrastructure",
    url: "https://braintrust.dev",
    supportsOpenWeights: true,
  },
] as const;

/** Models compatible with sovereign platforms - open-weights models generally work with all */
export function getCompatiblePlatforms(opennessLevel: string): readonly { id: string; name: string; description: string; url: string; supportsOpenWeights: boolean }[] {
  if (opennessLevel === "Open Weights") {
    return SOVEREIGN_PLATFORMS;
  }
  return SOVEREIGN_PLATFORMS.filter((p) => p.id === "braintrust"); // Braintrust supports API models too
}

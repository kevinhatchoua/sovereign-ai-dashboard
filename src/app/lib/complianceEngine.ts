export type Jurisdiction = "EU" | "IN" | "US";

export type RegistryModel = {
  openness_level: "Open Weights" | "API";
  origin_country: string;
  data_residency: boolean;
  compliance_tags: string[];
};

export type ComplianceIssue = {
  requirement: string;
  message: string;
};

export const checkCompliance = (
  model: RegistryModel,
  userRegion: Jurisdiction
): { isCompliant: boolean; issues: ComplianceIssue[] } => {
  const issues: ComplianceIssue[] = [];
  const openness =
    model.openness_level === "Open Weights" ? "Fully Open" : "API Only";
  const origin = model.origin_country === "United States" ? "USA" : model.origin_country;
  const hasEuAiAct = model.compliance_tags.some((t) => t.includes("EU AI Act"));

  if (userRegion === "EU") {
    if (openness !== "Fully Open" && !hasEuAiAct) {
      issues.push({
        requirement: "EU AI Act Article 53",
        message:
          "Missing Art 53 Transparency documentation (Required by Aug 2026).",
      });
    }
  }

  if (userRegion === "IN") {
    if (!model.data_residency) {
      issues.push({
        requirement: "DPDP 2025",
        message:
          "Non-resident processing: Potential violation of DPDP 2025 sectoral mandates.",
      });
    }
  }

  if (userRegion === "US") {
    if (origin !== "USA" && openness === "API Only") {
      issues.push({
        requirement: "2025 National AI Policy",
        message:
          "Subject to high-risk reporting under 2025 National AI Policy.",
      });
    }
  }

  return {
    isCompliant: issues.length === 0,
    issues,
  };
};

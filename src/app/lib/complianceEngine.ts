export type Jurisdiction = 'EU' | 'IN' | 'US';

export const checkCompliance = (model: any, userRegion: Jurisdiction) => {
  const issues = [];

  if (userRegion === 'EU') {
    if (model.openness !== 'Fully Open' && !model.compliance.EU_AI_Act.includes('Art 53')) {
      issues.push("Missing Art 53 Transparency documentation (Required by Aug 2026).");
    }
  }

  if (userRegion === 'IN') {
    if (!model.data_residency) {
      issues.push("Non-resident processing: Potential violation of DPDP 2025 sectoral mandates.");
    }
  }

  if (userRegion === 'US') {
    if (model.origin !== 'USA' && model.openness === 'API Only') {
      issues.push("Subject to high-risk reporting under 2025 National AI Policy.");
    }
  }

  return {
    isCompliant: issues.length === 0,
    issues
  };
};
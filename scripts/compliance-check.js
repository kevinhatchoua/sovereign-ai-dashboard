const fs = require("fs");
const path = require("path");

const registryPath = path.join(__dirname, "../src/data/registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

async function checkHealth() {
  console.log("🔍 Starting 2026 Sovereign Compliance Patrol...");
  let updatesFound = false;

  for (const model of registry) {
    console.log(`Checking ${model.name}...`);

    // Only run EU/US cross-check for entries with origin + compliance object (new schema)
    const origin = model.origin ?? (model.origin_country === "United States" ? "USA" : null);
    const euStatus = model.compliance?.EU_AI_Act ?? null;

    // Example: If a US model claims EU compliance, verify the latest "Data Privacy Framework" status
    if (origin === "USA" && euStatus && euStatus.toLowerCase().includes("compliant")) {
      // In 2026, this would be an actual API call to a regulatory database
      const isStillValid = Math.random() > 0.1; // Simulated check
      if (!isStillValid) {
        console.warn(`⚠️ ALERT: ${model.name} residency status has changed in EU registry!`);
        updatesFound = true;
      }
    }
  }

  if (updatesFound) {
    console.error("❌ Compliance patrol found models that may need registry updates.");
    process.exit(1); // Fail the build to trigger an alert
  }

  console.log("✅ Compliance patrol complete. No updates required.");
}

checkHealth().catch((err) => {
  console.error(err);
  process.exit(1);
});

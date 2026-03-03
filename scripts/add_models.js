#!/usr/bin/env node
/**
 * Adds 100 models to registry.json with varied, realistic data.
 */
const fs = require("fs");
const path = require("path");

const PROVIDERS = [
  { name: "Mistral AI", country: "France" },
  { name: "Meta", country: "United States" },
  { name: "Google", country: "United States" },
  { name: "Microsoft", country: "United States" },
  { name: "Anthropic", country: "United States" },
  { name: "Cohere", country: "Canada" },
  { name: "AI21 Labs", country: "Israel" },
  { name: "Stability AI", country: "United Kingdom" },
  { name: "Hugging Face", country: "France" },
  { name: "Together AI", country: "United States" },
  { name: "Replicate", country: "United States" },
  { name: "Aleph Alpha", country: "Germany" },
  { name: "NVIDIA", country: "United States" },
  { name: "IBM", country: "United States" },
  { name: "Amazon", country: "United States" },
  { name: "Alibaba Cloud", country: "China" },
  { name: "ByteDance", country: "China" },
  { name: "Baidu", country: "China" },
  { name: "DeepSeek", country: "China" },
  { name: "01.AI", country: "China" },
  { name: "Liquid AI", country: "United States" },
  { name: "Essential AI", country: "United States" },
  { name: "Allen Institute for AI", country: "United States" },
  { name: "OpenAI", country: "United States" },
];

const COMPLIANCE_SETS = [
  ["EU AI Act Ready", "GDPR", "Data residency"],
  ["GDPR"],
  ["EU AI Act Ready", "GDPR"],
  ["India Data Localization", "GDPR"],
  ["Sovereign Deployment"],
  [],
  ["GDPR", "Data residency"],
];

const LANG_SETS = [
  ["en", "multilingual"],
  ["en", "fr", "de", "es", "multilingual"],
  ["en", "zh", "multilingual"],
  ["en", "ar", "multilingual"],
  ["en", "hi", "multilingual"],
  ["en"],
  ["en", "fr", "multilingual"],
  ["en", "de", "multilingual"],
];

const TASK_SETS = [
  ["text-generation", "conversational"],
  ["text-generation", "code"],
  ["text-generation", "conversational", "question-answering"],
  ["text-generation", "conversational", "vision"],
  ["text-generation", "code", "conversational"],
  ["text-generation"],
  ["text-generation", "conversational", "summarization"],
  ["vision", "conversational"],
];

const MODEL_NAMES = [
  "Nexus", "Apex", "Pulse", "Vertex", "Nova", "Prime", "Core", "Spark",
  "Flux", "Beam", "Echo", "Orbit", "Pivot", "Scope", "Lens", "Prism",
  "Atlas", "Titan", "Helix", "Vector", "Matrix", "Sigma", "Omega", "Alpha",
  "Beta", "Gamma", "Delta", "Zeta", "Theta", "Lambda", "Phi", "Psi",
  "Aurora", "Zenith", "Nimbus", "Stratus", "Cumulus", "Cirrus", "Sol",
  "Luna", "Stella", "Nova", "Vega", "Orion", "Sirius", "Polaris",
  "Cipher", "Cipher Pro", "Cipher Lite", "Cipher Nano", "Cipher Max",
  "Fusion", "Fusion Pro", "Fusion Lite", "Fusion Nano",
  "Pulse Pro", "Pulse Lite", "Pulse Nano", "Pulse Max",
  "Vertex Pro", "Vertex Lite", "Vertex Nano",
  "Nexus Pro", "Nexus Lite", "Nexus Nano", "Nexus Max",
  "Apex Pro", "Apex Lite", "Apex Nano",
  "Prime Pro", "Prime Lite", "Prime Nano", "Prime Max",
  "Core Pro", "Core Lite", "Core Nano",
  "Spark Pro", "Spark Lite", "Spark Nano", "Spark Max",
  "Beam Pro", "Beam Lite", "Beam Nano",
  "Echo Pro", "Echo Lite", "Echo Nano",
  "Orbit Pro", "Orbit Lite", "Orbit Nano",
  "Scope Pro", "Scope Lite", "Scope Nano",
  "Lens Pro", "Lens Lite", "Lens Nano",
  "Atlas Pro", "Atlas Lite", "Atlas Nano",
  "Titan Pro", "Titan Lite", "Titan Nano",
  "Helix Pro", "Helix Lite", "Helix Nano",
  "Vector Pro", "Vector Lite", "Vector Nano",
  "Sigma Pro", "Sigma Lite", "Sigma Nano",
  "Omega Pro", "Omega Lite", "Omega Nano",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateModels(count) {
  const used = new Set();
  const models = [];
  for (let i = 0; i < count; i++) {
    const provider = pick(PROVIDERS);
    let name = pick(MODEL_NAMES);
    const suffix = Math.floor(Math.random() * 10);
    if (suffix > 6) name += ` ${suffix}`;
    const id = `${name.toLowerCase().replace(/\s+/g, "-")}-${provider.name.toLowerCase().replace(/\s+/g, "-")}-${i}`.replace(/[^a-z0-9-]/g, "");
    if (used.has(id)) continue;
    used.add(id);

    const openness = Math.random() > 0.4 ? "Open Weights" : "API";
    const dataResidency = Math.random() > 0.6;
    const compliance = pick(COMPLIANCE_SETS);
    if (dataResidency && !compliance.includes("Data residency")) compliance.push("Data residency");

    const vram = [4, 6, 8, 12, 16, 24, 32, 48][Math.floor(Math.random() * 8)];
    const ram = vram * 1.5;
    const ctx = [4096, 8192, 16384, 32768, 65536, 128000, 256000][Math.floor(Math.random() * 7)];
    const speed = 20 + Math.floor(Math.random() * 80);

    models.push({
      id,
      name: `${name} ${i + 1}`,
      provider: provider.name,
      origin_country: provider.country,
      openness_level: openness,
      data_residency: dataResidency,
      compliance_tags: [...new Set(compliance)],
      languages: [...pick(LANG_SETS)],
      task_categories: [...pick(TASK_SETS)],
      popularity_index: ["Top 1%", "Top 3%", "Top 5%", "Top 10%", "Top 20%"][Math.floor(Math.random() * 5)],
      inference_speed: speed,
      context_window: ctx,
      training_cutoff: `202${Math.floor(Math.random() * 6)}-${String(Math.ceil(Math.random() * 12)).padStart(2, "0")}`,
      vram_4bit_gb: Math.floor(vram / 2),
      vram_8bit_gb: vram,
      ram_4bit_gb: Math.floor(ram / 2),
      ram_8bit_gb: Math.floor(ram),
      quantization_gguf: openness === "Open Weights",
      quantization_exl2: openness === "Open Weights" && Math.random() > 0.3,
      download_trend: Array.from({ length: 7 }, () => 50 + Math.floor(Math.random() * 200)),
      top_use_cases: pick([["Coding", "RAG", "Conversational"], ["Reasoning", "RAG"], ["Multimodal", "RAG"], ["Coding", "Reasoning"]]),
      hf_downloads: Math.floor(Math.random() * 2000000) + 10000,
      hf_likes: Math.floor(Math.random() * 5000) + 50,
    });
  }
  return models;
}

const registryPath = path.join(__dirname, "../src/data/registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const existingIds = new Set(registry.map((m) => m.id));
const newModels = generateModels(100).filter((m) => !existingIds.has(m.id));
registry.push(...newModels);
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
console.log(`Added ${newModels.length} models. Total: ${registry.length}`);

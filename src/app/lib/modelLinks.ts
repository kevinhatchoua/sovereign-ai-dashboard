import type { ComparisonModel } from "./registryNormalizer";

/** Extended raw entry may have home_page and huggingface_id */
type ExtendedModel = ComparisonModel & {
  home_page?: string;
  huggingface_id?: string;
};

/** Provider homepage fallbacks when home_page not in registry (learn more / view on provider) */
const PROVIDER_HOMEPAGES: Record<string, string> = {
  "Mistral AI": "https://mistral.ai",
  "Meta": "https://ai.meta.com",
  "Google": "https://ai.google.dev",
  "Anthropic": "https://anthropic.com",
  "OpenAI": "https://openai.com",
  "Microsoft": "https://www.microsoft.com/en-us/research",
  "NVIDIA": "https://www.nvidia.com/en-us/ai-data-science",
  "Hugging Face": "https://huggingface.co",
  "HuggingFaceTB": "https://huggingface.co",
  "Alibaba Cloud": "https://www.alibabacloud.com",
  "Technology Innovation Institute": "https://www.tii.ae",
  "Allen Institute for AI": "https://allenai.org",
  "DeepSeek": "https://deepseek.com",
  "Cohere": "https://cohere.com",
  "Stability AI": "https://stability.ai",
  "IBM": "https://www.ibm.com/watson",
  "Amazon": "https://aws.amazon.com/machine-learning",
  "AI21 Labs": "https://www.ai21.com",
  "Aleph Alpha": "https://aleph-alpha.com",
  "Baidu": "https://cloud.baidu.com",
  "ByteDance": "https://www.bytedance.com",
  "EleutherAI": "https://www.eleuther.ai",
  "Essential AI": "https://www.essential.ai",
  "LMSYS": "https://lmsys.org",
  "Liquid AI": "https://liquid.ai",
  "MiniMax": "https://api.minimax.chat",
  "01.AI": "https://01.ai",
  "RedHatAI": "https://github.com/redhat-na/red-hat-ai",
  "Replicate": "https://replicate.com",
  "TinyLlama": "https://huggingface.co/TinyLlama",
  "Zhipu AI": "https://open.bigmodel.cn",
  "apple": "https://machinelearning.apple.com",
  "h2oai": "https://h2o.ai",
  "bigscience": "https://huggingface.co/bigscience",
  "mlx-community": "https://github.com/ml-explore",
  "lmstudio-community": "https://lmstudio.ai",
  "llamafactory": "https://github.com/hiyoufu/LLaMA-Factory",
  "zai-org": "https://huggingface.co/zai-org",
};

/** Registry id -> Hugging Face model id (for download links when huggingface_id not in registry) */
const HF_MODEL_MAP: Record<string, string> = {
  "llama-3.1": "meta-llama/Llama-3.1-8B",
  "mistral-7b": "mistralai/Mistral-7B-Instruct-v0.3",
  "mistral-large-3": "mistralai/Mistral-Large-2407",
  "mistral-small": "mistralai/Mistral-Small-2409",
  "mistral-nemo": "mistralai/Mistral-Nemo-2407",
  "qwen-2.5": "Qwen/Qwen2.5-7B-Instruct",
  "qwen3": "Qwen/Qwen2.5-7B-Instruct",
  "qwen3-vl": "Qwen/Qwen2-VL-7B-Instruct",
  "qwen3-coder": "Qwen/Qwen2.5-Coder-7B-Instruct",
  "qwen2-5-vl": "Qwen/Qwen2-VL-7B-Instruct",
  "ministral-3": "mistralai/Ministral-3B-Instruct-2409",
  "magistral": "mistralai/Magistral-24B-2409",
  "devstral": "mistralai/Devstral-24B-2501",
  "codestral": "mistralai/Codestral-22B-2501",
  "granite-4": "ibm-granite/granite-4.0-8b-instruct",
  "gemma-3": "google/gemma-3-12b-it",
  "gemma-3n": "google/gemma-3-12b-it",
  "phi-4": "microsoft/Phi-4",
  "olmo-3": "allenai/OLMo-2-7B-7B-Instruct",
  "olmocr-2": "allenai/OLMo-2-7B-7B-Instruct",
  "nemotron-3": "nvidia/Nemotron-MoE-30B-Instruct",
  "deepseek-r1": "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
  "gpt-oss": "openai/gpt-oss-20b",
  "falcon-2": "tiiuae/falcon2-11B-instruct",
  "flux-01ai-4": "black-forest-labs/FLUX.1-schnell",
  "seed-oss": "AILearning-AI/SEED-2-0",
};

export type ModelLinks = {
  learnMore: string | null;
  download: string | null;
};

export function getModelLinks(model: ComparisonModel): ModelLinks {
  const ext = model as ExtendedModel;
  let learnMore: string | null = ext.home_page ?? null;
  if (!learnMore && model.provider) {
    learnMore = PROVIDER_HOMEPAGES[model.provider] ?? null;
  }
  if (!learnMore && ext.huggingface_id) {
    learnMore = `https://huggingface.co/${ext.huggingface_id}`;
  }

  let download: string | null = null;
  if (model.openness_level === "Open Weights") {
    const hfId = ext.huggingface_id ?? HF_MODEL_MAP[model.id];
    if (hfId) {
      download = `https://huggingface.co/${hfId}`;
    } else {
      // Fallback: search Hugging Face so users can find the model (prefer name, then id)
      const searchTerm = (model.name?.trim() || model.id || "").replace(/\s+/g, " ");
      const searchQuery = encodeURIComponent(searchTerm || "LLM");
      download = `https://huggingface.co/models?search=${searchQuery}`;
    }
  }

  return { learnMore, download };
}

const TASK_LABELS: Record<string, string> = {
  "text-generation": "text generation",
  conversational: "conversational",
  code: "code",
  games: "games",
  "question-answering": "Q&A",
  summarization: "summarization",
  vision: "vision",
};

/** Returns a short description for cards; uses registry description or generates from metadata. */
export function getModelDescription(model: ComparisonModel): string {
  if (model.description?.trim()) return model.description.trim();
  const tasks = model.task_categories
    .slice(0, 3)
    .map((t) => TASK_LABELS[t] ?? t)
    .join(", ");
  const openness = model.openness_level === "Open Weights" ? "Open-weights" : "API-hosted";
  const suffix = tasks ? ` Supports ${tasks}.` : "";
  return `${openness} model from ${model.provider}.${suffix}`.trim();
}

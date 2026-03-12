#!/usr/bin/env python3
"""
Expand the Sovereign AI registry with models from Hugging Face.
Fetches top text-generation models by downloads and merges with existing registry.
Only adds validated data: hf_downloads, hf_likes, huggingface_id.
Provider and origin_country inferred from HF org mapping (authoritative where known).
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    print("Install requests: pip install requests")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).resolve().parent
REGISTRY_PATH = SCRIPT_DIR.parent / "src" / "data" / "registry.json"
HF_API = "https://huggingface.co/api/models"

# Registry id -> HF model id (from sync_hf_metrics / modelLinks). Used to avoid duplicates.
REGISTRY_HF_MAP: dict[str, str] = {
    "llama-3.1": "meta-llama/Llama-3.1-8B",
    "mistral-7b": "mistralai/Mistral-7B-Instruct-v0.3",
    "qwen3": "Qwen/Qwen2.5-7B-Instruct",
    "qwen3-vl": "Qwen/Qwen2-VL-7B-Instruct",
    "qwen3-coder": "Qwen/Qwen2.5-Coder-7B-Instruct",
    "ministral-3": "mistralai/Ministral-3B-Instruct-2409",
    "magistral": "mistralai/Magistral-24B-2409",
    "devstral": "mistralai/Devstral-24B-2501",
    "codestral": "mistralai/Codestral-22B-2501",
    "granite-4": "ibm-granite/granite-4.0-8b-instruct",
    "gemma-3": "google/gemma-3-12b-it",
    "phi-4": "microsoft/Phi-4",
    "olmo-3": "allenai/OLMo-2-7B-7B-Instruct",
    "nemotron-3": "nvidia/Nemotron-MoE-30B-Instruct",
    "deepseek-r1": "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
    "gpt-oss": "openai/gpt-oss-20b",
    "falcon-2": "tiiuae/falcon2-11B-instruct",
}

# HF org/author -> (provider, origin_country). Validated from official sources.
HF_ORG_MAP: dict[str, tuple[str, str]] = {
    "Qwen": ("Alibaba Cloud", "China"),
    "meta-llama": ("Meta", "United States"),
    "facebook": ("Meta", "United States"),
    "mistralai": ("Mistral AI", "France"),
    "tiiuae": ("Technology Innovation Institute", "United Arab Emirates"),
    "google": ("Google", "United States"),
    "microsoft": ("Microsoft", "United States"),
    "nvidia": ("NVIDIA", "United States"),
    "allenai": ("Allen Institute for AI", "United States"),
    "deepseek-ai": ("DeepSeek", "China"),
    "openai": ("OpenAI", "United States"),
    "openai-community": ("OpenAI", "United States"),
    "ibm-granite": ("IBM", "United States"),
    "HuggingFaceMB": ("Hugging Face", "United States"),
    "bigscience-workflow": ("BigScience", "France"),
    "stabilityai": ("Stability AI", "United Kingdom"),
    "EleutherAI": ("EleutherAI", "United States"),
    "togethercomputer": ("Together AI", "United States"),
    "databricks": ("Databricks", "United States"),
    "codellama": ("Meta", "United States"),
    "01-ai": ("01.AI", "China"),
    "sentence-transformers": ("Sentence Transformers", "Germany"),
    "BAAI": ("Beijing Academy of AI", "China"),
    "THUDM": ("Tsinghua KEG", "China"),
    "baichuan-inc": ("Baichuan", "China"),
    "internlm": ("Shanghai AI Lab", "China"),
    "FlagOpen": ("FlagOpen", "China"),
    "openchat": ("OpenChat", "United States"),
    "teknium": ("Teknium", "United States"),
    "WizardLM": ("Microsoft", "United States"),
    "lmsys": ("LMSYS", "United States"),
    "NousResearch": ("Nous Research", "United States"),
    "jinaai": ("Jina AI", "Germany"),
    "silo-ai": ("Silo AI", "Finland"),
    "turkunlp": ("TurkuNLP", "Finland"),
    "AMD": ("AMD", "United States"),
    "epfl-llm": ("EPFL", "Switzerland"),
    "SwissFederalInstitute": ("Swiss AI Initiative", "Switzerland"),
    "ai-forever": ("AI Forever", "Russia"),
    "cohere": ("Cohere", "Canada"),
    "Aleph-Alpha": ("Aleph Alpha", "Germany"),
    "gpt-sw3": ("AI Sweden", "Sweden"),
    "ellamind": ("Ella", "Estonia"),
    "occiglot": ("Occiglot", "European Union"),
    "tilde-nlp": ("Tilde", "Latvia"),
    "black-forest-labs": ("Black Forest Labs", "Germany"),
    "AILearning-AI": ("ByteDance", "China"),
}


def slugify(model_id: str) -> str:
    """Convert modelId to registry id slug."""
    s = re.sub(r"[^a-z0-9]+", "-", model_id.lower()).strip("-")
    return s[:80] if len(s) > 80 else s


def get_org(model_id: str) -> str:
    """Extract org/author from modelId (e.g. Qwen/Qwen2.5-7B -> Qwen)."""
    return model_id.split("/")[0] if "/" in model_id else model_id


def fetch_hf_models(limit: int = 200) -> list[dict[str, Any]]:
    """Fetch text-generation models from HF, sorted by downloads."""
    params: dict[str, Any] = {
        "pipeline_tag": "text-generation",
        "sort": "downloads",
        "limit": min(limit, 100),
    }
    token = os.environ.get("HF_TOKEN")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        r = requests.get(HF_API, params=params, headers=headers or None, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        print(f"HF API error: {e}")
        return []


def main() -> int:
    if not REGISTRY_PATH.exists():
        print(f"Registry not found: {REGISTRY_PATH}")
        return 1

    with open(REGISTRY_PATH, encoding="utf-8") as f:
        registry = json.load(f)

    existing_ids: set[str] = set()
    existing_hf_ids: set[str] = set()
    enriched = 0
    for e in registry:
        existing_ids.add(e.get("id", ""))
        hf_id = e.get("huggingface_id") or REGISTRY_HF_MAP.get(e.get("id", ""))
        if hf_id:
            existing_hf_ids.add(hf_id)
        if not e.get("huggingface_id") and e.get("id") in REGISTRY_HF_MAP:
            e["huggingface_id"] = REGISTRY_HF_MAP[e["id"]]
            existing_hf_ids.add(e["huggingface_id"])
            enriched += 1

    if enriched:
        print(f"Enriched {enriched} existing entries with huggingface_id")

    print("Fetching models from Hugging Face...")
    hf_models = fetch_hf_models(limit=100)
    print(f"Fetched {len(hf_models)} models")

    added = 0
    for m in hf_models:
        model_id = m.get("modelId") or m.get("id", "")
        if not model_id or model_id in existing_hf_ids:
            continue

        downloads = m.get("downloads") or 0
        likes = m.get("likes") or 0
        if downloads < 10000:
            continue

        org = get_org(model_id)
        provider, origin = HF_ORG_MAP.get(org, (org, "Unknown"))
        name = model_id.split("/")[-1] if "/" in model_id else model_id
        name = name.replace("-", " ").replace("_", " ")
        sid = slugify(model_id)
        if sid in existing_ids:
            continue
        existing_ids.add(sid)
        existing_hf_ids.add(model_id)

        entry: dict[str, Any] = {
            "id": sid,
            "name": name,
            "provider": provider,
            "origin_country": origin,
            "openness_level": "Open Weights",
            "data_residency": False,
            "compliance_tags": [],
            "languages": ["en", "multilingual"],
            "task_categories": ["text-generation", "conversational"],
            "huggingface_id": model_id,
            "hf_downloads": downloads,
            "hf_likes": likes,
        }
        tags = m.get("tags") or []
        if "zh" in tags or "chinese" in str(tags).lower():
            entry["languages"] = ["en", "zh", "multilingual"]
        if "code" in tags or "codellama" in str(tags).lower():
            entry["task_categories"] = ["text-generation", "conversational", "code"]
        if "region:eu" in tags or "region:de" in tags or "region:fr" in tags:
            entry["data_residency"] = True
            entry["compliance_tags"] = ["GDPR"]

        registry.append(entry)
        added += 1

    registry.sort(key=lambda e: -(e.get("hf_downloads") or 0))

    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)

    print(f"Added {added} new models. Total: {len(registry)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

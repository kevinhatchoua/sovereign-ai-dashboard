#!/usr/bin/env python3
"""
Sync Hugging Face metrics (downloads, likes) into the Sovereign AI registry.

Usage:
  pip install -r scripts/requirements.txt
  python scripts/sync_hf_metrics.py

Models are matched by optional "huggingface_id" in registry.json, or by the
mapping below. Add huggingface_id to any model to enable syncing.

For gated models (401), set HF_TOKEN env var with a Hugging Face token that
has access. Public models work without a token.
"""

import json
import os
import sys
import time
from pathlib import Path
from typing import Optional

try:
    import requests
except ImportError:
    print("Install requests: pip install requests")
    sys.exit(1)

# Registry path (from project root)
SCRIPT_DIR = Path(__file__).resolve().parent
REGISTRY_PATH = SCRIPT_DIR.parent / "src" / "data" / "registry.json"
HF_API = "https://huggingface.co/api/models"

# Fallback mapping: registry id -> Hugging Face model id (when huggingface_id not in registry)
HF_MODEL_MAP = {
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


def get_hf_model_id(entry: dict) -> Optional[str]:
    """Resolve Hugging Face model ID for a registry entry."""
    if "huggingface_id" in entry:
        return entry["huggingface_id"]
    return HF_MODEL_MAP.get(entry.get("id"))


def fetch_hf_metrics(model_id: str) -> Optional[dict]:
    """Fetch downloads and likes from Hugging Face API."""
    url = f"{HF_API}/{model_id}"
    headers = {}
    token = os.environ.get("HF_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.get(url, headers=headers or None, timeout=10)
        r.raise_for_status()
        data = r.json()
        return {
            "downloads": data.get("downloads"),
            "likes": data.get("likes"),
        }
    except requests.RequestException as e:
        print(f"  ⚠ Failed to fetch {model_id}: {e}")
        return None


def main():
    if not REGISTRY_PATH.exists():
        print(f"Registry not found: {REGISTRY_PATH}")
        sys.exit(1)

    with open(REGISTRY_PATH, encoding="utf-8") as f:
        registry = json.load(f)

    updated = 0
    for i, entry in enumerate(registry):
        hf_id = get_hf_model_id(entry)
        if not hf_id:
            continue

        name = entry.get("name", entry.get("id", "?"))
        print(f"Fetching {name} ({hf_id})...")

        metrics = fetch_hf_metrics(hf_id)
        if metrics:
            entry["hf_downloads"] = metrics["downloads"]
            entry["hf_likes"] = metrics["likes"]
            updated += 1
            print(f"  ✓ downloads={metrics['downloads']}, likes={metrics['likes']}")

        time.sleep(0.5)  # Rate limit

    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Updated {updated} models in {REGISTRY_PATH}")


if __name__ == "__main__":
    main()

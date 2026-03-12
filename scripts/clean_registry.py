#!/usr/bin/env python3
"""
Remove mock/synthetic data from the registry.
Keeps only validated fields: hf_downloads, hf_likes, and metadata from model cards
(context_window, training_cutoff, vram_*, etc. when sourced from specs).

Removes:
- download_trend: synthetic time-series, not from any API
- popularity_index: derived at runtime from hf_downloads instead
- inference_speed: no authoritative source
"""

import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REGISTRY_PATH = SCRIPT_DIR.parent / "src" / "data" / "registry.json"

MOCK_KEYS = {"download_trend", "popularity_index", "inference_speed"}


def main():
    if not REGISTRY_PATH.exists():
        print(f"Registry not found: {REGISTRY_PATH}")
        return 1

    with open(REGISTRY_PATH, encoding="utf-8") as f:
        registry = json.load(f)

    removed = 0
    for entry in registry:
        for key in MOCK_KEYS:
            if key in entry:
                del entry[key]
                removed += 1

    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)

    print(f"Removed {removed} mock fields from {len(registry)} models")
    return 0


if __name__ == "__main__":
    exit(main())

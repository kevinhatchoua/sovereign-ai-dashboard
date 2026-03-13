import { NextResponse } from "next/server";
import Parser from "rss-parser";
import registryData from "@/data/registry.json";
import {
  normalizeRegistry,
  type ComparisonModel,
  type RawRegistryEntry,
} from "@/app/lib/registryNormalizer";

const parser = new Parser();

type NewsItem = { title: string; link: string; date: string };

/** RSS feeds for sovereign AI / open models news. Tried in order; results merged. */
const DEFAULT_FEEDS = [
  "https://huggingface.co/blog/feed.xml",
  "https://huggingface.co/blog/feed",
  "https://blog.mistral.ai/feed/",
  "https://ai.meta.com/blog/rss/",
  "https://developers.googleblog.com/feeds/posts/default",
];

/** Curated links when RSS fails—blogs and resources about models in our catalog. */
const CURATED_FALLBACK: NewsItem[] = [
  {
    title: "Hugging Face Blog — Models, datasets, and ML updates",
    link: "https://huggingface.co/blog",
    date: "Ongoing",
  },
  {
    title: "Mistral AI Blog — Open models and sovereign AI",
    link: "https://blog.mistral.ai",
    date: "Ongoing",
  },
  {
    title: "Meta AI Blog — Llama, open foundation models",
    link: "https://ai.meta.com/blog",
    date: "Ongoing",
  },
  {
    title: "Google AI Blog — Gemma, open models",
    link: "https://blog.google/technology/ai",
    date: "Ongoing",
  },
  {
    title: "DeepSeek — Open reasoning models",
    link: "https://www.deepseek.com/blog",
    date: "Ongoing",
  },
  {
    title: "Qwen (Alibaba) — Multilingual open models",
    link: "https://qwenlm.github.io/blog",
    date: "Ongoing",
  },
  {
    title: "Hugging Face Models — Browse open weights",
    link: "https://huggingface.co/models?pipeline_tag=text-generation",
    date: "Catalog",
  },
  {
    title: "Sovereign AI Methodology — How we assess models",
    link: "/methodology",
    date: "Reference",
  },
];

function parseFeedItems(feed: Awaited<ReturnType<Parser["parseURL"]>>): NewsItem[] {
  return (feed.items ?? []).map((item) => ({
    title: item.title ?? "Untitled",
    link: item.link ?? "#",
    date: item.pubDate
      ? new Date(item.pubDate).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
  }));
}

function getCatalogHighlights(): NewsItem[] {
  const models: ComparisonModel[] = normalizeRegistry(
    registryData as RawRegistryEntry[]
  );
  const withHf = models.filter(
    (m) => m.huggingface_id && (m.intelligence?.hf_downloads ?? 0) > 0
  );
  const sorted = [...withHf].sort(
    (a, b) => (b.intelligence?.hf_downloads ?? 0) - (a.intelligence?.hf_downloads ?? 0)
  );
  return sorted.slice(0, 6).map((m) => ({
    title: `${m.name} — ${m.provider}`,
    link: `https://huggingface.co/${m.huggingface_id}`,
    date: "In catalog",
  }));
}

export async function GET() {
  const customFeed = process.env.RSS_FEED_URL || process.env.NEXT_PUBLIC_RSS_FEED_URL;
  const feedsToTry = customFeed ? [customFeed] : DEFAULT_FEEDS;

  const results = await Promise.allSettled(
    feedsToTry.map((url) => parser.parseURL(url))
  );

  const allItems: NewsItem[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled" && result.value?.items?.length) {
      const items = parseFeedItems(result.value);
      for (const item of items) {
        const key = item.title.toLowerCase().trim();
        if (!seen.has(key) && item.link && item.link !== "#") {
          seen.add(key);
          allItems.push(item);
        }
      }
    }
  }

  if (allItems.length > 0) {
    const sorted = [...allItems].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return Number.isNaN(da) || Number.isNaN(db) ? 0 : db - da;
    });
    return NextResponse.json({
      items: sorted.slice(0, 12),
      source: "RSS feeds",
    });
  }

  const catalogHighlights = getCatalogHighlights();
  const fallback = [...CURATED_FALLBACK];
  for (const h of catalogHighlights) {
    if (!fallback.some((f) => f.link === h.link)) {
      fallback.push(h);
    }
  }

  return NextResponse.json({
    items: fallback.slice(0, 12),
    source: "Curated — blogs and top models in catalog",
  });
}

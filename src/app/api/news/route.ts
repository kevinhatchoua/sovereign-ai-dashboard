import { NextResponse } from "next/server";
import Parser from "rss-parser";
import registryData from "@/data/registry.json";
import {
  normalizeRegistry,
  type ComparisonModel,
  type RawRegistryEntry,
} from "@/app/lib/registryNormalizer";

const parser = new Parser();

export type NewsItem = {
  title: string;
  link: string;
  date: string;
  dateRaw: string;
  source: string;
  topic: string;
};

/** Revalidate every hour — news updates regularly */
export const revalidate = 3600;

const FEED_SOURCES: { url: string; source: string; topic: string }[] = [
  { url: "https://huggingface.co/blog/feed.xml", source: "Hugging Face", topic: "Models & ML" },
  { url: "https://huggingface.co/blog/feed", source: "Hugging Face", topic: "Models & ML" },
  { url: "https://blog.mistral.ai/feed/", source: "Mistral AI", topic: "Open Models" },
  { url: "https://ai.meta.com/blog/rss/", source: "Meta AI", topic: "Open Models" },
  { url: "https://developers.googleblog.com/feeds/posts/default", source: "Google", topic: "AI & Dev" },
];

/** Curated links when RSS fails—blogs and resources about models in our catalog. */
const CURATED_FALLBACK: Omit<NewsItem, "dateRaw">[] = [
  { title: "Hugging Face Blog — Models, datasets, and ML updates", link: "https://huggingface.co/blog", date: "Ongoing", source: "Hugging Face", topic: "Models & ML" },
  { title: "Mistral AI Blog — Open models and sovereign AI", link: "https://blog.mistral.ai", date: "Ongoing", source: "Mistral AI", topic: "Open Models" },
  { title: "Meta AI Blog — Llama, open foundation models", link: "https://ai.meta.com/blog", date: "Ongoing", source: "Meta AI", topic: "Open Models" },
  { title: "Google AI Blog — Gemma, open models", link: "https://blog.google/technology/ai", date: "Ongoing", source: "Google", topic: "AI & Dev" },
  { title: "DeepSeek — Open reasoning models", link: "https://www.deepseek.com/blog", date: "Ongoing", source: "DeepSeek", topic: "Open Models" },
  { title: "Qwen (Alibaba) — Multilingual open models", link: "https://qwenlm.github.io/blog", date: "Ongoing", source: "Qwen", topic: "Open Models" },
  { title: "Hugging Face Models — Browse open weights", link: "https://huggingface.co/models?pipeline_tag=text-generation", date: "Catalog", source: "Catalog", topic: "Catalog" },
  { title: "Sovereign AI Methodology — How we assess models", link: "/methodology", date: "Reference", source: "Reference", topic: "Reference" },
];

function parseFeedItems(
  feed: Awaited<ReturnType<Parser["parseURL"]>>,
  source: string,
  topic: string
): NewsItem[] {
  return (feed.items ?? []).map((item) => {
    const dateRaw = item.pubDate ?? "";
    const date = dateRaw
      ? new Date(dateRaw).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";
    return {
      title: item.title ?? "Untitled",
      link: item.link ?? "#",
      date,
      dateRaw,
      source,
      topic,
    };
  });
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
    dateRaw: new Date().toISOString(),
    source: "Catalog",
    topic: "Catalog",
  }));
}

export async function GET() {
  const customFeed = process.env.RSS_FEED_URL || process.env.NEXT_PUBLIC_RSS_FEED_URL;
  const feedsToTry = customFeed
    ? [{ url: customFeed, source: "Custom", topic: "News" }]
    : FEED_SOURCES;

  const results = await Promise.allSettled(
    feedsToTry.map((f) => parser.parseURL(f.url).then((feed) => ({ feed, ...f })))
  );

  const allItems: NewsItem[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled" && result.value?.feed?.items?.length) {
      const { feed, source, topic } = result.value;
      const items = parseFeedItems(feed, source, topic);
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
      const da = new Date(a.dateRaw).getTime();
      const db = new Date(b.dateRaw).getTime();
      return Number.isNaN(da) || Number.isNaN(db) ? 0 : db - da;
    });
    return NextResponse.json({
      items: sorted.slice(0, 24),
      source: "RSS feeds",
      topics: [...new Set(sorted.map((i) => i.topic))],
    });
  }

  const catalogHighlights = getCatalogHighlights();
  const fallback: NewsItem[] = CURATED_FALLBACK.map((f) => ({
    ...f,
    dateRaw: new Date().toISOString(),
  }));
  for (const h of catalogHighlights) {
    if (!fallback.some((f) => f.link === h.link)) {
      fallback.push(h);
    }
  }

  return NextResponse.json({
    items: fallback.slice(0, 24),
    source: "Curated — blogs and top models in catalog",
    topics: [...new Set(fallback.map((i) => i.topic))],
  });
}

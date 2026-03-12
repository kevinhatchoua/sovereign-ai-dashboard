import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

/** RSS feeds for sovereign AI / open models news. Override with RSS_FEED_URL env. */
const DEFAULT_FEEDS = [
  "https://huggingface.co/blog/feed",
  "https://blog.mistral.ai/feed/",
];

export async function GET() {
  try {
    const feedUrl =
      process.env.RSS_FEED_URL ||
      process.env.NEXT_PUBLIC_RSS_FEED_URL ||
      DEFAULT_FEEDS[0];

    const feed = await parser.parseURL(feedUrl);
    const items = (feed.items ?? []).slice(0, 15).map((item) => ({
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

    return NextResponse.json({ items, source: feed.title ?? feedUrl });
  } catch (err) {
    console.error("News API error:", err);
    return NextResponse.json(
      {
        items: [],
        error:
          err instanceof Error ? err.message : "Failed to fetch news feed",
      },
      { status: 200 }
    );
  }
}

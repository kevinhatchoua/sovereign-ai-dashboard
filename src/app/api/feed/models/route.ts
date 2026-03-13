import { NextResponse } from "next/server";
import { getModels } from "@/app/lib/registryLoader";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sovereign-ai-dashboard.vercel.app";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** GET /api/feed/models — RSS feed of top models by downloads (for discovery/subscriptions) */
export async function GET() {
  const models = getModels();
  const sorted = [...models]
    .filter((m) => (m.intelligence?.hf_downloads ?? 0) > 0)
    .sort((a, b) => (b.intelligence?.hf_downloads ?? 0) - (a.intelligence?.hf_downloads ?? 0))
    .slice(0, 50);

  const now = new Date().toUTCString();
  const items = sorted.map(
    (m) =>
      `  <item>
    <title>${escapeXml(m.name)} — ${escapeXml(m.provider)}</title>
    <link>${SITE_URL}/?q=${encodeURIComponent(m.id)}</link>
    <description>${escapeXml(m.openness_level)} model from ${escapeXml(m.provider)}. ${m.intelligence?.hf_downloads ? `${m.intelligence.hf_downloads.toLocaleString()} HF downloads.` : ""}</description>
    <pubDate>${now}</pubDate>
    <guid isPermaLink="true">${SITE_URL}/api/models/${encodeURIComponent(m.id)}</guid>
  </item>`
  );

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Sovereign AI Model Catalog</title>
    <link>${SITE_URL}</link>
    <description>Top AI models for sovereign deployment — open weights, compliance, data residency</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/api/feed/models" rel="self" type="application/rss+xml"/>
${items.join("\n")}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

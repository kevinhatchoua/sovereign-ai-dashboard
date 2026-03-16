import { NextResponse } from "next/server";
import showcaseFallback from "@/data/communityShowcase.json";

/** Revalidate every 24 hours — banner auto-updates daily */
export const revalidate = 86400;

type HFSpace = {
  id: string;
  author: string;
  cardData?: {
    title?: string;
    short_description?: string;
  };
  likes?: number;
  trendingScore?: number;
  tags?: string[];
  sdk?: string;
};

type ShowcaseEntry = {
  id: string;
  title: string;
  href: string;
  description: string;
  type: "app" | "game";
  modelName: string;
};

function formatTitle(id: string, cardTitle?: string): string {
  if (cardTitle?.trim()) return cardTitle.trim();
  const slug = id.split("/").pop() ?? id;
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function inferType(space: HFSpace): "app" | "game" {
  const tags = space.tags?.join(" ").toLowerCase() ?? "";
  const desc = (space.cardData?.short_description ?? "").toLowerCase();
  const title = formatTitle(space.id, space.cardData?.title).toLowerCase();
  if (
    /game|rpg|npc|quest|pixel|comic|story|adventure/.test(tags + desc + title)
  ) {
    return "game";
  }
  return "app";
}

export async function GET() {
  try {
    const res = await fetch(
      "https://huggingface.co/api/spaces?limit=12&full=1&sort=trendingScore",
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) {
      throw new Error(`HF API error: ${res.status}`);
    }

    const spaces: HFSpace[] = await res.json();

    const entries: ShowcaseEntry[] = spaces.map((space) => ({
      id: space.id.replace(/\//g, "-"),
      title: formatTitle(space.id, space.cardData?.title),
      href: `https://huggingface.co/spaces/${space.id}`,
      description:
        space.cardData?.short_description?.trim() ||
        `Community app on Hugging Face`,
      type: inferType(space),
      modelName: "Hugging Face",
    }));

    return NextResponse.json(entries);
  } catch (err) {
    console.error("Community showcase API error:", err);
    const fallback = (
      showcaseFallback as { id: string; title: string; href: string; description: string; type: string }[]
    ).map((e) => ({
      id: e.id,
      title: e.title,
      href: e.href,
      description: e.description,
      type: e.type === "game" ? "game" as const : "app" as const,
      modelName: "Community",
    }));
    return NextResponse.json(fallback);
  }
}

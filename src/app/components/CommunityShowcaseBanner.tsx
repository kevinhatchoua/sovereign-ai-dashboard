"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { Gamepad2, Smartphone, ChevronRight, Newspaper } from "lucide-react";
import showcaseFallback from "@/data/communityShowcase.json";
import referencedModelsData from "@/data/referencedModels.json";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";

type ShowcaseEntry = {
  id: string;
  title: string;
  href: string;
  description: string;
  type: "app" | "game" | "news";
  modelName?: string;
  modelId?: string;
  externalModelId?: string;
};

const SCROLL_SPEED = 0.5;
const PAUSE_RESUME_DELAY_MS = 1500;

export function CommunityShowcaseBanner({
  models,
}: {
  models: ComparisonModel[];
}) {
  const [entries, setEntries] = useState<ShowcaseEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pauseUntilRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const modelMap = useMemo(
    () => new Map(models.map((m) => [m.id, m.name])),
    [models]
  );
  const refModelMap = useMemo(
    () =>
      new Map(
        (referencedModelsData as { id: string; name: string }[]).map((m) => [
          m.id,
          m.name,
        ])
      ),
    []
  );

  useEffect(() => {
    const fallbackEntries = (() => {
      const fallback = showcaseFallback as {
        id: string;
        title: string;
        href: string;
        description: string;
        type: string;
        modelId?: string | null;
        externalModelId?: string | null;
      }[];
      return fallback.map((e) => ({
        id: e.id,
        title: e.title,
        href: e.href,
        description: e.description,
        type: (e.type === "game" ? "game" : "app") as "app" | "game",
        modelName: e.modelId
          ? modelMap.get(e.modelId) ?? "Catalog"
          : e.externalModelId
            ? refModelMap.get(e.externalModelId) ?? "External"
            : "Community",
      }));
    })();

    Promise.all([
      fetch("/api/news").then((r) => r.json()).catch(() => ({ items: [] })),
      fetch("/api/community-showcase").then((r) => r.json()).catch(() => []),
    ]).then(([newsData, communityData]) => {
      const newsItems = Array.isArray(newsData?.items) ? newsData.items : [];
      const communityItems = Array.isArray(communityData) ? communityData : [];
      const newsEntries: ShowcaseEntry[] = newsItems.slice(0, 8).map((item: { title: string; link: string; source: string; date?: string }) => ({
        id: `news-${item.title.slice(0, 30).replace(/\s+/g, "-")}`,
        title: item.title,
        href: item.link,
        description: item.date ?? item.source,
        type: "news",
        modelName: item.source,
      }));
      const merged = [...newsEntries, ...communityItems] as ShowcaseEntry[];
      setEntries(merged.length > 0 ? merged : fallbackEntries);
    }).catch(() => setEntries(fallbackEntries))
      .finally(() => setLoading(false));
  }, [modelMap, refModelMap]);

  const getModelName = (entry: ShowcaseEntry): string => {
    if (entry.modelName) return entry.modelName;
    if (entry.modelId) return modelMap.get(entry.modelId) ?? entry.modelId;
    if (entry.externalModelId)
      return refModelMap.get(entry.externalModelId) ?? entry.externalModelId;
    return "Community";
  };

  const pauseAutoScroll = useCallback(() => {
    pauseUntilRef.current = Date.now() + PAUSE_RESUME_DELAY_MS;
  }, []);

  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || loading || !entries?.length) return;

    const el = scrollRef.current;
    if (!el) return;

    let lastTime = performance.now();

    const tick = (now: number) => {
      const halfWidth = el.scrollWidth / 2;
      if (halfWidth <= 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = now - lastTime;
      lastTime = now;

      if (now < pauseUntilRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      el.scrollLeft += SCROLL_SPEED * dt;
      if (el.scrollLeft >= halfWidth) {
        el.scrollLeft -= halfWidth;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loading, entries?.length]);

  const displayEntries = entries ?? [];

  if (displayEntries.length === 0 && !loading) return null;

  return (
    <div className="border-b border-slate-800/40 [.light_&]:border-slate-200/50">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500 [.light_&]:text-slate-600">
            News &amp; community
          </span>
          <span className="shrink-0 text-slate-600 [.light_&]:text-slate-400">
            ·
          </span>
          <div
            ref={scrollRef}
            className="banner-scroll-track flex flex-1 gap-3 overflow-x-auto overflow-y-hidden py-1"
            onWheel={pauseAutoScroll}
            onTouchStart={pauseAutoScroll}
            onScroll={pauseAutoScroll}
            role="region"
            aria-label="News and community — scrolls left automatically; scroll to browse"
          >
            {loading ? (
              <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/30 px-3 py-2 [.light_&]:border-slate-200/60 [.light_&]:bg-slate-100/80">
                <span className="text-sm text-slate-500 [.light_&]:text-slate-600">
                  Loading…
                </span>
              </div>
            ) : (
              <>
                {[...displayEntries, ...displayEntries].map((entry, i) => {
                  const isInternal = entry.href.startsWith("/");
                  const className = "group flex shrink-0 items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/30 px-3 py-2 transition hover:border-slate-600/70 hover:bg-slate-800/50 [.light_&]:border-slate-200/60 [.light_&]:bg-slate-100/80 [.light_&]:hover:border-slate-300 [.light_&]:hover:bg-slate-100";
                  const content = (
                    <>
                      {entry.type === "news" ? (
                        <Newspaper className="h-3.5 w-3.5 shrink-0 text-slate-500 [.light_&]:text-slate-600" aria-hidden />
                      ) : entry.type === "game" ? (
                        <Gamepad2 className="h-3.5 w-3.5 shrink-0 text-slate-500 [.light_&]:text-slate-600" aria-hidden />
                      ) : (
                        <Smartphone className="h-3.5 w-3.5 shrink-0 text-slate-500 [.light_&]:text-slate-600" aria-hidden />
                      )}
                      <span className="text-sm font-medium text-slate-200 [.light_&]:text-slate-800">
                        {entry.title}
                      </span>
                      <span className="text-xs text-slate-500 [.light_&]:text-slate-600">
                        {getModelName(entry)}
                      </span>
                      <ChevronRight className="h-3 w-3 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 [.light_&]:text-slate-600" aria-hidden />
                    </>
                  );
                  return isInternal ? (
                    <Link key={`${entry.id}-${i}`} href={entry.href} className={className} onClick={pauseAutoScroll}>
                      {content}
                    </Link>
                  ) : (
                    <a key={`${entry.id}-${i}`} href={entry.href} target="_blank" rel="noopener noreferrer" className={className} onClick={pauseAutoScroll}>
                      {content}
                    </a>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

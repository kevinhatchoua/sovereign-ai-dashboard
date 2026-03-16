"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Gamepad2, Smartphone, ChevronRight } from "lucide-react";
import showcaseFallback from "@/data/communityShowcase.json";
import referencedModelsData from "@/data/referencedModels.json";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";

type ShowcaseEntry = {
  id: string;
  title: string;
  href: string;
  description: string;
  type: "app" | "game";
  modelName?: string;
  modelId?: string;
  externalModelId?: string;
};

export function CommunityShowcaseBanner({
  models,
}: {
  models: ComparisonModel[];
}) {
  const [entries, setEntries] = useState<ShowcaseEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

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
    fetch("/api/community-showcase")
      .then((res) => res.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        const fallback = showcaseFallback as {
          id: string;
          title: string;
          href: string;
          description: string;
          type: string;
          modelId?: string | null;
          externalModelId?: string | null;
        }[];
        setEntries(
          fallback.map((e) => ({
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
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [modelMap, refModelMap]);

  const getModelName = (entry: ShowcaseEntry): string => {
    if (entry.modelName) return entry.modelName;
    if (entry.modelId) return modelMap.get(entry.modelId) ?? entry.modelId;
    if (entry.externalModelId)
      return refModelMap.get(entry.externalModelId) ?? entry.externalModelId;
    return "Community";
  };

  const displayEntries = entries ?? [];

  if (displayEntries.length === 0 && !loading) return null;

  return (
    <div className="border-b border-slate-800/40 [.light_&]:border-slate-200/50">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500 [.light_&]:text-slate-600">
            From the community
          </span>
          <span className="shrink-0 text-slate-600 [.light_&]:text-slate-400">
            ·
          </span>
          <div className="flex gap-3">
            {loading ? (
              <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/30 px-3 py-2 [.light_&]:border-slate-200/60 [.light_&]:bg-slate-100/80">
                <span className="text-sm text-slate-500 [.light_&]:text-slate-600">
                  Loading…
                </span>
              </div>
            ) : (
              displayEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={entry.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex shrink-0 items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/30 px-3 py-2 transition hover:border-slate-600/70 hover:bg-slate-800/50 [.light_&]:border-slate-200/60 [.light_&]:bg-slate-100/80 [.light_&]:hover:border-slate-300 [.light_&]:hover:bg-slate-100"
                >
                  {entry.type === "game" ? (
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
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

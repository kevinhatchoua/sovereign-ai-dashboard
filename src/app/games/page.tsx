"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { Gamepad2, ExternalLink, Filter, Server } from "lucide-react";
import gamesData from "@/data/games.json";

type Game = {
  id: string;
  name: string;
  description: string;
  url: string;
  source: string;
  category: string;
  models: string[];
  license: string;
  language: string;
};

const games: Game[] = gamesData as Game[];

/** Ensure URL is secure (https only) before rendering */
function isSecureUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function GamesPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");

  const categories = useMemo(
    () => [...new Set(games.map((g) => g.category))].sort(),
    []
  );
  const sources = useMemo(
    () => [...new Set(games.map((g) => g.source))].sort(),
    []
  );
  const models = useMemo(
    () =>
      [...new Set(games.flatMap((g) => g.models))].sort(),
    []
  );

  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      if (sourceFilter !== "all" && g.source !== sourceFilter) return false;
      if (modelFilter !== "all" && !g.models.includes(modelFilter)) return false;
      return isSecureUrl(g.url);
    });
  }, [categoryFilter, sourceFilter, modelFilter]);

  return (
    <div className="min-h-screen text-slate-200 [.light_&]:text-slate-900">
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"
        tabIndex={-1}
        role="main"
        aria-label="Open source games built with AI models"
      >
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl [.dark_&]:text-white">
              Games & Game AI
            </h1>
            <p className="mt-1 text-slate-600 [.dark_&]:text-slate-400">
              Open source games built with models from our catalog. NPC dialogue, procedural content, and interactive experiences.
            </p>
            <Link
              href="/?task=games"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 [.dark_&]:text-blue-400 [.dark_&]:hover:text-blue-300"
            >
              <Server className="h-4 w-4" aria-hidden />
              View game-capable models in catalog
            </Link>
          </div>
          <div className="shrink-0">
            <Gamepad2 className="h-16 w-16 text-slate-400/60 [.light_&]:text-slate-500/60" aria-hidden />
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card mb-8 rounded-xl border-slate-200/60 p-4 [.dark_&]:border-slate-700/50">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500 [.dark_&]:text-slate-400">
            <Filter className="h-4 w-4" aria-hidden />
            Filter
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 [.dark_&]:border-slate-600 [.dark_&]:bg-slate-800 [.dark_&]:text-slate-200"
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 [.dark_&]:border-slate-600 [.dark_&]:bg-slate-800 [.dark_&]:text-slate-200"
              aria-label="Filter by source"
            >
              <option value="all">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 [.dark_&]:border-slate-600 [.dark_&]:bg-slate-800 [.dark_&]:text-slate-200"
              aria-label="Filter by model"
            >
              <option value="all">All models</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Game cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((game) => (
            <article
              key={game.id}
              className="glass-card flex flex-col rounded-xl border-slate-200/60 p-4 transition hover:shadow-lg [.dark_&]:border-slate-700/50 [.dark_&]:hover:border-slate-600/70"
            >
              <h2 className="text-lg font-semibold text-slate-900 [.dark_&]:text-white">
                {game.name}
              </h2>
              <p className="mt-1 flex-1 text-sm text-slate-600 [.dark_&]:text-slate-400">
                {game.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 [.dark_&]:bg-slate-700/60 [.dark_&]:text-slate-400">
                  {game.category}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 [.dark_&]:bg-slate-700/60 [.dark_&]:text-slate-400">
                  {game.source}
                </span>
                {game.models.slice(0, 2).map((m) => (
                  <span
                    key={m}
                    className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 [.dark_&]:bg-blue-900/30 [.dark_&]:text-blue-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <a
                href={game.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 [.dark_&]:text-blue-400 [.dark_&]:hover:text-blue-300"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Open
              </a>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center [.dark_&]:border-slate-700 [.dark_&]:bg-slate-800/30">
            <p className="text-slate-600 [.dark_&]:text-slate-400">
              No games match your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("all");
                setSourceFilter("all");
                setModelFilter("all");
              }}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline [.dark_&]:text-blue-400"
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white no-underline hover:bg-blue-700 [.light_&]:bg-blue-600 [.light_&]:hover:bg-blue-700"
          >
            Browse models
          </Link>
          <Link
            href="/learn#games"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50 [.dark_&]:border-slate-600 [.dark_&]:bg-slate-800 [.dark_&]:text-slate-200 [.dark_&]:hover:bg-slate-700"
          >
            Learn about Games & AI
          </Link>
        </div>
      </main>
    </div>
  );
}

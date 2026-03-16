"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { CatalogIllustration } from "@/app/components/CatalogIllustration";
import {
  BarChart3,
  Server,
  Cloud,
  Award,
  TrendingUp,
  ArrowRight,
  Database,
  Globe,
  ShieldCheck,
  RefreshCw,
  Filter,
  Gamepad2,
} from "lucide-react";
import registryData from "@/data/registry.json";
import {
  normalizeRegistry,
  type ComparisonModel,
  type RawRegistryEntry,
  getIntelligenceScore,
} from "@/app/lib/registryNormalizer";
import { computeEthicsScore } from "@/app/lib/ethicsScore";
import { getSovereigntyReadiness, hasCloudActExposure } from "@/app/lib/sovereigntyScore";

const models: ComparisonModel[] = normalizeRegistry(registryData as RawRegistryEntry[]);

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  href?: string;
}) {
  const content = (
    <div className="glass-card rounded-xl border-slate-200/60 p-4 transition hover:shadow-lg [.dark_&]:border-slate-700/50 [.dark_&]:hover:border-slate-600/70">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 [.dark_&]:text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 [.dark_&]:text-white">
            {value}
          </p>
          {subtext && (
            <p className="mt-0.5 text-xs text-slate-500 [.dark_&]:text-slate-400">
              {subtext}
            </p>
          )}
        </div>
        <Icon className="h-8 w-8 text-blue-600/80 [.dark_&]:text-blue-400" />
      </div>
      {href && (
        <Link
          href={href}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 [.dark_&]:text-blue-400"
        >
          View
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function BarChart({
  data,
  max,
  color = "bg-blue-600",
}: {
  data: { label: string; value: number }[];
  max?: number;
  color?: string;
}) {
  const m = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-xs text-slate-600 [.dark_&]:text-slate-400">
            {d.label}
          </span>
          <div className="min-w-0 flex-1">
            <div
              className={`h-6 rounded ${color}`}
              style={{ width: `${Math.max(4, (d.value / m) * 100)}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-xs font-medium text-slate-700 [.dark_&]:text-slate-300">
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const openWeights = models.filter((m) => m.openness_level === "Open Weights");
  const apiOnly = models.filter((m) => m.openness_level === "API");
  const cloudActExposed = models.filter(hasCloudActExposure);
  const advancedSovereignty = models.filter((m) => getSovereigntyReadiness(m).level === "Advanced");
  const gamesModels = models.filter((m) => m.task_categories.includes("games"));
  const avgEthics =
    models.length > 0
      ? Math.round(
          models.reduce((acc, m) => acc + computeEthicsScore(m), 0) / models.length
        )
      : 0;

  const byProvider = models.reduce<Record<string, number>>((acc, m) => {
    acc[m.provider] = (acc[m.provider] ?? 0) + 1;
    return acc;
  }, {});
  const topProviders = Object.entries(byProvider)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  const byOrigin = models.reduce<Record<string, number>>((acc, m) => {
    acc[m.origin_country] = (acc[m.origin_country] ?? 0) + 1;
    return acc;
  }, {});
  const topOrigins = Object.entries(byOrigin)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  const byReadiness = models.reduce<Record<string, number>>((acc, m) => {
    const level = getSovereigntyReadiness(m).label;
    acc[level] = (acc[level] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen text-slate-200 [.light_&]:text-slate-900">
      <SiteHeader />

      <main id="main-content" className="mx-auto max-w-7xl animate-fade-in px-4 py-8 sm:px-6 lg:px-8" tabIndex={-1}>
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl [.dark_&]:text-white">
              Catalog Overview
            </h1>
            <p className="mt-1 text-slate-600 [.dark_&]:text-slate-400">
              Quick glance at sovereign AI models. Data refreshes with catalog updates.
            </p>
            <Link
              href="/learn"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 [.dark_&]:text-blue-400 [.dark_&]:hover:text-blue-300"
            >
              Learn about sovereignty, ethics score, and more
            </Link>
          </div>
          <div className="hidden shrink-0 sm:block">
            <CatalogIllustration className="h-16 w-28 text-slate-500/70 [.light_&]:text-slate-400/80" />
          </div>
        </div>

        {/* Key metrics */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Database}
            label="Total Models"
            value={models.length}
            subtext="In catalog"
            href="/"
          />
          <StatCard
            icon={Server}
            label="Open Weights"
            value={openWeights.length}
            subtext={`${Math.round((openWeights.length / models.length) * 100)}% self-hostable`}
            href="/"
          />
          <StatCard
            icon={Award}
            label="Advanced Sovereignty"
            value={advancedSovereignty.length}
            subtext="Readiness score ≥75"
            href="/"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Ethics Score"
            value={`${avgEthics}/100`}
            subtext="Across all models"
          />
          <StatCard
            icon={Gamepad2}
            label="AI Games"
            value={gamesModels.length}
            subtext="NPC dialogue, procedural content"
            href="/games"
          />
        </div>

        {/* Secondary metrics */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          <div className="glass-card rounded-xl border-slate-200/60 p-5 [.dark_&]:border-slate-700/50">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 [.dark_&]:text-slate-400">
              <Cloud className="h-4 w-4" aria-hidden />
              Openness Split
            </h2>
            <div className="flex gap-4">
              <div className="flex-1 rounded-lg bg-blue-600/15 p-4">
                <p className="text-2xl font-bold text-blue-700 [.dark_&]:text-blue-400">
                  {openWeights.length}
                </p>
                <p className="text-xs text-blue-600 [.dark_&]:text-blue-600">
                  Open Weights
                </p>
              </div>
              <div className="flex-1 rounded-lg bg-slate-500/15 p-4">
                <p className="text-2xl font-bold text-slate-700 [.dark_&]:text-slate-400">
                  {apiOnly.length}
                </p>
                <p className="text-xs text-slate-600 [.dark_&]:text-slate-500">
                  API-only
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl border-slate-200/60 p-5 [.dark_&]:border-slate-700/50">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 [.dark_&]:text-slate-400">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Risk Indicators
            </h2>
            <p className="text-sm text-slate-600 [.dark_&]:text-slate-400">
              <strong>{cloudActExposed.length}</strong> models from US-based providers
              (potential Cloud Act exposure).{" "}
              <strong>{models.length - cloudActExposed.length}</strong> with lower
              jurisdictional risk.
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="mb-10 grid gap-8 lg:grid-cols-2">
          <div className="glass-card rounded-xl border-slate-200/60 p-5 [.dark_&]:border-slate-700/50">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 [.dark_&]:text-slate-400">
              <BarChart3 className="h-4 w-4" aria-hidden />
              Models by Provider
            </h2>
            <BarChart data={topProviders} />
          </div>
          <div className="glass-card rounded-xl border-slate-200/60 p-5 [.dark_&]:border-slate-700/50">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 [.dark_&]:text-slate-400">
              <Globe className="h-4 w-4" aria-hidden />
              Models by Origin
            </h2>
            <BarChart data={topOrigins} />
          </div>
        </div>

        {/* Sovereignty distribution */}
        <div className="glass-card mb-10 rounded-xl border-slate-200/60 p-5 [.dark_&]:border-slate-700/50">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 [.dark_&]:text-slate-400">
            <Award className="h-4 w-4" aria-hidden />
            Sovereignty Readiness Distribution
          </h2>
          <div className="flex flex-wrap gap-4">
            {["Advanced", "Intermediate", "Foundation"].map((level) => (
              <div
                key={level}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 [.dark_&]:border-slate-600"
              >
                <span className="font-medium text-slate-900 [.dark_&]:text-white">
                  {byReadiness[level] ?? 0}
                </span>
                <span className="text-sm text-slate-500 [.dark_&]:text-slate-400">
                  {level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* News & Updates - will be a client component that fetches */}
        <div className="glass-card rounded-xl border-slate-200/60 p-5 [.dark_&]:border-slate-700/50">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 [.dark_&]:text-slate-400">
            <TrendingUp className="h-4 w-4" aria-hidden />
            News & Updates
          </h2>
          <NewsFeed />
        </div>
      </main>
    </div>
  );
}

type NewsItem = {
  title: string;
  link: string;
  date: string;
  dateRaw: string;
  source: string;
  topic: string;
};

const DATE_FILTERS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "all", label: "All" },
] as const;

function NewsFeed() {
  return (
    <div className="min-h-[200px]">
      <NewsFeedClient />
    </div>
  );
}

function NewsFeedClient() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchNews = () => {
    setLoading(true);
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setItems(data.items);
          setTopics(data.topics ?? [...new Set(data.items.map((i: NewsItem) => i.topic))]);
        } else {
          setError(data.error ?? "Failed to load");
        }
      })
      .catch(() => setError("Failed to fetch news"))
      .finally(() => {
        setLoading(false);
        setLastRefresh(new Date());
      });
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = items.filter((item) => {
    if (dateFilter !== "all") {
      const days = parseInt(dateFilter, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const itemDate = new Date(item.dateRaw);
      if (itemDate.getTime() < cutoff.getTime()) return false;
    }
    if (topicFilter !== "all" && item.topic !== topicFilter) return false;
    if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
    return true;
  });

  const sources = [...new Set(items.map((i) => i.source))].sort();

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden />
        <span className="sr-only">Loading news</span>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 [.dark_&]:border-blue-800 [.dark_&]:bg-blue-900/20 [.dark_&]:text-blue-200">
        <p>{error}</p>
        <p className="mt-2 text-xs">
          Configure RSS_FEED_URL in .env to add custom feeds. Default: Hugging Face blog.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and refresh */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-slate-500 [.dark_&]:text-slate-400">
          <Filter className="h-4 w-4" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wider">Filter</span>
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 [.dark_&]:border-slate-600 [.dark_&]:bg-slate-800 [.dark_&]:text-slate-200"
          aria-label="Filter by date"
        >
          {DATE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 [.dark_&]:border-slate-600 [.dark_&]:bg-slate-800 [.dark_&]:text-slate-200"
          aria-label="Filter by topic"
        >
          <option value="all">All topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 [.dark_&]:border-slate-600 [.dark_&]:bg-slate-800 [.dark_&]:text-slate-200"
          aria-label="Filter by source"
        >
          <option value="all">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={fetchNews}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 [.dark_&]:border-slate-600 [.dark_&]:bg-slate-800 [.dark_&]:text-slate-200 [.dark_&]:hover:bg-slate-700"
          aria-label="Refresh news"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>
      {lastRefresh && (
        <p className="text-xs text-slate-500 [.dark_&]:text-slate-400">
          Last updated: {lastRefresh.toLocaleTimeString()}. Auto-refreshes every 30 min.
        </p>
      )}

      {/* Scrollable list */}
      <div
        className="max-h-[400px] overflow-y-auto space-y-3 pr-2"
        role="feed"
        aria-label="News and updates"
      >
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 [.dark_&]:text-slate-400">
            No items match your filters.
          </p>
        ) : (
          filtered.map((item, i) => {
            const isInternal = item.link.startsWith("/");
            const className =
              "block rounded-lg border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50 [.dark_&]:border-slate-700 [.dark_&]:hover:bg-slate-800/50";
            const content = (
              <>
                <p className="text-sm font-medium text-slate-900 [.dark_&]:text-white">
                  {item.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 [.dark_&]:text-slate-400">
                  <span>{item.date}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 [.dark_&]:bg-slate-700">
                    {item.topic}
                  </span>
                  <span>{item.source}</span>
                </div>
              </>
            );
            if (isInternal) {
              return (
                <Link key={`${item.link}-${i}`} href={item.link} className={className}>
                  {content}
                </Link>
              );
            }
            return (
              <a
                key={`${item.link}-${i}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {content}
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}


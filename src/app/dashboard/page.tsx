"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  BarChart3,
  Server,
  Cloud,
  Award,
  TrendingUp,
  ArrowRight,
  Database,
  Globe,
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow [.dark_&]:border-slate-700 [.dark_&]:bg-slate-800/50 [.dark_&]:hover:border-slate-600">
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
        <Icon className="h-8 w-8 text-amber-500/80 [.dark_&]:text-amber-400" />
      </div>
      {href && (
        <Link
          href={href}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 [.dark_&]:text-amber-400"
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
  color = "bg-amber-500",
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
    <div className="min-h-screen bg-slate-50 text-slate-900 [.dark_&]:bg-zinc-950 [.dark_&]:text-slate-200">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur [.dark_&]:border-slate-800 [.dark_&]:bg-zinc-950/95">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold text-slate-900 [.dark_&]:text-white"
          >
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            Sovereign AI
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 [.dark_&]:text-slate-400 [.dark_&]:hover:bg-slate-800"
            >
              Models
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-700 [.dark_&]:bg-amber-400"
            >
              Dashboard
            </Link>
            <Link
              href="/methodology"
              className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 [.dark_&]:text-slate-400 [.dark_&]:hover:bg-slate-800"
            >
              Methodology
            </Link>
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 [.dark_&]:text-slate-400 [.dark_&]:hover:bg-slate-800"
            >
              Admin
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl [.dark_&]:text-white">
            Catalog Overview
          </h1>
          <p className="mt-1 text-slate-600 [.dark_&]:text-slate-400">
            Quick glance at sovereign AI models. Data refreshes with catalog updates.
          </p>
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
        </div>

        {/* Secondary metrics */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm [.dark_&]:border-slate-700 [.dark_&]:bg-slate-800/50">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 [.dark_&]:text-slate-400">
              <Cloud className="h-4 w-4" />
              Openness Split
            </h2>
            <div className="flex gap-4">
              <div className="flex-1 rounded-lg bg-emerald-500/15 p-4">
                <p className="text-2xl font-bold text-emerald-700 [.dark_&]:text-emerald-400">
                  {openWeights.length}
                </p>
                <p className="text-xs text-emerald-600 [.dark_&]:text-emerald-500">
                  Open Weights
                </p>
              </div>
              <div className="flex-1 rounded-lg bg-amber-500/15 p-4">
                <p className="text-2xl font-bold text-amber-700 [.dark_&]:text-amber-400">
                  {apiOnly.length}
                </p>
                <p className="text-xs text-amber-600 [.dark_&]:text-amber-500">
                  API-only
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm [.dark_&]:border-slate-700 [.dark_&]:bg-slate-800/50">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 [.dark_&]:text-slate-400">
              <ShieldCheck className="h-4 w-4" />
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
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm [.dark_&]:border-slate-700 [.dark_&]:bg-slate-800/50">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 [.dark_&]:text-slate-400">
              <BarChart3 className="h-4 w-4" />
              Models by Provider
            </h2>
            <BarChart data={topProviders} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm [.dark_&]:border-slate-700 [.dark_&]:bg-slate-800/50">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 [.dark_&]:text-slate-400">
              <Globe className="h-4 w-4" />
              Models by Origin
            </h2>
            <BarChart data={topOrigins} />
          </div>
        </div>

        {/* Sovereignty distribution */}
        <div className="mb-10 rounded-xl border border-slate-200 bg-white p-5 shadow-sm [.dark_&]:border-slate-700 [.dark_&]:bg-slate-800/50">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 [.dark_&]:text-slate-400">
            <Award className="h-4 w-4" />
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
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm [.dark_&]:border-slate-700 [.dark_&]:bg-slate-800/50">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 [.dark_&]:text-slate-400">
            <TrendingUp className="h-4 w-4" />
            News & Updates
          </h2>
          <NewsFeed />
        </div>
      </main>
    </div>
  );
}

function NewsFeed() {
  return (
    <div className="min-h-[200px]">
      <NewsFeedClient />
    </div>
  );
}

function NewsFeedClient() {
  const [items, setItems] = useState<{ title: string; link: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setItems(data.items);
        else setError(data.error ?? "Failed to load");
      })
      .catch(() => setError("Failed to fetch news"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 [.dark_&]:border-amber-800 [.dark_&]:bg-amber-900/20 [.dark_&]:text-amber-200">
        <p>{error}</p>
        <p className="mt-2 text-xs">
          Configure RSS_FEED_URL in .env to add custom feeds. Default: Hugging Face blog.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 [.dark_&]:text-slate-400">
        No news items available.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 8).map((item, i) => (
        <a
          key={i}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50 [.dark_&]:border-slate-700 [.dark_&]:hover:bg-slate-800/50"
        >
          <p className="text-sm font-medium text-slate-900 [.dark_&]:text-white">
            {item.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 [.dark_&]:text-slate-400">
            {item.date}
          </p>
        </a>
      ))}
    </div>
  );
}


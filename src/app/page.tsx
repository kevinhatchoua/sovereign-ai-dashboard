"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Server,
  Cloud,
  Shield,
  MapPin,
  ChevronDown,
  Filter,
} from "lucide-react";
import registryData from "@/data/registry.json";

type OpennessLevel = "Open Weights" | "API";

type Model = {
  id: string;
  name: string;
  provider: string;
  origin_country: string;
  openness_level: OpennessLevel;
  data_residency: boolean;
  compliance_tags: string[];
};

const models: Model[] = registryData as Model[];

const regions = ["EU", "US", "India"] as const;
const opennessOptions: OpennessLevel[] = ["Open Weights", "API"];

function getRegionFromTags(tags: string[], originCountry: string): (typeof regions)[number][] {
  const out: (typeof regions)[number][] = [];
  if (tags.some((t) => t.includes("EU") || t.includes("GDPR"))) out.push("EU");
  if (originCountry === "United States" || tags.some((t) => t.includes("US"))) out.push("US");
  if (tags.some((t) => t.includes("India"))) out.push("India");
  return out;
}

function ModelCard({ model }: { model: Model }) {
  const isLocalHostable = model.openness_level === "Open Weights";
  const regionList = getRegionFromTags(model.compliance_tags, model.origin_country);

  return (
    <article className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 shadow-lg transition hover:border-slate-600 hover:bg-slate-800/70">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-100">{model.name}</h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isLocalHostable
              ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
              : "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
          }`}
        >
          {isLocalHostable ? (
            <Server className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Cloud className="h-3.5 w-3.5" aria-hidden />
          )}
          {isLocalHostable ? "Local-hostable" : "API-only"}
        </span>
      </div>
      <p className="mb-3 text-sm text-slate-400">{model.provider}</p>
      <div className="mb-3 flex items-center gap-1.5 text-slate-500">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-sm">{model.origin_country}</span>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {regions.map((region) => {
          const active = regionList.includes(region);
          return (
            <span
              key={region}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${
                active
                  ? "bg-slate-600/80 text-slate-200"
                  : "bg-slate-700/40 text-slate-500"
              }`}
              title={active ? `${region} compliance` : `No ${region} compliance`}
            >
              <Shield className="h-3 w-3" aria-hidden />
              {region}
            </span>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {model.compliance_tags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300"
          >
            {tag}
          </span>
        ))}
        {model.data_residency && (
          <span className="rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">
            Data residency
          </span>
        )}
      </div>
    </article>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [opennessFilter, setOpennessFilter] = useState<Set<OpennessLevel>>(
    new Set(opennessOptions)
  );
  const [regionFilter, setRegionFilter] = useState<Set<string>>(
    new Set(regions)
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return models.filter((m) => {
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.origin_country.toLowerCase().includes(q);
      const matchOpenness = opennessFilter.has(m.openness_level);
      const modelRegions = getRegionFromTags(m.compliance_tags, m.origin_country);
      const matchRegion =
        regionFilter.size === 0 ||
        modelRegions.some((r) => regionFilter.has(r));
      return matchSearch && matchOpenness && matchRegion;
    });
  }, [search, opennessFilter, regionFilter]);

  const toggleOpenness = (level: OpennessLevel) => {
    setOpennessFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const toggleRegion = (region: string) => {
    setRegionFilter((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-200">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="shrink-0 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Sovereign AI Transparency
          </h1>
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search by model name or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/50"
              aria-label="Search models"
            />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 lg:hidden"
            aria-expanded={sidebarOpen}
            aria-label="Toggle filters"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-800 bg-zinc-900 p-4 transition-transform lg:static lg:z-0 lg:translate-x-0 lg:shrink-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="relative">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-slate-400">
              <ChevronDown className="h-4 w-4 lg:hidden" />
              Filters
            </h2>
            <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300">
                  Openness
                </legend>
                <div className="space-y-2">
                  {opennessOptions.map((level) => (
                    <label
                      key={level}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-400"
                    >
                      <input
                        type="checkbox"
                        checked={opennessFilter.has(level)}
                        onChange={() => toggleOpenness(level)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500"
                      />
                      {level}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300">
                  Region
                </legend>
                <div className="space-y-2">
                  {regions.map((region) => (
                    <label
                      key={region}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-400"
                    >
                      <input
                        type="checkbox"
                        checked={regionFilter.has(region)}
                        onChange={() => toggleRegion(region)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500"
                      />
                      {region}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <p className="mb-4 text-sm text-slate-500">
            {filtered.length} model{filtered.length !== 1 ? "s" : ""} shown
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-8 text-center text-slate-500">
              No models match your filters. Try adjusting search or filters.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

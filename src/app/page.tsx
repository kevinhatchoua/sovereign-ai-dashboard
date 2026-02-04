"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  Search,
  Server,
  Cloud,
  Shield,
  MapPin,
  ChevronDown,
  Filter,
  AlertTriangle,
  GitCompare,
  MoreVertical,
  X,
} from "lucide-react";
import registryData from "@/data/registry.json";
import { RegionSelector } from "@/app/components/RegionSelector";
import { VoteButtons } from "@/app/components/VoteButtons";
import { ComparisonMatrix } from "@/app/components/ComparisonMatrix";
import { ModelDetailPanel } from "@/app/components/ModelDetailPanel";
import { checkCompliance, type Jurisdiction } from "@/app/lib/complianceEngine";
import {
  normalizeRegistry,
  type ComparisonModel,
  type RawRegistryEntry,
} from "@/app/lib/registryNormalizer";

type OpennessLevel = "Open Weights" | "API";

const models: ComparisonModel[] = normalizeRegistry(
  registryData as RawRegistryEntry[]
);

const regions = ["EU", "US", "India"] as const;
const opennessOptions: OpennessLevel[] = ["Open Weights", "API"];

/** Hugging Face–style language code -> display label */
const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  zh: "Chinese",
  fr: "French",
  de: "German",
  es: "Spanish",
  ar: "Arabic",
  hi: "Hindi",
  multilingual: "Multilingual",
};

/** Hugging Face–style task tag -> display label */
const TASK_LABELS: Record<string, string> = {
  "text-generation": "Text generation",
  conversational: "Conversational",
  code: "Code",
  "question-answering": "Q&A",
  summarization: "Summarization",
  vision: "Vision",
};

function getRegionFromTags(tags: string[], originCountry: string): (typeof regions)[number][] {
  const out: (typeof regions)[number][] = [];
  if (tags.some((t) => t.includes("EU") || t.includes("GDPR"))) out.push("EU");
  if (originCountry === "United States" || tags.some((t) => t.includes("US"))) out.push("US");
  if (tags.some((t) => t.includes("India"))) out.push("India");
  return out;
}

function getMinVramGb(model: ComparisonModel): number | null {
  const v4 = model.intelligence?.vram_4bit_gb;
  const v8 = model.intelligence?.vram_8bit_gb;
  if (v4 == null && v8 == null) return null;
  if (v4 != null && v8 != null) return Math.min(v4, v8);
  return v4 ?? v8 ?? null;
}

const MAX_COMPARE = 5;
const HARDWARE_OPTIONS = [
  { value: "8", label: "≤ 8GB VRAM" },
  { value: "16", label: "≤ 16GB VRAM" },
  { value: "24", label: "≤ 24GB VRAM" },
];

function ModelCard({
  model,
  currentJurisdiction,
  compareChecked,
  onCompareChange,
  compareDisabled,
  onClick,
  onFilterRegion,
  onFilterLanguage,
  onFilterTask,
  onFilterComplianceTag,
  onFilterProvider,
  onFilterCountry,
  onFilterOpenness,
  onOpenDetails,
  onReportDispute,
}: {
  model: ComparisonModel;
  currentJurisdiction: Jurisdiction | null;
  compareChecked: boolean;
  onCompareChange: (checked: boolean) => void;
  compareDisabled: boolean;
  onClick: () => void;
  onFilterRegion?: (region: string) => void;
  onFilterLanguage?: (lang: string) => void;
  onFilterTask?: (task: string) => void;
  onFilterComplianceTag?: (tag: string) => void;
  onFilterProvider?: (provider: string) => void;
  onFilterCountry?: (country: string) => void;
  onFilterOpenness?: (level: OpennessLevel) => void;
  onOpenDetails?: () => void;
  onReportDispute?: () => void;
}) {
  const [riskTooltipOpen, setRiskTooltipOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const compliance = useMemo(
    () =>
      currentJurisdiction
        ? checkCompliance(
            {
              openness_level: model.openness_level,
              origin_country: model.origin_country,
              data_residency: model.data_residency,
              compliance_tags: model.compliance_tags,
            },
            currentJurisdiction
          )
        : {
            isCompliant: true,
            issues: [] as { requirement: string; message: string }[],
          },
    [model, currentJurisdiction]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        tooltipRef.current &&
        badgeRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        !badgeRef.current.contains(e.target as Node)
      ) {
        setRiskTooltipOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (riskTooltipOpen || menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [riskTooltipOpen, menuOpen]);

  const isLocalHostable = model.openness_level === "Open Weights";
  const regionList = getRegionFromTags(model.compliance_tags, model.origin_country);
  const showRiskBadge = currentJurisdiction && !compliance.isCompliant;

  return (
    <article
      className="relative cursor-pointer rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 shadow-lg transition hover:border-slate-600 hover:bg-slate-800/70"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Click overlay: on top to catch clicks; interactive elements use z-20 to stay above */}
      <div
        className="absolute inset-0 z-10 rounded-xl"
        onClick={onClick}
        aria-hidden
      />
      <div className="relative z-0">
      <div className="mb-3 flex items-start justify-between gap-2">
        <label
          className="relative z-20 flex cursor-pointer items-center gap-2 text-sm text-slate-400"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={compareChecked}
            onChange={(e) => onCompareChange(e.target.checked)}
            disabled={compareDisabled}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-500 focus:ring-slate-500 disabled:opacity-50"
            aria-label={`Compare ${model.name}`}
          />
          <span className="select-none">Compare</span>
        </label>
        <div className="relative z-20" onClick={(e) => e.stopPropagation()}>
          <VoteButtons modelId={model.id} compact />
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-100">{model.name}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="relative z-20" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
              aria-label="Card actions"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-lg border border-slate-600 bg-slate-800 py-1 shadow-xl"
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => { onOpenDetails?.(); setMenuOpen(false); }}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
                  role="menuitem"
                >
                  View details
                </button>
                <button
                  type="button"
                  onClick={() => { onCompareChange(!compareChecked); setMenuOpen(false); }}
                  disabled={compareDisabled && !compareChecked}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                  role="menuitem"
                >
                  {compareChecked ? "Remove from compare" : "Add to compare"}
                </button>
                <button
                  type="button"
                  onClick={() => { onReportDispute?.(); setMenuOpen(false); }}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
                  role="menuitem"
                >
                  Report dispute
                </button>
              </div>
            )}
          </div>
          {showRiskBadge && (
            <div className="relative z-20" onClick={(e) => e.stopPropagation()}>
              <button
                ref={badgeRef}
                type="button"
                onClick={() => setRiskTooltipOpen((o) => !o)}
                className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400 ring-1 ring-red-500/30 hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                aria-label="View compliance risk details"
                aria-expanded={riskTooltipOpen}
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                Risk
              </button>
              {riskTooltipOpen && compliance.issues.length > 0 && (
                <div
                  ref={tooltipRef}
                  role="tooltip"
                  className="absolute left-0 top-full z-50 mt-1.5 min-w-[14rem] rounded-lg border border-slate-600 bg-slate-800 p-3 shadow-xl"
                >
                  <p className="mb-2 text-xs font-medium text-slate-300">
                    2026 legal requirements
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    {compliance.issues.map((issue, i) => (
                      <li key={i}>
                        <span className="font-medium text-red-300">
                          {issue.requirement}
                        </span>
                        {" — "}
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFilterOpenness?.(model.openness_level as OpennessLevel); }}
            className={`relative z-20 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition hover:ring-2 hover:ring-slate-500/50 ${
              isLocalHostable
                ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
            }`}
            title="Filter by openness"
          >
            {isLocalHostable ? (
              <Server className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Cloud className="h-3.5 w-3.5" aria-hidden />
            )}
            {isLocalHostable ? "Local-hostable" : "API-only"}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onFilterProvider?.(model.provider); }}
        className="relative z-20 mb-3 block text-left text-sm text-slate-400 transition hover:text-slate-300 hover:underline"
        title="Filter by provider"
      >
        {model.provider}
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onFilterCountry?.(model.origin_country); }}
        className="relative z-20 mb-3 flex items-center gap-1.5 text-left text-slate-500 transition hover:text-slate-300"
        title="Filter by country"
      >
        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-sm">{model.origin_country}</span>
      </button>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {regions.map((region) => {
          const active = regionList.includes(region);
          return (
            <button
              key={region}
              type="button"
              onClick={(e) => { e.stopPropagation(); onFilterRegion?.(region); }}
              className={`relative z-20 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs transition hover:ring-2 hover:ring-slate-500/50 ${
                active
                  ? "bg-slate-600/80 text-slate-200"
                  : "bg-slate-700/40 text-slate-500"
              }`}
              title={active ? `Filter by ${region}` : `No ${region} compliance`}
            >
              <Shield className="h-3 w-3" aria-hidden />
              {region}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {model.compliance_tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={(e) => { e.stopPropagation(); onFilterComplianceTag?.(tag); }}
            className="relative z-20 rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300 transition hover:bg-slate-600/80 hover:ring-2 hover:ring-slate-500/50"
            title={`Filter by ${tag}`}
          >
            {tag}
          </button>
        ))}
        {model.data_residency && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFilterComplianceTag?.("Data residency"); }}
            className="relative z-20 rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300 transition hover:bg-slate-600/80 hover:ring-2 hover:ring-slate-500/50"
            title="Filter by data residency"
          >
            Data residency
          </button>
        )}
      </div>
      {model.languages.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-500">Languages:</span>
          {model.languages.slice(0, 5).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={(e) => { e.stopPropagation(); onFilterLanguage?.(lang); }}
              className="relative z-20 rounded bg-slate-700/40 px-2 py-0.5 text-xs text-slate-400 transition hover:bg-slate-600/60 hover:ring-2 hover:ring-slate-500/50"
              title={`Filter by ${LANGUAGE_LABELS[lang] ?? lang}`}
            >
              {LANGUAGE_LABELS[lang] ?? lang}
            </button>
          ))}
          {model.languages.length > 5 && (
            <span className="text-xs text-slate-500">+{model.languages.length - 5}</span>
          )}
        </div>
      )}
      {model.task_categories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-500">Tasks:</span>
          {model.task_categories.map((task) => (
            <button
              key={task}
              type="button"
              onClick={(e) => { e.stopPropagation(); onFilterTask?.(task); }}
              className="relative z-20 rounded bg-slate-700/40 px-2 py-0.5 text-xs text-slate-400 transition hover:bg-slate-600/60 hover:ring-2 hover:ring-slate-500/50"
              title={`Filter by ${TASK_LABELS[task] ?? task}`}
            >
              {TASK_LABELS[task] ?? task}
            </button>
          ))}
        </div>
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
  const [currentJurisdiction, setCurrentJurisdiction] =
    useState<Jurisdiction | null>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<Set<string>>(new Set());
  const [taskFilter, setTaskFilter] = useState<Set<string>>(new Set());
  const [hardwareFilter, setHardwareFilter] = useState<Set<string>>(new Set());
  const [complianceTagFilter, setComplianceTagFilter] = useState<Set<string>>(new Set());
  const [providerFilter, setProviderFilter] = useState<Set<string>>(new Set());
  const [countryFilter, setCountryFilter] = useState<Set<string>>(new Set());
  const [selectedModel, setSelectedModel] = useState<ComparisonModel | null>(null);
  const [openDisputeOnMount, setOpenDisputeOnMount] = useState(false);

  const allLanguages = useMemo(
    () => [...new Set(models.flatMap((m) => m.languages))].sort(),
    []
  );
  const allTasks = useMemo(
    () => [...new Set(models.flatMap((m) => m.task_categories))].sort(),
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return models.filter((m) => {
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.origin_country.toLowerCase().includes(q) ||
        m.compliance_tags.some((t) => t.toLowerCase().includes(q));
      const matchOpenness = opennessFilter.has(m.openness_level);
      const modelRegions = getRegionFromTags(m.compliance_tags, m.origin_country);
      const matchRegion =
        regionFilter.size === 0 ||
        modelRegions.some((r) => regionFilter.has(r));
      const matchLanguage =
        languageFilter.size === 0 ||
        m.languages.some((l) => languageFilter.has(l));
      const matchTask =
        taskFilter.size === 0 ||
        m.task_categories.some((t) => taskFilter.has(t));
      const matchComplianceTag =
        complianceTagFilter.size === 0 ||
        [...complianceTagFilter].every((tag) =>
          tag === "Data residency"
            ? m.data_residency
            : m.compliance_tags.includes(tag)
        );
      const matchProvider =
        providerFilter.size === 0 || providerFilter.has(m.provider);
      const matchCountry =
        countryFilter.size === 0 || countryFilter.has(m.origin_country);
      const minVram = getMinVramGb(m);
      const matchHardware =
        hardwareFilter.size === 0 ||
        (minVram != null &&
          [...hardwareFilter].some((h) => minVram <= parseInt(h, 10)));
      return (
        matchSearch &&
        matchOpenness &&
        matchRegion &&
        matchLanguage &&
        matchTask &&
        matchComplianceTag &&
        matchProvider &&
        matchCountry &&
        matchHardware
      );
    });
  }, [
    search,
    opennessFilter,
    regionFilter,
    languageFilter,
    taskFilter,
    complianceTagFilter,
    providerFilter,
    countryFilter,
    hardwareFilter,
  ]);

  const toggleOpenness = (level: OpennessLevel) => {
    setOpennessFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const filterToOpenness = (level: OpennessLevel) => {
    setOpennessFilter((prev) =>
      prev.size === 1 && prev.has(level)
        ? new Set(opennessOptions)
        : new Set([level])
    );
  };

  const toggleRegion = (region: string) => {
    setRegionFilter((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  const filterToRegion = (region: string) => {
    setRegionFilter((prev) =>
      prev.size === 1 && prev.has(region)
        ? new Set(regions)
        : new Set([region])
    );
  };

  const toggleLanguage = (lang: string) => {
    setLanguageFilter((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) next.delete(lang);
      else next.add(lang);
      return next;
    });
  };

  const toggleTask = (task: string) => {
    setTaskFilter((prev) => {
      const next = new Set(prev);
      if (next.has(task)) next.delete(task);
      else next.add(task);
      return next;
    });
  };

  const toggleHardware = (value: string) => {
    setHardwareFilter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleComplianceTag = (tag: string) => {
    setComplianceTagFilter((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const toggleProvider = (provider: string) => {
    setProviderFilter((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) next.delete(provider);
      else next.add(provider);
      return next;
    });
  };

  const toggleCountry = (country: string) => {
    setCountryFilter((prev) => {
      const next = new Set(prev);
      if (next.has(country)) next.delete(country);
      else next.add(country);
      return next;
    });
  };

  const hasActiveFilters =
    regionFilter.size < regions.length ||
    opennessFilter.size < opennessOptions.length ||
    languageFilter.size > 0 ||
    taskFilter.size > 0 ||
    hardwareFilter.size > 0 ||
    complianceTagFilter.size > 0 ||
    providerFilter.size > 0 ||
    countryFilter.size > 0;

  const clearAllFilters = () => {
    setRegionFilter(new Set(regions));
    setOpennessFilter(new Set(opennessOptions));
    setLanguageFilter(new Set());
    setTaskFilter(new Set());
    setHardwareFilter(new Set());
    setComplianceTagFilter(new Set());
    setProviderFilter(new Set());
    setCountryFilter(new Set());
  };

  const toggleCompare = (modelId: string, checked: boolean) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        if (next.size >= MAX_COMPARE) return prev;
        next.add(modelId);
      } else {
        next.delete(modelId);
      }
      return next;
    });
  };

  const compareModels = useMemo(
    () => models.filter((m) => compareIds.has(m.id)),
    [compareIds]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedModel(null);
    };
    if (selectedModel) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedModel]);

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-200">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="shrink-0 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Sovereign AI Transparency
          </h1>
          <RegionSelector
            value={currentJurisdiction}
            onChange={setCurrentJurisdiction}
            placeholder="Current Jurisdiction"
          />
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search by model name, provider, or country..."
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
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300">
                  Language
                </legend>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {allLanguages.map((lang) => (
                    <label
                      key={lang}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-400"
                    >
                      <input
                        type="checkbox"
                        checked={languageFilter.has(lang)}
                        onChange={() => toggleLanguage(lang)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500"
                      />
                      {LANGUAGE_LABELS[lang] ?? lang}
                    </label>
                  ))}
                  {allLanguages.length === 0 && (
                    <span className="text-xs text-slate-500">No language data</span>
                  )}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300">
                  Task
                </legend>
                <div className="space-y-2">
                  {allTasks.map((task) => (
                    <label
                      key={task}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-400"
                    >
                      <input
                        type="checkbox"
                        checked={taskFilter.has(task)}
                        onChange={() => toggleTask(task)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500"
                      />
                      {TASK_LABELS[task] ?? task}
                    </label>
                  ))}
                  {allTasks.length === 0 && (
                    <span className="text-xs text-slate-500">No task data</span>
                  )}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300">
                  Hardware (VRAM)
                </legend>
                <div className="space-y-2">
                  {HARDWARE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-400"
                    >
                      <input
                        type="checkbox"
                        checked={hardwareFilter.has(opt.value)}
                        onChange={() => toggleHardware(opt.value)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <p className="text-sm text-slate-500">
              {filtered.length} model{filtered.length !== 1 ? "s" : ""} shown
            </p>
            {hasActiveFilters && (
              <>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {[...complianceTagFilter, ...providerFilter, ...countryFilter].map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => {
                          if (complianceTagFilter.has(f)) toggleComplianceTag(f);
                          else if (providerFilter.has(f)) toggleProvider(f);
                          else toggleCountry(f);
                        }}
                        className="rounded hover:bg-slate-600"
                        aria-label={`Remove ${f} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                currentJurisdiction={currentJurisdiction}
                compareChecked={compareIds.has(model.id)}
                onCompareChange={(checked) => toggleCompare(model.id, checked)}
                compareDisabled={
                  compareIds.size >= MAX_COMPARE && !compareIds.has(model.id)
                }
                onClick={() => setSelectedModel(model)}
                onFilterRegion={filterToRegion}
                onFilterLanguage={toggleLanguage}
                onFilterTask={toggleTask}
                onFilterComplianceTag={toggleComplianceTag}
                onFilterProvider={toggleProvider}
                onFilterCountry={toggleCountry}
                onFilterOpenness={filterToOpenness}
                onOpenDetails={() => setSelectedModel(model)}
                onReportDispute={() => {
                  setSelectedModel(model);
                  setOpenDisputeOnMount(true);
                }}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-8 text-center text-slate-500">
              No models match your filters. Try adjusting search or filters.
            </p>
          )}
        </main>
      </div>

      {compareIds.size >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700 bg-zinc-900/95 py-3 shadow-lg backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-slate-400">
              {compareIds.size} model{compareIds.size !== 1 ? "s" : ""} selected
              for comparison (max {MAX_COMPARE})
            </p>
            <button
              type="button"
              onClick={() => setMatrixOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <GitCompare className="h-4 w-4" aria-hidden />
              Compare Models
            </button>
          </div>
        </div>
      )}

      {matrixOpen && compareModels.length >= 2 && (
        <ComparisonMatrix
          models={compareModels}
          jurisdiction={currentJurisdiction}
          onClose={() => setMatrixOpen(false)}
        />
      )}

      {selectedModel && (
        <ModelDetailPanel
          model={selectedModel}
          jurisdiction={currentJurisdiction}
          onClose={() => {
            setSelectedModel(null);
            setOpenDisputeOnMount(false);
          }}
          openDisputeOnMount={openDisputeOnMount}
        />
      )}
    </div>
  );
}

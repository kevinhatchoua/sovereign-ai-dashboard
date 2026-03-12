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
  LayoutGrid,
  ShieldCheck,
  ExternalLink,
  Download,
} from "lucide-react";
import Link from "next/link";
import registryData from "@/data/registry.json";
import { RegionSelector } from "@/app/components/RegionSelector";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { VoteButtons } from "@/app/components/VoteButtons";
import { CatalogChatbot } from "@/app/components/CatalogChatbot";
import { ComparisonMatrix } from "@/app/components/ComparisonMatrix";
import { ModelDetailPanel } from "@/app/components/ModelDetailPanel";
import { checkCompliance, type Jurisdiction } from "@/app/lib/complianceEngine";
import {
  normalizeRegistry,
  getIntelligenceScore,
  type ComparisonModel,
  type RawRegistryEntry,
} from "@/app/lib/registryNormalizer";
import { computeEthicsScore, getEthicsScoreColorClasses } from "@/app/lib/ethicsScore";
import { getModelLinks, getModelDescription } from "@/app/lib/modelLinks";
import {
  getSovereigntyReadiness,
  hasCloudActExposure,
  getFourDimensions,
} from "@/app/lib/sovereigntyScore";
import { ComplianceTooltip } from "@/app/components/ComplianceTooltip";
import { SovereigntyAssessment } from "@/app/components/SovereigntyAssessment";

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
  onFilterTask,
  onFilterProvider,
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
  onFilterTask?: (task: string) => void;
  onFilterProvider?: (provider: string) => void;
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
  const showRiskBadge = currentJurisdiction && !compliance.isCompliant;

  return (
    <article
      className="relative cursor-pointer touch-manipulation rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 shadow-lg transition hover:border-slate-600 hover:bg-slate-800/70 sm:p-5 [.light_&]:border-slate-300 [.light_&]:bg-slate-50 [.light_&]:hover:border-slate-400 [.light_&]:hover:bg-slate-100"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Overlay below content so interactive elements (z-20) receive clicks first */}
      <div
        className="absolute inset-0 z-0 rounded-xl"
        aria-hidden
      />
      <div
        className="relative z-10 cursor-pointer"
        onClick={onClick}
      >
      <div className="mb-3 flex items-start justify-between gap-2">
        <label
          className="relative z-20 flex cursor-pointer items-center gap-2 text-sm text-slate-400 [.light_&]:text-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={compareChecked}
            onChange={(e) => onCompareChange(e.target.checked)}
            disabled={compareDisabled}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-500 focus:ring-slate-500 disabled:opacity-50 [.light_&]:border-slate-500 [.light_&]:bg-white [.light_&]:text-slate-600"
            aria-label={`Compare ${model.name}`}
          />
          <span className="select-none">Compare</span>
        </label>
        <div className="relative z-20 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <VoteButtons modelId={model.id} compact />
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300 [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
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
        </div>
      </div>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-100 [.light_&]:text-slate-900">{model.name}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
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
                ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 [.light_&]:bg-emerald-100 [.light_&]:text-emerald-800 [.light_&]:ring-emerald-400"
                : "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30 [.light_&]:bg-amber-100 [.light_&]:text-amber-800 [.light_&]:ring-amber-500"
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
        className="relative z-20 mb-1 block text-left text-sm text-slate-400 transition hover:text-slate-300 hover:underline [.light_&]:text-slate-700 [.light_&]:hover:text-slate-900"
        title="Filter by provider"
      >
        {model.provider}
      </button>
      <p className="relative z-20 mb-3 line-clamp-2 text-xs text-slate-500 [.light_&]:text-slate-600">
        {getModelDescription(model)}
      </p>

      {/* Simplified list-based metadata */}
      <dl className="space-y-1.5 text-xs">
        {(model.task_categories.length > 0 || getMinVramGb(model) != null) && (
          <div className="flex items-start gap-2">
            <dt className="text-slate-500 [.light_&]:text-slate-600 w-16 shrink-0 pt-0.5">
              {model.task_categories.length > 0 ? "Tasks:" : "Hardware:"}
            </dt>
            <dd>
              <span className="text-slate-400 [.light_&]:text-slate-600">
                {model.task_categories.length > 0 && (
                  <>
                    {model.task_categories.slice(0, 3).map((t) => TASK_LABELS[t] ?? t).join(", ")}
                    {model.task_categories.length > 3 && ` +${model.task_categories.length - 3}`}
                    {getMinVramGb(model) != null && " • "}
                  </>
                )}
                {getMinVramGb(model) != null && `≤${getMinVramGb(model)}GB VRAM`}
              </span>
            </dd>
          </div>
        )}
        <div className="flex items-center gap-2 pt-1">
          <dt className="text-slate-500 [.light_&]:text-slate-600 w-16 shrink-0">Ethics:</dt>
          <dd>
            <span className={`font-medium ${getEthicsScoreColorClasses(computeEthicsScore(model))}`}>
              {computeEthicsScore(model)}/100
            </span>
          </dd>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <dt className="text-slate-500 [.light_&]:text-slate-600 w-16 shrink-0">Sovereignty:</dt>
          <dd className="flex flex-wrap items-center gap-1.5">
            {(() => {
              const readiness = getSovereigntyReadiness(model);
              const levelColors =
                readiness.level === "Advanced"
                  ? "bg-emerald-500/20 text-emerald-600 ring-emerald-500/30 [.light_&]:bg-emerald-100 [.light_&]:text-emerald-800"
                  : readiness.level === "Intermediate"
                    ? "bg-amber-500/20 text-amber-600 ring-amber-500/30 [.light_&]:bg-amber-100 [.light_&]:text-amber-800"
                    : "bg-slate-500/20 text-slate-600 ring-slate-500/30 [.light_&]:bg-slate-200 [.light_&]:text-slate-700";
              return (
                <>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${levelColors}`}
                    title={`Sovereignty Readiness: ${readiness.level} (${readiness.score}/100)`}
                  >
                    {readiness.label}
                  </span>
                  {hasCloudActExposure(model) && (
                    <span
                      className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-600 ring-1 ring-amber-500/30 [.light_&]:bg-amber-100 [.light_&]:text-amber-800"
                      title="US-based provider; may be subject to Cloud Act"
                    >
                      Cloud Act
                    </span>
                  )}
                </>
              );
            })()}
          </dd>
        </div>
      </dl>
      {(() => {
        const links = getModelLinks(model);
        if (!links.learnMore && !links.download) return null;
        return (
          <div className="relative z-20 mt-3 flex flex-wrap gap-2 border-t border-slate-700/60 pt-3 [.light_&]:border-slate-200">
            {links.learnMore && (
              <a
                href={links.learnMore}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 [.light_&]:text-slate-600 [.light_&]:hover:text-slate-800"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Learn more
              </a>
            )}
            {links.download && (
              <a
                href={links.download}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 [.light_&]:text-slate-600 [.light_&]:hover:text-slate-800"
              >
                <Download className="h-3.5 w-3.5" />
                Download from source
              </a>
            )}
          </div>
        );
      })()}
      </div>
    </article>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [opennessFilter, setOpennessFilter] = useState<Set<OpennessLevel>>(
    new Set()
  );
  const [regionFilter, setRegionFilter] = useState<Set<string>>(
    new Set()
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentJurisdiction, setCurrentJurisdiction] =
    useState<Jurisdiction | null>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<Set<string>>(new Set());
  const [taskFilter, setTaskFilter] = useState<Set<string>>(new Set());
  const [hardwareFilter, setHardwareFilter] = useState<Set<string>>(new Set());
  const [intelligenceFilter, setIntelligenceFilter] = useState<Set<string>>(new Set());
  const [complianceTagFilter, setComplianceTagFilter] = useState<Set<string>>(new Set());
  const [providerFilter, setProviderFilter] = useState<Set<string>>(new Set());
  const [countryFilter, setCountryFilter] = useState<Set<string>>(new Set());
  const [selectedModel, setSelectedModel] = useState<ComparisonModel | null>(null);
  const [openDisputeOnMount, setOpenDisputeOnMount] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "provider" | "country" | "intelligence" | "ethics">("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Sync Jurisdiction -> Region when user selects jurisdiction from dropdown
  useEffect(() => {
    if (currentJurisdiction === "EU") setRegionFilter(new Set(["EU"]));
    else if (currentJurisdiction === "IN") setRegionFilter(new Set(["India"]));
    else if (currentJurisdiction === "US") setRegionFilter(new Set(["US"]));
    // When null, leave region filter as-is (user may have custom multi-region)
  }, [currentJurisdiction]);
  const [chatbotModelIds, setChatbotModelIds] = useState<Set<string>>(new Set());

  const allLanguages = useMemo(
    () => [...new Set(models.flatMap((m) => m.languages))].sort(),
    []
  );
  const allTasks = useMemo(
    () => [...new Set(models.flatMap((m) => m.task_categories))].sort(),
    []
  );
  const allComplianceTags = useMemo(
    () => [...new Set(models.flatMap((m) => [...m.compliance_tags, ...(m.data_residency ? ["Data residency"] : [])]))].sort(),
    []
  );

  const top10DownloadThreshold = useMemo(() => {
    const withDl = models.map((m) => m.intelligence?.hf_downloads).filter((n): n is number => n != null && n > 0);
    if (withDl.length < 2) return 0;
    const sorted = [...withDl].sort((a, b) => b - a);
    const idx = Math.max(0, Math.floor(sorted.length * 0.1) - 1);
    return sorted[idx] ?? 0;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = models.filter((m) => {
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.origin_country.toLowerCase().includes(q) ||
        m.compliance_tags.some((t) => t.toLowerCase().includes(q));
      const matchOpenness =
        opennessFilter.size === 0 || opennessFilter.has(m.openness_level);
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
      const intelScore = getIntelligenceScore(m);
      const matchIntelligence =
        intelligenceFilter.size === 0 ||
        (intelligenceFilter.has("has_data") && intelScore > 0) ||
        (intelligenceFilter.has("top10") && top10DownloadThreshold > 0 && (m.intelligence?.hf_downloads ?? 0) >= top10DownloadThreshold);
      return (
        matchSearch &&
        matchOpenness &&
        matchRegion &&
        matchLanguage &&
        matchTask &&
        matchComplianceTag &&
        matchProvider &&
        matchCountry &&
        matchHardware &&
        matchIntelligence
      );
    });
    const byChatbot =
      chatbotModelIds.size > 0
        ? list.filter((m) => chatbotModelIds.has(m.id))
        : list;
    const sorted = [...byChatbot].sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortBy === "name")
        return mul * a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      if (sortBy === "provider")
        return mul * a.provider.localeCompare(b.provider, undefined, { sensitivity: "base" });
      if (sortBy === "country")
        return mul * a.origin_country.localeCompare(b.origin_country, undefined, { sensitivity: "base" });
      if (sortBy === "intelligence")
        return mul * (getIntelligenceScore(a) - getIntelligenceScore(b));
      if (sortBy === "ethics")
        return mul * (computeEthicsScore(a) - computeEthicsScore(b));
      return 0;
    });
    return sorted;
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
    intelligenceFilter,
    sortBy,
    sortAsc,
    chatbotModelIds,
    top10DownloadThreshold,
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
        ? new Set()
        : new Set([level])
    );
  };

  const toggleRegion = (region: string) => {
    setCurrentJurisdiction(null); // Clear jurisdiction when user manually changes Region
    setRegionFilter((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  const filterToRegion = (region: string) => {
    const clearing = regionFilter.size === 1 && regionFilter.has(region);
    setRegionFilter((prev) =>
      clearing ? new Set() : new Set([region])
    );
    if (clearing) setCurrentJurisdiction(null);
    else if (region === "EU") setCurrentJurisdiction("EU");
    else if (region === "India") setCurrentJurisdiction("IN");
    else if (region === "US") setCurrentJurisdiction("US");
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

  const setChatbotFilter = (ids: string[]) => {
    setChatbotModelIds(ids.length > 0 ? new Set(ids) : new Set());
  };

  const hasActiveFilters =
    regionFilter.size > 0 ||
    opennessFilter.size > 0 ||
    languageFilter.size > 0 ||
    taskFilter.size > 0 ||
    hardwareFilter.size > 0 ||
    intelligenceFilter.size > 0 ||
    complianceTagFilter.size > 0 ||
    providerFilter.size > 0 ||
    countryFilter.size > 0 ||
    chatbotModelIds.size > 0;

  const clearAllFilters = () => {
    setCurrentJurisdiction(null);
    setRegionFilter(new Set());
    setOpennessFilter(new Set());
    setLanguageFilter(new Set());
    setTaskFilter(new Set());
    setHardwareFilter(new Set());
    setIntelligenceFilter(new Set());
    setComplianceTagFilter(new Set());
    setProviderFilter(new Set());
    setCountryFilter(new Set());
    setChatbotModelIds(new Set());
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

  // Sync document title with jurisdiction and model count
  useEffect(() => {
    const jurisdictionLabel = currentJurisdiction
      ? currentJurisdiction === "EU"
        ? "EU"
        : currentJurisdiction === "IN"
          ? "India"
          : "USA"
      : null;
    document.title = jurisdictionLabel
      ? `Sovereign AI | Results for ${jurisdictionLabel} Jurisdiction`
      : `Sovereign AI | Build with AI You Own — ${filtered.length}+ models`;
  }, [currentJurisdiction, filtered.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedModel(null);
    };
    if (selectedModel) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (sidebarOpen && typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-200 [.light_&]:bg-white [.light_&]:text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-zinc-950/95 backdrop-blur [.light_&]:border-slate-300 [.light_&]:bg-white/95 pt-[env(safe-area-inset-top)]">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8">
          <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight text-white hover:text-slate-200 sm:text-lg [.light_&]:text-slate-900 [.light_&]:hover:text-slate-800"
            >
              <ShieldCheck className="h-5 w-5 shrink-0 text-amber-500 sm:h-6 sm:w-6" />
              <span className="truncate">Sovereign AI</span>
            </Link>
            <div className="hidden items-center gap-1 sm:flex">
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
              >
                Dashboard
              </Link>
              <span className="rounded-lg bg-slate-800/80 px-3 py-1.5 text-sm font-medium text-slate-300 [.light_&]:bg-slate-200 [.light_&]:text-slate-800">
                Models
              </span>
              <button
                type="button"
                onClick={() => setAssessmentOpen(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
              >
                <Shield className="h-4 w-4" />
                Assessment
              </button>
              <Link
                href="/methodology"
                className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
              >
                Methodology
              </Link>
              <Link
                href="/admin"
                className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
              >
                Admin
              </Link>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:basis-auto sm:flex-initial sm:pl-4 lg:pl-8">
            <div className="hidden shrink-0 sm:block">
              <RegionSelector
                value={currentJurisdiction}
                onChange={setCurrentJurisdiction}
                placeholder="Jurisdiction"
              />
            </div>
            <div className="relative min-w-0 flex-1">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-slate-500"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-slate-700 bg-slate-800/80 py-2.5 pl-10 pr-4 text-base text-slate-200 placeholder-slate-500 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/50 [.light_&]:border-slate-400 [.light_&]:bg-slate-100 [.light_&]:text-slate-900 [.light_&]:placeholder-slate-600 [.light_&]:focus:border-amber-500 [.light_&]:focus:ring-amber-500/30 sm:py-2"
                aria-label="Search models"
              />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setSidebarOpen((o) => !o)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 lg:hidden [.light_&]:border-slate-300 [.light_&]:bg-slate-100 [.light_&]:text-slate-800 [.light_&]:hover:bg-slate-200"
                aria-expanded={sidebarOpen}
                aria-label="Toggle filters"
              >
                <Filter className="h-4 w-4" />
                <span className="ml-1.5 sm:hidden">Filters</span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      <div className="border-b border-slate-800/60 bg-zinc-950/50 [.light_&]:border-slate-300 [.light_&]:bg-slate-50">
        <div className="mx-auto max-w-7xl py-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8">
          <h2 className="mb-1 text-2xl font-bold tracking-tight text-white sm:text-3xl [.light_&]:text-slate-900">
            {currentJurisdiction
              ? `Results for ${currentJurisdiction === "EU" ? "EU" : currentJurisdiction === "IN" ? "India" : "USA"} Jurisdiction`
              : `Build with AI you own — ${filtered.length}+ models`}
          </h2>
          <p className="text-slate-400 [.light_&]:text-slate-800">
            {currentJurisdiction
              ? "Models filtered by your selected jurisdiction. Change jurisdiction in the header to see others."
              : `Explore ${models.length}+ models for sovereign deployment—full ownership, data control, and domestic infrastructure. Filter by jurisdiction, openness, and compliance.`}
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 py-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-[min(20rem,100vw-2rem)] max-w-full border-r border-slate-800 bg-zinc-900 p-4 pb-[env(safe-area-inset-bottom)] pt-[calc(1rem+env(safe-area-inset-top))] transition-transform lg:static lg:z-0 lg:translate-x-0 lg:w-64 lg:shrink-0 lg:pt-4 lg:pb-4 [.light_&]:border-slate-300 [.light_&]:bg-slate-50 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="relative flex h-full flex-col overflow-y-auto">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-slate-400 [.light_&]:text-slate-800">
              <ChevronDown className="h-4 w-4 lg:hidden" />
              Filters
            </h2>
            <div className="mb-4 w-full min-w-0 sm:hidden">
              <RegionSelector
                value={currentJurisdiction}
                onChange={setCurrentJurisdiction}
                placeholder="Jurisdiction"
              />
            </div>
            <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                  Openness
                </legend>
                <div className="space-y-2">
                  {opennessOptions.map((level) => (
                    <label
                      key={level}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-400 [.light_&]:text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={opennessFilter.has(level)}
                        onChange={() => toggleOpenness(level)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500 [.light_&]:border-slate-500 [.light_&]:bg-white"
                      />
                      {level}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                  Model Intelligence
                </legend>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400 [.light_&]:text-slate-700">
                    <input
                      type="checkbox"
                      checked={intelligenceFilter.has("has_data")}
                      onChange={() => {
                        setIntelligenceFilter((prev) => {
                          const next = new Set(prev);
                          if (next.has("has_data")) next.delete("has_data");
                          else next.add("has_data");
                          return next;
                        });
                      }}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500 [.light_&]:border-slate-500 [.light_&]:bg-white"
                    />
                    Has freshness/quality data
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400 [.light_&]:text-slate-700">
                    <input
                      type="checkbox"
                      checked={intelligenceFilter.has("top10")}
                      onChange={() => {
                        setIntelligenceFilter((prev) => {
                          const next = new Set(prev);
                          if (next.has("top10")) next.delete("top10");
                          else next.add("top10");
                          return next;
                        });
                      }}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500 [.light_&]:border-slate-500 [.light_&]:bg-white"
                    />
                    Top 10% popularity or better
                  </label>
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                  Compliance
                </legend>
                <div className="max-h-32 space-y-2 overflow-y-auto">
                  {allComplianceTags.map((tag) => (
                    <label
                      key={tag}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-400 [.light_&]:text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={complianceTagFilter.has(tag)}
                        onChange={() => toggleComplianceTag(tag)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500 [.light_&]:border-slate-500 [.light_&]:bg-white"
                      />
                      {tag}
                      <ComplianceTooltip term={tag} />
                    </label>
                  ))}
                  {allComplianceTags.length === 0 && (
                    <span className="text-xs text-slate-500 [.light_&]:text-slate-600">No compliance data</span>
                  )}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                  Region (synced with Jurisdiction)
                </legend>
                <div className="space-y-2">
                  {regions.map((region) => (
                    <label
                      key={region}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-400 [.light_&]:text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={regionFilter.has(region)}
                        onChange={() => toggleRegion(region)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500 [.light_&]:border-slate-500 [.light_&]:bg-white"
                      />
                      {region}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                  Language
                </legend>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {allLanguages.map((lang) => (
                    <label
                      key={lang}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-400 [.light_&]:text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={languageFilter.has(lang)}
                        onChange={() => toggleLanguage(lang)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500 [.light_&]:border-slate-500 [.light_&]:bg-white"
                      />
                      {LANGUAGE_LABELS[lang] ?? lang}
                    </label>
                  ))}
                  {allLanguages.length === 0 && (
                    <span className="text-xs text-slate-500 [.light_&]:text-slate-600">No language data</span>
                  )}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                  Task
                </legend>
                <div className="space-y-2">
                  {allTasks.map((task) => (
                    <label
                      key={task}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-400 [.light_&]:text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={taskFilter.has(task)}
                        onChange={() => toggleTask(task)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500 [.light_&]:border-slate-500 [.light_&]:bg-white"
                      />
                      {TASK_LABELS[task] ?? task}
                    </label>
                  ))}
                  {allTasks.length === 0 && (
                    <span className="text-xs text-slate-500 [.light_&]:text-slate-600">No task data</span>
                  )}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                  Hardware (VRAM)
                </legend>
                <div className="space-y-2">
                  {HARDWARE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-400 [.light_&]:text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={hardwareFilter.has(opt.value)}
                        onChange={() => toggleHardware(opt.value)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-slate-600 focus:ring-slate-500 [.light_&]:border-slate-500 [.light_&]:bg-white"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        </aside>

        <main className={`min-w-0 flex-1 ${compareIds.size >= 2 ? "pb-28 sm:pb-24" : "pb-24 sm:pb-0"}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-300 [.light_&]:text-slate-800">
                {filtered.length.toLocaleString()} model{filtered.length !== 1 ? "s" : ""}
              </p>
              {hasActiveFilters && (
              <>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-300 [.light_&]:border-slate-500 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {chatbotModelIds.size > 0 && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400 [.light_&]:bg-amber-100 [.light_&]:text-amber-800">
                      Assistant filter ({chatbotModelIds.size})
                      <button
                        type="button"
                        onClick={() => setChatbotModelIds(new Set())}
                        className="rounded hover:bg-amber-500/30"
                        aria-label="Clear assistant filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {[...complianceTagFilter, ...providerFilter, ...countryFilter].map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 rounded bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300 [.light_&]:bg-slate-200 [.light_&]:text-slate-800"
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
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-xs text-slate-500 [.light_&]:text-slate-700">Sort:</label>
              <select
                id="sort"
                value={`${sortBy}-${sortAsc ? "asc" : "desc"}`}
                onChange={(e) => {
                  const [s, d] = e.target.value.split("-");
                  setSortBy(s as "name" | "provider" | "country" | "intelligence" | "ethics");
                  setSortAsc(d === "asc");
                }}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-sm text-slate-300 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-500 [.light_&]:border-slate-400 [.light_&]:bg-white [.light_&]:text-slate-800"
              >
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="provider-asc">Provider A–Z</option>
                <option value="provider-desc">Provider Z–A</option>
                <option value="country-asc">Country A–Z</option>
                <option value="country-desc">Country Z–A</option>
                <option value="intelligence-desc">Intelligence (high first)</option>
                <option value="intelligence-asc">Intelligence (low first)</option>
                <option value="ethics-desc">Ethics Score (high first)</option>
                <option value="ethics-asc">Ethics Score (low first)</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500 [.light_&]:text-slate-600">
              Quick Filters
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const quickChips = [
                  { id: "GDPR", label: "GDPR", isOpenness: false },
                  { id: "EU AI Act Ready", label: "EU AI Act Ready", isOpenness: false },
                  { id: "Data residency", label: "Data residency", isOpenness: false },
                  { id: "Local-hostable", label: "Local-hostable", isOpenness: true },
                ];
                const anyActive = quickChips.some((c) =>
                  c.isOpenness
                    ? opennessFilter.size === 1 && opennessFilter.has("Open Weights")
                    : complianceTagFilter.has(c.id)
                );
                return (
                  <>
                    {!anyActive && (
                      <span className="text-xs text-slate-500 [.light_&]:text-slate-600">
                        No filters applied
                      </span>
                    )}
                    {quickChips.map((c) => {
                      const active = c.isOpenness
                        ? opennessFilter.size === 1 && opennessFilter.has("Open Weights")
                        : complianceTagFilter.has(c.id);
                      const toggle = () => {
                        if (c.isOpenness) filterToOpenness("Open Weights");
                        else toggleComplianceTag(c.id);
                      };
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={toggle}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition touch-manipulation ${
                            active
                              ? "bg-amber-500/25 text-amber-400 ring-2 ring-amber-500/60 [.light_&]:bg-amber-100 [.light_&]:text-amber-800 [.light_&]:ring-amber-500"
                              : "bg-slate-800/60 text-slate-400 ring-1 ring-slate-600/50 hover:bg-slate-700/70 hover:text-slate-300 [.light_&]:bg-slate-200 [.light_&]:text-slate-600 [.light_&]:ring-slate-300 [.light_&]:hover:bg-slate-300 [.light_&]:hover:text-slate-800"
                          }`}
                        >
                          {c.id === "Local-hostable" && <Server className="h-3.5 w-3.5" />}
                          {c.id === "Data residency" && <MapPin className="h-3.5 w-3.5" />}
                          {(c.id === "GDPR" || c.id === "EU AI Act Ready") && <Shield className="h-3.5 w-3.5" />}
                          {c.label}
                        </button>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
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
                onFilterTask={toggleTask}
                onFilterProvider={toggleProvider}
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
            <p className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-8 text-center text-slate-500 [.light_&]:border-slate-300 [.light_&]:bg-slate-100 [.light_&]:text-slate-700">
              No models match your filters. Try adjusting search or filters.
            </p>
          )}
        </main>
      </div>

      {compareIds.size >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700 bg-zinc-900/95 py-3 shadow-lg backdrop-blur [.light_&]:border-slate-300 [.light_&]:bg-white/95 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8">
            <p className="text-sm text-slate-400 [.light_&]:text-slate-700">
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

      <CatalogChatbot
        models={models}
        onFilterByModels={setChatbotFilter}
        onSelectModel={setSelectedModel}
      />

      <SovereigntyAssessment
        models={models}
        onRecommend={(ids) => setChatbotFilter(ids)}
        onClose={() => setAssessmentOpen(false)}
        isOpen={assessmentOpen}
      />
    </div>
  );
}

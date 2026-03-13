"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  Bot,
  Server,
  Cloud,
  MapPin,
  Shield,
  Cpu,
  ChevronRight,
  PanelRightClose,
  Plus,
  Trash2,
} from "lucide-react";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";

type ChatAction = {
  label: string;
  type: "filter" | "view_model" | "clear";
  modelId?: string;
  model?: ComparisonModel;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  modelIds?: string[];
  modelDetails?: ComparisonModel;
  suggestedPrompts?: string[];
  actions?: ChatAction[];
};

type CatalogChatbotProps = {
  models: ComparisonModel[];
  onFilterByModels?: (ids: string[]) => void;
  onSelectModel?: (model: ComparisonModel) => void;
  /** Controlled: panel open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const MIN_WIDTH = 320;
const MAX_WIDTH = 560;
const DEFAULT_WIDTH = 400;

const SUGGESTED_PROMPTS = [
  "What's your hardware setup? (8GB, 16GB, or 24GB VRAM?)",
  "Looking for EU or GDPR compliance?",
  "Need models for coding or development?",
  "Prefer local-hostable or API-only?",
  "Show me the most popular models",
];

const GREETING = `Hey there! 👋 I'm your catalog guide. I can help you find the perfect AI model for your needs.

What would you like to explore?`;

function getMinVramGb(m: ComparisonModel): number | null {
  const v4 = m.intelligence?.vram_4bit_gb;
  const v8 = m.intelligence?.vram_8bit_gb;
  if (v4 == null && v8 == null) return null;
  if (v4 != null && v8 != null) return Math.min(v4, v8);
  return v4 ?? v8 ?? null;
}

function findModelByQuery(query: string, models: ComparisonModel[]): ComparisonModel | null {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return null;
  const cleaned = q
    .replace(/^(tell me about|what is|what's|details for|info on|information about|show me)\s+/i, "")
    .replace(/\?$/, "")
    .trim();
  const searchTerms = cleaned.split(/\s+/);
  const scored = models.map((m) => {
    const nameLower = m.name.toLowerCase();
    const providerLower = m.provider.toLowerCase();
    let score = 0;
    for (const term of searchTerms) {
      if (term.length < 2) continue;
      if (nameLower === term || nameLower.startsWith(term) || nameLower.includes(term)) {
        score += nameLower === term ? 100 : nameLower.startsWith(term) ? 50 : 20;
      }
      if (providerLower.includes(term)) score += 15;
    }
    return { model: m, score };
  });
  const best = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score)[0];
  return best?.model ?? null;
}

function matchModels(query: string, models: ComparisonModel[]): ComparisonModel[] {
  const q = query.toLowerCase();
  return models.filter((m) => {
    const vram = getMinVramGb(m);
    const matchEU =
      /eu|europe|gdpr|european/.test(q) &&
      (m.compliance_tags.some((t) => t.includes("EU") || t.includes("GDPR")) ||
        m.origin_country.includes("France") ||
        m.origin_country.includes("Germany"));
    const matchUS = /us|usa|american/.test(q) && m.origin_country === "United States";
    const matchIndia = /india/.test(q) && m.compliance_tags.some((t) => t.includes("India"));
    const matchVram8 = /8\s*gb|8gb/.test(q) && vram != null && vram <= 8;
    const matchVram16 = /16\s*gb|16gb/.test(q) && vram != null && vram <= 16;
    const matchCode =
      /code|coding|programming|developer/.test(q) && m.task_categories.includes("code");
    const matchLocal =
      /local|self-host|open\s*weight|hostable/.test(q) && m.openness_level === "Open Weights";
    const matchApi = /api/.test(q) && m.openness_level === "API";
    const matchProvider = m.provider.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
    const matchTask = m.task_categories.some((t) => t.includes(q.replace(/\s/g, "-")));
    const matchLang = m.languages.some((l) => l.includes(q) || q.includes(l));
    const matchPopular =
      /popular|top|best|trending/.test(q) &&
      m.intelligence?.hf_downloads != null &&
      m.intelligence.hf_downloads > 0;
    return (
      matchEU ||
      matchUS ||
      matchIndia ||
      matchVram8 ||
      matchVram16 ||
      matchCode ||
      matchLocal ||
      matchApi ||
      matchProvider ||
      matchTask ||
      matchLang ||
      matchPopular
    );
  });
}

function generateResponse(
  query: string,
  models: ComparisonModel[]
): {
  text: string;
  ids: string[];
  modelDetails?: ComparisonModel;
  actions?: ChatAction[];
  suggestedPrompts?: string[];
} {
  const q = query.toLowerCase().trim();
  if (/clear|reset|show all|remove filter/.test(q)) {
    return {
      text: "Filters cleared! You're now viewing the full catalog. What would you like to explore next?",
      ids: [],
      actions: [{ label: "Clear filter", type: "clear" }],
      suggestedPrompts: SUGGESTED_PROMPTS.slice(0, 3),
    };
  }
  const modelDetail = findModelByQuery(query, models);
  if (modelDetail) {
    const intel = modelDetail.intelligence;
    const vram = getMinVramGb(modelDetail);
    let summary = `${modelDetail.name} by ${modelDetail.provider} (${modelDetail.origin_country}). `;
    summary +=
      modelDetail.openness_level === "Open Weights"
        ? "Open weights, local-hostable. "
        : "API-only. ";
    if (modelDetail.compliance_tags.length > 0) {
      summary += `Compliance: ${modelDetail.compliance_tags.join(", ")}. `;
    }
    if (vram != null) summary += `Runs on ${vram}GB+ VRAM. `;
    if (intel?.context_window)
      summary += `Context: ${(intel.context_window / 1000).toFixed(0)}k tokens. `;
    if (intel?.top_use_cases?.length)
      summary += `Use cases: ${intel.top_use_cases.join(", ")}.`;
    return {
      text: summary,
      ids: [],
      modelDetails: modelDetail,
      actions: [
        { label: "View full details", type: "view_model", model: modelDetail },
        { label: "Filter to this model", type: "filter", modelId: modelDetail.id },
      ],
    };
  }
  const matched = matchModels(query, models);
  if (matched.length === 0) {
    return {
      text: "Hmm, I couldn't find models matching that. Try keywords like EU, 8GB, code, or local-hostable — or ask about a specific model by name!",
      ids: [],
      actions: [{ label: "Clear filter", type: "clear" }],
      suggestedPrompts: ["Show me EU models", "8GB VRAM models", "Tell me about Llama"],
    };
  }
  const names = matched.slice(0, 5).map((m) => m.name).join(", ");
  const more = matched.length > 5 ? ` and ${matched.length - 5} more` : "";
  const personality =
    matched.length > 10
      ? "Nice! There's quite a selection here. "
      : matched.length > 3
        ? "Great match! "
        : "";
  return {
    text: `${personality}Found ${matched.length} model${matched.length !== 1 ? "s" : ""}: ${names}${more}. I've applied a filter so you can browse them below.`,
    ids: matched.map((m) => m.id),
    actions: [
      ...(matched.length > 0
        ? [{ label: "View first result", type: "view_model" as const, model: matched[0] }]
        : []),
      { label: "Clear filter", type: "clear" as const },
    ],
    suggestedPrompts:
      matched.length > 0
        ? ["Show me more like this", "What about coding models?", "Clear filters"]
        : undefined,
  };
}

function ModelDetailCard({
  model,
  onViewDetails,
  onFilter,
}: {
  model: ComparisonModel;
  onViewDetails: () => void;
  onFilter: () => void;
}) {
  const intel = model.intelligence;
  const vram = getMinVramGb(model);
  return (
    <div className="mt-3 rounded-lg border border-slate-600/60 bg-slate-800/50 p-3 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
      <div className="mb-2 flex items-center gap-2">
        {model.openness_level === "Open Weights" ? (
          <Server className="h-4 w-4 text-emerald-500 [.light_&]:text-emerald-600" />
        ) : (
          <Cloud className="h-4 w-4 text-amber-500 [.light_&]:text-amber-600" />
        )}
        <span className="font-medium text-slate-100 [.light_&]:text-slate-900">{model.name}</span>
      </div>
      <div className="space-y-1 text-xs text-slate-400 [.light_&]:text-slate-600">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          {model.provider} • {model.origin_country}
        </div>
        {model.compliance_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {model.compliance_tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-0.5 rounded bg-slate-700/60 px-1.5 py-0.5 text-slate-300 [.light_&]:bg-slate-200 [.light_&]:text-slate-700"
              >
                <Shield className="h-2.5 w-2.5" />
                {t}
              </span>
            ))}
          </div>
        )}
        {(vram != null || intel?.context_window) && (
          <div className="flex flex-wrap gap-2">
            {vram != null && (
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                ≤{vram}GB VRAM
              </span>
            )}
            {intel?.context_window && (
              <span>{(intel.context_window / 1000).toFixed(0)}k context</span>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={onViewDetails}
          className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-400 hover:bg-amber-500/30 [.light_&]:bg-amber-100 [.light_&]:text-amber-800 [.light_&]:hover:bg-amber-200"
        >
          View details
          <ChevronRight className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onFilter}
          className="rounded bg-slate-700/60 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600/80 [.light_&]:bg-slate-200 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-300"
        >
          Filter to this
        </button>
      </div>
    </div>
  );
}

export function CatalogChatbot({
  models,
  onFilterByModels,
  onSelectModel,
  open: controlledOpen,
  onOpenChange,
}: CatalogChatbotProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING, suggestedPrompts: SUGGESTED_PROMPTS },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isResizing) return;
    const onMouseMove = (e: MouseEvent) => {
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      const newWidth = rect.right - e.clientX;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
    };
    const onMouseUp = () => setIsResizing(false);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
  }, [open, setOpen]);

  const handleSend = useCallback(
    (text?: string) => {
      const toSend = (text ?? input.trim()).trim();
      if (!toSend) return;
      if (!text) setInput("");
      setMessages((prev) => [...prev, { role: "user", content: toSend }]);
      setLoading(true);
      setTimeout(() => {
        const result = generateResponse(toSend, models);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.text,
            modelIds: result.ids,
            modelDetails: result.modelDetails,
            actions: result.actions,
            suggestedPrompts: result.suggestedPrompts,
          },
        ]);
        onFilterByModels?.(result.ids.length > 0 ? result.ids : []);
        setLoading(false);
      }, 400);
    },
    [input, models, onFilterByModels]
  );

  const handleAction = useCallback(
    (action: ChatAction) => {
      if (action.type === "view_model" && action.model) {
        onSelectModel?.(action.model);
      } else if (action.type === "filter" && action.modelId) {
        onFilterByModels?.([action.modelId]);
      } else if (action.type === "clear") {
        onFilterByModels?.([]);
      }
    },
    [onFilterByModels, onSelectModel]
  );

  const handleNewChat = useCallback(() => {
    setMessages([
      { role: "assistant", content: GREETING, suggestedPrompts: SUGGESTED_PROMPTS },
    ]);
    onFilterByModels?.([]);
  }, [onFilterByModels]);

  const handleClear = useCallback(() => {
    setMessages([
      { role: "assistant", content: GREETING, suggestedPrompts: SUGGESTED_PROMPTS },
    ]);
    onFilterByModels?.([]);
  }, [onFilterByModels]);

  return (
    <>
      {/* Toggle tab when closed — right edge, Cursor-style */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-0 top-1/2 z-30 flex h-24 w-8 -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-slate-700 bg-slate-800/95 shadow-lg backdrop-blur transition hover:bg-slate-700/95 hover:w-10 [.light_&]:border-slate-300 [.light_&]:bg-slate-100/95 [.light_&]:hover:bg-slate-200/95"
          style={{ top: "50%" }}
          aria-label="Open AI assistant"
        >
          <MessageCircle className="h-4 w-4 rotate-90 text-amber-500 [.light_&]:text-amber-600" />
        </button>
      )}

      {/* Side panel — pushes content when open */}
      {open && (
        <div
          ref={panelRef}
          className="relative flex shrink-0 flex-col border-l border-slate-700 bg-zinc-900 transition-[width] duration-200 ease-out [.light_&]:border-slate-300 [.light_&]:bg-slate-50"
          style={{ width: `${width}px` }}
        >
          {/* Resize handle */}
          <button
            type="button"
            onMouseDown={() => setIsResizing(true)}
            className="absolute left-0 top-0 z-10 flex h-full w-2 -translate-x-1/2 cursor-col-resize items-center justify-center hover:bg-amber-500/20 focus:outline-none"
            aria-label="Resize panel"
          >
            <div className="h-12 w-1 rounded-full bg-slate-600 opacity-0 transition hover:opacity-100 [.light_&]:bg-slate-400" />
          </button>

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-700 px-3 py-2.5 [.light_&]:border-slate-200">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-white [.light_&]:text-slate-900">
                  Catalog Assistant
                </h3>
                <p className="truncate text-xs text-slate-400 [.light_&]:text-slate-600">
                  Find sovereign AI models
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={handleNewChat}
                className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
                title="New chat"
                aria-label="New chat"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
                title="Clear chat"
                aria-label="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
                title="Close panel"
                aria-label="Close panel"
              >
                <PanelRightClose className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/80 to-amber-600/80 text-white">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={`flex min-w-0 flex-1 flex-col gap-1.5 ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-full rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-amber-500/20 text-amber-100 [.light_&]:bg-amber-100 [.light_&]:text-amber-900"
                          : "bg-slate-800 text-slate-200 [.light_&]:bg-slate-100 [.light_&]:text-slate-800"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      {msg.modelDetails && (
                        <ModelDetailCard
                          model={msg.modelDetails}
                          onViewDetails={() => onSelectModel?.(msg.modelDetails!)}
                          onFilter={() =>
                            onFilterByModels?.(msg.modelDetails ? [msg.modelDetails.id] : [])
                          }
                        />
                      )}
                      {msg.modelIds && msg.modelIds.length > 0 && !msg.modelDetails && (
                        <p className="mt-2 text-xs opacity-80 [.light_&]:text-slate-600 [.light_&]:opacity-100">
                          Click a model in the grid to view details.
                        </p>
                      )}
                    </div>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.actions.map((action, j) => (
                          <button
                            key={j}
                            type="button"
                            onClick={() => handleAction(action)}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20 [.light_&]:border-amber-500/60 [.light_&]:bg-amber-100 [.light_&]:text-amber-800 [.light_&]:hover:bg-amber-200"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="w-full text-xs text-slate-500 [.light_&]:text-slate-600">
                          Try:
                        </span>
                        {msg.suggestedPrompts.map((prompt, j) => (
                          <button
                            key={j}
                            type="button"
                            onClick={() => handleSend(prompt)}
                            className="rounded-lg border border-slate-600/60 bg-slate-800/60 px-2.5 py-1.5 text-left text-xs text-slate-300 transition hover:bg-slate-700/80 hover:text-slate-100 [.light_&]:border-slate-300 [.light_&]:bg-slate-100 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/80 to-amber-600/80 text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-lg bg-slate-800 px-3 py-2 [.light_&]:bg-slate-100">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400 [.light_&]:text-slate-600" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-slate-700 p-3 [.light_&]:border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about models..."
                  className="min-h-[40px] min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 [.light_&]:border-slate-400 [.light_&]:bg-white [.light_&]:text-slate-900 [.light_&]:placeholder-slate-600"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[40px] min-w-[40px] shrink-0 rounded-lg bg-amber-500 px-3 py-2 text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

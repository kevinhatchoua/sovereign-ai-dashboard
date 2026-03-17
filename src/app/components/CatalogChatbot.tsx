"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { useDialogAccessibility } from "@/app/lib/useDialogAccessibility";
import {
  Sparkles,
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
  Volume2,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";
import { useCatalogActions } from "@/app/lib/CatalogActionsContext";
import { useMediaQuery } from "@/app/lib/useMediaQuery";
import { useOptionalAuth } from "@/app/lib/AuthContext";
import { SelectModelModal } from "@/app/components/SelectModelModal";

type ChatAction = {
  label: string;
  type: "filter" | "view_model" | "clear" | "select_model" | "navigate";
  modelId?: string;
  model?: ComparisonModel;
  href?: string;
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
  /** Optional overrides; when in AppShell, uses CatalogActionsContext or router navigation */
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
  "What is the Overview page?",
  "How does the methodology work?",
  "What's your hardware setup? (8GB, 16GB, or 24GB VRAM?)",
  "Looking for EU or GDPR compliance?",
  "Explain sovereignty readiness levels",
  "Where does the data come from?",
];

const GREETING = `I'm your Sovereign AI Assistant. I can help with:

• **Site & content** — Overview, Methodology, Models, Learn, AI Games
• **Concepts** — sovereignty, compliance, ethics scores, Cloud Act
• **Finding models** — by hardware, region, task, or name
• **Founder** — Kevin Hatchoua created this project
• **Feedback, jokes & emoji** — send thoughts, emoji, or ask for a joke

I can also point you to the open source community (Hugging Face, GitHub) or suggest where to search for the latest info. What would you like to know?`;

const AI_DISCLAIMER = "Always review AI-generated content prior to use.";

/** Conversational greetings/courtesies — handle first so "hi" doesn't match Hindi */
const CONVERSATIONAL_PATTERNS: Array<{ pattern: RegExp; text: string }> = [
  { pattern: /^(hi|hello|hey|howdy|yo|hiya|hi there|good (morning|afternoon|evening)|how are you|what'?s up|sup)[!.]?$/i, text: "Hi! How can I help you today? I can answer questions about the site, sovereignty concepts, or help you find models by hardware, region, or task." },
  { pattern: /^(thanks?|thank you|thx|ty)[!.]?$/i, text: "You're welcome! Let me know if you have any other questions about the catalog or sovereignty." },
  { pattern: /^(bye|goodbye|see you|later)[!.]?$/i, text: "Goodbye! Feel free to come back if you need help finding models or understanding sovereignty." },
  { pattern: /^(ok|okay|got it|alright|sure|cheers?)[!.]?$/i, text: "Great! What else can I help you with?" },
];

/** Renders message content with **bold** as <strong> for accessibility (no raw asterisks) */
function renderMessageContent(text: string): ReactNode {
  const parts: Array<{ type: "text"; value: string } | { type: "bold"; value: string }> = [];
  const re = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, m.index) });
    }
    parts.push({ type: "bold", value: m[1] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: "text", value: text.slice(lastIndex) });
  if (parts.length === 0) return <span>{text}</span>;
  return parts.map((p, i) =>
    p.type === "bold" ? (
      <strong key={i} className="font-semibold">{p.value}</strong>
    ) : (
      <span key={i}>{p.value}</span>
    )
  );
}

/** Joke/personality queries — let the API handle so the LLM can tell a joke (don't treat as model search) */
function isJokeOrPersonalityQuery(msg: string): boolean {
  const t = msg.trim();
  if (t.length === 0) return false;
  const lower = t.toLowerCase();
  if (/^(tell me a joke|joke|jokes|something funny|make me laugh|got any jokes?|any jokes?|do you have jokes?|can you tell (me )?a joke|can you tell jokes?|give me a joke|say something funny|entertain me)$/i.test(t)) return true;
  if (/\b(joke|jokes|funny|make me laugh|something funny)\b/.test(lower) && (lower.includes("?") || lower.length < 30)) return true;
  return false;
}

/** Current events, news, politics, or clearly off-catalog topics — let the API respond (do NOT return catalog models) */
function isOffTopicOrCurrentEventsQuery(msg: string): boolean {
  const t = msg.trim().toLowerCase();
  if (t.length < 5) return false;
  const indicators = [
    /\b(wars?|conflict|invasion|election|politics|news|current events|what'?s happening|whats up with|latest on)\b/,
    /\b(iran|iraq|ukraine|russia|gaza|israel|china|north korea)\b/,
    /^(how|what|why|is it true)\s+(about|is going on with|happened to)\s+/,
    /\b(breaking|headline|today'?s news)\b/,
  ];
  if (indicators.some((p) => p.test(t))) return true;
  return false;
}

/** Natural-language/conversational questions about the assistant or chat — let the API answer (don't treat as catalog search) */
function isConversationalOrIdentityQuery(msg: string): boolean {
  const t = msg.trim().toLowerCase();
  if (t.length < 3) return false;
  const identityPatterns = [
    /^(what|who) (model |are )?you\??$/i,
    /^what (model|ai|bot|assistant) (are you|is this)\??$/i,
    /^(who|what) are you\??$/i,
    /^how (do you|does this) work\??$/i,
    /^what can you do\??$/i,
    /^are you (a )?(bot|ai|model|assistant|real)\??$/i,
    /^am i (talking to|speaking with)/i,
    /^(tell me )?about yourself\??$/i,
    /^what('s| is) your (name|purpose|role)\??$/i,
    /^who (are you|am i talking to)\??$/i,
  ];
  if (identityPatterns.some((p) => p.test(t))) return true;
  if (/\b(what model are you|who are you|what are you|how do you work|what can you do)\b/.test(t) && t.length < 60) return true;
  return false;
}

/** Emoji-only or very short non-search queries — let the API handle (jokes, emoji, quirks) */
function isEmojiOrShortQuirk(msg: string): boolean {
  const t = msg.trim();
  if (t.length === 0) return false;
  if (t.length <= 3 && /^[\p{Emoji}\p{Symbol}\s]+$/u.test(t)) return true;
  if (isJokeOrPersonalityQuery(msg)) return true;
  if (/^(tell me a joke|joke|something funny|make me laugh|🤣|😀|😊|😂|👍|🙌)$/i.test(t)) return true;
  return false;
}

/** General site/concept knowledge — answers before model-specific logic */
function getGeneralKnowledgeResponse(query: string): {
  text: string;
  ids: string[];
  actions?: ChatAction[];
  suggestedPrompts?: string[];
} | null {
  const q = query.toLowerCase().trim();

  // Conversational greetings/courtesies first (prevents "hi" from matching Hindi)
  for (const { pattern, text } of CONVERSATIONAL_PATTERNS) {
    if (pattern.test(q)) {
      return {
        text,
        ids: [],
        suggestedPrompts: SUGGESTED_PROMPTS.slice(0, 3),
      };
    }
  }

  // Overview / Dashboard page
  if (/overview|dashboard|catalog overview|what is the overview|overview page|go to overview/.test(q)) {
    return {
      text: "The **Overview** page (Dashboard) gives you a quick glance at the sovereign AI catalog: total models, open weights vs API-only split, advanced sovereignty count, and average ethics score. It also shows charts for top providers, origin countries, and readiness levels. Use it to get a high-level picture before diving into the Models catalog.",
      ids: [],
      actions: [{ label: "Go to Overview", type: "navigate", href: "/dashboard" }],
      suggestedPrompts: ["Go to Overview", "How does the methodology work?", "Show me EU models"],
    };
  }

  // Methodology
  if (/methodology|how (do|does) (we|you) (assess|score|compute)|four dimensions|readiness level|go to methodology/.test(q)) {
    return {
      text: "Our **Open Methodology** is based on McKinsey's Four Dimensions of Sovereignty: Data, Operational, Technological, and Infrastructure. We compute a **Sovereignty Readiness** score (0–100) and apply a Cloud Act penalty for US-exposed models. Levels: **Advanced** (75–100), **Intermediate** (50–74), **Foundation** (0–49). See the Methodology page for full details and references (Red Hat, SUSE, Forrester, NuEnergy.ai).",
      ids: [],
      actions: [{ label: "Go to Methodology", type: "navigate", href: "/methodology" }],
      suggestedPrompts: ["What is Cloud Act exposure?", "Explain ethics score", "Go to Methodology"],
    };
  }

  // Ethics score
  if (/ethics score|ethical (design )?score|how (do|does) ethics/.test(q)) {
    return {
      text: "The **Ethics Score** (0–100) combines Data Sovereignty (50%) and Transparency (50%). It rewards open weights, data residency, sovereign deployment, compliance tags, and documentation. Green (>70) = strong, Amber (40–70) = moderate, Red (<40) = review needed. Bias mitigation is excluded until we have authoritative bias data.",
      ids: [],
      suggestedPrompts: ["What is sovereignty readiness?", "Show me high-ethics models", "Explain GDPR"],
    };
  }

  // Sovereignty concepts
  if (/sovereignty|sovereign ai|what (is|does) sovereign/.test(q) && !/model|find|show/.test(q)) {
    return {
      text: "**Sovereign AI** means AI you own and control—data, models, and infrastructure. We assess it across Four Dimensions (McKinsey): Data (where data lives), Operational (who manages the stack), Technological (open vs proprietary), and Infrastructure (compute control). Models with open weights, domestic deployment, and strong compliance score higher.",
      ids: [],
      suggestedPrompts: ["Explain readiness levels", "What is Cloud Act?", "Go to Methodology"],
    };
  }

  // Cloud Act
  if (/cloud act|cloudact|us (cloud|data) (act|exposure)/.test(q)) {
    return {
      text: "The **US Cloud Act** (Clarifying Lawful Overseas Use of Data) can compel US-based providers to disclose data in certain circumstances. We flag models from US-based providers or with US origin as having Cloud Act exposure. This is an informational risk indicator for organizations with strict data sovereignty requirements—it does not imply illegality.",
      ids: [],
      suggestedPrompts: ["Show me models without Cloud Act exposure", "What is GDPR?", "Go to Methodology"],
    };
  }

  // GDPR / EU / India DPDP
  if (/gdpr|eu ai act|european|india dpdp|data (protection|residency|localization)/.test(q) && !/model|find|show|compliance tag/.test(q)) {
    return {
      text: "**GDPR** (EU General Data Protection Regulation) governs data privacy in the EU. The **EU AI Act** regulates AI systems by risk level. **India DPDP** (Digital Personal Data Protection) is India's data protection law. **Data residency** means data stays in a specific jurisdiction. Models tagged with GDPR, EU AI Act Ready, or India Data Localization meet these requirements. Use the Models catalog and filter by compliance to find them.",
      ids: [],
      suggestedPrompts: ["Show me GDPR models", "What is India DPDP?", "Looking for EU compliance"],
    };
  }

  // Data sources / Hugging Face / references
  if (/data source|where (does|do) (the )?data|hugging face|mckinsey|red hat|suse|forrester|reference/.test(q)) {
    return {
      text: "Model metadata comes from **public registries**, provider documentation, and **Hugging Face**. Compliance tags follow EU AI Act, India DPDP, and US Executive Order. Our methodology references **McKinsey** (Four Dimensions), **Red Hat** (Digital Sovereignty Readiness), **SUSE** (Cloud Sovereignty Framework), **Forrester**, and **NuEnergy.ai** (CAISIC). You can report corrections via Report Compliance Dispute.",
      ids: [],
      actions: [{ label: "Go to Methodology", type: "navigate", href: "/methodology" }],
      suggestedPrompts: ["Go to Methodology", "How do I report an error?", "Show me models"],
    };
  }

  // Navigation / pages
  if (/go to (models|catalog)|navigate|where is|how (do i|to) (get to|find|access)|models page|catalog page/.test(q)) {
    return {
      text: "**Models** (home) — Browse and filter the catalog. **Overview** — High-level stats and charts. **Methodology** — How we assess sovereignty. Use the top navigation to switch. I can also filter the Models catalog for you—just ask for models by hardware, region, or task.",
      ids: [],
      actions: [
        { label: "Go to Models", type: "navigate", href: "/" },
        { label: "Go to Overview", type: "navigate", href: "/dashboard" },
        { label: "Go to Methodology", type: "navigate", href: "/methodology" },
      ],
      suggestedPrompts: ["Show me EU models", "What is the Overview?", "Best model for 8GB VRAM"],
    };
  }

  // Founder / who built this
  if (/who (built|created|made|runs|owns)|founder|kevin|hatchoua|creator|author|team behind/.test(q)) {
    return {
      text: "**Kevin Hatchoua** created and leads the Sovereign AI Transparency Dashboard. It's an open-source project to help developers and enterprises navigate sovereign AI, data residency, and compliance. You can reach out or contribute via the GitHub repo linked in the app.",
      ids: [],
      suggestedPrompts: ["What is the Overview?", "How does the methodology work?", "Show me EU models"],
    };
  }

  // Feedback / contact
  if (/feedback|contact|reach (you|out)|get in touch|suggest|compliment|complaint/.test(q)) {
    return {
      text: "Thanks for your interest! You can share feedback or get in touch via the project's **GitHub** repository (see links in the app). For compliance or data corrections, use **Report Compliance Dispute** on any model's details.",
      ids: [],
      suggestedPrompts: ["Who built this?", "Go to Methodology", "Show me models"],
    };
  }

  // Report dispute / corrections
  if (/report|dispute|correction|error|wrong|incorrect/.test(q)) {
    return {
      text: "To report a compliance dispute or correction: open a model's details, then click **Report Compliance Dispute**. Describe the issue and optionally your email. Submissions are reviewed for catalog updates. For broader contributions, check the GitHub repo linked in the app.",
      ids: [],
      suggestedPrompts: ["Show me a model", "What is the methodology?", "Go to Models"],
    };
  }

  // Open weights vs API
  if (/open weight|api.?only|local.?host|self.?host|hostable/.test(q) && !/model|find|show/.test(q)) {
    return {
      text: "**Open Weights** models let you download and run them yourself—full control, no provider lock-in. **API-only** models are accessed via a provider's API; you depend on their infrastructure and policies. Open weights score higher for sovereignty. Filter by Openness in the Models catalog.",
      ids: [],
      suggestedPrompts: ["Show me open weights models", "Show me API-only models", "What is sovereignty?"],
    };
  }

  return null;
}

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
  if (isJokeOrPersonalityQuery(query) || isConversationalOrIdentityQuery(query) || isOffTopicOrCurrentEventsQuery(query)) return null;
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
    const matchVram24 = /24\s*gb|24gb/.test(q) && vram != null && vram <= 24;
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
      matchVram24 ||
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

  // Emoji-only or joke/personality — let API respond (LLM tells joke or responds in kind); fallback if API unavailable
  if (isEmojiOrShortQuirk(query)) {
    return {
      text: "😊 I'm here! Ask me anything about the site, models—or ask me for a joke.",
      ids: [],
      suggestedPrompts: ["Tell me a joke", "Who built this?", "What is sovereignty?"],
    };
  }

  // Natural-language/conversational (e.g. "what model are you", "who are you") — let API answer like ChatGPT, don't list catalog
  if (isConversationalOrIdentityQuery(query)) {
    return {
      text: "I'm the Sovereign AI Assistant—here to help with the site and catalog. Ask me anything.",
      ids: [],
      suggestedPrompts: ["What can you do?", "Who built this?", "What is the Overview page?"],
    };
  }

  // Current events, news, politics, or off-catalog topics — let API respond; do NOT return catalog model info
  if (isOffTopicOrCurrentEventsQuery(query)) {
    return {
      text: "I don't have real-time news access. For current events, try a web search or a trusted news source—I'm here to help with the sovereign AI catalog.",
      ids: [],
      suggestedPrompts: ["What is the Overview page?", "Show me EU models", "Who built this?"],
    };
  }

  // General site/concept content first — help with any site, concepts, or references
  const general = getGeneralKnowledgeResponse(query);
  if (general) return general;

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
        { label: "Select model", type: "select_model", model: modelDetail },
        { label: "View full details", type: "view_model", model: modelDetail },
        { label: "Filter to this model", type: "filter", modelId: modelDetail.id },
      ],
    };
  }
  if (isConversationalOrIdentityQuery(query) || isOffTopicOrCurrentEventsQuery(query)) {
    return {
      text: "I'm your assistant for this site—happy to help with the catalog or point you to where to find other info. What would you like to know?",
      ids: [],
      suggestedPrompts: ["What can you do?", "Who built this?", "Show me EU models"],
    };
  }
  const matched = matchModels(query, models);
  if (matched.length === 0) {
    return {
      text: "I couldn't find models matching that. Try: EU, 8GB, code, or local-hostable — or ask about a specific model by name. Or ask me about the site (Overview, Methodology), concepts (sovereignty, ethics score), or external references.",
      ids: [],
      actions: [{ label: "Clear filter", type: "clear" }],
      suggestedPrompts: ["What is the Overview page?", "How does the methodology work?", "Show me EU models"],
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
        ? [
            { label: "Select first result", type: "select_model" as const, model: matched[0] },
            { label: "View first result", type: "view_model" as const, model: matched[0] },
          ]
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
  onSelect,
}: {
  model: ComparisonModel;
  onViewDetails: () => void;
  onFilter: () => void;
  onSelect?: () => void;
}) {
  const intel = model.intelligence;
  const vram = getMinVramGb(model);
  return (
    <div className="mt-3 rounded-lg border border-slate-600/60 bg-slate-800/50 p-3 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
      <div className="mb-2 flex items-center gap-2">
        {model.openness_level === "Open Weights" ? (
          <Server className="h-4 w-4 text-blue-600 [.light_&]:text-blue-600" />
        ) : (
          <Cloud className="h-4 w-4 text-slate-500 [.light_&]:text-slate-600" />
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
      <div className="mt-2 flex flex-wrap gap-2">
        {onSelect && (
          <button
            type="button"
            onClick={onSelect}
            className="cta-primary text-xs"
          >
            Select model
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
        <button
          type="button"
          onClick={onViewDetails}
          className="cta-primary text-xs"
        >
          View details
          <ChevronRight className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onFilter}
          className="cta-secondary text-xs"
        >
          Filter to this
        </button>
      </div>
    </div>
  );
}

export function CatalogChatbot({
  models,
  onFilterByModels: onFilterByModelsProp,
  onSelectModel: onSelectModelProp,
  open: controlledOpen,
  onOpenChange,
}: CatalogChatbotProps) {
  const router = useRouter();
  const { actions } = useCatalogActions();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Prefer props, then context (catalog page), else navigate to catalog with params
  const onFilterByModels = onFilterByModelsProp ?? actions?.filterByModels ?? ((ids: string[]) => {
    const params = new URLSearchParams();
    if (ids.length > 0) params.set("models", ids.join(","));
    router.push(ids.length > 0 ? `/?${params}` : "/");
  });
  const onSelectModel = onSelectModelProp ?? actions?.selectModel ?? ((model: ComparisonModel | null) => {
    if (!model) return;
    router.push(`/?model=${model.id}`);
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING, suggestedPrompts: SUGGESTED_PROMPTS },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s${Date.now()}`
  );
  const isXl = useMediaQuery("(min-width: 1280px)");
  const auth = useOptionalAuth();

  // Open by default on xl (desktop) for integrated OpenShift-style layout
  useEffect(() => {
    if (isXl && controlledOpen === undefined && !internalOpen) {
      setInternalOpen(true);
    }
  }, [isXl]); // eslint-disable-line react-hooks/exhaustive-deps
  const user = auth?.user ?? null;
  const [selectModel, setSelectModel] = useState<ComparisonModel | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const clearConfirmRef = useRef<HTMLDivElement>(null);
  const [canSpeak, setCanSpeak] = useState(false);
  useDialogAccessibility(clearConfirmOpen, () => setClearConfirmOpen(false), clearConfirmRef);

  useEffect(() => {
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

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
    async (text?: string) => {
      const toSend = (text ?? input.trim()).trim();
      if (!toSend) return;
      if (!text) setInput("");
      setMessages((prev) => [...prev, { role: "user", content: toSend }]);
      setLoading(true);

      const ruleResult = generateResponse(toSend, models);
      const chatHistory = [...messages, { role: "user" as const, content: toSend }];

      const context = {
        filterIds: ruleResult.ids.length > 0 ? ruleResult.ids : undefined,
        suggestedActions: ruleResult.actions?.map((a) => a.label),
        fallback: ruleResult.text,
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: chatHistory.map((m) => ({ role: m.role, content: m.content })),
            context,
            sessionId,
          }),
        });
        const data = (await res.json()) as { content?: string; fallback?: string; error?: string };
        const isConversationalIntent =
          isEmojiOrShortQuirk(toSend) || isConversationalOrIdentityQuery(toSend) || isOffTopicOrCurrentEventsQuery(toSend);
        const connectionFallback =
          "I couldn't connect just now. Please try again in a moment—I'd love to help.";
        const content =
          res.ok && data.content
            ? data.content
            : (data.fallback ?? (isConversationalIntent ? connectionFallback : ruleResult.text));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content,
            modelIds: ruleResult.ids,
            modelDetails: ruleResult.modelDetails,
            actions: ruleResult.actions,
            suggestedPrompts: ruleResult.suggestedPrompts,
          },
        ]);
      } catch {
        const isConversationalIntent =
          isEmojiOrShortQuirk(toSend) || isConversationalOrIdentityQuery(toSend) || isOffTopicOrCurrentEventsQuery(toSend);
        const connectionFallback =
          "I couldn't connect just now. Please try again in a moment—I'd love to help.";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: isConversationalIntent ? connectionFallback : ruleResult.text,
            modelIds: ruleResult.ids,
            modelDetails: ruleResult.modelDetails,
            actions: ruleResult.actions,
            suggestedPrompts: ruleResult.suggestedPrompts,
          },
        ]);
      }
      onFilterByModels?.(ruleResult.ids.length > 0 ? ruleResult.ids : []);
      setLoading(false);
    },
    [input, messages, models, onFilterByModels, sessionId]
  );

  const handleAction = useCallback(
    (action: ChatAction) => {
      if (action.type === "select_model" && action.model) {
        setSelectModel(action.model);
      } else if (action.type === "view_model" && action.model) {
        onSelectModel?.(action.model);
      } else if (action.type === "filter" && action.modelId) {
        onFilterByModels?.([action.modelId]);
      } else if (action.type === "clear") {
        onFilterByModels?.([]);
      } else if (action.type === "navigate" && action.href) {
        router.push(action.href);
      }
    },
    [onFilterByModels, onSelectModel, router]
  );

  const resetChat = useCallback(() => {
    setSessionId(
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s${Date.now()}`
    );
    setMessages([
      { role: "assistant", content: GREETING, suggestedPrompts: SUGGESTED_PROMPTS },
    ]);
    setInput("");
    setSelectModel(null);
    onFilterByModels?.([]);
  }, [onFilterByModels]);

  const handleNewChat = useCallback(() => {
    resetChat();
    setClearConfirmOpen(false);
  }, [resetChat]);

  const handleClearClick = useCallback(() => {
    const hasConversation = messages.length > 1;
    if (hasConversation) {
      setClearConfirmOpen(true);
    } else {
      resetChat();
    }
  }, [messages.length, resetChat]);

  const handleClearConfirm = useCallback(() => {
    resetChat();
    setClearConfirmOpen(false);
  }, [resetChat]);

  return (
    <>
      {selectModel && (
        <SelectModelModal
          model={selectModel}
          user={user}
          onClose={() => setSelectModel(null)}
        />
      )}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            ref={clearConfirmRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-dialog-title"
            aria-describedby="clear-dialog-desc"
            className="glass-strong mx-4 w-full max-w-sm rounded-2xl border border-slate-700/50 p-6 shadow-2xl [.light_&]:border-slate-200/60"
          >
            <h3 id="clear-dialog-title" className="text-lg font-semibold text-white [.light_&]:text-slate-900">
              Clear conversation?
            </h3>
            <p id="clear-dialog-desc" className="mt-2 text-sm text-slate-400 [.light_&]:text-slate-600">
              This will remove all messages and reset the assistant. Your catalog filters will also be cleared.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setClearConfirmOpen(false)}
                className="flex-1 rounded-lg border border-slate-600 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 [.light_&]:border-slate-300 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearConfirm}
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 [.light_&]:bg-emerald-600 [.light_&]:hover:bg-emerald-500"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toggle tab when closed — right edge, prominent AI branding */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group fixed right-0 top-1/2 z-30 flex h-20 w-12 -translate-y-1/2 items-center justify-center gap-1.5 rounded-l-xl border border-teal-600/60 border-r-0 bg-teal-600 py-3 pl-2 pr-3 shadow-lg shadow-teal-600/30 transition-all hover:w-14 [.light_&]:bg-teal-600 [.light_&]:shadow-teal-600/25"
          style={{ top: "50%" }}
          aria-label="Open Sovereign AI Assistant"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-white" aria-hidden />
          <span className="text-xs font-bold text-white">AI</span>
        </button>
      )}

      {/* Backdrop when overlay (mobile/tablet) */}
      {open && !isXl && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Side panel — overlay on mobile/tablet; beside content on xl+ (OpenShift-style, outside scroll area) */}
      {open && (
        <div
          ref={panelRef}
          className={`chat-panel-bg flex shrink-0 flex-col overflow-hidden rounded-l-2xl border-l border-slate-700/50 shadow-2xl transition-[width] duration-200 ease-out [.light_&]:border-slate-200/60 ${
            isXl
              ? "h-screen max-h-screen"
              : "fixed inset-y-0 right-0 z-40 flex h-[100dvh] w-[min(100vw-2rem,400px)] flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]"
          }`}
          style={isXl ? { width: `${width}px` } : undefined}
        >
          {/* Resize handle — only on xl */}
          {isXl && (
          <button
            type="button"
            onMouseDown={() => setIsResizing(true)}
            className="absolute left-0 top-0 z-10 flex h-full w-2 -translate-x-1/2 cursor-col-resize items-center justify-center hover:bg-blue-600/20 focus:outline-none"
            aria-label="Resize panel"
          >
            <div className="h-12 w-1 rounded-full bg-slate-600 opacity-0 transition hover:opacity-100 [.light_&]:bg-slate-400" />
          </button>
          )}

          {/* Header — OpenShift-style with prominent AI branding */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-700/60 px-3 py-2.5 [.light_&]:border-slate-200/60">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-blue-600/50 bg-gradient-to-br from-blue-600 to-blue-600 text-white shadow-lg shadow-blue-600/20 [.light_&]:border-blue-600/60">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-white [.light_&]:text-slate-900">
                  Sovereign AI Assistant
                </h3>
                <p className="truncate text-xs text-slate-400 [.light_&]:text-slate-600">
                  Help with site content, concepts, and models
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={handleNewChat}
                className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
                title="New chat — start a fresh conversation and clear filters"
                aria-label="New chat"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleClearClick}
                className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
                title="Clear conversation — removes all messages and resets the assistant"
                aria-label="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-900"
                title="Close panel — collapse the assistant to the side"
                aria-label="Close panel"
              >
                <PanelRightClose className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* OpenShift-style welcome when conversation is fresh */}
              {messages.length === 1 &&
                messages[0].role === "assistant" &&
                messages[0].suggestedPrompts &&
                messages[0].suggestedPrompts.length > 0 && (
                  <div className="flex flex-col items-center gap-6 pb-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-blue-600/60 bg-gradient-to-br from-blue-600 to-blue-600 text-white shadow-xl shadow-blue-600/25 [.light_&]:border-blue-600/50">
                      <Bot className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-white [.light_&]:text-slate-900">
                        Where should we start?
                      </h4>
                      <p className="mt-1 text-sm text-slate-400 [.light_&]:text-slate-600">
                        Site content, concepts, models, or external references
                      </p>
                    </div>
                    <div className="grid w-full max-w-2xl grid-cols-3 gap-2">
                      {messages[0].suggestedPrompts.slice(0, 3).map((prompt, j) => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => handleSend(prompt)}
                          className="cta-secondary min-w-0 text-center text-sm"
                        >
                          <span className="leading-tight">{prompt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              {messages.map((msg, i) => {
                const isWelcomeMsg =
                  i === 0 &&
                  msg.role === "assistant" &&
                  msg.suggestedPrompts &&
                  msg.suggestedPrompts.length > 0;
                if (isWelcomeMsg) return null;
                return (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/80 to-blue-600/80 text-white">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={`flex min-w-0 flex-1 flex-col gap-1.5 ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-full rounded-xl px-3 py-2 text-sm backdrop-blur-sm ${
                        msg.role === "user"
                          ? "bg-emerald-500/25 text-emerald-100 [.light_&]:bg-emerald-100/90 [.light_&]:text-emerald-900"
                          : "bg-slate-800/70 text-slate-200 [.light_&]:bg-white/80 [.light_&]:text-slate-800"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {renderMessageContent(msg.content)}
                      </div>
                      {msg.role === "assistant" && msg.content && canSpeak && (
                        <button
                          type="button"
                          onClick={() => {
                            const synth = window.speechSynthesis;
                            if (synth) {
                              synth.cancel();
                              const utterance = new SpeechSynthesisUtterance(msg.content.replace(/\*\*/g, ""));
                              utterance.rate = 0.95;
                              synth.speak(utterance);
                            }
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-700/50 hover:text-slate-300 [.light_&]:text-slate-500 [.light_&]:hover:bg-slate-200 [.light_&]:hover:text-slate-700"
                          title="Read aloud (text-to-speech)"
                          aria-label="Read aloud"
                        >
                          <Volume2 className="h-3 w-3" />
                          Read aloud
                        </button>
                      )}
                      {msg.modelDetails && (
                        <ModelDetailCard
                          model={msg.modelDetails}
                          onViewDetails={() => onSelectModel?.(msg.modelDetails!)}
                          onFilter={() =>
                            onFilterByModels?.(msg.modelDetails ? [msg.modelDetails.id] : [])
                          }
                          onSelect={() => setSelectModel(msg.modelDetails!)}
                        />
                      )}
                      {msg.modelIds && msg.modelIds.length > 0 && !msg.modelDetails && (
                        <p className="mt-2 text-xs opacity-80 [.light_&]:text-slate-600 [.light_&]:opacity-100">
                          Click a model in the grid to view details.
                        </p>
                      )}
                    </div>
                    {msg.actions && msg.actions.length > 0 && !msg.modelDetails && (
                      <div className="flex flex-wrap gap-2">
                        {msg.actions.map((action, j) => {
                          const isExternalHref = action.type === "navigate" && action.href?.startsWith("http");
                          if (isExternalHref && action.href) {
                            return (
                              <a
                                key={j}
                                href={action.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cta-primary"
                              >
                                {action.label}
                                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              </a>
                            );
                          }
                          return (
                            <button
                              key={j}
                              type="button"
                              onClick={() => handleAction(action)}
                              className="cta-primary"
                            >
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="w-full text-xs font-medium uppercase tracking-wider text-slate-500 [.light_&]:text-slate-600">
                          Try:
                        </span>
                        {msg.suggestedPrompts.map((prompt, j) => (
                          <button
                            key={j}
                            type="button"
                            onClick={() => handleSend(prompt)}
                            className="cta-secondary text-sm"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/80 to-blue-600/80 text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-lg bg-slate-800 px-3 py-2 [.light_&]:bg-slate-100">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400 [.light_&]:text-slate-600" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input + disclaimer — always visible at bottom (never scrolls away) */}
            <div className="shrink-0 space-y-2 border-t border-slate-700/50 p-3 [.light_&]:border-slate-200/60">
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
                  placeholder="What sovereign AI models fit your needs?"
                  className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-slate-600/60 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 backdrop-blur-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 [.light_&]:border-slate-300/80 [.light_&]:bg-white [.light_&]:text-slate-900 [.light_&]:placeholder-slate-600"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[44px] min-w-[44px] shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <p className="text-[11px] text-slate-500 [.light_&]:text-slate-600">
                {AI_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

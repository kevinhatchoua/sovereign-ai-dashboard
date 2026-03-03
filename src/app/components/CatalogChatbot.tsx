"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  modelIds?: string[];
};

type CatalogChatbotProps = {
  models: ComparisonModel[];
  onFilterByModels?: (ids: string[]) => void;
  onSelectModel?: (model: ComparisonModel) => void;
};

const GREETING = `Hi! I can help you navigate the catalog. Try asking:
• "Show me EU compliant models"
• "Which models work with 8GB VRAM?"
• "Models for coding"
• "Local-hostable models"
• "GDPR compliant"`;

function getMinVramGb(m: ComparisonModel): number | null {
  const v4 = m.intelligence?.vram_4bit_gb;
  const v8 = m.intelligence?.vram_8bit_gb;
  if (v4 == null && v8 == null) return null;
  if (v4 != null && v8 != null) return Math.min(v4, v8);
  return v4 ?? v8 ?? null;
}

function matchModels(query: string, models: ComparisonModel[]): ComparisonModel[] {
  const q = query.toLowerCase();
  return models.filter((m) => {
    const vram = getMinVramGb(m);
    const matchEU = /eu|europe|gdpr|european/.test(q) &&
      (m.compliance_tags.some((t) => t.includes("EU") || t.includes("GDPR")) || m.origin_country.includes("France") || m.origin_country.includes("Germany"));
    const matchUS = /us|usa|american/.test(q) && m.origin_country === "United States";
    const matchIndia = /india/.test(q) && m.compliance_tags.some((t) => t.includes("India"));
    const matchVram8 = /8\s*gb|8gb/.test(q) && vram != null && vram <= 8;
    const matchVram16 = /16\s*gb|16gb/.test(q) && vram != null && vram <= 16;
    const matchCode = /code|coding|programming|developer/.test(q) && m.task_categories.includes("code");
    const matchLocal = /local|self-host|open\s*weight|hostable/.test(q) && m.openness_level === "Open Weights";
    const matchApi = /api/.test(q) && m.openness_level === "API";
    const matchProvider = m.provider.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
    const matchTask = m.task_categories.some((t) => t.includes(q.replace(/\s/g, "-")));
    const matchLang = m.languages.some((l) => l.includes(q) || q.includes(l));
    return matchEU || matchUS || matchIndia || matchVram8 || matchVram16 || matchCode || matchLocal || matchApi || matchProvider || matchTask || matchLang;
  });
}

function generateResponse(query: string, models: ComparisonModel[]): { text: string; ids: string[] } {
  const matched = matchModels(query, models);
  if (matched.length === 0) {
    return {
      text: "I couldn't find models matching that. Try different keywords like EU, 8GB, code, or local-hostable.",
      ids: [],
    };
  }
  const names = matched.slice(0, 5).map((m) => m.name).join(", ");
  const more = matched.length > 5 ? ` and ${matched.length - 5} more` : "";
  return {
    text: `Found ${matched.length} model${matched.length !== 1 ? "s" : ""}: ${names}${more}. I've applied a filter to show them.`,
    ids: matched.map((m) => m.id),
  };
}

export function CatalogChatbot({
  models,
  onFilterByModels,
  onSelectModel,
}: CatalogChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    setTimeout(() => {
      const { text: reply, ids } = generateResponse(text, models);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, modelIds: ids },
      ]);
      onFilterByModels?.(ids.length > 0 ? ids : []);
      setLoading(false);
    }, 400);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 [.light_&]:focus:ring-offset-white"
        aria-label="Open catalog assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[28rem] w-96 flex-col rounded-xl border border-slate-700 bg-zinc-900 shadow-2xl [.light_&]:border-slate-300 [.light_&]:bg-white">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3 [.light_&]:border-slate-200">
            <h3 className="font-semibold text-white [.light_&]:text-slate-900">
              Catalog Assistant
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white [.light_&]:hover:bg-slate-100 [.light_&]:hover:text-slate-900"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-amber-500/20 text-amber-100 [.light_&]:bg-amber-100 [.light_&]:text-amber-900"
                      : "bg-slate-800 text-slate-200 [.light_&]:bg-slate-100 [.light_&]:text-slate-800"
                  }`}
                >
                  {msg.content}
                  {msg.modelIds && msg.modelIds.length > 0 && (
                    <p className="mt-2 text-xs opacity-80">
                      Click a model in the grid to view details.
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-slate-800 px-3 py-2 [.light_&]:bg-slate-100">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-slate-700 p-3 [.light_&]:border-slate-200">
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
                className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 [.light_&]:border-slate-300 [.light_&]:bg-white [.light_&]:text-slate-900 [.light_&]:placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-amber-500 px-3 py-2 text-white hover:bg-amber-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

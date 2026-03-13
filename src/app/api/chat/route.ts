import { NextRequest, NextResponse } from "next/server";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_MODEL_FALLBACK = "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `You are the Sovereign AI Assistant for a catalog of sovereign AI models. You help users with:
- Site content: Overview (dashboard with stats), Methodology (how we assess sovereignty), Models (catalog)
- Concepts: sovereignty, compliance, ethics scores, Cloud Act, GDPR, open weights vs API
- Finding models: by hardware (8GB/16GB VRAM), region (EU, US, India), task (code, conversational), or name

Be conversational, friendly, and concise (2–4 sentences). If the user says thanks, hello, goodbye, or ok, respond naturally and briefly.
Use markdown **bold** when helpful. Keep responses focused.`;

const FALLBACK_RESPONSE =
  "I couldn't find models matching that. Try: EU, 8GB, code, or local-hostable — or ask about a specific model by name. Or ask me about the site (Overview, Methodology), concepts (sovereignty, ethics score), or external references.";

/** GET /api/chat — Check if Groq API is configured (for debugging) */
export async function GET() {
  const configured = !!process.env.GROQ_API_KEY?.trim();
  return NextResponse.json({
    configured,
    message: configured
      ? "GROQ_API_KEY is set. Chat should work."
      : "GROQ_API_KEY is not set. Add it in Vercel: Settings → Environment Variables → GROQ_API_KEY, then redeploy.",
  });
}

async function callGroq(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model: string
): Promise<{ ok: boolean; content?: string; status?: number; error?: string }> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, status: res.status, error: err };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  return { ok: true, content: content ?? "" };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY?.trim();

    const body = await req.json();
    const { messages, context } = body as {
      messages: Array<{ role: string; content: string }>;
      context?: { filterIds?: string[]; suggestedActions?: string[]; fallback?: string };
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array required" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Chat API not configured. Set GROQ_API_KEY in Vercel (Settings → Environment Variables), then redeploy.",
          fallback: context?.fallback ?? FALLBACK_RESPONSE,
        },
        { status: 503 }
      );
    }

    const contextNote = context?.suggestedActions?.length
      ? `\n\nSuggested actions to mention: ${context.suggestedActions.join(", ")}.`
      : context?.filterIds?.length
        ? `\n\nUser asked for models. Matching model IDs: ${context.filterIds.join(", ")}. Mention that results are filtered below.`
        : "";

    const systemContent = SYSTEM_PROMPT + contextNote;

    const groqMessages = [
      { role: "system", content: systemContent },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    let result = await callGroq(apiKey, groqMessages, GROQ_MODEL);

    // If 70B fails (rate limit, etc.), try 8B
    if (!result.ok && (result.status === 429 || result.status === 402)) {
      console.warn("Groq 70B failed, trying 8B:", result.status, result.error);
      result = await callGroq(apiKey, groqMessages, GROQ_MODEL_FALLBACK);
    }

    if (!result.ok) {
      console.error("Groq API error:", result.status, result.error);
      return NextResponse.json(
        {
          error: "LLM request failed",
          fallback: context?.fallback ?? FALLBACK_RESPONSE,
        },
        { status: 502 }
      );
    }

    const content = result.content?.trim();
    if (!content) {
      return NextResponse.json(
        { content: context?.fallback ?? FALLBACK_RESPONSE },
        { status: 200 }
      );
    }

    return NextResponse.json({ content });
  } catch (e) {
    console.error("Chat API error:", e);
    return NextResponse.json(
      { error: "Chat failed", fallback: FALLBACK_RESPONSE },
      { status: 500 }
    );
  }
}

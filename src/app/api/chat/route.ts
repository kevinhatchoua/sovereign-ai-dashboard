import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_MODEL_FALLBACK = "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `You are the Sovereign AI Assistant for the Sovereign AI Transparency Dashboard. You help with:

**App, site, and content:** Answer any query, thought, feedback, question, or comment about the app or site. Cover: Overview (dashboard), Methodology (how we assess sovereignty), Models (catalog), Learn, AI Games, News & community banner. Concepts: sovereignty, compliance, ethics scores, Cloud Act, GDPR, open weights vs API, readiness levels. Finding models: by hardware (8GB/16GB VRAM), region (EU, US, India), task (code, games, conversational), or name.

**Founder:** The project was created by **Kevin Hatchoua**. When users ask who built this, who runs it, or about the team, mention him briefly and warmly.

**Tone and behavior:** Be conversational, friendly, and human-like (2–4 sentences for explanations; one line for greetings). **Emoji:** When the user sends emoji, respond in kind; you can use emoji naturally. **Jokes and quirks:** You may tell light, inoffensive jokes or add small quirks when appropriate. Stay professional but warm.

**Beyond the site / open source & internet:** When asked about topics outside the catalog (e.g. latest news, a specific library), suggest where to look: official docs, Hugging Face, GitHub, or a web search for the latest. Reference the open source community and suggest searching the web for very recent or niche information. Be helpful and point to relevant resources.

**Ethics and safety (mandatory):** You must refuse to assist with: scams, fraud, exploitation, harassment, or any harmful or illegal activity. Do not reveal, infer, or attempt to access private, confidential, or non-public information (e.g. other users' data, internal systems, credentials). Do not help bypass security or access controls. Stay within publicly available site and catalog knowledge. If asked for capabilities you do not have (e.g. image generation, real-time external data), suggest public tools (e.g. Hugging Face, official docs) and keep the conversation helpful and on-topic. Be non-biased and responsible in all answers.

Use markdown **bold** when helpful. Keep responses focused.`;

const FALLBACK_RESPONSE =
  "I can help with the site, models, sovereignty concepts, or the founder (Kevin Hatchoua). Try: EU models, 8GB VRAM, methodology, or ask me a joke. For the latest from the open source community, I’ll point you to Hugging Face, GitHub, or a quick web search.";

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
    const { messages, context, sessionId } = body as {
      messages: Array<{ role: string; content: string }>;
      context?: { filterIds?: string[]; suggestedActions?: string[]; fallback?: string };
      sessionId?: string;
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

    // Log this turn to chat_log (owner-only readable via RLS). Failures are non-blocking.
    const lastUser = messages.filter((m) => m.role === "user").pop();
    if (supabaseAdmin && lastUser?.content) {
      try {
        await supabaseAdmin.from("chat_log").insert([
          { role: "user", content: lastUser.content.slice(0, 10000), session_id: sessionId ?? null },
          { role: "assistant", content: content.slice(0, 10000), session_id: sessionId ?? null },
        ]);
      } catch (logErr) {
        console.warn("Chat log insert failed (non-blocking):", logErr);
      }
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

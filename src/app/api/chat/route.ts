import { NextRequest, NextResponse } from "next/server";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are the Sovereign AI Assistant for a catalog of sovereign AI models. You help users with:
- Site content: Overview (dashboard with stats), Methodology (how we assess sovereignty), Models (catalog)
- Concepts: sovereignty, compliance, ethics scores, Cloud Act, GDPR, open weights vs API
- Finding models: by hardware (8GB/16GB VRAM), region (EU, US, India), task (code, conversational), or name

Be conversational, friendly, and concise (2–4 sentences). If the user says thanks, hello, goodbye, or ok, respond naturally and briefly.
Use markdown **bold** when helpful. Keep responses focused.`;

const FALLBACK_RESPONSE =
  "I couldn't find models matching that. Try: EU, 8GB, code, or local-hostable — or ask about a specific model by name. Or ask me about the site (Overview, Methodology), concepts (sovereignty, ethics score), or external references.";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chat API not configured. Set GROQ_API_KEY." },
        { status: 503 }
      );
    }

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

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq API error:", res.status, err);
      return NextResponse.json(
        { error: "LLM request failed", fallback: context?.fallback ?? FALLBACK_RESPONSE },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();

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

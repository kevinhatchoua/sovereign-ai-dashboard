import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Minimal schema for model submission. */
const REQUIRED_FIELDS = ["id", "name", "provider", "origin_country", "openness_level"] as const;

function validatePayload(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!body || typeof body !== "object") {
    return { valid: false, errors: ["Invalid JSON body"] };
  }
  const obj = body as Record<string, unknown>;
  for (const f of REQUIRED_FIELDS) {
    if (obj[f] == null || String(obj[f]).trim() === "") {
      errors.push(`Missing or empty: ${f}`);
    }
  }
  const openness = obj.openness_level as string;
  if (openness && !["Open Weights", "API"].includes(openness)) {
    errors.push("openness_level must be 'Open Weights' or 'API'");
  }
  const id = String(obj.id ?? "").trim();
  if (id && !/^[a-z0-9-]+$/.test(id)) {
    errors.push("id must be lowercase alphanumeric and hyphens only");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * POST /api/webhook/submit — Receive model submissions from external services.
 * Requires X-Webhook-Secret header matching WEBHOOK_SECRET env var.
 * Validates payload and returns result. Does not persist; use GitHub PR for actual updates.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("X-Webhook-Secret");
    const expected = process.env.WEBHOOK_SECRET;
    if (expected && secret !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { valid, errors } = validatePayload(body);

    if (!valid) {
      return NextResponse.json(
        { accepted: false, errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      accepted: true,
      message:
        "Submission validated. To add to the registry, open a PR at https://github.com/kevinhatchoua/sovereign-ai-dashboard.",
      submitUrl:
        "https://github.com/kevinhatchoua/sovereign-ai-dashboard/issues/new?template=model_update.yml",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/app/lib/registryLoader";

export const dynamic = "force-dynamic";

/** GET /api/stats — Aggregate stats for dashboards */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jurisdiction = searchParams.get("jurisdiction") as
      | "EU"
      | "IN"
      | "US"
      | null;

    const stats = getStats(
      jurisdiction && ["EU", "IN", "US"].includes(jurisdiction)
        ? jurisdiction
        : undefined
    );

    return NextResponse.json(stats);
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getModels } from "@/app/lib/registryLoader";

export const dynamic = "force-dynamic";

/** GET /api/export — Bulk export as JSON or CSV */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") ?? "json").toLowerCase();

    const models = getModels();

    if (format === "csv") {
      const headers = [
        "id",
        "name",
        "provider",
        "origin_country",
        "openness_level",
        "data_residency",
        "compliance_tags",
        "hf_downloads",
        "hf_likes",
        "huggingface_id",
      ];
      const rows = models.map((m) =>
        headers.map((h) => {
          const v = (m as Record<string, unknown>)[h];
          if (Array.isArray(v)) return `"${v.join("; ")}"`;
          if (typeof v === "string" && v.includes(",")) return `"${v}"`;
          return String(v ?? "");
        }).join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="sovereign-ai-models-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json(models, {
      headers: {
        "Content-Disposition": `attachment; filename="sovereign-ai-models-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    console.error("Export API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

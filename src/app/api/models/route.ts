import { NextRequest, NextResponse } from "next/server";
import { getModels } from "@/app/lib/registryLoader";
import { checkCompliance } from "@/app/lib/complianceEngine";
import type { Jurisdiction } from "@/app/lib/complianceEngine";

export const dynamic = "force-dynamic";

/** GET /api/models — List models with optional filters */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jurisdiction = searchParams.get("jurisdiction") as Jurisdiction | null;
    const openness = searchParams.get("openness");
    const provider = searchParams.get("provider");
    const country = searchParams.get("country");
    const q = searchParams.get("q")?.toLowerCase().trim();
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

    let models = getModels();

    if (jurisdiction && ["EU", "IN", "US"].includes(jurisdiction)) {
      models = models.filter((m) => {
        const result = checkCompliance(
          {
            openness_level: m.openness_level,
            origin_country: m.origin_country,
            data_residency: m.data_residency,
            compliance_tags: m.compliance_tags,
          },
          jurisdiction as Jurisdiction
        );
        return result.isCompliant;
      });
    }

    if (openness) {
      const level = openness === "Open Weights" ? "Open Weights" : "API";
      models = models.filter((m) => m.openness_level === level);
    }

    if (provider) {
      models = models.filter(
        (m) => m.provider.toLowerCase() === provider.toLowerCase()
      );
    }

    if (country) {
      models = models.filter(
        (m) => m.origin_country.toLowerCase() === country.toLowerCase()
      );
    }

    if (q) {
      models = models.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.origin_country.toLowerCase().includes(q) ||
          m.compliance_tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    const total = models.length;
    const offset = (page - 1) * limit;
    const paginated = models.slice(offset, offset + limit);

    return NextResponse.json({
      models: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        jurisdiction: jurisdiction ?? undefined,
      },
    });
  } catch (err) {
    console.error("Models API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

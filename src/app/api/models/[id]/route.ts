import { NextRequest, NextResponse } from "next/server";
import { getModelById } from "@/app/lib/registryLoader";

export const dynamic = "force-dynamic";

/** GET /api/models/[id] — Single model by ID */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const model = getModelById(id);

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json(model);
  } catch (err) {
    console.error("Model API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

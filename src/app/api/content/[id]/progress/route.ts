import { NextRequest, NextResponse } from "next/server";
import { progressAssetStage } from "@/lib/server/contentService";
import { getAuthContext } from "@/lib/server/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const targetStage = body.targetStage;
    const updated = await progressAssetStage(id, targetStage, auth.workspace.id);
    const { syncAndPersistEngineTasks } = await import("@/lib/server/taskService");
    await syncAndPersistEngineTasks(auth.workspace.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to advance stage" }, { status: 500 });
  }
}

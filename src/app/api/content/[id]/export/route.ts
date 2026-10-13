import { NextRequest, NextResponse } from "next/server";
import { exportAssetAndDeriveReels } from "@/lib/server/contentService";
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
    const result = await exportAssetAndDeriveReels(id, auth.workspace.id);
    try {
      const { syncAndPersistEngineTasks } = await import("@/lib/server/taskService");
      await syncAndPersistEngineTasks(auth.workspace.id);
    } catch (syncErr) {
      console.warn("Background task sync warning after export:", syncErr);
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to export and derive reels" }, { status: 500 });
  }
}

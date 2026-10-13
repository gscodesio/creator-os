import { NextRequest, NextResponse } from "next/server";
import { reopenTask } from "@/lib/server/taskService";
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
    const task = await reopenTask(id, auth.workspace.id);
    return NextResponse.json(task);
  } catch (error: any) {
    const status = error.message?.includes("not found or access denied") ? 404 : 500;
    return NextResponse.json({ error: error.message || "Failed to reopen task" }, { status });
  }
}

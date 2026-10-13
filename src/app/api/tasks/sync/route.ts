import { NextRequest, NextResponse } from "next/server";
import { syncAndPersistEngineTasks, getTasks } from "@/lib/server/taskService";
import { getAuthContext } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await syncAndPersistEngineTasks(auth.workspace.id);
    const data = await getTasks({}, auth.workspace.id);
    return NextResponse.json({ success: true, tasks, counts: data.counts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to sync tasks" }, { status: 500 });
  }
}

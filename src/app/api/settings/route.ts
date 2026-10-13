import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/server/settingsService";
import { getAuthContext } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const settings = await getSettings(auth.workspace.id);
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const updated = await updateSettings(body, auth.workspace.id);
    if (updated.isConfigured === true) {
      const { syncAndPersistEngineTasks } = await import("@/lib/server/taskService");
      await syncAndPersistEngineTasks(auth.workspace.id);
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 400 });
  }
}

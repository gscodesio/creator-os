import { NextRequest, NextResponse } from "next/server";
import { getContentAssets } from "@/lib/server/contentService";
import { getSettings } from "@/lib/server/settingsService";
import { analyzeBufferDeficits } from "@/lib/engine/taskEngine";
import { getAuthContext } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assets } = await getContentAssets({ limit: 100 }, auth.workspace.id);
    const settings = await getSettings(auth.workspace.id);
    if (!settings || !settings.isConfigured) {
      return NextResponse.json({
        isConfigured: false,
        windowDays: 0,
        totalShortfall: 0,
        quotas: {},
        totalAssets: assets.length,
      });
    }

    const deficits = analyzeBufferDeficits(assets as any, settings as any);

    return NextResponse.json({
      isConfigured: true,
      windowDays: deficits.windowDays,
      quotas: deficits.quotas,
      totalAssets: assets.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to calculate buffer" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getContentAssets } from "@/lib/server/contentService";
import { getTopics } from "@/lib/server/topicService";
import { getSettings } from "@/lib/server/settingsService";
import { analyzeBufferDeficits } from "@/lib/engine/taskEngine";
import { getAuthContext } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [{ assets }, { topics }, settings] = await Promise.all([
      getContentAssets({ limit: 100 }, auth.workspace.id),
      getTopics({ limit: 100 }, auth.workspace.id),
      getSettings(auth.workspace.id),
    ]);

    const deficits = analyzeBufferDeficits(assets as any, settings as any);

    const typeBreakdown = {
      youtubeLong: assets.filter((a) => a.type === "YouTube Long").length,
      derivedReels: assets.filter((a) => a.type === "Derived Reel").length,
      standaloneReels: assets.filter((a) => a.type === "Standalone Reel").length,
      linkedin: assets.filter((a) => a.type === "LinkedIn").length,
      carousel: assets.filter((a) => a.type === "Carousel").length,
    };

    const statusBreakdown = {
      scripting: assets.filter((a) => a.workflowStatus === "scripting").length,
      shooting: assets.filter((a) => a.workflowStatus === "shooting").length,
      editing: assets.filter((a) => a.workflowStatus === "editing").length,
      exported: assets.filter((a) => a.workflowStatus === "exported").length,
      writing: assets.filter((a) => a.workflowStatus === "writing").length,
      creating: assets.filter((a) => a.workflowStatus === "creating").length,
      ready: assets.filter((a) => a.workflowStatus === "ready").length,
      scheduled: assets.filter((a) => a.workflowStatus === "scheduled").length,
      published: assets.filter((a) => a.workflowStatus === "published").length,
    };

    const topicFunnel = {
      idea: topics.filter((t) => t.status === "idea").length,
      planning: topics.filter((t) => t.status === "planning").length,
      in_progress: topics.filter((t) => t.status === "in_progress").length,
      converted: topics.filter((t) => t.status === "converted").length,
    };

    return NextResponse.json({
      totalTopics: topics.length,
      totalAssets: assets.length,
      typeBreakdown,
      statusBreakdown,
      topicFunnel,
      quotas: deficits.quotas,
      windowDays: deficits.windowDays,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch analytics" }, { status: 500 });
  }
}

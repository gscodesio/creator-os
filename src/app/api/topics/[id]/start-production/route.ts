import { NextRequest, NextResponse } from "next/server";
import { getTopicById, updateTopic } from "@/lib/server/topicService";
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
    const topic = await getTopicById(id, auth.workspace.id);
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const { getContentAssetById, createContentAsset } = await import("@/lib/server/contentService");

    // Idempotency check 1: topic already has linked contentAssetId
    if (topic.contentAssetId) {
      const existingAsset = await getContentAssetById(topic.contentAssetId, auth.workspace.id);
      if (existingAsset) {
        if (topic.status !== "in_progress") {
          await updateTopic(id, { status: "in_progress" }, auth.workspace.id);
        }
        return NextResponse.json({ success: true, asset: existingAsset });
      }
    }

    // Idempotency check 2: content asset already exists with topicId
    const { prisma } = await import("@/lib/prisma");
    const existingAssetByTopic = await prisma.contentAsset.findFirst({
      where: { topicId: topic.id, workspaceId: auth.workspace.id },
      include: { distributions: true, derivedReels: true, mediaAssets: true },
    });
    if (existingAssetByTopic) {
      await updateTopic(id, {
        status: "in_progress",
        contentAssetId: existingAssetByTopic.id,
      }, auth.workspace.id);
      return NextResponse.json({ success: true, asset: existingAssetByTopic });
    }

    // Initialize content asset at its first actionable production stage
    let initialWorkflowStatus: "scripting" | "writing" | "creating" | "editing" = "scripting";
    let contentType = topic.type;
    let reelType = undefined;
    let duration = "12:00";

    if (contentType === "LinkedIn") {
      initialWorkflowStatus = "writing";
      duration = "";
    } else if (contentType === "Carousel") {
      initialWorkflowStatus = "creating";
      duration = "";
    } else if (contentType === "Standalone Reel") {
      initialWorkflowStatus = "scripting";
      duration = "0:45";
    } else if (contentType === "Long Video Derived" || contentType === "Derived Reel") {
      contentType = "Derived Reel";
      reelType = "Long Video Derived";
      initialWorkflowStatus = "editing";
      duration = "0:30";
    } else {
      // YouTube Long
      contentType = "YouTube Long";
      initialWorkflowStatus = "scripting";
      duration = "12:00";
    }

    const asset = await createContentAsset({
      title: topic.title,
      type: contentType,
      subType: topic.subType || undefined,
      reelType,
      workflowStatus: initialWorkflowStatus,
      topicId: topic.id,
      duration,
      thumbBg: topic.thumbBg || undefined,
      thumbText: topic.thumbText || undefined,
    }, auth.workspace.id);

    await updateTopic(id, {
      status: "in_progress",
      contentAssetId: asset.id,
    }, auth.workspace.id);

    const { syncAndPersistEngineTasks } = await import("@/lib/server/taskService");
    await syncAndPersistEngineTasks(auth.workspace.id);

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to start production" }, { status: 500 });
  }
}

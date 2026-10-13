import { prisma } from "@/lib/prisma";
import {
  normalizeWorkflowStatus,
  getWorkflowSteps,
  getWorkflowStepIndex,
  getWorkflowStageLabel,
  type ContentWorkflowStatus,
} from "@/lib/domain/contentWorkflow";

export interface PlatformDistributionRecord {
  id?: string;
  platform: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  workflowStatus: string;
  internalStatus: string;
}

export interface ContentAssetRecord {
  id: string;
  workspaceId?: string | null;
  title: string;
  type: string;
  subType?: string | null;
  reelType?: string | null;
  workflowStatus: string;
  actionStatus: string;
  stage: string;
  completedSteps: number;
  totalSteps: number;
  hasActive: boolean;
  source: string;
  isParentLink: boolean;
  parentLongVideoId?: string | null;
  topicId?: string | null;
  driveAsset?: string | null;
  googleDriveUrl?: string | null;
  duration?: string | null;
  thumbBg: string;
  thumbText: string;
  thumbSub?: string | null;
  lastUpdated: string;
  distributions?: PlatformDistributionRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getContentAssets(
  query: {
    search?: string;
    type?: string;
    status?: string;
    reelType?: string;
    subType?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  } = {},
  workspaceId?: string
): Promise<{ assets: ContentAssetRecord[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 50));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (workspaceId) {
    where.workspaceId = workspaceId;
  }

  if (query.search?.trim()) {
    const q = query.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { source: { contains: q, mode: "insensitive" } },
    ];
  }
  if (query.type && query.type !== "All") {
    where.type = query.type;
  }
  if (query.status && query.status !== "All") {
    where.workflowStatus = query.status.toLowerCase();
  }
  if (query.reelType && query.reelType !== "All") {
    where.reelType = query.reelType;
  }
  if (query.subType && query.subType !== "All") {
    where.subType = query.subType;
  }

  const orderBy: any = {};
  if (query.sortBy === "Oldest First") {
    orderBy.createdAt = "asc";
  } else if (query.sortBy === "Title A-Z") {
    orderBy.title = "asc";
  } else {
    orderBy.createdAt = "desc";
  }

  const [assets, total] = await Promise.all([
    prisma.contentAsset.findMany({
      where,
      include: { distributions: true, derivedReels: true, mediaAssets: true },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.contentAsset.count({ where }),
  ]);

  return { assets: assets as unknown as ContentAssetRecord[], total, page, limit };
}

export async function getContentAssetById(
  id: string,
  workspaceId?: string
): Promise<ContentAssetRecord | null> {
  const where: any = { id };
  if (workspaceId) {
    where.workspaceId = workspaceId;
  }

  const asset = await prisma.contentAsset.findFirst({
    where,
    include: { distributions: true, derivedReels: true, mediaAssets: true },
  });
  return asset as unknown as ContentAssetRecord | null;
}

export async function createContentAsset(
  input: {
    id?: string;
    title: string;
    type: string;
    subType?: string | null;
    reelType?: string | null;
    workflowStatus?: string;
    actionStatus?: string;
    source?: string;
    isParentLink?: boolean;
    parentLongVideoId?: string | null;
    topicId?: string | null;
    duration?: string | null;
    thumbBg?: string | null;
    thumbText?: string | null;
    thumbSub?: string | null;
    googleDriveUrl?: string | null;
  },
  workspaceId?: string
): Promise<ContentAssetRecord> {
  const normStatus = normalizeWorkflowStatus(input.workflowStatus, input.type);
  const steps = getWorkflowSteps(input.type);
  const stepIdx = getWorkflowStepIndex(input.type, normStatus);
  const stageLabel = getWorkflowStageLabel(input.type, normStatus);

  const thumbBg = input.thumbBg || "bg-gradient-to-br from-slate-900 to-blue-950 text-blue-300";
  const thumbText = input.thumbText || input.title.slice(0, 8).toUpperCase();

  const dataToSave: any = {
    ...(input.id ? { id: input.id } : {}),
    ...(workspaceId ? { workspaceId } : {}),
    title: input.title.trim(),
    type: input.type,
    subType: input.subType || null,
    reelType: input.reelType || null,
    workflowStatus: normStatus,
    actionStatus: input.actionStatus || "in_progress",
    stage: stageLabel,
    completedSteps: Math.max(0, stepIdx),
    totalSteps: steps.length,
    hasActive: normStatus !== "published",
    source: input.source || "Standalone",
    isParentLink: !!input.isParentLink,
    parentLongVideoId: input.parentLongVideoId || null,
    topicId: input.topicId || null,
    driveAsset: input.googleDriveUrl ? "Added" : "Not Added",
    googleDriveUrl: input.googleDriveUrl || null,
    duration: input.duration || null,
    thumbBg,
    thumbText,
    thumbSub: input.thumbSub || null,
    lastUpdated: "Today",
  };

  const created = await prisma.contentAsset.create({
    data: dataToSave,
    include: { distributions: true, derivedReels: true },
  });

  return created as unknown as ContentAssetRecord;
}

export async function updateContentAsset(
  id: string,
  updates: Partial<ContentAssetRecord>,
  workspaceId?: string
): Promise<ContentAssetRecord> {
  if (workspaceId) {
    const existing = await prisma.contentAsset.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      throw new Error("Content asset not found or access denied");
    }
  }

  const data: any = { ...updates };
  delete data.id;
  delete data.distributions;
  delete data.derivedReels;
  delete data.mediaAssets;
  delete data.createdAt;
  delete data.updatedAt;

  if (data.workflowStatus) {
    const type = data.type || "YouTube Long";
    data.workflowStatus = normalizeWorkflowStatus(data.workflowStatus, type);
    const steps = getWorkflowSteps(type);
    data.completedSteps = Math.max(0, getWorkflowStepIndex(type, data.workflowStatus));
    data.totalSteps = steps.length;
    data.stage = getWorkflowStageLabel(type, data.workflowStatus);
  }

  const updated = await prisma.contentAsset.update({
    where: { id },
    data,
    include: { distributions: true, derivedReels: true },
  });

  return updated as unknown as ContentAssetRecord;
}

export async function deleteContentAsset(id: string, workspaceId?: string): Promise<boolean> {
  if (workspaceId) {
    const existing = await prisma.contentAsset.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      throw new Error("Content asset not found or access denied");
    }
  }

  await prisma.contentAsset.delete({ where: { id } });
  return true;
}

/**
 * Advance asset stage to the specified step or next step
 */
export async function progressAssetStage(
  id: string,
  targetStage?: string | number,
  workspaceId?: string
): Promise<ContentAssetRecord> {
  const asset = await getContentAssetById(id, workspaceId);
  if (!asset) throw new Error(`Asset not found: ${id}`);

  const steps = getWorkflowSteps(asset.type);
  let nextStatus: ContentWorkflowStatus;

  if (typeof targetStage === "number") {
    const bounded = Math.max(0, Math.min(targetStage, steps.length - 1));
    nextStatus = steps[bounded].status;
  } else if (typeof targetStage === "string" && targetStage.trim()) {
    nextStatus = normalizeWorkflowStatus(targetStage, asset.type);
  } else {
    const currentIdx = getWorkflowStepIndex(asset.type, asset.workflowStatus as ContentWorkflowStatus);
    const nextIdx = Math.min(currentIdx + 1, steps.length - 1);
    nextStatus = steps[nextIdx].status;
  }

  const nextStepIdx = getWorkflowStepIndex(asset.type, nextStatus);
  const nextStageLabel = getWorkflowStageLabel(asset.type, nextStatus);

  const updated = await updateContentAsset(
    id,
    {
      workflowStatus: nextStatus,
      stage: nextStageLabel,
      completedSteps: nextStepIdx,
      totalSteps: steps.length,
      actionStatus: nextStatus === "published" ? "completed" : "in_progress",
      hasActive: nextStatus !== "published",
      lastUpdated: "Today",
    },
    workspaceId
  );

  if (
    asset.type === "YouTube Long" &&
    (nextStatus === "exported" || nextStatus === "scheduled" || nextStatus === "published")
  ) {
    await exportAssetAndDeriveReels(id, workspaceId);
  }

  return updated;
}

/**
 * YouTube Long Video export workflow:
 * Derives child Reels with status 'editing', linked to this parent video.
 * Configurable target count via Settings (default 3).
 * Fully idempotent: handles zero, partial, complete, excess, repeated, and concurrent requests.
 */
export async function exportAssetAndDeriveReels(
  longVideoId: string,
  workspaceId?: string
): Promise<{ parent: ContentAssetRecord; reels: ContentAssetRecord[] }> {
  const parent = await getContentAssetById(longVideoId, workspaceId);
  if (!parent) throw new Error(`Parent Long Video not found: ${longVideoId}`);

  // Fetch configured target count (default 3) for the workspace
  const resolvedWorkspaceId = parent.workspaceId || workspaceId;
  const settings = resolvedWorkspaceId
    ? await prisma.settings.findUnique({ where: { workspaceId: resolvedWorkspaceId } })
    : await prisma.settings.findUnique({ where: { id: "default" } });
  const targetCount = settings?.derivedReelsPerLongVideo || 3;

  // Mark parent exported
  const updatedParent = await updateContentAsset(
    longVideoId,
    {
      workflowStatus: "exported",
      stage: "Export",
      completedSteps: 4,
      actionStatus: "in_progress",
      hasActive: true,
    },
    workspaceId
  );

  // Check existing derived child reels for this parent video
  const existingReels = await prisma.contentAsset.findMany({
    where: {
      parentLongVideoId: longVideoId,
      type: "Derived Reel",
    },
    orderBy: { createdAt: "asc" },
  });

  const baseTitle = parent.title.split("—")[0].trim();

  // If existing count meets or exceeds target, return existing without creating duplicates or deleting excess
  if (existingReels.length >= targetCount) {
    return {
      parent: updatedParent,
      reels: existingReels.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        workflowStatus: r.workflowStatus,
        stage: r.stage,
        parentLongVideoId: r.parentLongVideoId,
      } as ContentAssetRecord)),
    };
  }

  // Determine which reel numbers (1..targetCount) already exist
  const existingIndices = new Set<number>();
  for (const r of existingReels) {
    const match = r.title.match(/Reel\s*(\d+)/i);
    if (match) {
      existingIndices.add(parseInt(match[1], 10));
    }
  }

  const neededCount = targetCount - existingReels.length;
  const missingIndices: number[] = [];

  // Fill in missing indices from 1 to targetCount
  for (let i = 1; i <= targetCount; i++) {
    if (!existingIndices.has(i)) {
      missingIndices.push(i);
    }
  }

  // Fallback if non-numbered reels exist
  let nextNum = 1;
  while (missingIndices.length < neededCount) {
    if (!existingIndices.has(nextNum) && !missingIndices.includes(nextNum)) {
      missingIndices.push(nextNum);
    }
    nextNum++;
  }

  const toCreateIndices = missingIndices.slice(0, neededCount);

  const colors = [
    "bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white",
    "bg-gradient-to-br from-slate-900 via-purple-950 to-purple-900 text-white",
    "bg-gradient-to-br from-slate-900 via-pink-950 to-rose-900 text-white",
    "bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 text-white",
    "bg-gradient-to-br from-slate-900 via-amber-950 to-orange-900 text-white",
  ];

  for (const idx of toCreateIndices) {
    const stableId = `${parent.id}-reel-${idx}`;
    const thumbBg = colors[(idx - 1) % colors.length];
    const durationSec = 28 + ((idx * 3) % 7);
    const duration = `0:${durationSec < 10 ? "0" : ""}${durationSec}`;
    const title = `${baseTitle} — Reel ${idx}`;
    const thumbText = `REEL ${idx}`;

    try {
      await prisma.contentAsset.create({
        data: {
          id: stableId,
          ...(resolvedWorkspaceId ? { workspaceId: resolvedWorkspaceId } : {}),
          title,
          type: "Derived Reel",
          reelType: "Long Video Derived",
          workflowStatus: "editing",
          actionStatus: "in_progress",
          stage: "Editing",
          completedSteps: 0,
          totalSteps: 4,
          hasActive: true,
          source: `From: ${parent.title}`,
          isParentLink: true,
          parentLongVideoId: parent.id,
          duration,
          thumbBg,
          thumbText,
          lastUpdated: "Today",
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        // Safe against concurrent requests: stableId already created by parallel worker
      } else {
        throw err;
      }
    }
  }

  // Return all derived reels for this parent
  const finalReels = await prisma.contentAsset.findMany({
    where: {
      parentLongVideoId: longVideoId,
      type: "Derived Reel",
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    parent: updatedParent,
    reels: finalReels.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      workflowStatus: r.workflowStatus,
      stage: r.stage,
      parentLongVideoId: r.parentLongVideoId,
    } as ContentAssetRecord)),
  };
}

/**
 * Schedule distribution for a platform with server-side validation and duplicate prevention
 */
export async function scheduleContentDistribution(
  params: {
    contentId: string;
    platform: string;
    date: string;
    time: string;
  },
  workspaceId?: string
): Promise<ContentAssetRecord> {
  const asset = await getContentAssetById(params.contentId, workspaceId);
  if (!asset) throw new Error(`Content asset not found: ${params.contentId}`);

  // Server-side validation of cross-platform Reel scheduling rules
  const isReel = asset.type === "Derived Reel" || asset.type === "Standalone Reel";
  if (isReel) {
    const normPlatform = params.platform.toLowerCase();
    const isIg = normPlatform.includes("instagram");
    const isYt = normPlatform.includes("youtube");

    if (isIg || isYt) {
      const compPlatforms = isIg
        ? ["YouTube", "YouTube Shorts", "youtube", "youtube_shorts"]
        : ["Instagram", "instagram"];
      const existingComp = await prisma.platformDistribution.findFirst({
        where: {
          contentAssetId: params.contentId,
          platform: { in: compPlatforms },
        },
      });

      if (existingComp?.scheduledDate) {
        const resolvedWorkspaceId = asset.workspaceId || workspaceId;
        const settings = resolvedWorkspaceId
          ? await prisma.settings.findUnique({ where: { workspaceId: resolvedWorkspaceId } })
          : await prisma.settings.findUnique({ where: { id: "default" } });
        const restrictSameDay = settings?.restrictSameDay ?? true;
        const minGap = settings?.minSchedulingGap ?? 2;
        const maxGap = settings?.maxSchedulingGap ?? 5;

        const targetTime = new Date(params.date).getTime();
        const compTime = new Date(existingComp.scheduledDate).getTime();
        const diffDays = Math.round(Math.abs(targetTime - compTime) / (1000 * 60 * 60 * 24));

        if (diffDays === 0 && restrictSameDay) {
          throw new Error("Same-day publishing is blocked for the same Reel across Instagram and YouTube Shorts.");
        }
        if (diffDays < minGap) {
          throw new Error(`Cross-platform gap is ${diffDays} day(s). Minimum required gap is ${minGap} days.`);
        }
        if (diffDays > maxGap) {
          throw new Error(`Cross-platform gap is ${diffDays} day(s). Maximum allowed gap is ${maxGap} days.`);
        }

        const platformOrder = settings?.platformOrder || "Balanced";
        if (platformOrder === "Instagram First") {
          if (isIg && targetTime > compTime) {
            throw new Error("Platform order restriction: Instagram must be scheduled before YouTube Shorts.");
          }
          if (isYt && targetTime < compTime) {
            throw new Error("Platform order restriction: Instagram must be scheduled before YouTube Shorts.");
          }
        } else if (platformOrder === "YouTube First") {
          if (isYt && targetTime > compTime) {
            throw new Error("Platform order restriction: YouTube Shorts must be scheduled before Instagram.");
          }
          if (isIg && targetTime < compTime) {
            throw new Error("Platform order restriction: YouTube Shorts must be scheduled before Instagram.");
          }
        }
      }
    }
  }

  // Reschedule updates the existing distribution without creating duplicates
  await prisma.platformDistribution.upsert({
    where: {
      contentAssetId_platform: {
        contentAssetId: params.contentId,
        platform: params.platform,
      },
    },
    update: {
      scheduledDate: params.date,
      scheduledTime: params.time,
      workflowStatus: "Scheduled",
      internalStatus: "Scheduled",
    },
    create: {
      contentAssetId: params.contentId,
      platform: params.platform,
      scheduledDate: params.date,
      scheduledTime: params.time,
      workflowStatus: "Scheduled",
      internalStatus: "Scheduled",
    },
  });

  return updateContentAsset(
    params.contentId,
    {
      workflowStatus: "scheduled",
      stage: "Schedule",
      lastUpdated: "Today",
    },
    workspaceId
  );
}

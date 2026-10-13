import type { ContentAsset } from "../../app/(dashboard)/content/contentData";
import type { Topic } from "../../app/(dashboard)/topics/topicsData";
import {
  isAssetBufferReady,
  isAssetInProduction,
  isChildReelUnlocked,
  normalizeTopicStatus,
  normalizeWorkflowStatus,
  type ContentWorkflowStatus,
} from "../domain/contentWorkflow.ts";
import { getEffectiveDate } from "../domain/dateUtils.ts";

export interface TaskItem {
  id: string;
  title: string;
  reason: string;
  badge: string; // e.g. "Editing", "Shooting", "Writing", "Scheduling", "Planning", "Creating", "Publishing"
  color: string;
  thumbType: "video" | "linkedin" | "calendar" | "carousel";
  type: "YouTube Long" | "Derived Reel" | "Standalone Reel" | "LinkedIn" | "Carousel";
  category: "Urgent" | "Production" | "Publishing";
  status: "Today" | "Upcoming" | "Completed";
  priority: "High" | "Medium" | "Low";
  priorityScore?: number;
  sortOrder?: number;
  contentId?: string;
  topicId?: string;
  contentTitle: string;
  dueNotice?: string;
  completedAt?: string;
  actionStage?: string; // Canonical workflow stage: Script | Shoot | Edit | Export | Schedule | Publish | Plan
  isPreparationTask?: boolean;
  targetContentType?: "YouTube Long" | "Derived Reel" | "Standalone Reel" | "LinkedIn" | "Carousel";
  targetSubType?: "Informative" | "Long Video Related" | "Standalone";
}

export interface CalendarEvent {
  id: string;
  contentId: string;
  title: string;
  type: "youtube" | "instagram" | "linkedin" | "carousel";
  date: number;
  month: string;
  time: string;
  fullDateStr: string;
  status?: string;
}

export interface EngineTaskPreferences {
  autoTaskGen?: boolean;
  autoRepurposing?: boolean;
  autoBufferCalc?: boolean;
  dailyCapacity?: string; // "Auto" | "3 tasks" | "5 tasks" | "7 tasks" | "10 tasks" | "Custom"
  customCapacity?: number;
  priorityOrder?: string[];
  bufferFallAuto?: boolean;
  prioritizeMissing?: boolean;
  countReadyOnly?: boolean;
  trackDerivedReels?: boolean;
  prioritizeDerived?: boolean;
  countExportedOnly?: boolean;
  showReason?: boolean;
  showRelated?: boolean;
  showPlatform?: boolean;
  showPriority?: boolean;
  nextActionBehavior?: boolean;
}

export interface EngineSettings {
  isConfigured?: boolean;
  advanceBuffer: {
    days: number | null;
    isCustom?: boolean | null;
    maintainAuto?: boolean | null;
  };
  publishingFrequency: {
    youtubeLong: { count: number | null; days?: string[] };
    youtubeShorts: { count: number | null; schedule?: string; days?: string[] };
    instagramReels: { count: number | null; schedule?: string; derivedCount?: number | null; standaloneCount?: number | null; days?: string[] };
    linkedinPosts: { count: number | null; informativeCount?: number | null; videoRelatedCount?: number | null };
    carousel: { frequency?: string | null; target: number | null };
    derivedReelsPerLongVideo?: number | null;
  };
  derivedReelsPerLongVideo?: number | null;
  taskPreferences?: EngineTaskPreferences;
  launchPlan?: {
    overallStartDate: string;
    useSeparateDates?: boolean;
    platformDates?: {
      youtube?: string;
      instagram?: string;
      linkedin?: string;
      carousel?: string;
    };
    currentSimulatedDate: string;
  };
}

export interface ActionCandidate {
  id?: string;
  actionStage: string;
  title: string;
  actionTitle: string;
  badge: string;
  color: string;
  thumbType: "video" | "linkedin" | "calendar" | "carousel";
  contentType: "YouTube Long" | "Derived Reel" | "Standalone Reel" | "LinkedIn" | "Carousel";
  category: "Urgent" | "Production" | "Publishing";
  contentId?: string;
  topicId?: string;
  contentTitle: string;
  priorityScore: number;
  priorityLevel: "High" | "Medium" | "Low";
  reason: string;
  dueNotice?: string;
  isPreparationTask?: boolean;
  targetContentType?: "YouTube Long" | "Derived Reel" | "Standalone Reel" | "LinkedIn" | "Carousel";
  targetSubType?: "Informative" | "Long Video Related" | "Standalone";
}

export interface BufferDeficitAnalysis {
  windowDays: number;
  quotas: {
    youtubeLong: { target: number; ready: number; deficit: number; severity: number };
    youtubeShorts: { target: number; ready: number; deficit: number; severity: number };
    instagramReels: {
      target: number;
      ready: number;
      deficit: number;
      severity: number;
      derivedTarget: number;
      derivedReady: number;
      derivedDeficit: number;
      standaloneTarget: number;
      standaloneReady: number;
      standaloneDeficit: number;
    };
    linkedin: {
      target: number;
      ready: number;
      deficit: number;
      severity: number;
      informativeTarget: number;
      informativeReady: number;
      informativeDeficit: number;
      videoRelatedTarget: number;
      videoRelatedReady: number;
      videoRelatedDeficit: number;
    };
    carousel: { target: number; ready: number; deficit: number; severity: number };
  };
}

// -------------------------------------------------------------------------
// 1. ASSET ELIGIBILITY & READY STATUS CHECK
// -------------------------------------------------------------------------

/**
 * Checks whether an asset is considered "Ready" for buffer coverage.
 * Strictly driven by canonical status: ideas, unedited, or unexported assets do NOT count!
 */
export function isAssetReadyForBuffer(asset: ContentAsset): boolean {
  return isAssetBufferReady(asset);
}

// -------------------------------------------------------------------------
// 2. BUFFER DEFICIT ANALYSIS
// -------------------------------------------------------------------------

export function analyzeBufferDeficits(
  assets: ContentAsset[],
  settings: EngineSettings
): BufferDeficitAnalysis {
  if (!settings || !(settings as any).isConfigured) {
    const zero = { target: 0, ready: 0, deficit: 0, severity: 0 };
    return {
      windowDays: 0,
      quotas: {
        youtubeLong: zero,
        youtubeShorts: zero,
        instagramReels: { ...zero, derivedTarget: 0, derivedReady: 0, derivedDeficit: 0, standaloneTarget: 0, standaloneReady: 0, standaloneDeficit: 0 },
        linkedin: { ...zero, informativeTarget: 0, informativeReady: 0, informativeDeficit: 0, videoRelatedTarget: 0, videoRelatedReady: 0, videoRelatedDeficit: 0 },
        carousel: zero,
      },
    };
  }

  const windowDays = settings.advanceBuffer?.days || 14;
  const factor = windowDays / 7;

  const ytLongTarget = Math.round((settings.publishingFrequency?.youtubeLong?.count || 2) * factor);
  const ytShortsTarget = Math.round((settings.publishingFrequency?.youtubeShorts?.count || 7) * factor);
  const igTotalTarget = Math.round((settings.publishingFrequency?.instagramReels?.count || 7) * factor);
  const igDerivedTarget = Math.round((settings.publishingFrequency?.instagramReels?.derivedCount || 4) * factor);
  const igStandaloneTarget = Math.round((settings.publishingFrequency?.instagramReels?.standaloneCount || 3) * factor);

  const liTotalTarget = Math.round((settings.publishingFrequency?.linkedinPosts?.count || 4) * factor);
  const liInfTarget = Math.round((settings.publishingFrequency?.linkedinPosts?.informativeCount || 2) * factor);
  const liVidTarget = Math.round((settings.publishingFrequency?.linkedinPosts?.videoRelatedCount || 2) * factor);

  const carTarget = settings.publishingFrequency?.carousel?.target || 2;

  // Count ready inventory
  const ytLongReady = assets.filter((a) => a.type === "YouTube Long" && isAssetReadyForBuffer(a)).length;

  const derivedReelsReady = assets.filter((a) => a.type === "Derived Reel" && isAssetReadyForBuffer(a)).length;
  const standaloneReelsReady = assets.filter((a) => a.type === "Standalone Reel" && isAssetReadyForBuffer(a)).length;
  const igTotalReady = derivedReelsReady + standaloneReelsReady;

  const ytShortsReady = assets.filter(
    (a) => (a.type === "Derived Reel" || a.type === "Standalone Reel") && isAssetReadyForBuffer(a)
  ).length;

  const liInfReady = assets.filter(
    (a) => a.type === "LinkedIn" && a.subType === "Informative" && isAssetReadyForBuffer(a)
  ).length;
  const liVidReady = assets.filter(
    (a) => a.type === "LinkedIn" && a.subType === "Long Video Related" && isAssetReadyForBuffer(a)
  ).length;
  const liTotalReady = liInfReady + liVidReady;

  const carReady = assets.filter((a) => a.type === "Carousel" && isAssetReadyForBuffer(a)).length;

  const calcDeficit = (target: number, ready: number) => {
    const def = Math.max(0, target - ready);
    const sev = target > 0 ? def / target : 0;
    return { target, ready, deficit: def, severity: sev };
  };

  const ytLong = calcDeficit(ytLongTarget, ytLongReady);
  const ytShorts = calcDeficit(ytShortsTarget, ytShortsReady);

  const igDerived = calcDeficit(igDerivedTarget, derivedReelsReady);
  const igStandalone = calcDeficit(igStandaloneTarget, standaloneReelsReady);
  const igTotal = {
    ...calcDeficit(igTotalTarget, igTotalReady),
    derivedTarget: igDerived.target,
    derivedReady: igDerived.ready,
    derivedDeficit: igDerived.deficit,
    standaloneTarget: igStandalone.target,
    standaloneReady: igStandalone.ready,
    standaloneDeficit: igStandalone.deficit,
  };

  const liInf = calcDeficit(liInfTarget, liInfReady);
  const liVid = calcDeficit(liVidTarget, liVidReady);
  const liTotal = {
    ...calcDeficit(liTotalTarget, liTotalReady),
    informativeTarget: liInf.target,
    informativeReady: liInf.ready,
    informativeDeficit: liInf.deficit,
    videoRelatedTarget: liVid.target,
    videoRelatedReady: liVid.ready,
    videoRelatedDeficit: liVid.deficit,
  };

  const car = calcDeficit(carTarget, carReady);

  return {
    windowDays,
    quotas: {
      youtubeLong: ytLong,
      youtubeShorts: ytShorts,
      instagramReels: igTotal,
      linkedin: liTotal,
      carousel: car,
    },
  };
}

// -------------------------------------------------------------------------
// 3. CANONICAL NEXT VALID ACTION RESOLUTION
// -------------------------------------------------------------------------

/**
 * Returns the next valid action candidate for a content asset according to its workflow.
 * Applies sequential child reel constraints for derived reels.
 */
export function getNextValidActionForAsset(
  asset: ContentAsset,
  allAssets: ContentAsset[]
): ActionCandidate | null {
  const distStatus = asset.distribution?.status || "Not Scheduled";
  const isScheduled = distStatus !== "Not Scheduled" && distStatus.includes("Scheduled");
  const isPublished = distStatus === "Published";

  // Derive canonical typed workflow status
  const status: ContentWorkflowStatus =
    asset.workflowStatus ||
    normalizeWorkflowStatus(asset.progress?.stage, asset.type, distStatus);

  // If already published or scheduled, no production tasks remain
  if (isPublished || status === "published") {
    return null;
  }

  // A. YOUTUBE LONG VIDEO
  // Workflow: Topic → Script → Shoot → Edit → Export → Schedule → Publish
  if (asset.type === "YouTube Long") {
    if (status === "scripting" || status === "topic") {
      return {
        actionStage: "Script",
        actionTitle: `Write Script: ${asset.title}`,
        title: `Write Script: ${asset.title}`,
        badge: "Scripting",
        color: "bg-blue-100 text-blue-700",
        thumbType: "video",
        contentType: "YouTube Long",
        category: "Production",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "Medium",
        reason: "Initial script outline needed before shooting.",
      };
    }
    if (status === "shooting") {
      return {
        actionStage: "Shoot",
        actionTitle: `Shoot Footage: ${asset.title}`,
        title: `Shoot YouTube Long Video: ${asset.title}`,
        badge: "Shooting",
        color: "bg-green-100 text-green-700",
        thumbType: "video",
        contentType: "YouTube Long",
        category: "Production",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "High",
        reason: "Script is approved. Record studio video footage.",
      };
    }
    if (status === "editing") {
      return {
        actionStage: "Edit",
        actionTitle: `Finish Editing: ${asset.title}`,
        title: `Finish Editing: ${asset.title}`,
        badge: "Editing",
        color: "bg-purple-100 text-purple-700",
        thumbType: "video",
        contentType: "YouTube Long",
        category: "Production",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "High",
        reason: "Rough cut recorded. Complete final editing and color grade.",
      };
    }
    if (status === "exported") {
      if (!isScheduled) {
        return {
          actionStage: "Schedule",
          actionTitle: `Schedule Long Video: ${asset.title}`,
          title: `Schedule YouTube Video: ${asset.title}`,
          badge: "Scheduling",
          color: "bg-pink-100 text-pink-700",
          thumbType: "calendar",
          contentType: "YouTube Long",
          category: "Publishing",
          contentId: asset.id,
          contentTitle: asset.title,
          priorityScore: 0,
          priorityLevel: "High",
          reason: "Master video exported. Select YouTube publishing slot (Tue/Fri).",
        };
      }
    }
    if (status === "scheduled") {
      return {
        actionStage: "Publish",
        actionTitle: `Publish Long Video: ${asset.title}`,
        title: `Publish YouTube Video: ${asset.title}`,
        badge: "Publishing",
        color: "bg-emerald-100 text-emerald-700",
        thumbType: "calendar",
        contentType: "YouTube Long",
        category: "Publishing",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "High",
        reason: "Scheduled video is ready for release on YouTube.",
      };
    }
    return null;
  }

  // B. DERIVED REEL
  // Workflow: Pending → Edit → Export → Schedule → Publish
  if (asset.type === "Derived Reel") {
    const match = asset.title.match(/Reel\s*(\d)/i);
    const reelNumber = match ? parseInt(match[1], 10) : 1;

    // Sequential Child Reel Constraint:
    // Strictly driven by typed state unblocking via domain rule isChildReelUnlocked
    if (!isChildReelUnlocked(asset, allAssets)) {
      return null;
    }

    if (status === "pending" || status === "editing") {
      return {
        actionStage: "Edit",
        actionTitle: `Edit ${asset.title}`,
        title: `Edit Reel ${reelNumber}`,
        badge: "Editing",
        color: "bg-purple-100 text-purple-700",
        thumbType: "video",
        contentType: "Derived Reel",
        category: "Production",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: reelNumber === 1 ? "High" : "Medium",
        reason: "Instagram Reel buffer needs more long-video-derived content.",
      };
    }
    if (status === "exporting") {
      return {
        actionStage: "Export",
        actionTitle: `Export ${asset.title}`,
        title: `Export Reel ${reelNumber}`,
        badge: "Editing",
        color: "bg-indigo-100 text-indigo-700",
        thumbType: "video",
        contentType: "Derived Reel",
        category: "Production",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "High",
        reason: "Render final short-form video file for Instagram & YouTube Shorts.",
      };
    }
    if (status === "exported") {
      if (!isScheduled) {
        return {
          actionStage: "Schedule",
          actionTitle: `Schedule ${asset.title}`,
          title: `Schedule Tomorrow's Reel`,
          badge: "Scheduling",
          color: "bg-pink-100 text-pink-700",
          thumbType: "calendar",
          contentType: "Derived Reel",
          category: "Publishing",
          contentId: asset.id,
          contentTitle: asset.title,
          priorityScore: 0,
          priorityLevel: "High",
          reason: "Keep 2-day gap for cross-platform publish.",
        };
      }
    }
    if (status === "scheduled") {
      return {
        actionStage: "Publish",
        actionTitle: `Publish ${asset.title}`,
        title: `Publish Reel ${reelNumber}`,
        badge: "Publishing",
        color: "bg-emerald-100 text-emerald-700",
        thumbType: "calendar",
        contentType: "Derived Reel",
        category: "Publishing",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "High",
        reason: "Scheduled Reel is ready for release.",
      };
    }
    return null;
  }

  // C. STANDALONE REEL
  // Workflow: Topic → Script → Shoot → Edit → Export → Schedule → Publish
  if (asset.type === "Standalone Reel") {
    if (status === "scripting" || status === "topic") {
      return {
        actionStage: "Script",
        actionTitle: `Write Script: ${asset.title}`,
        title: `Write Script: ${asset.title}`,
        badge: "Scripting",
        color: "bg-blue-100 text-blue-700",
        thumbType: "video",
        contentType: "Standalone Reel",
        category: "Production",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "Medium",
        reason: "Hook and concise 30-45s script needed for standalone reel.",
      };
    }
    if (status === "shooting") {
      return {
        actionStage: "Shoot",
        actionTitle: `Shoot Standalone Reel: ${asset.title}`,
        title: `Shoot Standalone Reel: ${asset.title}`,
        badge: "Shooting",
        color: "bg-green-100 text-green-700",
        thumbType: "video",
        contentType: "Standalone Reel",
        category: "Production",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "High",
        reason: "14-day plan needs 1 standalone Reel shoot.",
      };
    }
    if (status === "editing") {
      return {
        actionStage: "Edit",
        actionTitle: `Edit Standalone Reel: ${asset.title}`,
        title: `Edit Standalone Reel: ${asset.title}`,
        badge: "Editing",
        color: "bg-purple-100 text-purple-700",
        thumbType: "video",
        contentType: "Standalone Reel",
        category: "Production",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "Medium",
        reason: "Edit cuts, pacing, on-screen text, and audio captions.",
      };
    }
    if (status === "exported") {
      if (!isScheduled) {
        return {
          actionStage: "Schedule",
          actionTitle: `Schedule Standalone Reel: ${asset.title}`,
          title: `Schedule Standalone Reel`,
          badge: "Scheduling",
          color: "bg-pink-100 text-pink-700",
          thumbType: "calendar",
          contentType: "Standalone Reel",
          category: "Publishing",
          contentId: asset.id,
          contentTitle: asset.title,
          priorityScore: 0,
          priorityLevel: "High",
          reason: "Schedule distribution adhering to 2-5 day cross-platform gap.",
        };
      }
    }
    if (status === "scheduled") {
      return {
        actionStage: "Publish",
        actionTitle: `Publish Standalone Reel: ${asset.title}`,
        title: `Publish Standalone Reel: ${asset.title}`,
        badge: "Publishing",
        color: "bg-emerald-100 text-emerald-700",
        thumbType: "calendar",
        contentType: "Standalone Reel",
        category: "Publishing",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "High",
        reason: "Scheduled standalone reel is ready for publication.",
      };
    }
    return null;
  }

  // D. LINKEDIN POST
  // Workflow: Topic → Write → Ready → Schedule → Publish
  if (asset.type === "LinkedIn") {
    const isInf = asset.subType === "Informative";
    if (status === "writing" || status === "topic") {
      return {
        actionStage: "Write",
        actionTitle: `Draft LinkedIn Post: ${asset.title}`,
        title: isInf ? `Draft LinkedIn Informative Post: ${asset.title}` : `Draft LinkedIn Video-Related Post: ${asset.title}`,
        badge: "Writing",
        color: "bg-yellow-100 text-yellow-700",
        thumbType: "linkedin",
        contentType: "LinkedIn",
        category: "Production",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "Medium",
        reason: isInf
          ? "Draft informative LinkedIn thought leadership post."
          : "Draft accompanying LinkedIn breakdown connected to long video.",
      };
    }
    if (status === "ready") {
      if (!isScheduled) {
        return {
          actionStage: "Schedule",
          actionTitle: `Schedule LinkedIn Post: ${asset.title}`,
          title: `Schedule LinkedIn Post`,
          badge: "Scheduling",
          color: "bg-pink-100 text-pink-700",
          thumbType: "calendar",
          contentType: "LinkedIn",
          category: "Publishing",
          contentId: asset.id,
          contentTitle: asset.title,
          priorityScore: 0,
          priorityLevel: "Medium",
          reason: "Schedule post publication on LinkedIn.",
        };
      }
    }
    if (status === "scheduled") {
      return {
        actionStage: "Publish",
        actionTitle: `Publish LinkedIn Post: ${asset.title}`,
        title: `Publish LinkedIn Post`,
        badge: "Publishing",
        color: "bg-emerald-100 text-emerald-700",
        thumbType: "calendar",
        contentType: "LinkedIn",
        category: "Publishing",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "Medium",
        reason: "Scheduled post ready for publication on LinkedIn.",
      };
    }
    return null;
  }

  // E. CAROUSEL
  // Workflow: Topic → Create → Ready → Schedule
  if (asset.type === "Carousel") {
    if (status === "creating" || status === "topic") {
      return {
        actionStage: "Create",
        actionTitle: `Design Carousel Slides: ${asset.title}`,
        title: `Design Carousel Slides: ${asset.title}`,
        badge: "Creating",
        color: "bg-amber-100 text-amber-700",
        thumbType: "carousel",
        contentType: "Carousel",
        category: "Production",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "Low",
        reason: "Maintain monthly educational carousel quota.",
      };
    }
    if (status === "ready" || status === "exporting" || status === "exported") {
      if (!isScheduled) {
        return {
          actionStage: "Schedule",
          actionTitle: `Schedule Carousel: ${asset.title}`,
          title: `Schedule Carousel`,
          badge: "Scheduling",
          color: "bg-pink-100 text-pink-700",
          thumbType: "calendar",
          contentType: "Carousel",
          category: "Publishing",
          contentId: asset.id,
          contentTitle: asset.title,
          priorityScore: 0,
          priorityLevel: "Medium",
          reason: "Carousel slides exported. Set publishing date on LinkedIn / Instagram.",
        };
      }
    }
    if (status === "scheduled") {
      return {
        actionStage: "Publish",
        actionTitle: `Publish Carousel: ${asset.title}`,
        title: `Publish Carousel`,
        badge: "Publishing",
        color: "bg-emerald-100 text-emerald-700",
        thumbType: "calendar",
        contentType: "Carousel",
        category: "Publishing",
        contentId: asset.id,
        contentTitle: asset.title,
        priorityScore: 0,
        priorityLevel: "High",
        reason: "Scheduled carousel ready for publication.",
      };
    }
    return null;
  }

  return null;
}

// -------------------------------------------------------------------------
// 4. TOPIC UPSTREAM ACTION CANDIDATE
// -------------------------------------------------------------------------

export function getNextValidActionForTopic(
  topic: Topic,
  existingAssets: ContentAsset[]
): ActionCandidate | null {
  // Product Rule: No production tasks for Idea or Planning Topics.
  // Starting production generates the first valid task on the linked Content Asset.
  return null;
}

// -------------------------------------------------------------------------
// 4b. BUFFER DEFICIT PREPARATION CANDIDATES
// -------------------------------------------------------------------------

export function generatePreparationCandidates({
  assets,
  topics,
  settings,
  deficits,
  isPreLaunch,
  currentDate,
  overallStartDate,
}: {
  assets: ContentAsset[];
  topics: Topic[];
  settings: EngineSettings;
  deficits: BufferDeficitAnalysis;
  isPreLaunch: boolean;
  currentDate: string;
  overallStartDate: string;
}): ActionCandidate[] {
  const candidates: ActionCandidate[] = [];
  const q = deficits.quotas;

  // Helper to count pipeline inventory:
  // 1) Ready buffer inventory
  // 2) Content in active production
  // 3) Planned topics created that have not yet started production
  const countPipeline = (
    matchAsset: (a: ContentAsset) => boolean,
    matchTopic: (t: Topic) => boolean
  ) => {
    const ready = assets.filter((a) => matchAsset(a) && isAssetReadyForBuffer(a)).length;
    const inProd = assets.filter((a) => matchAsset(a) && isAssetInProduction(a)).length;
    const plannedTopics = topics.filter(
      (t) => matchTopic(t) && !t.contentAssetId && normalizeTopicStatus(t.status) !== "converted"
    ).length;
    return { ready, inProd, plannedTopics, total: ready + inProd + plannedTopics };
  };

  // 1. YouTube Long Video
  const ytPipeline = countPipeline(
    (a) => a.type === "YouTube Long",
    (t) => t.type === "YouTube Long"
  );
  const ytDeficit = Math.max(0, q.youtubeLong.target - ytPipeline.total);

  for (let i = 1; i <= ytDeficit; i++) {
    const candidateId = `prep-yt-long-${i}`;
    candidates.push({
      id: candidateId,
      actionStage: "Plan",
      actionTitle: `Create Topic: YouTube Long Video`,
      title: `Create Topic for YouTube Long Video`,
      badge: "Planning",
      color: "bg-rose-100 text-rose-700",
      thumbType: "video",
      contentType: "YouTube Long",
      category: isPreLaunch ? "Urgent" : "Production",
      contentTitle: `YouTube Long Video (Slot ${ytPipeline.total + i}/${q.youtubeLong.target})`,
      priorityScore: 920 - i * 5,
      priorityLevel: "High",
      reason: isPreLaunch
        ? `Launch buffer needs ${q.youtubeLong.target} YouTube Long Videos (${ytPipeline.total} in pipeline). Exporting this master video will also derive child Reels.`
        : `Rolling buffer requires ${q.youtubeLong.target} YouTube Long Videos (${ytPipeline.total} in pipeline).`,
      isPreparationTask: true,
      targetContentType: "YouTube Long",
    });
  }

  // 2. Standalone Reel
  const srPipeline = countPipeline(
    (a) => a.type === "Standalone Reel",
    (t) => t.type === "Standalone Reel" || (t.type as string === "Reels" && t.subType === "Standalone")
  );
  const srDeficit = Math.max(0, q.instagramReels.standaloneTarget - srPipeline.total);

  for (let i = 1; i <= srDeficit; i++) {
    const candidateId = `prep-sr-${i}`;
    candidates.push({
      id: candidateId,
      actionStage: "Plan",
      actionTitle: `Create Topic: Standalone Reel`,
      title: `Create Topic for Standalone Reel`,
      badge: "Planning",
      color: "bg-purple-100 text-purple-700",
      thumbType: "video",
      contentType: "Standalone Reel",
      category: isPreLaunch ? "Urgent" : "Production",
      contentTitle: `Standalone Reel (Slot ${srPipeline.total + i}/${q.instagramReels.standaloneTarget})`,
      priorityScore: 860 - i * 5,
      priorityLevel: "High",
      reason: isPreLaunch
        ? `Launch buffer requires ${q.instagramReels.standaloneTarget} Standalone Reels (${srPipeline.total} in pipeline) for daily Instagram & Shorts frequency.`
        : `Rolling buffer requires ${q.instagramReels.standaloneTarget} Standalone Reels (${srPipeline.total} in pipeline).`,
      isPreparationTask: true,
      targetContentType: "Standalone Reel",
      targetSubType: "Standalone",
    });
  }

  // 3. LinkedIn Informative
  const liInfPipeline = countPipeline(
    (a) => a.type === "LinkedIn" && a.subType === "Informative",
    (t) => t.type === "LinkedIn" && t.subType === "Informative"
  );
  const liInfDeficit = Math.max(0, q.linkedin.informativeTarget - liInfPipeline.total);

  for (let i = 1; i <= liInfDeficit; i++) {
    const candidateId = `prep-li-inf-${i}`;
    candidates.push({
      id: candidateId,
      actionStage: "Plan",
      actionTitle: `Create Topic: LinkedIn Informative Post`,
      title: `Create Topic for LinkedIn Informative Post`,
      badge: "Planning",
      color: "bg-blue-100 text-blue-700",
      thumbType: "linkedin",
      contentType: "LinkedIn",
      category: isPreLaunch ? "Urgent" : "Production",
      contentTitle: `LinkedIn Informative Post (Slot ${liInfPipeline.total + i}/${q.linkedin.informativeTarget})`,
      priorityScore: 720 - i * 5,
      priorityLevel: "Medium",
      reason: isPreLaunch
        ? `Launch buffer requires ${q.linkedin.informativeTarget} LinkedIn Informative posts (${liInfPipeline.total} in pipeline).`
        : `Rolling buffer requires ${q.linkedin.informativeTarget} LinkedIn Informative posts (${liInfPipeline.total} in pipeline).`,
      isPreparationTask: true,
      targetContentType: "LinkedIn",
      targetSubType: "Informative",
    });
  }

  // 4. LinkedIn Video-Related
  const liVidPipeline = countPipeline(
    (a) => a.type === "LinkedIn" && a.subType === "Long Video Related",
    (t) => t.type === "LinkedIn" && t.subType === "Long Video Related"
  );
  const liVidDeficit = Math.max(0, q.linkedin.videoRelatedTarget - liVidPipeline.total);

  for (let i = 1; i <= liVidDeficit; i++) {
    const candidateId = `prep-li-vid-${i}`;
    candidates.push({
      id: candidateId,
      actionStage: "Plan",
      actionTitle: `Create Topic: LinkedIn Long Video Related Post`,
      title: `Create Topic for LinkedIn Long Video Related Post`,
      badge: "Planning",
      color: "bg-indigo-100 text-indigo-700",
      thumbType: "linkedin",
      contentType: "LinkedIn",
      category: isPreLaunch ? "Urgent" : "Production",
      contentTitle: `LinkedIn Video-Related Post (Slot ${liVidPipeline.total + i}/${q.linkedin.videoRelatedTarget})`,
      priorityScore: 700 - i * 5,
      priorityLevel: "Medium",
      reason: isPreLaunch
        ? `Launch buffer requires ${q.linkedin.videoRelatedTarget} LinkedIn Video-Related posts (${liVidPipeline.total} in pipeline).`
        : `Rolling buffer requires ${q.linkedin.videoRelatedTarget} LinkedIn Video-Related posts (${liVidPipeline.total} in pipeline).`,
      isPreparationTask: true,
      targetContentType: "LinkedIn",
      targetSubType: "Long Video Related",
    });
  }

  // 5. Educational Carousel
  const carPipeline = countPipeline(
    (a) => a.type === "Carousel",
    (t) => t.type === "Carousel"
  );
  const carDeficit = Math.max(0, q.carousel.target - carPipeline.total);

  for (let i = 1; i <= carDeficit; i++) {
    const candidateId = `prep-car-${i}`;
    candidates.push({
      id: candidateId,
      actionStage: "Plan",
      actionTitle: `Create Topic: Educational Carousel`,
      title: `Create Topic for Carousel`,
      badge: "Planning",
      color: "bg-amber-100 text-amber-700",
      thumbType: "carousel",
      contentType: "Carousel",
      category: isPreLaunch ? "Urgent" : "Production",
      contentTitle: `Educational Carousel (Slot ${carPipeline.total + i}/${q.carousel.target})`,
      priorityScore: 560 - i * 5,
      priorityLevel: "Medium",
      reason: isPreLaunch
        ? `Launch buffer requires ${q.carousel.target} Educational Carousels (${carPipeline.total} in pipeline).`
        : `Rolling buffer requires ${q.carousel.target} Educational Carousels (${carPipeline.total} in pipeline).`,
      isPreparationTask: true,
      targetContentType: "Carousel",
    });
  }

  return candidates;
}

// -------------------------------------------------------------------------
// 5. GLOBAL PRIORITIZATION SCORING
// -------------------------------------------------------------------------

// -------------------------------------------------------------------------
// 5. GLOBAL PRIORITIZATION SCORING
// -------------------------------------------------------------------------

export function getCandidatePriorityCategory(
  candidate: ActionCandidate,
  asset: ContentAsset | null,
  deficits: BufferDeficitAnalysis,
  calendarEvents: CalendarEvent[]
): string[] {
  const matches: string[] = [];

  const isPublishing =
    candidate.category === "Publishing" ||
    candidate.actionStage === "Schedule" ||
    candidate.actionStage === "Publish" ||
    (asset && calendarEvents.some((e) => e.contentId === asset.id));
  if (isPublishing) {
    matches.push("Publishing deadlines");
  }

  const isRepurposing =
    candidate.contentType === "Derived Reel" ||
    (candidate.contentType === "YouTube Long" &&
      (candidate.actionStage === "Export" || candidate.actionStage === "Edit"));
  if (isRepurposing) {
    matches.push("Repurposing requirements");
  }

  const isBufferGap = candidate.isPreparationTask || candidate.actionStage === "Plan";
  if (isBufferGap) {
    matches.push("Buffer gaps");
  }

  const isProduction =
    !candidate.isPreparationTask &&
    (candidate.category === "Production" ||
      ["Script", "Shoot", "Edit", "Export", "Write", "Create"].includes(candidate.actionStage));
  if (isProduction) {
    matches.push("Current production steps");
  }

  const isFuture =
    candidate.actionStage === "Plan" ||
    candidate.category === "Urgent" ||
    candidate.isPreparationTask;
  if (isFuture) {
    matches.push("Future work / preparation");
  }

  return matches;
}

export function calculatePriorityScore(
  candidate: ActionCandidate,
  asset: ContentAsset | null,
  deficits: BufferDeficitAnalysis,
  calendarEvents: CalendarEvent[],
  referenceDate: string,
  isPreLaunch: boolean,
  priorityOrder?: string[]
): { score: number; level: "High" | "Medium" | "Low"; reason: string; dueNotice?: string } {
  const order =
    priorityOrder && priorityOrder.length > 0
      ? priorityOrder
      : [
          "Publishing deadlines",
          "Buffer gaps",
          "Current production steps",
          "Repurposing requirements",
          "Future work / preparation",
        ];

  const matchedCategories = getCandidatePriorityCategory(candidate, asset, deficits, calendarEvents);
  let bestRank = 4;
  for (const cat of matchedCategories) {
    const idx = order.indexOf(cat);
    if (idx !== -1 && idx < bestRank) {
      bestRank = idx;
    }
  }
  // User configured preference weight: Rank 0 gets +2400, down to Rank 4 gets 0
  const preferenceBonus = (4 - bestRank) * 600;

  // If this is a buffer preparation candidate
  if (candidate.isPreparationTask) {
    let score = (candidate.priorityScore || 500) + preferenceBonus;
    let reason = candidate.reason;
    let dueNotice = isPreLaunch ? "Pre-Launch prep" : "Buffer Deficit";
    let level: "High" | "Medium" | "Low" = candidate.priorityLevel || "Medium";

    if (isPreLaunch) {
      score += 50;
      if (candidate.contentType === "YouTube Long" || candidate.contentType === "Standalone Reel") {
        level = "High";
      }
    }
    if (score >= 600) {
      level = "High";
    } else if (score < 300) {
      level = "Low";
    }
    return { score, level, reason, dueNotice };
  }

  let score = preferenceBonus;
  let reason = candidate.reason;
  let dueNotice: string | undefined = undefined;

  // Tier 1: Imminent Publishing Deadlines (Weight: 1000)
  if (asset && calendarEvents.length > 0) {
    const assetEvents = calendarEvents.filter((e) => e.contentId === asset.id);
    for (const evt of assetEvents) {
      if (evt.fullDateStr) {
        const refParts = referenceDate.split("-").map(Number);
        const evtParts = evt.fullDateStr.split("-").map(Number);
        const refDate = new Date(refParts[0] || 2026, (refParts[1] || 10) - 1, refParts[2] || 10);
        const targetDate = new Date(evtParts[0] || 2026, (evtParts[1] || 10) - 1, evtParts[2] || 10);
        const diffDays = Math.round((targetDate.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          score += 1200;
          dueNotice = isPreLaunch ? "Pre-Launch prep" : "Due Today";
          reason = `Publishing slot reached for ${asset.type}. Action required immediately.`;
        } else if (diffDays === 1) {
          score += 900;
          dueNotice = isPreLaunch ? "Pre-Launch prep" : "Tomorrow";
          reason = `Approaching publishing deadline tomorrow (${evt.month} ${evt.date}).`;
        } else if (diffDays <= 3) {
          score += 650;
          dueNotice = isPreLaunch ? "Pre-Launch prep" : `Friday's publishing slot is approaching.`;
          reason = `Friday's publishing slot is approaching.`;
        } else if (diffDays <= 5) {
          score += 400;
          dueNotice = isPreLaunch ? "Pre-Launch prep" : `In ${diffDays} Days`;
        }
      }
    }
  }

  // Tier 2: Critical Buffer Shortages (Weight: 500 * severity)
  const q = deficits.quotas;
  let deficitSeverity = 0;

  if (candidate.contentType === "YouTube Long") {
    deficitSeverity = q.youtubeLong.severity;
    score += Math.round(500 * deficitSeverity);
    if (q.youtubeLong.deficit > 0 && !reason.includes("slot")) {
      reason = `YouTube Long buffer is deficient (${q.youtubeLong.ready}/${q.youtubeLong.target} ready).`;
    }
  } else if (candidate.contentType === "Derived Reel") {
    deficitSeverity = q.instagramReels.derivedDeficit / (q.instagramReels.derivedTarget || 1);
    score += Math.round(500 * Math.min(1, deficitSeverity));
    if (q.instagramReels.derivedDeficit > 0 && !reason.includes("gap")) {
      reason = `Instagram Reel buffer needs more long-video-derived content.`;
    }
  } else if (candidate.contentType === "Standalone Reel") {
    deficitSeverity = q.instagramReels.standaloneDeficit / (q.instagramReels.standaloneTarget || 1);
    score += Math.round(500 * Math.min(1, deficitSeverity));
    if (q.instagramReels.standaloneDeficit > 0 && !reason.includes("shoot")) {
      reason = `14-day plan needs ${q.instagramReels.standaloneDeficit} standalone Reel shoot.`;
    }
  } else if (candidate.contentType === "LinkedIn") {
    deficitSeverity = q.linkedin.severity;
    score += Math.round(400 * deficitSeverity);
  } else if (candidate.contentType === "Carousel") {
    deficitSeverity = q.carousel.severity;
    score += Math.round(300 * deficitSeverity);
  }

  // COMPETING DEFICIT BALANCING RULE:
  // When both Long Video and Reel buffers are deficient:
  // Compare deadlines, deficit severity, and prerequisite benefits.
  const isBothYtAndReelDeficient = q.youtubeLong.deficit > 0 && q.instagramReels.deficit > 0;
  if (isBothYtAndReelDeficient) {
    if (candidate.contentType === "YouTube Long") {
      // If Long Video is at Edit or Export stage: unblocks child reels!
      if (candidate.actionStage === "Edit" || candidate.actionStage === "Export") {
        score += 300; // Big bonus for prerequisite benefit
        reason = `Exporting master unlocks 3 child Reels to resolve short-form buffer deficit.`;
      }
      // If Long Video deficit is more severe than Reel deficit
      if (q.youtubeLong.severity > q.instagramReels.severity) {
        score += 150;
      }
    } else if (candidate.contentType === "Derived Reel") {
      // If Reel buffer is completely empty (< 2 ready)
      if (q.instagramReels.ready < 2) {
        score += 250;
        reason = `Critical short-form buffer shortage (< 2 Reels ready). Immediate editing needed.`;
      }
    }
  }

  // Tier 3: Prerequisite Actions Unlocking Downstream Work (Weight: 250)
  if (candidate.contentType === "YouTube Long" && candidate.actionStage === "Export") {
    score += 250;
  }
  if (candidate.contentType === "Derived Reel" && candidate.actionStage === "Edit") {
    if (candidate.title.includes("Reel 1")) {
      score += 150;
    }
  }

  // Tier 4: Pre-Launch Mode Adaptation
  if (isPreLaunch) {
    dueNotice = "Pre-Launch prep";
    if (candidate.category === "Production") {
      score += 100;
    }
  } else if (!dueNotice) {
    dueNotice = candidate.priorityLevel === "High" ? "Today" : "Tomorrow";
  }

  // Determine priority level
  let level: "High" | "Medium" | "Low" = "Medium";
  if (score >= 600) {
    level = "High";
  } else if (score < 300) {
    level = "Low";
  }

  return { score, level, reason, dueNotice };
}

// -------------------------------------------------------------------------
// 6. MAIN ENGINE: GENERATE AND PRIORITIZE TASKS
// -------------------------------------------------------------------------

export function generateAndPrioritizeTasks({
  assets,
  topics,
  calendarEvents = [],
  settings,
  existingTasks = [],
  referenceDate,
}: {
  assets: ContentAsset[];
  topics: Topic[];
  calendarEvents?: CalendarEvent[];
  settings: EngineSettings;
  existingTasks?: TaskItem[];
  referenceDate?: string;
}): TaskItem[] {
  if (!settings || !(settings as any).isConfigured) {
    return [];
  }

  const currentDate = referenceDate || getEffectiveDate(settings);
  const overallStartDate = settings.launchPlan?.overallStartDate;
  const isPreLaunch = overallStartDate ? currentDate < overallStartDate : false;

  // 1. Buffer deficits analysis
  const deficits = analyzeBufferDeficits(assets, settings);

  // 2. Candidate generation from assets
  const candidates: ActionCandidate[] = [];

  for (const asset of assets) {
    const candidate = getNextValidActionForAsset(asset, assets);
    if (candidate) {
      candidates.push(candidate);
    }
  }

  // 3. Candidate generation from unlinked topics (for upstream pipeline)
  for (const topic of topics) {
    const candidate = getNextValidActionForTopic(topic, assets);
    if (candidate) {
      candidates.push(candidate);
    }
  }

  // 4. Candidate generation from buffer deficits (actionable preparation recommendations)
  const isSettingsConfigured = Boolean((settings as any).isConfigured);
  const shouldGeneratePrep =
    isSettingsConfigured &&
    ((assets.length === 0 && topics.length === 0) ||
      settings.taskPreferences?.autoBufferCalc === true ||
      settings.taskPreferences?.prioritizeMissing === true);

  if (shouldGeneratePrep) {
    const prepCandidates = generatePreparationCandidates({
      assets,
      topics,
      settings,
      deficits,
      isPreLaunch,
      currentDate,
      overallStartDate: overallStartDate || "",
    });
    candidates.push(...prepCandidates);
  }

  // 5. Score and prioritize all candidates
  const userPriorityOrder = settings.taskPreferences?.priorityOrder;
  const scoredCandidates = candidates.map((cand) => {
    const asset = cand.contentId ? assets.find((a) => a.id === cand.contentId) || null : null;
    const scoring = calculatePriorityScore(
      cand,
      asset,
      deficits,
      calendarEvents,
      currentDate,
      isPreLaunch,
      userPriorityOrder
    );
    return {
      ...cand,
      priorityScore: scoring.score,
      priorityLevel: scoring.level,
      reason: scoring.reason,
      dueNotice: scoring.dueNotice,
    };
  });

  // 6. Sort deterministically:
  // Primary: priorityScore DESC
  // Secondary: High priority > Medium > Low
  // Tertiary: Stable tiebreaker by title
  scoredCandidates.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    const levelWeight = { High: 3, Medium: 2, Low: 1 };
    if (levelWeight[b.priorityLevel] !== levelWeight[a.priorityLevel]) {
      return levelWeight[b.priorityLevel] - levelWeight[a.priorityLevel];
    }
    return (a.id || a.title).localeCompare(b.id || b.title);
  });

  // 7. Workload Allocation (Today vs Upcoming)
  // Respect settings.taskPreferences.dailyCapacity
  const capacityStr = settings.taskPreferences?.dailyCapacity || "Auto";
  let maxToday = 6;
  if (capacityStr === "3 tasks") maxToday = 3;
  else if (capacityStr === "5 tasks") maxToday = 5;
  else if (capacityStr === "7 tasks") maxToday = 7;
  else if (capacityStr === "10 tasks") maxToday = 10;
  else if (capacityStr === "Auto") {
    const highCount = scoredCandidates.filter((c) => c.priorityLevel === "High" || c.priorityScore >= 500).length;
    maxToday = Math.max(4, Math.min(7, highCount));
  }

  // 8. Merge with existing tasks for idempotency and completed history preservation
  const completedHistory = existingTasks.filter((t) => t.status === "Completed");

  // Track completed content/action pairs to never regenerate completed steps
  const completedKeys = new Set(
    completedHistory.map((t) => t.id || `${t.contentId || t.topicId}:${t.actionStage || t.badge}`)
  );

  const consolidatedTasks: TaskItem[] = [];
  let todayCount = 0;

  for (const cand of scoredCandidates) {
    const actionKey = cand.id || `${cand.contentId || cand.topicId}:${cand.actionStage}`;

    // If already in completed history, do not regenerate open task
    if (completedKeys.has(actionKey)) {
      continue;
    }

    // Check if an existing open task matches this candidate
    const existingOpen = existingTasks.find(
      (t) =>
        t.status !== "Completed" &&
        (
          (cand.id && t.id === cand.id) ||
          (cand.contentId && t.contentId === cand.contentId && (t.actionStage === cand.actionStage || t.badge === cand.badge)) ||
          (cand.topicId && t.topicId === cand.topicId && (t.actionStage === cand.actionStage || t.badge === cand.badge))
        )
    );

    const taskId =
      existingOpen?.id ||
      cand.id ||
      `task-${cand.contentId || cand.topicId}-${cand.actionStage.toLowerCase()}`;

    // Assign status strictly bounded by daily capacity
    let assignedStatus: "Today" | "Upcoming" = "Upcoming";
    if (todayCount < maxToday && (cand.priorityLevel === "High" || todayCount < 3 || cand.category === "Urgent")) {
      assignedStatus = "Today";
      todayCount++;
    } else if (todayCount < maxToday) {
      assignedStatus = "Today";
      todayCount++;
    }

    const newTaskItem: TaskItem = {
      id: taskId,
      title: cand.title,
      reason: cand.reason,
      badge: cand.badge,
      color: cand.color,
      thumbType: cand.thumbType,
      type: cand.contentType,
      category: cand.category,
      status: assignedStatus,
      priority: cand.priorityLevel,
      priorityScore: cand.priorityScore,
      sortOrder: consolidatedTasks.length,
      contentId: cand.contentId,
      topicId: cand.topicId,
      contentTitle: cand.contentTitle,
      dueNotice: cand.dueNotice,
      actionStage: cand.actionStage,
      isPreparationTask: cand.isPreparationTask,
      targetContentType: cand.targetContentType || cand.contentType,
      targetSubType: cand.targetSubType,
    };

    consolidatedTasks.push(newTaskItem);
  }

  // 9. Return open tasks + completed history (no duplicate open tasks)
  return [...consolidatedTasks, ...completedHistory];
}

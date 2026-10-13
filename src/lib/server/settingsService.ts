import { prisma } from "@/lib/prisma";

export interface SettingsData {
  id?: string;
  isConfigured?: boolean;
  profileName?: string | null;
  profileRole?: string | null;
  avatar?: string | null;
  timezone?: string | null;
  startOfWeek?: string | null;
  calendarView?: string | null;
  contentSort?: string | null;
  theme?: string | null;
  advanceBufferDays?: number | null;
  isCustomBuffer?: boolean | null;
  maintainAutoBuffer?: boolean | null;
  ytLongCount?: number | null;
  ytLongDays?: string | null;
  ytShortsCount?: number | null;
  igReelsCount?: number | null;
  igDerivedCount?: number | null;
  igStandaloneCount?: number | null;
  liPostsCount?: number | null;
  liInfCount?: number | null;
  liVidCount?: number | null;
  carTarget?: number | null;
  carouselFrequency?: string | null;
  autoTaskGen?: boolean | null;
  autoRepurposing?: boolean | null;
  autoBufferCalc?: boolean | null;
  dailyCapacity?: string | null;
  customCapacity?: number | null;
  priorityOrder?: string | null;
  derivedReelsPerLongVideo?: number | null;
  overallStartDate?: string | null;
  currentSimulatedDate?: string | null;
  useSimulatedDate?: boolean | null;
  useSeparateDates?: boolean | null;
  youtubeDate?: string | null;
  instagramDate?: string | null;
  linkedinDate?: string | null;
  carouselDate?: string | null;
  connectedPlatforms?: string | null;
  platformOrder?: string | null;
  minSchedulingGap?: number | null;
  maxSchedulingGap?: number | null;
  restrictSameDay?: boolean | null;
}

export function formatSettingsResponse(data: any) {
  const d = data || {};
  const isConfigured = Boolean(d.isConfigured);

  const connectedArr = typeof d.connectedPlatforms === "string"
    ? d.connectedPlatforms.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean)
    : Array.isArray(d.connectedPlatforms)
    ? d.connectedPlatforms
    : [];

  const ytDaysArr = typeof d.ytLongDays === "string"
    ? d.ytLongDays.split(",").map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(d.ytLongDays)
    ? d.ytLongDays
    : [];

  const priorityArr = typeof d.priorityOrder === "string"
    ? d.priorityOrder.split(",").map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(d.priorityOrder)
    ? d.priorityOrder
    : [
        "Publishing deadlines",
        "Buffer gaps",
        "Current production steps",
        "Repurposing requirements",
        "Future work / preparation",
      ];

  const derivedReelsCount = d.derivedReelsPerLongVideo ?? 3;

  return {
    id: d.id || "default",
    isConfigured,
    derivedReelsPerLongVideo: derivedReelsCount,
    profile: {
      name: d.profileName ?? "",
      role: d.profileRole ?? "",
      avatar: d.avatar ?? "",
      timezone: d.timezone ?? "Asia/Kolkata (IST)",
    },
    workspacePreferences: {
      startOfWeek: d.startOfWeek ?? null,
      calendarView: d.calendarView ?? null,
      contentSort: d.contentSort ?? null,
      theme: d.theme ?? null,
    },
    advanceBuffer: {
      days: d.advanceBufferDays ?? null,
      isCustom: Boolean(d.isCustomBuffer),
      maintainAuto: d.maintainAutoBuffer !== null && d.maintainAutoBuffer !== undefined ? Boolean(d.maintainAutoBuffer) : null,
    },
    publishingFrequency: {
      youtubeLong: {
        count: d.ytLongCount !== null && d.ytLongCount !== undefined ? d.ytLongCount : null,
        days: ytDaysArr,
      },
      youtubeShorts: {
        count: d.ytShortsCount !== null && d.ytShortsCount !== undefined ? d.ytShortsCount : null,
        schedule: d.ytShortsCount ? "Daily" : "",
        days: d.ytShortsCount ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : [],
      },
      instagramReels: {
        count: d.igReelsCount !== null && d.igReelsCount !== undefined ? d.igReelsCount : null,
        derivedCount: d.igDerivedCount !== null && d.igDerivedCount !== undefined ? d.igDerivedCount : null,
        standaloneCount: d.igStandaloneCount !== null && d.igStandaloneCount !== undefined ? d.igStandaloneCount : null,
        schedule: d.igReelsCount ? "Daily" : "",
        days: d.igReelsCount ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : [],
      },
      linkedinPosts: {
        count: d.liPostsCount !== null && d.liPostsCount !== undefined ? d.liPostsCount : null,
        informativeCount: d.liInfCount !== null && d.liInfCount !== undefined ? d.liInfCount : null,
        videoRelatedCount: d.liVidCount !== null && d.liVidCount !== undefined ? d.liVidCount : null,
      },
      carousel: {
        target: d.carTarget !== null && d.carTarget !== undefined ? d.carTarget : null,
        frequency: d.carouselFrequency ?? "",
      },
      derivedReelsPerLongVideo: derivedReelsCount,
    },
    taskPreferences: {
      autoTaskGen: d.autoTaskGen !== null && d.autoTaskGen !== undefined ? Boolean(d.autoTaskGen) : null,
      autoRepurposing: d.autoRepurposing !== null && d.autoRepurposing !== undefined ? Boolean(d.autoRepurposing) : null,
      autoBufferCalc: d.autoBufferCalc !== null && d.autoBufferCalc !== undefined ? Boolean(d.autoBufferCalc) : null,
      dailyCapacity: d.dailyCapacity ?? "",
      customCapacity: d.customCapacity !== null && d.customCapacity !== undefined ? d.customCapacity : null,
      priorityOrder: priorityArr,
      derivedReelsPerLongVideo: derivedReelsCount,
      bufferFallAuto: d.autoBufferCalc !== null && d.autoBufferCalc !== undefined ? Boolean(d.autoBufferCalc) : null,
      prioritizeMissing: true,
      countReadyOnly: true,
      trackDerivedReels: true,
      prioritizeDerived: true,
      countExportedOnly: true,
      showReason: true,
      showRelated: true,
      showPlatform: true,
      showPriority: true,
      nextActionBehavior: true,
    },
    launchPlan: {
      overallStartDate: d.overallStartDate ?? "",
      currentSimulatedDate: d.currentSimulatedDate ?? "",
      useSimulatedDate: Boolean(d.useSimulatedDate),
      useSeparateDates: Boolean(d.useSeparateDates),
      platformDates: {
        youtube: d.youtubeDate ?? "",
        instagram: d.instagramDate ?? "",
        linkedin: d.linkedinDate ?? "",
        carousel: d.carouselDate || d.overallStartDate || "",
      },
    },
    schedulingRules: {
      sameDayBlocked: d.restrictSameDay !== null && d.restrictSameDay !== undefined ? Boolean(d.restrictSameDay) : null,
      minGapDays: d.minSchedulingGap !== null && d.minSchedulingGap !== undefined ? d.minSchedulingGap : null,
      maxGapDays: d.maxSchedulingGap !== null && d.maxSchedulingGap !== undefined ? d.maxSchedulingGap : null,
      platformOrder: d.platformOrder ?? "",
    },
    connectedPlatforms: connectedArr,
  };
}

export async function getSettings(workspaceId?: string): Promise<any> {
  if (workspaceId) {
    let record = await prisma.settings.findUnique({
      where: { workspaceId },
    });
    if (!record) {
      record = await prisma.settings.create({
        data: {
          workspaceId,
          isConfigured: false,
          timezone: "Asia/Kolkata",
          derivedReelsPerLongVideo: 3,
        },
      });
    }
    return formatSettingsResponse(record);
  }

  const record = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  return formatSettingsResponse(record || {});
}

/**
 * Update settings partially. Only fields explicitly present in `updates` are modified.
 * Missing fields remain completely untouched in the database.
 * Does not set isConfigured: true unless explicitly instructed with full validation.
 */
export async function updateSettings(updates: any, workspaceId?: string): Promise<any> {
  if (!updates || typeof updates !== "object") {
    throw new Error("Invalid settings payload");
  }

  const flatUpdates: Record<string, any> = {};

  // Profile fields
  if (updates.profile?.name !== undefined) flatUpdates.profileName = String(updates.profile.name).trim();
  else if (updates.profileName !== undefined) flatUpdates.profileName = String(updates.profileName).trim();

  if (updates.profile?.role !== undefined) flatUpdates.profileRole = String(updates.profile.role).trim();
  else if (updates.profileRole !== undefined) flatUpdates.profileRole = String(updates.profileRole).trim();

  if (updates.profile?.avatar !== undefined) flatUpdates.avatar = String(updates.profile.avatar);
  else if (updates.avatar !== undefined) flatUpdates.avatar = String(updates.avatar);

  if (updates.profile?.timezone !== undefined) {
    const tz = String(updates.profile.timezone).trim();
    // Normalize to canonical Asia/Kolkata if matched
    flatUpdates.timezone = tz.includes("Asia/Kolkata") ? "Asia/Kolkata" : tz;
  } else if (updates.timezone !== undefined) {
    const tz = String(updates.timezone).trim();
    flatUpdates.timezone = tz.includes("Asia/Kolkata") ? "Asia/Kolkata" : tz;
  }

  // Workspace Preferences
  const wp = updates.workspacePreferences;
  if (wp?.startOfWeek !== undefined) flatUpdates.startOfWeek = String(wp.startOfWeek).trim();
  else if (updates.startOfWeek !== undefined) flatUpdates.startOfWeek = String(updates.startOfWeek).trim();

  if (wp?.calendarView !== undefined) flatUpdates.calendarView = String(wp.calendarView).trim();
  else if (updates.calendarView !== undefined) flatUpdates.calendarView = String(updates.calendarView).trim();

  if (wp?.contentSort !== undefined) flatUpdates.contentSort = String(wp.contentSort).trim();
  else if (updates.contentSort !== undefined) flatUpdates.contentSort = String(updates.contentSort).trim();

  if (wp?.theme !== undefined) flatUpdates.theme = String(wp.theme).trim();
  else if (updates.theme !== undefined) flatUpdates.theme = String(updates.theme).trim();

  // Advance Buffer
  const ab = updates.advanceBuffer;
  if (ab?.days !== undefined || updates.advanceBufferDays !== undefined) {
    const rawDays = ab?.days !== undefined ? ab.days : updates.advanceBufferDays;
    const days = Number(rawDays);
    if (isNaN(days) || days < 1 || days > 90) throw new Error("Advance buffer days must be between 1 and 90");
    flatUpdates.advanceBufferDays = days;
  }

  if (ab?.isCustom !== undefined) flatUpdates.isCustomBuffer = Boolean(ab.isCustom);
  else if (updates.isCustomBuffer !== undefined) flatUpdates.isCustomBuffer = Boolean(updates.isCustomBuffer);

  if (ab?.maintainAuto !== undefined) {
    flatUpdates.maintainAutoBuffer = ab.maintainAuto === null ? null : Boolean(ab.maintainAuto);
  } else if (updates.maintainAutoBuffer !== undefined) {
    flatUpdates.maintainAutoBuffer = updates.maintainAutoBuffer === null ? null : Boolean(updates.maintainAutoBuffer);
  }

  // Publishing Frequency
  const pf = updates.publishingFrequency;
  if (pf?.youtubeLong?.count !== undefined) flatUpdates.ytLongCount = Math.max(0, Number(pf.youtubeLong.count));
  else if (updates.ytLongCount !== undefined) flatUpdates.ytLongCount = Math.max(0, Number(updates.ytLongCount));

  if (pf?.youtubeLong?.days !== undefined) {
    flatUpdates.ytLongDays = Array.isArray(pf.youtubeLong.days) ? pf.youtubeLong.days.join(",") : String(pf.youtubeLong.days);
  } else if (updates.ytLongDays !== undefined) {
    flatUpdates.ytLongDays = Array.isArray(updates.ytLongDays) ? updates.ytLongDays.join(",") : String(updates.ytLongDays);
  }

  if (pf?.youtubeShorts?.count !== undefined) flatUpdates.ytShortsCount = Math.max(0, Number(pf.youtubeShorts.count));
  else if (updates.ytShortsCount !== undefined) flatUpdates.ytShortsCount = Math.max(0, Number(updates.ytShortsCount));

  if (pf?.instagramReels?.count !== undefined) flatUpdates.igReelsCount = Math.max(0, Number(pf.instagramReels.count));
  else if (updates.igReelsCount !== undefined) flatUpdates.igReelsCount = Math.max(0, Number(updates.igReelsCount));

  if (pf?.instagramReels?.derivedCount !== undefined) flatUpdates.igDerivedCount = Math.max(0, Number(pf.instagramReels.derivedCount));
  else if (updates.igDerivedCount !== undefined) flatUpdates.igDerivedCount = Math.max(0, Number(updates.igDerivedCount));

  if (pf?.instagramReels?.standaloneCount !== undefined) flatUpdates.igStandaloneCount = Math.max(0, Number(pf.instagramReels.standaloneCount));
  else if (updates.igStandaloneCount !== undefined) flatUpdates.igStandaloneCount = Math.max(0, Number(updates.igStandaloneCount));

  if (pf?.linkedinPosts?.count !== undefined) flatUpdates.liPostsCount = Math.max(0, Number(pf.linkedinPosts.count));
  else if (updates.liPostsCount !== undefined) flatUpdates.liPostsCount = Math.max(0, Number(updates.liPostsCount));

  if (pf?.linkedinPosts?.informativeCount !== undefined) flatUpdates.liInfCount = Math.max(0, Number(pf.linkedinPosts.informativeCount));
  else if (updates.liInfCount !== undefined) flatUpdates.liInfCount = Math.max(0, Number(updates.liInfCount));

  if (pf?.linkedinPosts?.videoRelatedCount !== undefined) flatUpdates.liVidCount = Math.max(0, Number(pf.linkedinPosts.videoRelatedCount));
  else if (updates.liVidCount !== undefined) flatUpdates.liVidCount = Math.max(0, Number(updates.liVidCount));

  if (pf?.carousel?.target !== undefined) flatUpdates.carTarget = Math.max(0, Number(pf.carousel.target));
  else if (updates.carTarget !== undefined) flatUpdates.carTarget = Math.max(0, Number(updates.carTarget));

  if (pf?.carousel?.frequency !== undefined) flatUpdates.carouselFrequency = String(pf.carousel.frequency).trim();
  else if (updates.carouselFrequency !== undefined) flatUpdates.carouselFrequency = String(updates.carouselFrequency).trim();

  // Derived Reels per Long Video (1..10)
  const rawDerivedReels =
    updates.derivedReelsPerLongVideo !== undefined
      ? updates.derivedReelsPerLongVideo
      : pf?.derivedReelsPerLongVideo !== undefined
      ? pf.derivedReelsPerLongVideo
      : updates.taskPreferences?.derivedReelsPerLongVideo;

  if (rawDerivedReels !== undefined) {
    const val = Number(rawDerivedReels);
    if (isNaN(val) || !Number.isInteger(val) || val < 1 || val > 10) {
      throw new Error("Derived Reels per Long Video must be an integer between 1 and 10");
    }
    flatUpdates.derivedReelsPerLongVideo = val;
  }

  // Task Preferences & Workflow
  const tp = updates.taskPreferences;
  if (tp?.autoTaskGen !== undefined) {
    flatUpdates.autoTaskGen = tp.autoTaskGen === null ? null : Boolean(tp.autoTaskGen);
  } else if (updates.autoTaskGen !== undefined) {
    flatUpdates.autoTaskGen = updates.autoTaskGen === null ? null : Boolean(updates.autoTaskGen);
  }

  if (tp?.autoRepurposing !== undefined) {
    flatUpdates.autoRepurposing = tp.autoRepurposing === null ? null : Boolean(tp.autoRepurposing);
  } else if (updates.autoRepurposing !== undefined) {
    flatUpdates.autoRepurposing = updates.autoRepurposing === null ? null : Boolean(updates.autoRepurposing);
  }

  if (tp?.autoBufferCalc !== undefined) {
    flatUpdates.autoBufferCalc = tp.autoBufferCalc === null ? null : Boolean(tp.autoBufferCalc);
  } else if (updates.autoBufferCalc !== undefined) {
    flatUpdates.autoBufferCalc = updates.autoBufferCalc === null ? null : Boolean(updates.autoBufferCalc);
  }

  if (tp?.dailyCapacity !== undefined) flatUpdates.dailyCapacity = String(tp.dailyCapacity);
  else if (updates.dailyCapacity !== undefined) flatUpdates.dailyCapacity = String(updates.dailyCapacity);

  if (tp?.customCapacity !== undefined) flatUpdates.customCapacity = Number(tp.customCapacity);
  else if (updates.customCapacity !== undefined) flatUpdates.customCapacity = Number(updates.customCapacity);

  if (tp?.priorityOrder !== undefined) {
    flatUpdates.priorityOrder = Array.isArray(tp.priorityOrder) ? tp.priorityOrder.join(",") : String(tp.priorityOrder);
  } else if (updates.priorityOrder !== undefined) {
    flatUpdates.priorityOrder = Array.isArray(updates.priorityOrder) ? updates.priorityOrder.join(",") : String(updates.priorityOrder);
  }

  // Scheduling Rules
  const sr = updates.schedulingRules;
  if (sr?.sameDayBlocked !== undefined) {
    flatUpdates.restrictSameDay = sr.sameDayBlocked === null ? null : Boolean(sr.sameDayBlocked);
  } else if (updates.restrictSameDay !== undefined) {
    flatUpdates.restrictSameDay = updates.restrictSameDay === null ? null : Boolean(updates.restrictSameDay);
  } else if (sr?.restrictSameDay !== undefined) {
    flatUpdates.restrictSameDay = sr.restrictSameDay === null ? null : Boolean(sr.restrictSameDay);
  }

  if (sr?.minGapDays !== undefined || updates.minSchedulingGap !== undefined) {
    const rawMin = sr?.minGapDays !== undefined ? sr.minGapDays : updates.minSchedulingGap;
    const minG = Number(rawMin);
    if (isNaN(minG) || minG < 0) throw new Error("Minimum scheduling gap must be 0 or positive");
    flatUpdates.minSchedulingGap = minG;
  }

  if (sr?.maxGapDays !== undefined || updates.maxSchedulingGap !== undefined) {
    const rawMax = sr?.maxGapDays !== undefined ? sr.maxGapDays : updates.maxSchedulingGap;
    const maxG = Number(rawMax);
    if (isNaN(maxG) || maxG < 0) throw new Error("Maximum scheduling gap must be 0 or positive");
    flatUpdates.maxSchedulingGap = maxG;
  }

  if (sr?.platformOrder !== undefined) flatUpdates.platformOrder = String(sr.platformOrder);
  else if (updates.platformOrder !== undefined) flatUpdates.platformOrder = String(updates.platformOrder);

  // Validate cross-field scheduling gaps if both are being updated
  if (flatUpdates.minSchedulingGap !== undefined && flatUpdates.maxSchedulingGap !== undefined) {
    if (flatUpdates.maxSchedulingGap < flatUpdates.minSchedulingGap) {
      throw new Error(`Maximum gap (${flatUpdates.maxSchedulingGap} days) cannot be less than minimum gap (${flatUpdates.minSchedulingGap} days)`);
    }
  }

  // Launch Plan
  const lp = updates.launchPlan;
  if (lp?.overallStartDate !== undefined) flatUpdates.overallStartDate = String(lp.overallStartDate).trim();
  else if (updates.overallStartDate !== undefined) flatUpdates.overallStartDate = String(updates.overallStartDate).trim();

  if (lp?.currentSimulatedDate !== undefined) flatUpdates.currentSimulatedDate = String(lp.currentSimulatedDate).trim();
  else if (updates.currentSimulatedDate !== undefined) flatUpdates.currentSimulatedDate = String(updates.currentSimulatedDate).trim();

  if (lp?.useSimulatedDate !== undefined) flatUpdates.useSimulatedDate = Boolean(lp.useSimulatedDate);
  else if (updates.useSimulatedDate !== undefined) flatUpdates.useSimulatedDate = Boolean(updates.useSimulatedDate);

  if (lp?.useSeparateDates !== undefined) flatUpdates.useSeparateDates = Boolean(lp.useSeparateDates);
  else if (updates.useSeparateDates !== undefined) flatUpdates.useSeparateDates = Boolean(updates.useSeparateDates);

  if (lp?.platformDates?.youtube !== undefined) flatUpdates.youtubeDate = String(lp.platformDates.youtube).trim();
  else if (updates.youtubeDate !== undefined) flatUpdates.youtubeDate = String(updates.youtubeDate).trim();

  if (lp?.platformDates?.instagram !== undefined) flatUpdates.instagramDate = String(lp.platformDates.instagram).trim();
  else if (updates.instagramDate !== undefined) flatUpdates.instagramDate = String(updates.instagramDate).trim();

  if (lp?.platformDates?.linkedin !== undefined) flatUpdates.linkedinDate = String(lp.platformDates.linkedin).trim();
  else if (updates.linkedinDate !== undefined) flatUpdates.linkedinDate = String(updates.linkedinDate).trim();

  if (lp?.platformDates?.carousel !== undefined) flatUpdates.carouselDate = String(lp.platformDates.carousel).trim();
  else if (updates.carouselDate !== undefined) flatUpdates.carouselDate = String(updates.carouselDate).trim();

  // Connected Platforms
  if (updates.connectedPlatforms !== undefined) {
    flatUpdates.connectedPlatforms = Array.isArray(updates.connectedPlatforms)
      ? updates.connectedPlatforms.join(",")
      : String(updates.connectedPlatforms);
  }

  // Fetch existing record to safely preserve omitted fields
  const existing = workspaceId
    ? await prisma.settings.findUnique({ where: { workspaceId } })
    : await prisma.settings.findUnique({ where: { id: "default" } });

  // Explicit Activation Handling
  if (updates.isConfigured !== undefined) {
    const reqConfigured = Boolean(updates.isConfigured);
    if (reqConfigured) {
      // Validate all required setup sections across the application
      const merged = { ...(existing || {}), ...flatUpdates };
      const missingFields: string[] = [];

      if (!merged.profileName) missingFields.push("Profile Name");
      if (!merged.profileRole) missingFields.push("Profile Role");
      if (!merged.timezone) missingFields.push("Timezone");
      if (!merged.startOfWeek) missingFields.push("Default Start of Week");
      if (!merged.calendarView) missingFields.push("Default Calendar View");
      if (!merged.contentSort) missingFields.push("Default Content Sort");
      if (!merged.theme) missingFields.push("Theme");
      if (merged.autoTaskGen === null || merged.autoTaskGen === undefined) missingFields.push("Automatic Task Generation");
      if (merged.autoRepurposing === null || merged.autoRepurposing === undefined) missingFields.push("Automatic Repurposing Tracking");
      if (merged.autoBufferCalc === null || merged.autoBufferCalc === undefined) missingFields.push("Automatic Buffer Calculation");
      if (!merged.advanceBufferDays || merged.advanceBufferDays <= 0) missingFields.push("Advance Buffer Days");
      if (!merged.overallStartDate) missingFields.push("Overall Publishing Start Date");
      if (merged.minSchedulingGap === null || merged.minSchedulingGap === undefined) missingFields.push("Minimum Scheduling Gap");
      if (merged.maxSchedulingGap === null || merged.maxSchedulingGap === undefined) missingFields.push("Maximum Scheduling Gap");

      if (missingFields.length > 0) {
        throw new Error(`Cannot activate Creator OS. Missing required configuration: ${missingFields.join(", ")}`);
      }

      flatUpdates.isConfigured = true;
    } else {
      flatUpdates.isConfigured = false;
    }
  }

  let record;
  if (existing) {
    record = await prisma.settings.update({
      where: { id: existing.id },
      data: flatUpdates,
    });
  } else {
    record = await prisma.settings.create({
      data: {
        ...(workspaceId ? { workspaceId } : { id: "default" }),
        isConfigured: false,
        ...flatUpdates,
      },
    });
  }

  return formatSettingsResponse(record);
}

export const settingsService = {
  getSettings,
  updateSettings,
  saveSettings: async (updates: any) => {
    try {
      const res = await updateSettings(updates);
      return { success: true, settings: res };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update settings" };
    }
  },
};

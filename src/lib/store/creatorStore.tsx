"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { ALL_TOPICS, Topic } from "@/app/(dashboard)/topics/topicsData";
import { ALL_CONTENT_ASSETS, ContentAsset } from "@/app/(dashboard)/content/contentData";
import { generateAndPrioritizeTasks } from "../engine/taskEngine";
import {
  isAssetBufferReady,
  isAssetInProduction,
  isAssetScheduled,
  isAssetPublished,
  isAssetEligibleForDerivation,
  isChildReelUnlocked,
  getNextWorkflowStatus,
  getNextTopicWorkflowStatus,
  normalizeTopicStatus,
  getWorkflowSteps,
  getWorkflowStepIndex,
  getWorkflowStageLabel,
  TOPIC_WORKFLOW_STEPS,
  TOPIC_KANBAN_COLUMNS,
  migrateContentAsset,
  type ContentWorkflowStatus,
  type TopicWorkflowStatus,
  type CanonicalTopicStatus,
} from "../domain/contentWorkflow.ts";

export interface TaskItem {
  id: string;
  title: string;
  reason: string;
  badge: string; // e.g. "Editing", "Shooting", "Writing", "Scheduling", "Planning"
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
  actionStage?: string;
  isPreparationTask?: boolean;
  targetContentType?: "YouTube Long" | "Derived Reel" | "Standalone Reel" | "LinkedIn" | "Carousel";
  targetSubType?: "Informative" | "Long Video Related" | "Standalone";
}

export interface CalendarEvent {
  id: string;
  contentId: string;
  title: string;
  type: "youtube" | "instagram" | "linkedin" | "carousel";
  date: number; // day of month in October 2026, e.g. 7
  month: string; // "October 2026"
  time: string; // "10:00 AM"
  fullDateStr: string; // "2026-10-07"
  status?: string;
}

export interface LaunchPlanSettings {
  overallStartDate: string; // e.g. "2026-10-20"
  useSeparateDates: boolean;
  platformDates: {
    youtube: string;
    instagram: string;
    linkedin: string;
    carousel: string;
  };
  currentSimulatedDate: string;
  useSimulatedDate?: boolean;
}

export interface LaunchReadiness {
  isPreLaunch: boolean;
  daysUntilLaunch: number;
  overallStartDate: string;
  currentDate: string;
  bufferDays: number;
  totalUniqueRequired: number;
  totalUniqueReady: number;
  totalUniqueMissing: number;
  readinessScore: number;
  totalPlatformSlots: number;
  breakdown: {
    youtubeLong: { required: number; ready: number; missing: number; inProgress: number };
    derivedReels: { required: number; ready: number; missing: number; inProgress: number };
    standaloneReels: { required: number; ready: number; missing: number; inProgress: number };
    linkedinInformative: { required: number; ready: number; missing: number; inProgress: number };
    linkedinVideoRelated: { required: number; ready: number; missing: number; inProgress: number };
    carousel: { required: number; ready: number; missing: number; inProgress: number };
  };
  platforms: {
    youtube: { startDate: string; isPreLaunch: boolean; daysUntil: number };
    instagram: { startDate: string; isPreLaunch: boolean; daysUntil: number };
    linkedin: { startDate: string; isPreLaunch: boolean; daysUntil: number };
    carousel: { startDate: string; isPreLaunch: boolean; daysUntil: number };
  };
  missingSummary: string[];
  nextPriorityActions: {
    type: "YouTube Long" | "Derived Reel" | "Standalone Reel" | "LinkedIn" | "Carousel";
    action: string;
    stage: string;
    reason: string;
    contentTitle?: string;
    contentId?: string;
  }[];
}

export interface SettingsState {
  profile: {
    name: string;
    role: string;
    avatar: string;
    timezone: string;
  };
  workspacePreferences: {
    startOfWeek: string;
    calendarView: string;
    contentSort: string;
    theme: string;
  };
  advanceBuffer: {
    days: number;
    isCustom: boolean;
    maintainAuto: boolean | null;
  };
  publishingFrequency: {
    youtubeLong: { count: number | null; days: string[] };
    youtubeShorts: { count: number | null; schedule: string; days: string[] };
    instagramReels: { count: number | null; schedule: string; derivedCount: number | null; standaloneCount: number | null; days: string[] };
    linkedinPosts: { count: number | null; informativeCount: number | null; videoRelatedCount: number | null };
    carousel: { frequency: string; target: number | null };
    derivedReelsPerLongVideo?: number;
  };
  schedulingRules: {
    sameDayBlocked: boolean | null;
    minGapDays: number | null;
    maxGapDays: number | null;
    platformOrder?: "Balanced" | "Instagram First" | "YouTube First" | string;
  };
  connectedPlatforms?: string[];
  derivedReelsPerLongVideo?: number;
  taskPreferences: {
    autoTaskGen: boolean | null;
    autoRepurposing: boolean | null;
    autoBufferCalc: boolean | null;
    dailyCapacity: string;
    bufferFallAuto?: boolean | null;
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
    priorityOrder: string[];
    derivedReelsPerLongVideo?: number;
    customCapacity?: number | null;
  };
  launchPlan: LaunchPlanSettings;
  isConfigured?: boolean;
}

export const DEFAULT_SETTINGS: SettingsState = {
  isConfigured: false,
  derivedReelsPerLongVideo: 3,
  profile: {
    name: "",
    role: "",
    avatar: "",
    timezone: "",
  },
  workspacePreferences: {
    startOfWeek: "",
    calendarView: "",
    contentSort: "",
    theme: "",
  },
  advanceBuffer: {
    days: 0,
    isCustom: false,
    maintainAuto: null,
  },
  publishingFrequency: {
    youtubeLong: { count: null, days: [] },
    youtubeShorts: { count: null, schedule: "", days: [] },
    instagramReels: { count: null, schedule: "", derivedCount: null, standaloneCount: null, days: [] },
    linkedinPosts: { count: null, informativeCount: null, videoRelatedCount: null },
    carousel: { frequency: "", target: null },
    derivedReelsPerLongVideo: 3,
  },
  connectedPlatforms: [],
  schedulingRules: {
    sameDayBlocked: null,
    minGapDays: null,
    maxGapDays: null,
    platformOrder: "",
  },
  taskPreferences: {
    autoTaskGen: null,
    autoRepurposing: null,
    autoBufferCalc: null,
    dailyCapacity: "",
    bufferFallAuto: null,
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
    priorityOrder: [
      "Publishing deadlines",
      "Buffer gaps",
      "Current production steps",
      "Repurposing requirements",
      "Future work / preparation",
    ],
  },
  launchPlan: {
    overallStartDate: "",
    useSeparateDates: false,
    platformDates: {
      youtube: "",
      instagram: "",
      linkedin: "",
      carousel: "",
    },
    currentSimulatedDate: "",
    useSimulatedDate: false,
  },
};

export function mergeServerSettings(prev: SettingsState, server: any): SettingsState {
  if (!server) return prev;
  return {
    ...prev,
    isConfigured: server.isConfigured !== undefined ? Boolean(server.isConfigured) : prev.isConfigured,
    derivedReelsPerLongVideo: server.derivedReelsPerLongVideo ?? prev.derivedReelsPerLongVideo ?? 3,
    profile: {
      name: server.profile?.name !== undefined ? server.profile.name : prev.profile.name,
      role: server.profile?.role !== undefined ? server.profile.role : prev.profile.role,
      avatar: server.profile?.avatar !== undefined ? server.profile.avatar : prev.profile.avatar,
      timezone: server.profile?.timezone !== undefined ? server.profile.timezone : prev.profile.timezone,
    },
    workspacePreferences: {
      startOfWeek: server.workspacePreferences?.startOfWeek !== undefined ? server.workspacePreferences.startOfWeek : prev.workspacePreferences?.startOfWeek ?? "",
      calendarView: server.workspacePreferences?.calendarView !== undefined ? server.workspacePreferences.calendarView : prev.workspacePreferences?.calendarView ?? "",
      contentSort: server.workspacePreferences?.contentSort !== undefined ? server.workspacePreferences.contentSort : prev.workspacePreferences?.contentSort ?? "",
      theme: server.workspacePreferences?.theme !== undefined ? server.workspacePreferences.theme : prev.workspacePreferences?.theme ?? "",
    },
    advanceBuffer: {
      days: server.advanceBuffer?.days !== undefined ? server.advanceBuffer.days : prev.advanceBuffer.days,
      isCustom: server.advanceBuffer?.isCustom !== undefined ? server.advanceBuffer.isCustom : prev.advanceBuffer.isCustom,
      maintainAuto: server.advanceBuffer?.maintainAuto !== undefined ? server.advanceBuffer.maintainAuto : prev.advanceBuffer.maintainAuto,
    },
    publishingFrequency: {
      youtubeLong: {
        count: server.publishingFrequency?.youtubeLong?.count !== undefined ? server.publishingFrequency.youtubeLong.count : prev.publishingFrequency.youtubeLong.count,
        days: server.publishingFrequency?.youtubeLong?.days !== undefined ? server.publishingFrequency.youtubeLong.days : prev.publishingFrequency.youtubeLong.days,
      },
      youtubeShorts: {
        count: server.publishingFrequency?.youtubeShorts?.count !== undefined ? server.publishingFrequency.youtubeShorts.count : prev.publishingFrequency.youtubeShorts.count,
        schedule: server.publishingFrequency?.youtubeShorts?.schedule !== undefined ? server.publishingFrequency.youtubeShorts.schedule : prev.publishingFrequency.youtubeShorts.schedule,
        days: server.publishingFrequency?.youtubeShorts?.days !== undefined ? server.publishingFrequency.youtubeShorts.days : prev.publishingFrequency.youtubeShorts.days,
      },
      instagramReels: {
        count: server.publishingFrequency?.instagramReels?.count !== undefined ? server.publishingFrequency.instagramReels.count : prev.publishingFrequency.instagramReels.count,
        schedule: server.publishingFrequency?.instagramReels?.schedule !== undefined ? server.publishingFrequency.instagramReels.schedule : prev.publishingFrequency.instagramReels.schedule,
        derivedCount: server.publishingFrequency?.instagramReels?.derivedCount !== undefined ? server.publishingFrequency.instagramReels.derivedCount : prev.publishingFrequency.instagramReels.derivedCount,
        standaloneCount: server.publishingFrequency?.instagramReels?.standaloneCount !== undefined ? server.publishingFrequency.instagramReels.standaloneCount : prev.publishingFrequency.instagramReels.standaloneCount,
        days: server.publishingFrequency?.instagramReels?.days !== undefined ? server.publishingFrequency.instagramReels.days : prev.publishingFrequency.instagramReels.days,
      },
      linkedinPosts: {
        count: server.publishingFrequency?.linkedinPosts?.count !== undefined ? server.publishingFrequency.linkedinPosts.count : prev.publishingFrequency.linkedinPosts.count,
        informativeCount: server.publishingFrequency?.linkedinPosts?.informativeCount !== undefined ? server.publishingFrequency.linkedinPosts.informativeCount : prev.publishingFrequency.linkedinPosts.informativeCount,
        videoRelatedCount: server.publishingFrequency?.linkedinPosts?.videoRelatedCount !== undefined ? server.publishingFrequency.linkedinPosts.videoRelatedCount : prev.publishingFrequency.linkedinPosts.videoRelatedCount,
      },
      carousel: {
        frequency: server.publishingFrequency?.carousel?.frequency !== undefined ? server.publishingFrequency.carousel.frequency : prev.publishingFrequency.carousel.frequency,
        target: server.publishingFrequency?.carousel?.target !== undefined ? server.publishingFrequency.carousel.target : prev.publishingFrequency.carousel.target,
      },
      derivedReelsPerLongVideo: server.publishingFrequency?.derivedReelsPerLongVideo ?? server.derivedReelsPerLongVideo ?? prev.derivedReelsPerLongVideo ?? 3,
    },
    schedulingRules: {
      sameDayBlocked: server.schedulingRules?.sameDayBlocked !== undefined ? server.schedulingRules.sameDayBlocked : prev.schedulingRules.sameDayBlocked,
      minGapDays: server.schedulingRules?.minGapDays !== undefined ? server.schedulingRules.minGapDays : prev.schedulingRules.minGapDays,
      maxGapDays: server.schedulingRules?.maxGapDays !== undefined ? server.schedulingRules.maxGapDays : prev.schedulingRules.maxGapDays,
      platformOrder: server.schedulingRules?.platformOrder !== undefined ? server.schedulingRules.platformOrder : prev.schedulingRules.platformOrder,
    },
    connectedPlatforms: server.connectedPlatforms !== undefined ? server.connectedPlatforms : prev.connectedPlatforms,
    taskPreferences: {
      ...prev.taskPreferences,
      autoTaskGen: server.taskPreferences?.autoTaskGen !== undefined ? server.taskPreferences.autoTaskGen : prev.taskPreferences.autoTaskGen,
      autoRepurposing: server.taskPreferences?.autoRepurposing !== undefined ? server.taskPreferences.autoRepurposing : prev.taskPreferences.autoRepurposing,
      autoBufferCalc: server.taskPreferences?.autoBufferCalc !== undefined ? server.taskPreferences.autoBufferCalc : prev.taskPreferences.autoBufferCalc,
      dailyCapacity: server.taskPreferences?.dailyCapacity !== undefined ? server.taskPreferences.dailyCapacity : prev.taskPreferences.dailyCapacity,
      customCapacity: server.taskPreferences?.customCapacity !== undefined ? server.taskPreferences.customCapacity : prev.taskPreferences.customCapacity,
      priorityOrder: server.taskPreferences?.priorityOrder !== undefined ? server.taskPreferences.priorityOrder : prev.taskPreferences.priorityOrder,
    },
    launchPlan: {
      ...prev.launchPlan,
      overallStartDate: server.launchPlan?.overallStartDate !== undefined ? server.launchPlan.overallStartDate : prev.launchPlan.overallStartDate,
      currentSimulatedDate: server.launchPlan?.currentSimulatedDate !== undefined ? server.launchPlan.currentSimulatedDate : prev.launchPlan.currentSimulatedDate,
      useSimulatedDate: server.launchPlan?.useSimulatedDate !== undefined ? server.launchPlan.useSimulatedDate : prev.launchPlan.useSimulatedDate,
      useSeparateDates: server.launchPlan?.useSeparateDates !== undefined ? server.launchPlan.useSeparateDates : prev.launchPlan.useSeparateDates,
      platformDates: {
        youtube: server.launchPlan?.platformDates?.youtube !== undefined ? server.launchPlan.platformDates.youtube : prev.launchPlan.platformDates.youtube,
        instagram: server.launchPlan?.platformDates?.instagram !== undefined ? server.launchPlan.platformDates.instagram : prev.launchPlan.platformDates.instagram,
        linkedin: server.launchPlan?.platformDates?.linkedin !== undefined ? server.launchPlan.platformDates.linkedin : prev.launchPlan.platformDates.linkedin,
        carousel: server.launchPlan?.platformDates?.carousel !== undefined ? server.launchPlan.platformDates.carousel : prev.launchPlan.platformDates.carousel,
      },
    },
  };
}

const INITIAL_COMPLETED_TASKS: TaskItem[] = [];
const INITIAL_TASKS: TaskItem[] = [];
const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [];

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? T[P]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

interface CreatorContextType {
  // Topics
  topics: Topic[];
  addTopic: (topic: Omit<Topic, "id">) => Topic;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  deleteTopic: (id: string) => void;
  advanceTopicStep: (id: string, target: number | TopicWorkflowStatus) => void;
  moveTopicStatus: (topicId: string, newStatus: TopicWorkflowStatus) => void;
  startProductionForTopic: (topicId: string) => { success: boolean; asset?: ContentAsset; error?: string };

  // Content Assets
  assets: ContentAsset[];
  addAsset: (asset: Omit<ContentAsset, "id">) => ContentAsset;
  updateAsset: (id: string, updates: Partial<ContentAsset>) => void;
  deleteAsset: (id: string) => void;
  advanceAssetStage: (id: string, targetStage: number | ContentWorkflowStatus) => void;
  exportAssetAndDeriveReels: (longVideoId: string) => { created: boolean; reels: ContentAsset[] };

  // Tasks
  tasks: TaskItem[];
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  reopenTask: (taskId: string) => void;
  addTask: (task: Omit<TaskItem, "id">) => TaskItem;

  // Calendar & Scheduling
  calendarEvents: CalendarEvent[];
  scheduleContent: (params: {
    contentId: string;
    platform: "youtube" | "instagram" | "linkedin" | "carousel";
    date: string;
    time: string;
  }) => Promise<{ success: boolean; error?: string }>;

  // Settings
  settings: SettingsState;
  updateSettings: (updates: DeepPartial<SettingsState> | Record<string, any>) => Promise<{ success: boolean; error?: string; settings?: SettingsState }>;
  activateCreatorOS: () => Promise<{ success: boolean; missingSections?: string[]; error?: string }>;

  // Calculations & Analytics Helpers
  effectiveDate: string;
  launchReadiness: LaunchReadiness;
  setSimulatedDate: (date: string) => void;
  bufferStats: {
    windowDays: number;
    windowLabel: string;
    healthStatus: "Healthy" | "Production Needed" | "Critical";
    aheadDays: number;
    quotas: {
      youtubeLong: { ready: number; target: number };
      youtubeShorts: { ready: number; target: number };
      instagramReels: { ready: number; target: number };
      linkedin: { ready: number; target: number; informativeReady: number; videoRelatedReady: number };
      carousel: { ready: number; target: number };
    };
  };

  // Reset to initial demo data
  resetAllDemoData: () => void;
}

const CreatorContext = createContext<CreatorContextType | null>(null);

// Centralized Date Utilities Import & Re-export
import {
  parseDateString,
  formatDateString,
  getDaysDiff,
  addDays,
  formatDisplayDate,
  formatShortDate,
  formatHeaderDate,
  getEffectiveDate,
  getRelativeLaunchDates,
  getRollingWindow,
  reconcileOverdueScheduledContent,
  DEFAULT_LAUNCH_DATE,
  DEFAULT_SIMULATED_DATE,
  getCurrentDateInTimezone,
} from "../domain/dateUtils.ts";

export {
  parseDateString,
  formatDateString,
  getDaysDiff,
  addDays,
  formatDisplayDate,
  formatShortDate,
  formatHeaderDate,
  getEffectiveDate,
  getRelativeLaunchDates,
  getRollingWindow,
  reconcileOverdueScheduledContent,
  DEFAULT_LAUNCH_DATE,
  DEFAULT_SIMULATED_DATE,
  getCurrentDateInTimezone,
};

export function createChildReelsForParent(
  parentVideo: ContentAsset,
  targetCount: number = 3,
  existingChildren: ContentAsset[] = []
): ContentAsset[] {
  const baseTitle = parentVideo.title.split("—")[0].trim();
  const existingIndices = new Set<number>();
  for (const r of existingChildren) {
    const match = r.title.match(/Reel\s*(\d+)/i);
    if (match) {
      existingIndices.add(parseInt(match[1], 10));
    }
  }

  const neededCount = Math.max(0, targetCount - existingChildren.length);
  if (neededCount === 0) return [];

  const missingIndices: number[] = [];
  for (let i = 1; i <= targetCount; i++) {
    if (!existingIndices.has(i)) {
      missingIndices.push(i);
    }
  }
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

  return toCreateIndices.map((idx) => {
    const thumbBg = colors[(idx - 1) % colors.length];
    const durationSec = 28 + ((idx * 3) % 7);
    const duration = `0:${durationSec < 10 ? "0" : ""}${durationSec}`;
    return {
      id: `${parentVideo.id}-reel-${idx}`,
      title: `${baseTitle} — Reel ${idx}`,
      type: "Derived Reel",
      reelType: "Long Video Derived",
      workflowStatus: "editing",
      actionStatus: "in_progress",
      progress: { stage: "Editing", completed: 0, total: 4, hasActive: true },
      distribution: { status: "Not Scheduled" },
      source: `From: ${parentVideo.title}`,
      isParentLink: true,
      parentLongVideoId: parentVideo.id,
      lastUpdated: "Today",
      duration,
      thumbBg,
      thumbText: `REEL ${idx}`,
    };
  });
}

export function CreatorOSProvider({ children }: { children: ReactNode }) {
  // Initialize state with clean empty data (frontend functional only, no dummy data)
  const [topics, setTopics] = useState<Topic[]>([]);
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [clientDate, setClientDate] = useState<string>("");

  useEffect(() => {
    setHydrated(true);
    setClientDate(getCurrentDateInTimezone(settings?.profile?.timezone));
  }, [settings?.profile?.timezone]);

  const effectiveDate =
    settings.launchPlan?.useSimulatedDate && settings.launchPlan?.currentSimulatedDate
      ? settings.launchPlan.currentSimulatedDate
      : clientDate;

  // Helper: Recalculate tasks dynamically using the engine
  const recalculateEngineTasks = (
    targetAssets: ContentAsset[],
    targetTopics: Topic[],
    targetCalendar: CalendarEvent[],
    targetSettings: SettingsState,
    targetExistingTasks: TaskItem[]
  ) => {
    if (!targetSettings.isConfigured) {
      return [];
    }
    return generateAndPrioritizeTasks({
      assets: targetAssets,
      topics: targetTopics,
      calendarEvents: targetCalendar,
      settings: targetSettings as any,
      existingTasks: targetExistingTasks,
      referenceDate: getEffectiveDate(targetSettings),
    });
  };

  // Load from real Next.js PostgreSQL API routes on client mount
  useEffect(() => {
    let isMounted = true;

    async function loadFromApi() {
      try {
        const [topicsRes, assetsRes, tasksRes, settingsRes, calendarRes] = await Promise.all([
          fetch("/api/topics?limit=100").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/content?limit=100").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/tasks").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/settings").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/calendar").then((r) => (r.ok ? r.json() : null)),
        ]);

        if (!isMounted) return;

        let loadedTopics: Topic[] = [];
        let loadedAssets: ContentAsset[] = [];
        let loadedCalendar: CalendarEvent[] = [];
        let loadedSettings: SettingsState = DEFAULT_SETTINGS;
        let loadedTasks: TaskItem[] = [];

        if (topicsRes?.topics && Array.isArray(topicsRes.topics)) {
          loadedTopics = topicsRes.topics.map((t: any) => ({
            ...t,
            status: normalizeTopicStatus(t.status),
          }));
        }

        if (assetsRes?.assets && Array.isArray(assetsRes.assets)) {
          loadedAssets = assetsRes.assets.map(migrateContentAsset);
        }

        if (calendarRes && Array.isArray(calendarRes)) {
          loadedCalendar = calendarRes;
        }

        if (settingsRes) {
          loadedSettings = mergeServerSettings(DEFAULT_SETTINGS, settingsRes);
        } else {
          loadedSettings = DEFAULT_SETTINGS;
        }

        if (tasksRes?.tasks && Array.isArray(tasksRes.tasks)) {
          loadedTasks = tasksRes.tasks;
        } else if (loadedSettings.isConfigured) {
          loadedTasks = generateAndPrioritizeTasks({
            assets: loadedAssets,
            topics: loadedTopics,
            calendarEvents: loadedCalendar,
            settings: loadedSettings as any,
            existingTasks: [],
            referenceDate: getEffectiveDate(loadedSettings),
          });
        } else {
          loadedTasks = [];
        }

        setTopics(loadedTopics);
        setAssets(loadedAssets);
        setCalendarEvents(loadedCalendar);
        setSettings(loadedSettings);
        setTasks(loadedTasks);
      } catch (err) {
        console.error("Could not load initial data from API routes:", err);
      } finally {
        if (isMounted) setHydrated(true);
      }
    }

    loadFromApi();

    return () => {
      isMounted = false;
    };
  }, []);

  // Window focus & interval reconciliation listener
  useEffect(() => {
    if (!hydrated) return;
    const handleReconcile = () => {
      const effectiveDate = getEffectiveDate(settings);
      const { updatedAssets, changedCount } = reconcileOverdueScheduledContent(
        assets,
        calendarEvents,
        effectiveDate
      );
      if (changedCount > 0) {
        setAssets(updatedAssets);
        setTasks((prev) => recalculateEngineTasks(updatedAssets, topics, calendarEvents, settings, prev));
      }
    };

    window.addEventListener("focus", handleReconcile);
    const timer = setInterval(handleReconcile, 15000);
    return () => {
      window.removeEventListener("focus", handleReconcile);
      clearInterval(timer);
    };
  }, [hydrated, assets, calendarEvents, topics, settings]);

  // ==========================================
  // TOPIC ACTIONS
  // ==========================================
  const addTopic = (newTopicData: Omit<Topic, "id">): Topic => {
    const id = `topic-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const topic: Topic = {
      ...newTopicData,
      id,
      status: normalizeTopicStatus(newTopicData.status || "idea"),
      date: newTopicData.date || "Today",
      thumbBg: newTopicData.thumbBg || "bg-gradient-to-br from-slate-900 to-blue-950 text-blue-300",
      thumbText: newTopicData.thumbText || newTopicData.title.slice(0, 10).toUpperCase(),
      currentStepIndex: newTopicData.currentStepIndex ?? 0,
    };
    const nextTopics = [topic, ...topics];
    setTopics(nextTopics);
    setTasks((prev) => recalculateEngineTasks(assets, nextTopics, calendarEvents, settings, prev));

    fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(topic),
    }).catch(console.error);

    return topic;
  };

  const updateTopic = (id: string, updates: Partial<Topic>) => {
    const nextTopics = topics.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTopics(nextTopics);
    setTasks((prev) => recalculateEngineTasks(assets, nextTopics, calendarEvents, settings, prev));

    fetch(`/api/topics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(console.error);
  };

  const deleteTopic = (id: string) => {
    const nextTopics = topics.filter((t) => t.id !== id);
    setTopics(nextTopics);
    setTasks((prev) => recalculateEngineTasks(assets, nextTopics, calendarEvents, settings, prev.filter((t) => t.topicId !== id)));

    fetch(`/api/topics/${id}`, { method: "DELETE" }).catch(console.error);
  };

  const moveTopicStatus = (topicId: string, newStatus: TopicWorkflowStatus) => {
    const canonicalStatus = normalizeTopicStatus(newStatus);
    const nextTopics = topics.map((t) => (t.id === topicId ? { ...t, status: canonicalStatus } : t));
    setTopics(nextTopics);
    setTasks((prev) => recalculateEngineTasks(assets, nextTopics, calendarEvents, settings, prev));

    fetch(`/api/topics/${topicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: canonicalStatus }),
    }).catch(console.error);
  };

  const advanceTopicStep = (id: string, target: number | TopicWorkflowStatus) => {
    let nextStatus: TopicWorkflowStatus;
    if (typeof target === "string") {
      nextStatus = target;
    } else {
      const statuses: CanonicalTopicStatus[] = ["idea", "planning", "in_progress", "converted"];
      const clamped = Math.max(0, Math.min(target, statuses.length - 1));
      nextStatus = statuses[clamped];
    }
    moveTopicStatus(id, nextStatus);
  };

  const startProductionForTopic = (
    topicId: string
  ): { success: boolean; asset?: ContentAsset; error?: string } => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) {
      return { success: false, error: "Topic not found" };
    }

    // Call real API route
    fetch(`/api/topics/${topicId}/start-production`, {
      method: "POST",
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data?.asset) {
            const apiAsset = migrateContentAsset(data.asset);
            setAssets((prev) => [apiAsset, ...prev.filter((a) => a.id !== apiAsset.id)]);
          }
        }
      })
      .catch(console.error);

    // Idempotency: Use stable IDs to connect Topics and Content Assets (never match records only by title)
    const existingAsset = assets.find(
      (a) =>
        (topic.contentAssetId && a.id === topic.contentAssetId) ||
        (a.topicId && a.topicId === topic.id)
    );

    if (existingAsset) {
      if (topic.status !== "in_progress" || topic.contentAssetId !== existingAsset.id) {
        const nextTopics = topics.map((t) =>
          t.id === topicId ? { ...t, status: "in_progress" as const, contentAssetId: existingAsset.id } : t
        );
        setTopics(nextTopics);
      }
      return { success: true, asset: existingAsset };
    }

    // Initialize canonical workflow status and progress based on content type:
    // YouTube Long Video: Script
    // Standalone Reel: Script
    // LinkedIn post: Write
    // Carousel: Create
    // Derived Reel: Edit
    let initialWorkflowStatus: ContentWorkflowStatus = "scripting";
    let initialDuration: string | undefined = "12:00";
    let contentType = topic.type;

    if (contentType === "LinkedIn") {
      initialWorkflowStatus = "writing";
      initialDuration = undefined;
    } else if (contentType === "Carousel") {
      initialWorkflowStatus = "creating";
      initialDuration = undefined;
    } else if (contentType === "Standalone Reel") {
      initialWorkflowStatus = "scripting";
      initialDuration = "0:45";
    } else if (contentType === "Long Video Derived" || (contentType as string) === "Derived Reel") {
      initialWorkflowStatus = "editing";
      initialDuration = "0:30";
      contentType = "Derived Reel" as any;
    } else {
      // YouTube Long
      contentType = "YouTube Long";
      initialWorkflowStatus = "scripting";
      initialDuration = "12:00";
    }

    const steps = getWorkflowSteps(contentType as string);
    const stepIdx = getWorkflowStepIndex(contentType as string, initialWorkflowStatus);
    const stageLabel = getWorkflowStageLabel(contentType as string, initialWorkflowStatus);

    const assetId = "asset-" + topic.id;
    const newAsset: ContentAsset = {
      id: assetId,
      title: topic.title,
      type: contentType as any,
      subType:
        topic.subType === "Informative" || topic.subType === "Long Video Related"
          ? topic.subType
          : undefined,
      reelType:
        topic.subType === "Standalone" || topic.subType === "Long Video Derived"
          ? topic.subType
          : undefined,
      workflowStatus: initialWorkflowStatus,
      actionStatus: "in_progress",
      progress: {
        stage: stageLabel,
        completed: stepIdx,
        total: steps.length,
        hasActive: true,
      },
      distribution: {
        status: "Not Scheduled",
      },
      source: `From Topic: ${topic.title}`,
      topicId: topic.id,
      lastUpdated: "Just now",
      duration: initialDuration,
      thumbBg: topic.thumbBg || "bg-gradient-to-br from-slate-900 to-blue-950 text-blue-300",
      thumbText: topic.thumbText || topic.title.slice(0, 10).toUpperCase(),
    };

    const nextAssets = [newAsset, ...assets];
    const nextTopics = topics.map((t) =>
      t.id === topicId ? { ...t, status: "in_progress" as const, contentAssetId: newAsset.id } : t
    );

    setAssets(nextAssets);
    setTopics(nextTopics);
    setTasks((prev) => recalculateEngineTasks(nextAssets, nextTopics, calendarEvents, settings, prev));

    return { success: true, asset: newAsset };
  };

  // ==========================================
  // CONTENT ASSET ACTIONS
  // ==========================================
  const addAsset = (newAssetData: Omit<ContentAsset, "id">): ContentAsset => {
    const id = String(Date.now());
    const workflowStatus: ContentWorkflowStatus =
      newAssetData.workflowStatus ||
      (newAssetData.type === "LinkedIn"
        ? "writing"
        : newAssetData.type === "Carousel"
        ? "creating"
        : newAssetData.type === "Derived Reel"
        ? "editing"
        : "scripting");

    const totalSteps = getWorkflowSteps(newAssetData.type).length;
    const stepIdx = getWorkflowStepIndex(newAssetData.type, workflowStatus);
    const stageLabel = getWorkflowStageLabel(newAssetData.type, workflowStatus);

    const asset: ContentAsset = {
      ...newAssetData,
      id,
      workflowStatus,
      actionStatus: newAssetData.actionStatus || "in_progress",
      progress: {
        hasActive: true,
        ...newAssetData.progress,
        stage: stageLabel,
        completed: stepIdx,
        total: totalSteps,
      },
      distribution: newAssetData.distribution || { status: "Not Scheduled" },
      lastUpdated: "Today",
      thumbBg: newAssetData.thumbBg || "bg-gradient-to-br from-slate-900 to-blue-950 text-blue-300",
      thumbText: newAssetData.thumbText || newAssetData.title.slice(0, 10).toUpperCase(),
    };
    const nextAssets = [asset, ...assets];
    setAssets(nextAssets);
    setTasks((prev) => recalculateEngineTasks(nextAssets, topics, calendarEvents, settings, prev));

    fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(asset),
    }).catch(console.error);

    return asset;
  };

  const updateAsset = (id: string, updates: Partial<ContentAsset>) => {
    const nextAssets = assets.map((a) => (a.id === id ? { ...a, ...updates, lastUpdated: "Today" } : a));
    setAssets(nextAssets);
    setTasks((prev) => recalculateEngineTasks(nextAssets, topics, calendarEvents, settings, prev));

    fetch(`/api/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(console.error);
  };

  const deleteAsset = (id: string) => {
    const nextAssets = assets.filter((a) => a.id !== id);
    setAssets(nextAssets);
    setTasks((prev) => recalculateEngineTasks(nextAssets, topics, calendarEvents, settings, prev.filter((t) => t.contentId !== id)));

    fetch(`/api/content/${id}`, { method: "DELETE" }).catch(console.error);
  };

  // Helper: Export Long Video and automatically derive the 3 child Reels (PRODUCT RULE: Exactly 3 child Reels)
  const exportAssetAndDeriveReels = (longVideoId: string) => {
    fetch(`/api/content/${longVideoId}/export`, { method: "POST" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data?.reels && Array.isArray(data.reels)) {
            const apiReels = data.reels.map(migrateContentAsset);
            setAssets((prev) => [...prev.filter((a) => !apiReels.some((r: any) => r.id === a.id)), ...apiReels]);
          }
        }
      })
      .catch(console.error);

    const parentVideo = assets.find((a) => a.id === longVideoId);
    if (!parentVideo || parentVideo.type !== "YouTube Long") {
      return { created: false, reels: [] };
    }

    const targetCount =
      settings.derivedReelsPerLongVideo ||
      settings.publishingFrequency?.derivedReelsPerLongVideo ||
      3;

    // Check if derived child reels already exist for this parent video (Idempotency)
    const existingChildren = assets.filter(
      (a) => a.type === "Derived Reel" && a.parentLongVideoId === longVideoId
    );
    if (existingChildren.length >= targetCount) {
      return { created: false, reels: existingChildren };
    }

    const childReels = createChildReelsForParent(parentVideo, targetCount, existingChildren);
    const nextAssets = [
      ...assets.map((a) =>
        a.id === longVideoId
          ? {
              ...a,
              workflowStatus: "exported" as ContentWorkflowStatus,
              actionStatus: "completed" as const,
              repurposing: { readyCount: 0, totalCount: targetCount },
              progress: {
                ...a.progress,
                stage: "Exported",
                completed: getWorkflowStepIndex("YouTube Long", "exported"),
              },
            }
          : a
      ),
      ...childReels,
    ];

    setAssets(nextAssets);
    setTasks((prev) => recalculateEngineTasks(nextAssets, topics, calendarEvents, settings, prev));

    return { created: true, reels: childReels };
  };

  const advanceAssetStage = (id: string, targetStage: number | ContentWorkflowStatus) => {
    fetch(`/api/content/${id}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStage }),
    }).catch(console.error);

    let targetAsset: ContentAsset | undefined;

    let nextAssets = assets.map((a) => {
      if (a.id !== id) return a;

      const steps = getWorkflowSteps(a.type);
      let nextStatus: ContentWorkflowStatus;

      if (typeof targetStage === "string") {
        nextStatus = targetStage;
      } else {
        const clampedIndex = Math.max(0, Math.min(targetStage, steps.length - 1));
        nextStatus = steps[clampedIndex].status;
      }

      const stepIdx = getWorkflowStepIndex(a.type, nextStatus);
      const stageLabel = getWorkflowStageLabel(a.type, nextStatus);
      const isCompleted = nextStatus === "published";

      const updated: ContentAsset = {
        ...a,
        workflowStatus: nextStatus,
        actionStatus:
          nextStatus === "published" ||
          nextStatus === "scheduled" ||
          nextStatus === "exported" ||
          nextStatus === "ready"
            ? "completed"
            : "in_progress",
        lastUpdated: "Today",
        distribution:
          nextStatus === "published"
            ? { ...a.distribution, status: "Published" }
            : nextStatus === "scheduled"
            ? { ...a.distribution, status: "Scheduled" }
            : a.distribution,
        progress: {
          ...a.progress,
          stage: stageLabel,
          completed: stepIdx,
          hasActive: !isCompleted,
        },
      };
      targetAsset = updated;
      return updated;
    });

    // If a YouTube Long Video reaches exported status, trigger derived reels
    if (targetAsset && isAssetEligibleForDerivation(targetAsset)) {
      const existingChildren = nextAssets.filter(
        (a) => a.type === "Derived Reel" && a.parentLongVideoId === id
      );
      if (existingChildren.length < 3) {
        const childReels = createChildReelsForParent(targetAsset);
        nextAssets = [
          ...nextAssets.map((a) => (a.id === id ? { ...a, repurposing: { readyCount: 0, totalCount: 3 } } : a)),
          ...childReels,
        ];
      }
    }

    setAssets(nextAssets);
    setTasks((prev) => recalculateEngineTasks(nextAssets, topics, calendarEvents, settings, prev));
  };

  // ==========================================
  // TASK ACTIONS
  // ==========================================
  const startTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: "Today",
        };
      })
    );

    // Mark active in content asset if attached
    const targetTask = tasks.find((t) => t.id === taskId);
    if (targetTask?.contentId) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === targetTask.contentId
            ? { ...a, progress: { ...a.progress, hasActive: true } }
            : a
        )
      );
    }
  };

  const completeTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Mark task completed in history
    const updatedTasksWithCompleted = tasks.map((t) =>
      t.id === taskId
        ? { ...t, status: "Completed" as const, completedAt: "Just now" }
        : t
    );

    let nextAssets = [...assets];
    let nextTopics = [...topics];

    if (task.contentId) {
      const asset = nextAssets.find((a) => a.id === task.contentId);
      if (asset) {
        let nextStatus: ContentWorkflowStatus = getNextWorkflowStatus(asset);
        const actionStage = task.actionStage || task.badge;

        if (actionStage === "Script" || task.title.toLowerCase().includes("script")) {
          nextStatus = "shooting";
        } else if (actionStage === "Shoot" || task.title.toLowerCase().includes("shoot")) {
          nextStatus = "editing";
        } else if (actionStage === "Edit" || actionStage === "Editing" || task.title.toLowerCase().includes("edit")) {
          nextStatus = "exported";
        } else if (actionStage === "Export" || task.title.toLowerCase().includes("export")) {
          nextStatus = "exported";
        } else if (actionStage === "Write" || task.title.toLowerCase().includes("write") || task.title.toLowerCase().includes("draft")) {
          nextStatus = "ready";
        } else if (actionStage === "Ready" || task.title.toLowerCase().includes("ready")) {
          nextStatus = "ready";
        } else if (actionStage === "Create" || task.title.toLowerCase().includes("create")) {
          nextStatus = "scheduled";
        } else if (actionStage === "Schedule" || actionStage === "Scheduling" || task.title.toLowerCase().includes("schedule")) {
          nextStatus = "scheduled";
        } else if (actionStage === "Publish" || actionStage === "Publishing" || task.title.toLowerCase().includes("publish")) {
          nextStatus = "published";
        }

        const isSchedulingAction =
          actionStage === "Schedule" ||
          actionStage === "Scheduling" ||
          task.title.toLowerCase().includes("schedule") ||
          nextStatus === "scheduled";

        const isPublishingAction =
          actionStage === "Publish" ||
          actionStage === "Publishing" ||
          task.title.toLowerCase().includes("publish") ||
          nextStatus === "published";

        const stepIdx = getWorkflowStepIndex(asset.type, nextStatus);
        const stageLabel = getWorkflowStageLabel(asset.type, nextStatus);

        nextAssets = nextAssets.map((a) => {
          if (a.id !== asset.id) return a;
          return {
            ...a,
            workflowStatus: nextStatus,
            actionStatus: "completed" as const,
            lastUpdated: "Today",
            distribution: isPublishingAction
              ? { ...a.distribution, status: "Published" }
              : isSchedulingAction
              ? { ...a.distribution, status: "Scheduled" }
              : a.distribution,
            progress: {
              ...a.progress,
              stage: stageLabel,
              completed: stepIdx,
              hasActive: nextStatus !== "published",
            },
          };
        });

        // If parent YouTube Long Video reached exported state, auto derive child reels
        const updatedAsset = nextAssets.find((a) => a.id === asset.id);
        if (updatedAsset && isAssetEligibleForDerivation(updatedAsset)) {
          const targetCount =
            settings.derivedReelsPerLongVideo ||
            settings.publishingFrequency?.derivedReelsPerLongVideo ||
            3;
          const existingChildren = nextAssets.filter(
            (a) => a.type === "Derived Reel" && a.parentLongVideoId === asset.id
          );
          if (existingChildren.length < targetCount) {
            const childReels = createChildReelsForParent(updatedAsset, targetCount, existingChildren);
            nextAssets = [
              ...nextAssets.map((a) =>
                a.id === asset.id ? { ...a, repurposing: { readyCount: 0, totalCount: targetCount } } : a
              ),
              ...childReels,
            ];
          }
        }
      }
    } else if (task.topicId) {
      nextTopics = nextTopics.map((t) => {
        if (t.id !== task.topicId) return t;
        const nextStatus = getNextTopicWorkflowStatus(t.status);
        const nextStep = TOPIC_WORKFLOW_STEPS.findIndex((s) => s.status === nextStatus);
        return {
          ...t,
          currentStepIndex: nextStep !== -1 ? nextStep : (t.currentStepIndex ?? 0) + 1,
          status: nextStatus,
        };
      });
    }

    setAssets(nextAssets);
    setTopics(nextTopics);
    setTasks(recalculateEngineTasks(nextAssets, nextTopics, calendarEvents, settings, updatedTasksWithCompleted));

    fetch(`/api/tasks/${taskId}/complete`, { method: "POST" }).catch(console.error);
  };

  const reopenTask = (taskId: string) => {
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: "Today" as const, completedAt: undefined } : t
    );
    setTasks(recalculateEngineTasks(assets, topics, calendarEvents, settings, updatedTasks));

    fetch(`/api/tasks/${taskId}/reopen`, { method: "POST" }).catch(console.error);
  };

  const addTask = (newTaskData: Omit<TaskItem, "id">): TaskItem => {
    const id = `task-${Date.now()}`;
    const task: TaskItem = {
      ...newTaskData,
      id,
    };
    setTasks((prev) => [task, ...prev]);
    return task;
  };

  // ==========================================
  // CALENDAR & SCHEDULING (ENFORCING PRODUCT RULES)
  // ==========================================
  const scheduleContent = async ({
    contentId,
    platform,
    date,
    time,
  }: {
    contentId: string;
    platform: "youtube" | "instagram" | "linkedin" | "carousel";
    date: string; // YYYY-MM-DD
    time: string; // e.g. "10:00 AM"
  }): Promise<{ success: boolean; error?: string }> => {
    const asset = assets.find((a) => a.id === contentId);
    if (!asset) {
      return { success: false, error: "Content asset not found." };
    }

    if (!date || !time) {
      return { success: false, error: "Please provide a valid date and time." };
    }

    const scheduledDateObj = parseDateString(date);
    if (isNaN(scheduledDateObj.getTime())) {
      return { success: false, error: "Invalid date format." };
    }

    // Call real server API to strictly validate and persist scheduling
    try {
      const res = await fetch(`/api/content/${contentId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, date, time }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `Scheduling rejected by server (${res.status})`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Network error while scheduling content",
      };
    }

    const dayNumber = scheduledDateObj.getDate();
    const displayMonth = scheduledDateObj.toLocaleString("en-US", { month: "long", year: "numeric" });

    let newStatus: ContentAsset["distribution"]["status"] = asset.distribution.status;
    const distUpdates: Partial<ContentAsset["distribution"]> = {};

    if (platform === "youtube") {
      distUpdates.youtubeDate = date;
      distUpdates.youtubeTime = time;
      newStatus = asset.distribution.instagramDate ? "Both Scheduled" : "YouTube Scheduled";
    } else if (platform === "instagram") {
      distUpdates.instagramDate = date;
      distUpdates.instagramTime = time;
      newStatus = asset.distribution.youtubeDate ? "Both Scheduled" : "Instagram Scheduled";
    } else if (platform === "linkedin") {
      distUpdates.linkedinDate = date;
      distUpdates.linkedinTime = time;
      newStatus = "LinkedIn Scheduled";
    } else if (platform === "carousel") {
      distUpdates.carouselDate = date;
      distUpdates.carouselTime = time;
      newStatus = "Scheduled";
    }

    const nextAssets = assets.map((a) =>
      a.id === contentId
        ? {
            ...a,
            distribution: {
              ...a.distribution,
              ...distUpdates,
              status: newStatus,
              date: formatDisplayDate(date),
            },
            lastUpdated: "Today",
          }
        : a
    );

    const newEvent: CalendarEvent = {
      id: `cal-${Date.now()}`,
      contentId,
      title: asset.title,
      type: platform,
      date: dayNumber,
      month: displayMonth,
      time,
      fullDateStr: date,
    };

    const nextCalendar = [
      ...calendarEvents.filter((e) => !(e.contentId === contentId && e.type === platform)),
      newEvent,
    ];

    setAssets(nextAssets);
    setCalendarEvents(nextCalendar);
    setTasks((prev) => recalculateEngineTasks(nextAssets, topics, nextCalendar, settings, prev));

    return { success: true };
  };

  // ==========================================
  // SETTINGS & SIMULATION ACTIONS
  // ==========================================
  const updateSettings = async (
    updates: DeepPartial<SettingsState> | Record<string, any>
  ): Promise<{ success: boolean; error?: string; settings?: SettingsState }> => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return { success: false, error: errorData.error || `Failed to update settings (${res.status})` };
      }

      const resData = await res.json().catch(() => ({}));
      const serverSettings = resData.settings || resData;

      let nextSettingsState = settings;
      setSettings((prev) => {
        const next = mergeServerSettings(prev, serverSettings);
        nextSettingsState = next;
        return next;
      });

      if (serverSettings.isConfigured) {
        setTasks((prev) => recalculateEngineTasks(assets, topics, calendarEvents, nextSettingsState, prev));
        fetch("/api/tasks/sync", { method: "POST" })
          .then(async (syncRes) => {
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData?.tasks && Array.isArray(syncData.tasks)) {
                setTasks(syncData.tasks);
              }
            }
          })
          .catch(console.error);
      }

      return { success: true, settings: serverSettings };
    } catch (err: any) {
      console.error("Error updating settings:", err);
      return { success: false, error: err?.message || "Network error while saving settings" };
    }
  };

  const activateCreatorOS = async (): Promise<{ success: boolean; missingSections?: string[]; error?: string }> => {
    const missing: string[] = [];

    if (!settings.profile.name?.trim()) missing.push("Creator Profile: Full Name");
    if (!settings.profile.role?.trim()) missing.push("Creator Profile: Role");
    if (!settings.profile.timezone?.trim()) missing.push("Creator Profile: Timezone");

    if (!settings.workspacePreferences?.startOfWeek) missing.push("Workspace Preferences: Default Start of Week");
    if (!settings.workspacePreferences?.calendarView) missing.push("Workspace Preferences: Default Calendar View");
    if (!settings.workspacePreferences?.contentSort) missing.push("Workspace Preferences: Default Content Sort");
    if (!settings.workspacePreferences?.theme) missing.push("Workspace Preferences: Theme");

    if (settings.taskPreferences?.autoTaskGen === null || settings.taskPreferences?.autoTaskGen === undefined) {
      missing.push("Content Workflow: Automatic Task Generation");
    }
    if (settings.taskPreferences?.autoRepurposing === null || settings.taskPreferences?.autoRepurposing === undefined) {
      missing.push("Content Workflow: Automatic Repurposing Tracking");
    }
    if (settings.taskPreferences?.autoBufferCalc === null || settings.taskPreferences?.autoBufferCalc === undefined) {
      missing.push("Content Workflow: Automatic Buffer Calculation");
    }

    if (!settings.advanceBuffer?.days || settings.advanceBuffer.days <= 0) {
      missing.push("Advance Buffer: Buffer Days");
    }
    if (!settings.launchPlan?.overallStartDate?.trim()) {
      missing.push("Advance Buffer: Overall Publishing Start Date");
    }

    if (settings.schedulingRules?.minGapDays === null || settings.schedulingRules?.minGapDays === undefined) {
      missing.push("Scheduling Rules: Minimum Scheduling Gap");
    }
    if (settings.schedulingRules?.maxGapDays === null || settings.schedulingRules?.maxGapDays === undefined) {
      missing.push("Scheduling Rules: Maximum Scheduling Gap");
    }
    if (settings.schedulingRules?.sameDayBlocked === null || settings.schedulingRules?.sameDayBlocked === undefined) {
      missing.push("Scheduling Rules: Cross-platform same-day rule");
    }

    if (missing.length > 0) {
      return {
        success: false,
        missingSections: missing,
        error: `Incomplete configuration: ${missing.join(", ")}`,
      };
    }

    const res = await updateSettings({ isConfigured: true });
    if (!res.success) {
      return { success: false, error: res.error };
    }
    return { success: true };
  };

  const setSimulatedDate = (newDate: string) => {
    const nextSettings: SettingsState = {
      ...settings,
      launchPlan: {
        ...settings.launchPlan,
        currentSimulatedDate: newDate,
        useSimulatedDate: true,
      },
    };
    const effectiveDate = getEffectiveDate(nextSettings);
    const { updatedAssets, changedCount } = reconcileOverdueScheduledContent(
      assets,
      calendarEvents,
      effectiveDate
    );
    const effectiveAssets = changedCount > 0 ? updatedAssets : assets;
    if (changedCount > 0) {
      setAssets(effectiveAssets);
    }
    setSettings(nextSettings);
    setTasks((prev) => recalculateEngineTasks(effectiveAssets, topics, calendarEvents, nextSettings, prev));

    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextSettings),
    }).catch(console.error);
  };

  // Reset workspace helper (clears all user records)
  const resetAllDemoData = () => {
    setTopics([]);
    setAssets([]);
    setCalendarEvents([]);
    setTasks([]);
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem("creator_os_topics");
      localStorage.removeItem("creator_os_assets");
      localStorage.removeItem("creator_os_tasks");
      localStorage.removeItem("creator_os_calendar");
      localStorage.removeItem("creator_os_settings");
    } catch (e) {}
  };

  // ==========================================
  // LAUNCH READINESS & BUFFER CALCULATIONS
  // ==========================================
  const launchReadiness: LaunchReadiness = useMemo(() => {
    if (!settings.isConfigured) {
      return {
        isPreLaunch: false,
        daysUntilLaunch: 0,
        overallStartDate: "",
        currentDate: effectiveDate,
        bufferDays: 0,
        totalUniqueRequired: 0,
        totalUniqueReady: 0,
        totalUniqueMissing: 0,
        readinessScore: 0,
        totalPlatformSlots: 0,
        breakdown: {
          youtubeLong: { required: 0, ready: 0, missing: 0, inProgress: 0 },
          derivedReels: { required: 0, ready: 0, missing: 0, inProgress: 0 },
          standaloneReels: { required: 0, ready: 0, missing: 0, inProgress: 0 },
          linkedinInformative: { required: 0, ready: 0, missing: 0, inProgress: 0 },
          linkedinVideoRelated: { required: 0, ready: 0, missing: 0, inProgress: 0 },
          carousel: { required: 0, ready: 0, missing: 0, inProgress: 0 },
        },
        platforms: {
          youtube: { startDate: "", isPreLaunch: false, daysUntil: 0 },
          instagram: { startDate: "", isPreLaunch: false, daysUntil: 0 },
          linkedin: { startDate: "", isPreLaunch: false, daysUntil: 0 },
          carousel: { startDate: "", isPreLaunch: false, daysUntil: 0 },
        },
        missingSummary: [],
        nextPriorityActions: [],
      };
    }

    const currentDate = effectiveDate;
    const overallStartDate = settings.launchPlan?.overallStartDate || "";
    const useSeparate = settings.launchPlan?.useSeparateDates ?? false;

    const ytStartDate = useSeparate ? settings.launchPlan?.platformDates?.youtube || overallStartDate : overallStartDate;
    const igStartDate = useSeparate ? settings.launchPlan?.platformDates?.instagram || overallStartDate : overallStartDate;
    const liStartDate = useSeparate ? settings.launchPlan?.platformDates?.linkedin || overallStartDate : overallStartDate;
    const carStartDate = useSeparate ? settings.launchPlan?.platformDates?.carousel || overallStartDate : overallStartDate;

    const isOverallPreLaunch = overallStartDate ? currentDate < overallStartDate : false;
    const isYtPreLaunch = ytStartDate ? currentDate < ytStartDate : false;
    const isIgPreLaunch = igStartDate ? currentDate < igStartDate : false;
    const isLiPreLaunch = liStartDate ? currentDate < liStartDate : false;
    const isCarPreLaunch = carStartDate ? currentDate < carStartDate : false;
    const isPreLaunch = isOverallPreLaunch || isYtPreLaunch || isIgPreLaunch || isLiPreLaunch || isCarPreLaunch;

    const daysUntilLaunch = overallStartDate ? Math.max(0, getDaysDiff(currentDate, overallStartDate)) : 0;
    const bufferDays = settings.advanceBuffer.days || 14;
    const factor = bufferDays / 7;

    // Platform Publishing Slots demand (for 14 days: YT Long: 4, YT Shorts: 14, IG: 14, LI: 8, Carousel: 2 = 42 slots)
    const ytLongSlots = Math.round((settings.publishingFrequency.youtubeLong.count || 0) * factor);
    const ytShortsSlots = Math.round((settings.publishingFrequency.youtubeShorts.count || 0) * factor);
    const igReelsSlots = Math.round((settings.publishingFrequency.instagramReels.count || 0) * factor);
    const liSlots = Math.round((settings.publishingFrequency.linkedinPosts.count || 0) * factor);
    const carSlots = settings.publishingFrequency.carousel.target || 0;
    const totalPlatformSlots = ytLongSlots + ytShortsSlots + igReelsSlots + liSlots + carSlots;

    // Unique Content Assets required (Supply demand):
    // 1 Long Video unlocks 3 Derived Reels upon export.
    // Derived Reels + Standalone Reels cover both IG and YT Shorts via cross-platform distribution without double counting!
    const ytLongRequired = ytLongSlots;
    const derivedReelsRequired = Math.round((settings.publishingFrequency.instagramReels.derivedCount || 0) * factor);
    const standaloneReelsRequired = Math.round((settings.publishingFrequency.instagramReels.standaloneCount || 0) * factor);
    const liInfRequired = Math.round((settings.publishingFrequency.linkedinPosts.informativeCount || 0) * factor);
    const liVidRequired = Math.round((settings.publishingFrequency.linkedinPosts.videoRelatedCount || 0) * factor);
    const carRequired = carSlots;

    const totalUniqueRequired = ytLongRequired + derivedReelsRequired + standaloneReelsRequired + liInfRequired + liVidRequired + carRequired;

    // Actual Ready Inventory (Strictly recorded canonical state; unexported or pending assets DO NOT COUNT)
    const readyYtLong = assets.filter((a) => a.type === "YouTube Long" && isAssetBufferReady(a)).length;
    const inProgressYtLong = assets.filter((a) => a.type === "YouTube Long" && isAssetInProduction(a)).length;

    const readyDerivedReels = assets.filter((a) => a.type === "Derived Reel" && isAssetBufferReady(a)).length;
    const inProgressDerivedReels = assets.filter((a) => a.type === "Derived Reel" && isAssetInProduction(a)).length;

    const readyStandaloneReels = assets.filter((a) => a.type === "Standalone Reel" && isAssetBufferReady(a)).length;
    const inProgressStandaloneReels = assets.filter((a) => a.type === "Standalone Reel" && isAssetInProduction(a)).length;

    const readyLiInf = assets.filter((a) => a.type === "LinkedIn" && a.subType === "Informative" && isAssetBufferReady(a)).length;
    const inProgressLiInf = assets.filter((a) => a.type === "LinkedIn" && a.subType === "Informative" && isAssetInProduction(a)).length;

    const readyLiVid = assets.filter((a) => a.type === "LinkedIn" && a.subType === "Long Video Related" && isAssetBufferReady(a)).length;
    const inProgressLiVid = assets.filter((a) => a.type === "LinkedIn" && a.subType === "Long Video Related" && isAssetInProduction(a)).length;

    const readyCar = assets.filter((a) => a.type === "Carousel" && isAssetBufferReady(a)).length;
    const inProgressCar = assets.filter((a) => a.type === "Carousel" && isAssetInProduction(a)).length;

    // Missing amounts
    const missingYtLong = Math.max(0, ytLongRequired - readyYtLong);
    const missingDerivedReels = Math.max(0, derivedReelsRequired - readyDerivedReels);
    const missingStandaloneReels = Math.max(0, standaloneReelsRequired - readyStandaloneReels);
    const missingLiInf = Math.max(0, liInfRequired - readyLiInf);
    const missingLiVid = Math.max(0, liVidRequired - readyLiVid);
    const missingCar = Math.max(0, carRequired - readyCar);

    const totalUniqueReady = readyYtLong + readyDerivedReels + readyStandaloneReels + readyLiInf + readyLiVid + readyCar;
    const totalUniqueMissing = missingYtLong + missingDerivedReels + missingStandaloneReels + missingLiInf + missingLiVid + missingCar;
    const readinessScore = totalUniqueRequired > 0 ? Math.min(100, Math.round((totalUniqueReady / totalUniqueRequired) * 100)) : 100;

    const missingSummary: string[] = [];
    if (missingYtLong > 0) missingSummary.push(`${missingYtLong} YouTube Long Video${missingYtLong > 1 ? "s" : ""}`);
    if (missingDerivedReels > 0) missingSummary.push(`${missingDerivedReels} Long-Video Derived Reel${missingDerivedReels > 1 ? "s" : ""}`);
    if (missingStandaloneReels > 0) missingSummary.push(`${missingStandaloneReels} Standalone Reel${missingStandaloneReels > 1 ? "s" : ""}`);
    if (missingLiInf > 0) missingSummary.push(`${missingLiInf} LinkedIn Informative Post${missingLiInf > 1 ? "s" : ""}`);
    if (missingLiVid > 0) missingSummary.push(`${missingLiVid} LinkedIn Video-Related Post${missingLiVid > 1 ? "s" : ""}`);
    if (missingCar > 0) missingSummary.push(`${missingCar} Educational Carousel${missingCar > 1 ? "s" : ""}`);

    // Prioritized production actions
    const nextPriorityActions: LaunchReadiness["nextPriorityActions"] = [];

    // 1. YouTube Long Video
    if (missingYtLong > 0) {
      const inProgLong = assets.find((a) => a.type === "YouTube Long" && isAssetInProduction(a));
      if (inProgLong) {
        nextPriorityActions.push({
          type: "YouTube Long",
          action: inProgLong.progress.stage === "Editing" ? `Finish Editing: ${inProgLong.title}` : `Complete ${inProgLong.progress.stage}: ${inProgLong.title}`,
          stage: inProgLong.progress.stage,
          reason: `Exporting master video unlocks 3 child derived Reels and fulfills ${ytLongRequired}-video launch buffer.`,
          contentTitle: inProgLong.title,
          contentId: inProgLong.id,
        });
      } else {
        nextPriorityActions.push({
          type: "YouTube Long",
          action: "Script / Shoot Next YouTube Long Video",
          stage: "Scripting",
          reason: `Need ${missingYtLong} more long videos for the ${bufferDays}-day buffer before launch.`,
        });
      }
    }

    // 2. Derived Reels
    if (missingDerivedReels > 0) {
      const inProgReel = assets.find((a) => a.type === "Derived Reel" && isAssetInProduction(a));
      if (inProgReel) {
        nextPriorityActions.push({
          type: "Derived Reel",
          action: `Edit Derived Reel: ${inProgReel.title}`,
          stage: "Editing",
          reason: "Instagram & Shorts buffer needs exported child Reels ready before launch.",
          contentTitle: inProgReel.title,
          contentId: inProgReel.id,
        });
      }
    }

    // 3. Standalone Reels
    if (missingStandaloneReels > 0) {
      const inProgStandalone = assets.find((a) => a.type === "Standalone Reel" && isAssetInProduction(a));
      if (inProgStandalone) {
        nextPriorityActions.push({
          type: "Standalone Reel",
          action: inProgStandalone.progress.stage === "Shooting" ? `Shoot Footage: ${inProgStandalone.title}` : `Edit: ${inProgStandalone.title}`,
          stage: inProgStandalone.progress.stage,
          reason: `Pre-launch buffer requires ${missingStandaloneReels} more Standalone Reels.`,
          contentTitle: inProgStandalone.title,
          contentId: inProgStandalone.id,
        });
      } else {
        nextPriorityActions.push({
          type: "Standalone Reel",
          action: "Script / Shoot Standalone Reel",
          stage: "Shooting",
          reason: `Need ${missingStandaloneReels} more Standalone Reels for launch buffer.`,
        });
      }
    }

    // 4. LinkedIn
    if (missingLiInf > 0) {
      const inProgLi = assets.find((a) => a.type === "LinkedIn" && a.subType === "Informative" && isAssetInProduction(a));
      if (inProgLi) {
        nextPriorityActions.push({
          type: "LinkedIn",
          action: `Draft & Mark Ready: ${inProgLi.title}`,
          stage: "Writing",
          reason: "Needed to fulfill LinkedIn Informative launch buffer.",
          contentTitle: inProgLi.title,
          contentId: inProgLi.id,
        });
      }
    }
    if (missingLiVid > 0) {
      const inProgLiVid = assets.find((a) => a.type === "LinkedIn" && a.subType === "Long Video Related" && isAssetInProduction(a));
      if (inProgLiVid) {
        nextPriorityActions.push({
          type: "LinkedIn",
          action: `Draft & Mark Ready: ${inProgLiVid.title}`,
          stage: "Writing",
          reason: "Needed to fulfill LinkedIn Video-Related launch buffer.",
          contentTitle: inProgLiVid.title,
          contentId: inProgLiVid.id,
        });
      }
    }

    // 5. Carousel
    if (missingCar > 0) {
      const inProgCar = assets.find((a) => a.type === "Carousel" && isAssetInProduction(a));
      if (inProgCar) {
        nextPriorityActions.push({
          type: "Carousel",
          action: `Design & Export Slides: ${inProgCar.title}`,
          stage: "Creating",
          reason: "Carousel buffer quota needed before launch date.",
          contentTitle: inProgCar.title,
          contentId: inProgCar.id,
        });
      }
    }

    return {
      isPreLaunch,
      daysUntilLaunch,
      overallStartDate,
      currentDate,
      bufferDays,
      totalUniqueRequired,
      totalUniqueReady,
      totalUniqueMissing,
      readinessScore,
      totalPlatformSlots,
      breakdown: {
        youtubeLong: { required: ytLongRequired, ready: readyYtLong, missing: missingYtLong, inProgress: inProgressYtLong },
        derivedReels: { required: derivedReelsRequired, ready: readyDerivedReels, missing: missingDerivedReels, inProgress: inProgressDerivedReels },
        standaloneReels: { required: standaloneReelsRequired, ready: readyStandaloneReels, missing: missingStandaloneReels, inProgress: inProgressStandaloneReels },
        linkedinInformative: { required: liInfRequired, ready: readyLiInf, missing: missingLiInf, inProgress: inProgressLiInf },
        linkedinVideoRelated: { required: liVidRequired, ready: readyLiVid, missing: missingLiVid, inProgress: inProgressLiVid },
        carousel: { required: carRequired, ready: readyCar, missing: missingCar, inProgress: inProgressCar },
      },
      platforms: {
        youtube: { startDate: ytStartDate, isPreLaunch: isYtPreLaunch, daysUntil: Math.max(0, getDaysDiff(currentDate, ytStartDate)) },
        instagram: { startDate: igStartDate, isPreLaunch: isIgPreLaunch, daysUntil: Math.max(0, getDaysDiff(currentDate, igStartDate)) },
        linkedin: { startDate: liStartDate, isPreLaunch: isLiPreLaunch, daysUntil: Math.max(0, getDaysDiff(currentDate, liStartDate)) },
        carousel: { startDate: carStartDate, isPreLaunch: isCarPreLaunch, daysUntil: Math.max(0, getDaysDiff(currentDate, carStartDate)) },
      },
      missingSummary,
      nextPriorityActions,
    };
  }, [assets, settings, effectiveDate]);

  // ==========================================
  // CALCULATED BUFFER & HEALTH STATS
  // ==========================================
  const bufferStats = useMemo(() => {
    if (!settings.isConfigured) {
      return {
        windowDays: 0,
        windowLabel: "Not configured",
        healthStatus: "Healthy" as const,
        aheadDays: 0,
        quotas: {
          youtubeLong: { ready: 0, target: 0 },
          youtubeShorts: { ready: 0, target: 0 },
          instagramReels: { ready: 0, target: 0 },
          linkedin: { ready: 0, target: 0, informativeReady: 0, videoRelatedReady: 0 },
          carousel: { ready: 0, target: 0 },
        },
      };
    }

    const windowDays = settings.advanceBuffer.days;
    const currentDate = effectiveDate;
    const overallStartDate = settings.launchPlan?.overallStartDate || "";
    const isPreLaunch = overallStartDate ? currentDate < overallStartDate : false;

    let windowLabel = "";
    if (isPreLaunch) {
      const bufferEnd = addDays(overallStartDate, windowDays);
      windowLabel = `${formatDisplayDate(overallStartDate)} – ${formatDisplayDate(bufferEnd)} (Launch Buffer)`;
    } else {
      const bufferEnd = addDays(currentDate, windowDays);
      windowLabel = `${formatDisplayDate(currentDate)} – ${formatDisplayDate(bufferEnd)}`;
    }

    // Quotas calculated from editable publishing frequencies
    const factor = windowDays / 7;
    const ytLongTarget = Math.round((settings.publishingFrequency.youtubeLong.count || 0) * factor);
    const ytShortsTarget = Math.round((settings.publishingFrequency.youtubeShorts.count || 0) * factor);
    const instaTarget = Math.round((settings.publishingFrequency.instagramReels.count || 0) * factor);
    const liTarget = Math.round((settings.publishingFrequency.linkedinPosts.count || 0) * factor);
    const carouselTarget = settings.publishingFrequency.carousel.target || 0;

    // Actual ready / scheduled counts from assets (strictly status-driven)
    const ytLongReady = assets.filter((a) => a.type === "YouTube Long" && isAssetBufferReady(a)).length;

    const ytShortsReady = assets.filter(
      (a) => (a.type === "Derived Reel" || a.type === "Standalone Reel") && isAssetBufferReady(a)
    ).length;

    const instaReady = assets.filter(
      (a) => (a.type === "Derived Reel" || a.type === "Standalone Reel") && isAssetBufferReady(a)
    ).length;

    const liInformativeReady = assets.filter(
      (a) => a.type === "LinkedIn" && a.subType === "Informative" && isAssetBufferReady(a)
    ).length;

    const liVideoRelatedReady = assets.filter(
      (a) => a.type === "LinkedIn" && a.subType === "Long Video Related" && isAssetBufferReady(a)
    ).length;

    const liReady = liInformativeReady + liVideoRelatedReady;

    const carouselReady = assets.filter((a) => a.type === "Carousel" && isAssetBufferReady(a)).length;

    const totalReady = ytLongReady + ytShortsReady + instaReady + liReady + carouselReady;
    const totalTarget = ytLongTarget + ytShortsTarget + instaTarget + liTarget + carouselTarget;
    const ratio = totalTarget > 0 ? totalReady / totalTarget : 1;
    const estimatedCoverageDays = Math.round(ratio * windowDays);

    let healthStatus: "Healthy" | "Production Needed" | "Critical" = "Healthy";
    if (estimatedCoverageDays >= 14) healthStatus = "Healthy";
    else if (estimatedCoverageDays >= 7) healthStatus = "Production Needed";
    else healthStatus = "Critical";

    return {
      windowDays,
      windowLabel,
      healthStatus,
      aheadDays: Math.max(0, estimatedCoverageDays + 2),
      quotas: {
        youtubeLong: { ready: ytLongReady, target: ytLongTarget },
        youtubeShorts: { ready: ytShortsReady, target: ytShortsTarget },
        instagramReels: { ready: instaReady, target: instaTarget },
        linkedin: {
          ready: liReady,
          target: liTarget,
          informativeReady: liInformativeReady,
          videoRelatedReady: liVideoRelatedReady,
        },
        carousel: { ready: carouselReady, target: carouselTarget },
      },
    };
  }, [assets, settings, effectiveDate]);

  // Dynamic tasks adaptation for Pre-Launch Mode
  const activeTasks = useMemo(() => {
    if (!launchReadiness.isPreLaunch) {
      return tasks;
    }

    // In Pre-Launch Mode:
    // Dates before the launch date must NOT be treated as overdue or missed!
    // Production tasks take highest precedence to build initial buffer.
    return tasks.map((t) => {
      // If task was flagged as overdue or due today before launch date:
      const isPastOrPreLaunch = t.dueNotice?.includes("Due Today") || t.dueNotice?.includes("Overdue") || t.dueNotice === "Today";
      if (isPastOrPreLaunch) {
        return {
          ...t,
          dueNotice: "Pre-Launch prep",
          reason: t.reason.includes("slot") ? `Launch buffer preparation: ${t.reason}` : t.reason,
        };
      }
      return t;
    });
  }, [tasks, launchReadiness.isPreLaunch]);

  return (
    <CreatorContext.Provider
      value={{
        topics,
        addTopic,
        updateTopic,
        deleteTopic,
        advanceTopicStep,
        moveTopicStatus,
        startProductionForTopic,
        assets,
        addAsset,
        updateAsset,
        deleteAsset,
        advanceAssetStage,
        exportAssetAndDeriveReels,
        tasks: activeTasks,
        startTask,
        completeTask,
        reopenTask,
        addTask,
        calendarEvents,
        scheduleContent,
        settings,
        updateSettings,
        activateCreatorOS,
        setSimulatedDate,
        effectiveDate,
        launchReadiness,
        bufferStats,
        resetAllDemoData,
      }}
    >
      {children}
    </CreatorContext.Provider>
  );
}

export function useCreatorOS() {
  const context = useContext(CreatorContext);
  if (!context) {
    throw new Error("useCreatorOS must be used within a CreatorOSProvider");
  }
  return context;
}

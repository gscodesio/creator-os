/**
 * CREATOR OS — Centralized Date Utilities & Scheduled Content Reconciliation
 *
 * Provides single source of truth for:
 * - Parsing and formatting ISO date strings (avoiding local timezone rollover glitches)
 * - Calculating relative launch dates (Pre-Launch, Launch Day, Post-Launch)
 * - Computing rolling buffer windows with exclusive end-date boundaries
 * - Idempotently reconciling scheduled content distributions after their target dates pass
 */

import type { ContentAsset } from "@/app/(dashboard)/content/contentData";
import type { CalendarEvent } from "../engine/taskEngine";

export const DEFAULT_LAUNCH_DATE = "2026-10-16";
export const DEFAULT_SIMULATED_DATE = "2026-10-10";

/**
 * Parses YYYY-MM-DD into a midday Date object to prevent UTC/local day-boundary shifts.
 */
export function parseDateString(dateStr: string): Date {
  if (!dateStr || typeof dateStr !== "string") {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }
  const parts = dateStr.split("-").map(Number);
  const now = new Date();
  const year = parts[0] || now.getFullYear();
  const month = parts[1] || (now.getMonth() + 1);
  const day = parts[2] || now.getDate();
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Formats a Date object to standard YYYY-MM-DD string.
 */
export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns difference in whole days between two YYYY-MM-DD strings (toDate - fromDate).
 */
export function getDaysDiff(fromDateStr: string, toDateStr: string): number {
  const from = parseDateString(fromDateStr);
  const to = parseDateString(toDateStr);
  const diffMs = to.getTime() - from.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Adds (or subtracts) whole days to a YYYY-MM-DD string.
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateString(d);
}

/**
 * Formats YYYY-MM-DD for standard readable display: "Oct 16, 2026".
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "Not Configured";
  const d = parseDateString(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Formats YYYY-MM-DD for short display: "Oct 16".
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = parseDateString(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Formats YYYY-MM-DD for header display: "Fri, 16 Oct 2026".
 */
export function formatHeaderDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = parseDateString(dateStr);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const day = d.getDate();
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

/**
 * Calculates current date string (YYYY-MM-DD) for a given timezone.
 */
export function getCurrentDateInTimezone(timezone?: string): string {
  try {
    const tz = timezone?.split(" ")[0]?.trim() || undefined;
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz || undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now);
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}

/**
 * Returns the effective date in YYYY-MM-DD format.
 * - Use a simulated date only when simulation is explicitly enabled and a valid simulated date is saved.
 * - Otherwise, calculates the actual current date using the configured timezone.
 */
export function getEffectiveDate(
  settingsOrLaunchPlan?: any,
  fallbackTimezone?: string
): string {
  if (!settingsOrLaunchPlan) {
    return getCurrentDateInTimezone(fallbackTimezone);
  }

  // Simulation is only active when explicitly enabled
  const isSimulationEnabled =
    settingsOrLaunchPlan.useSimulatedDate === true ||
    settingsOrLaunchPlan.launchPlan?.useSimulatedDate === true;

  const simDate =
    settingsOrLaunchPlan.currentSimulatedDate ||
    settingsOrLaunchPlan.launchPlan?.currentSimulatedDate;

  if (
    isSimulationEnabled &&
    typeof simDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(simDate.trim())
  ) {
    return simDate.trim();
  }

  // Determine timezone from settings object
  const tz =
    settingsOrLaunchPlan.timezone ||
    settingsOrLaunchPlan.profile?.timezone ||
    fallbackTimezone;

  return getCurrentDateInTimezone(tz);
}

/**
 * Computes quick-select simulated dates relative to the configured launch date.
 */
export function getRelativeLaunchDates(overallStartDate?: string): {
  preLaunchDate: string;
  launchDate: string;
  postLaunchDate: string;
  preLaunchLabel: string;
  launchLabel: string;
  postLaunchLabel: string;
} {
  const validLaunch =
    overallStartDate && overallStartDate.trim()
      ? overallStartDate.trim()
      : getCurrentDateInTimezone();
  const preLaunchDate = addDays(validLaunch, -6);
  const launchDate = validLaunch;
  const postLaunchDate = addDays(validLaunch, 5);

  return {
    preLaunchDate,
    launchDate,
    postLaunchDate,
    preLaunchLabel: `${formatShortDate(preLaunchDate)} (Pre-Launch)`,
    launchLabel: `${formatShortDate(launchDate)} (Launch Day)`,
    postLaunchLabel: `${formatShortDate(postLaunchDate)} (Post-Launch)`,
  };
}

/**
 * Computes rolling window details adhering strictly to the exclusive end boundary convention.
 * e.g., 14 days starting Oct 10 covers Oct 10 through Oct 23, with exclusive boundary Oct 24.
 */
export function getRollingWindow(
  effectiveDate: string,
  bufferDays: number,
  isPreLaunch: boolean,
  overallStartDate: string
): {
  windowStart: string;
  windowEndExclusive: string;
  windowEndInclusive: string;
  windowLabel: string;
  todayWindow: {
    startDate: string;
    endDateExclusive: string;
    displayStart: string;
    displayEnd: string;
  };
  tomorrowWindow: {
    startDate: string;
    endDateExclusive: string;
    displayStart: string;
    displayEnd: string;
  };
} {
  const windowStart = isPreLaunch ? overallStartDate : effectiveDate;
  const windowEndExclusive = addDays(windowStart, bufferDays);
  const windowEndInclusive = addDays(windowStart, bufferDays - 1);

  const windowLabel = isPreLaunch
    ? `${formatDisplayDate(windowStart)} – ${formatDisplayDate(windowEndInclusive)} (Launch Buffer)`
    : `${formatDisplayDate(windowStart)} – ${formatDisplayDate(windowEndInclusive)}`;

  const todayStart = effectiveDate;
  const todayEnd = addDays(todayStart, bufferDays);

  const tomorrowStart = addDays(effectiveDate, 1);
  const tomorrowEnd = addDays(tomorrowStart, bufferDays);

  return {
    windowStart,
    windowEndExclusive,
    windowEndInclusive,
    windowLabel,
    todayWindow: {
      startDate: todayStart,
      endDateExclusive: todayEnd,
      displayStart: formatDisplayDate(todayStart),
      displayEnd: formatDisplayDate(todayEnd),
    },
    tomorrowWindow: {
      startDate: tomorrowStart,
      endDateExclusive: tomorrowEnd,
      displayStart: formatDisplayDate(tomorrowStart),
      displayEnd: formatDisplayDate(tomorrowEnd),
    },
  };
}

/**
 * Reconciles scheduled content after its chosen date has passed.
 *
 * Rules:
 * - When scheduled for a chosen local date, it remains Scheduled during that date.
 * - Once that date has passed (`scheduledDate < effectiveDate`), it automatically transitions to Published.
 * - Centralized, idempotent, local-state only. Never claims external APIs published.
 * - Updates only the affected distribution and asset state.
 */
export function reconcileOverdueScheduledContent(
  assets: ContentAsset[],
  calendarEvents: CalendarEvent[] = [],
  effectiveDate: string
): { updatedAssets: ContentAsset[]; updatedCalendar: CalendarEvent[]; changedCount: number } {
  let changedCount = 0;

  const updatedAssets = assets.map((asset) => {
    const dist = (asset.distribution || { status: "Not Scheduled" }) as any;

    // If already fully Published, nothing to reconcile
    if (dist.status === "Published" && asset.workflowStatus === "published") {
      return asset;
    }

    // Check specific platform dates
    let ytDate = dist.youtubeDate;
    let igDate = dist.instagramDate;
    let liDate = dist.linkedinDate;
    let carDate = dist.carouselDate;
    let generalDate = dist.date;

    // Check individual nested distributions if present
    let updatedDistributionsList = dist.distributions;
    let distributionsListChanged = false;

    if (Array.isArray(dist.distributions) && dist.distributions.length > 0) {
      updatedDistributionsList = dist.distributions.map((d: any) => {
        if (d.status === "Scheduled" && d.date && d.date < effectiveDate) {
          distributionsListChanged = true;
          return { ...d, status: "Published" };
        }
        return d;
      });
    }

    // Fallback: check associated calendar events
    if (!ytDate || !igDate || !liDate || !carDate || !generalDate) {
      const assetEvents = calendarEvents.filter((e) => e.contentId === asset.id);
      for (const evt of assetEvents) {
        const evtDate = evt.fullDateStr || evt.date;
        if (evt.type === "youtube" && !ytDate && evtDate) ytDate = evtDate;
        else if (evt.type === "instagram" && !igDate && evtDate) igDate = evtDate;
        else if (evt.type === "linkedin" && !liDate && evtDate) liDate = evtDate;
        else if (evt.type === "carousel" && !carDate && evtDate) carDate = evtDate;
        else if (!generalDate && evtDate) generalDate = evtDate;
      }
    }

    let isModified = distributionsListChanged;
    let nextStatus = dist.status;
    let nextWorkflowStatus = asset.workflowStatus;
    let nextDistUpdates: Record<string, any> = {};

    if (distributionsListChanged) {
      nextDistUpdates.distributions = updatedDistributionsList;
      const allPublished = updatedDistributionsList.every((d: any) => d.status === "Published");
      if (allPublished) {
        nextStatus = "Published";
        nextWorkflowStatus = "published";
      }
    }

    // Multi-platform Reel scheduled across both YouTube Shorts and Instagram Reels
    if (dist.status === "Both Scheduled" || (ytDate && igDate)) {
      const ytOverdue = ytDate ? ytDate < effectiveDate : false;
      const igOverdue = igDate ? igDate < effectiveDate : false;

      if (ytOverdue && igOverdue) {
        nextStatus = "Published";
        nextWorkflowStatus = "published";
        isModified = true;
      } else if (ytOverdue && !igOverdue) {
        nextStatus = "Instagram Scheduled";
        isModified = true;
      } else if (igOverdue && !ytOverdue) {
        nextStatus = "YouTube Scheduled";
        isModified = true;
      }
    } else {
      // Single platform distributions
      const targetDate = ytDate || igDate || liDate || carDate || generalDate;

      if (targetDate && targetDate < effectiveDate) {
        const isCurrentlyScheduled =
          dist.status.includes("Scheduled") ||
          asset.workflowStatus === "scheduled" ||
          (targetDate && dist.status !== "Published");

        if (isCurrentlyScheduled) {
          nextStatus = "Published";
          nextWorkflowStatus = "published";
          isModified = true;
        }
      }
    }

    if (!isModified) {
      return asset;
    }

    changedCount++;
    const isNowPublished = nextStatus === "Published";

    return {
      ...asset,
      workflowStatus: isNowPublished ? "published" : nextWorkflowStatus,
      actionStatus: isNowPublished ? "completed" : asset.actionStatus,
      distribution: {
        ...dist,
        ...nextDistUpdates,
        status: nextStatus,
      },
      progress: {
        ...asset.progress,
        stage: isNowPublished ? "Published" : asset.progress.stage,
        completed: isNowPublished ? (asset.progress?.total || 4) : asset.progress?.completed,
        hasActive: isNowPublished ? false : asset.progress?.hasActive,
      },
      lastUpdated: "Today",
    };
  });

  const updatedCalendar = calendarEvents.map((evt: any) => {
    const evtDate = evt.fullDateStr || (typeof evt.date === "string" ? evt.date : undefined);
    if (evt.status === "Scheduled" && evtDate && evtDate < effectiveDate) {
      return { ...evt, status: "Published" };
    }
    return evt;
  });

  return { updatedAssets, updatedCalendar, changedCount };
}

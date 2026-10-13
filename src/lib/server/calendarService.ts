import { prisma } from "@/lib/prisma";
import { getSettings } from "./settingsService";
import { getEffectiveDate, parseDateString } from "@/lib/domain/dateUtils";

export interface CalendarEventRecord {
  id: string;
  contentId: string;
  title: string;
  type: "youtube" | "instagram" | "linkedin" | "carousel";
  date: number; // day of month
  month: string; // formatted month and year
  time: string; // e.g. "10:00 AM"
  fullDateStr: string; // "YYYY-MM-DD"
  status: string; // "Scheduled" | "Overdue" | "Published"
}

export async function getCalendarEvents(workspaceId?: string): Promise<CalendarEventRecord[]> {
  const distributions = await prisma.platformDistribution.findMany({
    where: {
      scheduledDate: { not: null },
      ...(workspaceId ? { contentAsset: { workspaceId } } : {}),
    },
    include: {
      contentAsset: true,
    },
  });

  const settings = await getSettings(workspaceId);
  const effectiveDate = getEffectiveDate(settings);

  const events: CalendarEventRecord[] = distributions.map((dist) => {
    const dateParts = (dist.scheduledDate || "").split("-");
    const day = parseInt(dateParts[2] || "1", 10);
    const isPast = (dist.scheduledDate || "") < effectiveDate;
    const status = isPast && dist.internalStatus !== "Published" ? "Overdue" : dist.internalStatus;

    const pLow = dist.platform.toLowerCase();
    let eventType: CalendarEventRecord["type"] = "youtube";
    if (pLow.includes("instagram") || pLow.includes("reels")) eventType = "instagram";
    else if (pLow.includes("linkedin")) eventType = "linkedin";
    else if (pLow.includes("carousel")) eventType = "carousel";

    const monthStr = dist.scheduledDate
      ? parseDateString(dist.scheduledDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "";

    return {
      id: dist.id,
      contentId: dist.contentAssetId,
      title: dist.contentAsset?.title || "Scheduled Content",
      type: eventType,
      date: day,
      month: monthStr,
      time: dist.scheduledTime || "10:00 AM",
      fullDateStr: dist.scheduledDate || "",
      status,
    };
  });

  return events;
}

export async function reconcileOverdueCalendar(workspaceId?: string): Promise<{ reconciledCount: number }> {
  const settings = await getSettings(workspaceId);
  const effectiveDate = getEffectiveDate(settings);

  const updated = await prisma.platformDistribution.updateMany({
    where: {
      scheduledDate: { lt: effectiveDate },
      internalStatus: "Scheduled",
      ...(workspaceId ? { contentAsset: { workspaceId } } : {}),
    },
    data: {
      internalStatus: "Published",
      workflowStatus: "Published",
    },
  });

  return { reconciledCount: updated.count };
}

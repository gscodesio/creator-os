import { prisma } from "@/lib/prisma";
import { generateAndPrioritizeTasks, type TaskItem } from "@/lib/engine/taskEngine";
import { getEffectiveDate, parseDateString } from "@/lib/domain/dateUtils";
import { getContentAssets, progressAssetStage, exportAssetAndDeriveReels } from "./contentService";
import { getTopics } from "./topicService";
import { getSettings } from "./settingsService";

export { type TaskItem };

export async function getTasks(
  query: {
    status?: string;
    priority?: string;
    category?: string;
    type?: string;
  } = {},
  workspaceId?: string
): Promise<{ tasks: TaskItem[]; counts: { today: number; upcoming: number; completed: number } }> {
  const where: any = {};
  if (workspaceId) {
    where.workspaceId = workspaceId;
  }
  if (query.status && query.status !== "All") {
    where.status = query.status;
  }
  if (query.priority && query.priority !== "All") {
    where.priority = query.priority;
  }
  if (query.category && query.category !== "All") {
    where.category = query.category;
  }
  if (query.type && query.type !== "All") {
    where.type = query.type;
  }

  let dbTasks = await prisma.task.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const totalCount = await prisma.task.count({ where: workspaceId ? { workspaceId } : {} });

  // If DB task collection has not been generated yet, compute and persist initial tasks ONLY when settings are configured
  if (totalCount === 0) {
    const settings = await getSettings(workspaceId);
    if (!settings || !settings.isConfigured) {
      return {
        tasks: [],
        counts: { today: 0, upcoming: 0, completed: 0 },
      };
    }

    const { assets } = await getContentAssets({ limit: 100 }, workspaceId);
    const { topics } = await getTopics({ limit: 100 }, workspaceId);

    const generated = generateAndPrioritizeTasks({
      assets: assets as any,
      topics: topics as any,
      calendarEvents: [],
      settings: settings as any,
      existingTasks: [],
      referenceDate: getEffectiveDate(settings),
    });

    if (generated.length > 0) {
      for (let idx = 0; idx < generated.length; idx++) {
        const t = generated[idx];
        await prisma.task.upsert({
          where: { id: t.id },
          create: {
            id: t.id,
            ...(workspaceId ? { workspaceId } : {}),
            title: t.title,
            reason: t.reason,
            badge: t.badge,
            color: t.color,
            thumbType: t.thumbType,
            type: t.type,
            category: t.category,
            status: t.status,
            priority: t.priority,
            priorityScore: t.priorityScore || 0,
            sortOrder: idx,
            contentId: t.contentId || null,
            topicId: t.topicId || null,
            contentTitle: t.contentTitle,
            dueNotice: t.dueNotice || null,
            actionStage: t.actionStage || null,
            isPreparationTask: !!t.isPreparationTask,
            targetContentType: t.targetContentType || null,
            targetSubType: t.targetSubType || null,
          },
          update: {
            title: t.title,
            reason: t.reason,
            badge: t.badge,
            color: t.color,
            category: t.category,
            priority: t.priority,
            priorityScore: t.priorityScore || 0,
            sortOrder: idx,
            status: t.status,
            dueNotice: t.dueNotice || null,
            actionStage: t.actionStage || null,
          },
        });
      }

      dbTasks = await prisma.task.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
    }
  }

  const baseCountWhere = workspaceId ? { workspaceId } : {};
  const [todayCount, upcomingCount, completedCount] = await Promise.all([
    prisma.task.count({ where: { ...baseCountWhere, status: "Today" } }),
    prisma.task.count({ where: { ...baseCountWhere, status: "Upcoming" } }),
    prisma.task.count({ where: { ...baseCountWhere, status: "Completed" } }),
  ]);

  return {
    tasks: dbTasks as unknown as TaskItem[],
    counts: { today: todayCount, upcoming: upcomingCount, completed: completedCount },
  };
}

/**
 * Synchronize and persist tasks with the task engine whenever content, topics, or settings change.
 * Preserves completed task history and stable identities.
 */
export async function syncAndPersistEngineTasks(workspaceId?: string): Promise<TaskItem[]> {
  const settings = await getSettings(workspaceId);
  if (!settings || !settings.isConfigured) {
    return [];
  }

  const { assets } = await getContentAssets({ limit: 100 }, workspaceId);
  const { topics } = await getTopics({ limit: 100 }, workspaceId);
  const distributions = await prisma.platformDistribution.findMany({
    where: {
      scheduledDate: { not: null },
      ...(workspaceId ? { contentAsset: { workspaceId } } : {}),
    },
  });

  const calendarEvents = distributions.map((d) => ({
    id: d.id,
    contentId: d.contentAssetId,
    title: "",
    type: d.platform.toLowerCase() as any,
    date: d.scheduledDate ? parseInt(d.scheduledDate.split("-")[2] || "1", 10) : 1,
    month: d.scheduledDate
      ? parseDateString(d.scheduledDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "",
    time: d.scheduledTime || "10:00 AM",
    fullDateStr: d.scheduledDate || "",
    status: d.workflowStatus,
  }));

  const taskWhere = workspaceId ? { workspaceId } : {};
  const existingDbTasks = await prisma.task.findMany({ where: taskWhere });
  const existingCompletedIds = new Set(
    existingDbTasks.filter((t) => t.status === "Completed").map((t) => t.id)
  );
  const completedAtMap = new Map(
    existingDbTasks.filter((t) => t.status === "Completed").map((t) => [t.id, t.completedAt])
  );

  const generated = generateAndPrioritizeTasks({
    assets: assets as any,
    topics: topics as any,
    calendarEvents: calendarEvents as any,
    settings: settings as any,
    existingTasks: existingDbTasks as any,
    referenceDate: getEffectiveDate(settings),
  });

  for (const t of generated) {
    if (existingCompletedIds.has(t.id)) {
      t.status = "Completed";
      t.completedAt = completedAtMap.get(t.id) || new Date().toISOString();
    }
  }

  // Validate foreign key references
  const validTopicIds = new Set(topics.map((top) => top.id));
  const validContentIds = new Set(assets.map((a) => a.id));

  for (let idx = 0; idx < generated.length; idx++) {
    const t = generated[idx];
    const safeContentId = t.contentId && validContentIds.has(t.contentId) ? t.contentId : null;
    const safeTopicId = t.topicId && validTopicIds.has(t.topicId) ? t.topicId : null;

    try {
      await prisma.task.upsert({
        where: { id: t.id },
        create: {
          id: t.id,
          ...(workspaceId ? { workspaceId } : {}),
          title: t.title,
          reason: t.reason,
          badge: t.badge,
          color: t.color,
          thumbType: t.thumbType,
          type: t.type,
          category: t.category,
          status: t.status,
          priority: t.priority,
          priorityScore: t.priorityScore || 0,
          sortOrder: idx,
          contentId: safeContentId,
          topicId: safeTopicId,
          contentTitle: t.contentTitle,
          dueNotice: t.dueNotice || null,
          completedAt: t.completedAt || null,
          actionStage: t.actionStage || null,
          isPreparationTask: !!t.isPreparationTask,
          targetContentType: t.targetContentType || null,
          targetSubType: t.targetSubType || null,
        },
        update: {
          title: t.title,
          reason: t.reason,
          badge: t.badge,
          color: t.color,
          category: t.category,
          priority: t.priority,
          priorityScore: t.priorityScore || 0,
          sortOrder: idx,
          status: t.status,
          dueNotice: t.dueNotice || null,
          completedAt: t.completedAt || null,
          actionStage: t.actionStage || null,
        },
      });
    } catch (upsertErr: any) {
      if (upsertErr?.code === "P2002") {
        await prisma.task.update({
          where: { id: t.id },
          data: {
            title: t.title,
            reason: t.reason,
            badge: t.badge,
            color: t.color,
            category: t.category,
            priority: t.priority,
            priorityScore: t.priorityScore || 0,
            sortOrder: idx,
            status: t.status,
            dueNotice: t.dueNotice || null,
            completedAt: t.completedAt || null,
            actionStage: t.actionStage || null,
          },
        }).catch(() => {});
      } else {
        throw upsertErr;
      }
    }
  }

  // Delete orphaned tasks
  const orphanedIds = existingDbTasks
    .filter((t) => (t.topicId && !validTopicIds.has(t.topicId)) || (t.contentId && !validContentIds.has(t.contentId)))
    .map((t) => t.id);

  if (orphanedIds.length > 0) {
    await prisma.task.deleteMany({ where: { id: { in: orphanedIds } } });
  }

  const { tasks } = await getTasks({}, workspaceId);
  return tasks;
}

export async function completeTask(id: string, workspaceId?: string): Promise<TaskItem> {
  const where: any = { id };
  if (workspaceId) {
    where.workspaceId = workspaceId;
  }
  const task = await prisma.task.findFirst({ where });
  if (!task) throw new Error(`Task not found or access denied: ${id}`);

  const completedAt = new Date().toISOString();
  const updated = await prisma.task.update({
    where: { id },
    data: {
      status: "Completed",
      completedAt,
    },
  });

  // If this task corresponds to a content asset workflow step, advance the authoritative stage in Neon
  if (task.contentId) {
    try {
      if (
        task.type === "YouTube Long" &&
        (task.actionStage === "Export" || task.title.toLowerCase().includes("export"))
      ) {
        await exportAssetAndDeriveReels(task.contentId, workspaceId);
      } else {
        await progressAssetStage(task.contentId, undefined, workspaceId);
      }
    } catch (err) {
      console.error(`Error progressing content asset on task completion (${task.contentId}):`, err);
    }
  }

  // Recalculate and persist the authoritative task state across workflows
  await syncAndPersistEngineTasks(workspaceId);

  return updated as unknown as TaskItem;
}

export async function reopenTask(id: string, workspaceId?: string): Promise<TaskItem> {
  if (workspaceId) {
    const task = await prisma.task.findFirst({ where: { id, workspaceId } });
    if (!task) throw new Error(`Task not found or access denied: ${id}`);
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status: "Today",
      completedAt: null,
    },
  });

  await syncAndPersistEngineTasks(workspaceId);
  return updated as unknown as TaskItem;
}

export async function createTask(task: Partial<TaskItem>, workspaceId?: string): Promise<TaskItem> {
  const newTask = {
    id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ...(workspaceId ? { workspaceId } : {}),
    title: task.title || "Untitled Task",
    reason: task.reason || "Manual Task",
    badge: task.badge || "Production",
    color: task.color || "bg-blue-500",
    thumbType: task.thumbType || "video",
    type: task.type || "YouTube Long",
    category: task.category || "Production",
    status: task.status || "Today",
    priority: task.priority || "Medium",
    priorityScore: task.priorityScore || 0,
    sortOrder: task.sortOrder || 0,
    contentId: task.contentId || null,
    topicId: task.topicId || null,
    contentTitle: task.contentTitle || task.title || "Untitled",
    dueNotice: task.dueNotice || null,
    actionStage: task.actionStage || null,
    isPreparationTask: !!task.isPreparationTask,
    targetContentType: task.targetContentType || null,
    targetSubType: task.targetSubType || null,
  };

  const created = await prisma.task.upsert({
    where: { id: newTask.id },
    create: newTask,
    update: newTask,
  });

  return created as unknown as TaskItem;
}

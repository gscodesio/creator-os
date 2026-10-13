import { prisma } from "@/lib/prisma";
import { normalizeTopicStatus, type CanonicalTopicStatus } from "@/lib/domain/contentWorkflow";

export interface TopicRecord {
  id: string;
  workspaceId?: string | null;
  title: string;
  subtitle?: string | null;
  type: string;
  subType?: string | null;
  status: string;
  date: string;
  notes?: string | null;
  thumbBg?: string | null;
  thumbText?: string | null;
  thumbSub?: string | null;
  tag?: string | null;
  description?: string | null;
  scriptOutline?: string | null;
  currentStepIndex: number;
  contentAssetId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getTopics(
  query: {
    search?: string;
    type?: string;
    status?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  } = {},
  workspaceId?: string
): Promise<{ topics: TopicRecord[]; total: number; page: number; limit: number }> {
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
      { subtitle: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }
  if (query.type && query.type !== "All") {
    where.type = query.type;
  }
  if (query.status && query.status !== "All") {
    where.status = query.status.toLowerCase();
  }

  const orderBy: any = {};
  if (query.sortBy === "Oldest First") {
    orderBy.createdAt = "asc";
  } else if (query.sortBy === "Title A-Z") {
    orderBy.title = "asc";
  } else {
    orderBy.createdAt = "desc";
  }

  const [topics, total] = await Promise.all([
    prisma.topic.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: { contentAsset: true },
    }),
    prisma.topic.count({ where }),
  ]);

  return { topics: topics as unknown as TopicRecord[], total, page, limit };
}

export async function getTopicById(id: string, workspaceId?: string): Promise<TopicRecord | null> {
  const where: any = { id };
  if (workspaceId) {
    where.workspaceId = workspaceId;
  }

  const record = await prisma.topic.findFirst({
    where,
    include: { contentAsset: true },
  });
  return record as unknown as TopicRecord | null;
}

export async function createTopic(
  input: {
    id?: string;
    title: string;
    subtitle?: string;
    type: string;
    subType?: string;
    status?: string;
    notes?: string;
    date?: string;
    thumbBg?: string;
    thumbText?: string;
    description?: string;
    scriptOutline?: string;
  },
  workspaceId?: string
): Promise<TopicRecord> {
  if (!input.title?.trim()) {
    throw new Error("Topic title is required");
  }

  const status = normalizeTopicStatus(input.status || "idea");
  const thumbText = input.thumbText || input.title.slice(0, 10).toUpperCase();
  const thumbBg =
    input.thumbBg || "bg-gradient-to-br from-slate-900 to-blue-950 text-blue-300";

  const topic = await prisma.topic.create({
    data: {
      ...(input.id ? { id: input.id } : {}),
      ...(workspaceId ? { workspaceId } : {}),
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      type: input.type,
      subType: input.subType || null,
      status,
      date: input.date || "Today",
      notes: input.notes?.trim() || null,
      thumbBg,
      thumbText,
      description: input.description?.trim() || null,
      scriptOutline: input.scriptOutline?.trim() || null,
    },
    include: { contentAsset: true },
  });

  return topic as unknown as TopicRecord;
}

export async function updateTopic(
  id: string,
  patch: Partial<{
    title: string;
    subtitle: string;
    type: string;
    subType: string;
    status: string;
    notes: string;
    date: string;
    thumbBg: string;
    thumbText: string;
    description: string;
    scriptOutline: string;
    currentStepIndex: number;
    contentAssetId: string | null;
  }>,
  workspaceId?: string
): Promise<TopicRecord> {
  if (workspaceId) {
    const existing = await prisma.topic.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      throw new Error("Topic not found or access denied");
    }
  }

  const data: any = { ...patch };
  if (patch.status) {
    data.status = normalizeTopicStatus(patch.status);
  }

  const updated = await prisma.topic.update({
    where: { id },
    data,
    include: { contentAsset: true },
  });

  return updated as unknown as TopicRecord;
}

export async function deleteTopic(id: string, workspaceId?: string): Promise<{ success: boolean }> {
  if (workspaceId) {
    const existing = await prisma.topic.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      throw new Error("Topic not found or access denied");
    }
  }

  await prisma.topic.delete({
    where: { id },
  });
  return { success: true };
}

import { prisma } from "@/lib/prisma";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  category: "topic" | "content" | "task";
  status: string;
  url: string;
}

export async function searchAllEntities(query: string, workspaceId?: string): Promise<SearchResultItem[]> {
  const q = (query || "").trim();
  if (!q) return [];

  const results: SearchResultItem[] = [];

  const [topics, content, tasks] = await Promise.all([
    prisma.topic.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { subtitle: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
    }),
    prisma.contentAsset.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { source: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
    }),
    prisma.task.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { contentTitle: { contains: q, mode: "insensitive" } },
          { reason: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
    }),
  ]);

  topics.forEach((t) => {
    results.push({
      id: t.id,
      title: t.title,
      subtitle: t.subtitle || undefined,
      type: t.type,
      category: "topic",
      status: t.status,
      url: `/topics`,
    });
  });

  content.forEach((c) => {
    results.push({
      id: c.id,
      title: c.title,
      subtitle: c.source,
      type: c.type,
      category: "content",
      status: c.stage,
      url: `/content/${c.id}`,
    });
  });

  tasks.forEach((tk) => {
    results.push({
      id: tk.id,
      title: tk.title,
      subtitle: tk.contentTitle,
      type: tk.type,
      category: "task",
      status: tk.status,
      url: `/tasks`,
    });
  });

  return results;
}

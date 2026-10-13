import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking Neon PostgreSQL tables...");
  const [topics, assets, tasks, settings, media, distributions] = await Promise.all([
    prisma.topic.count(),
    prisma.contentAsset.count(),
    prisma.task.count(),
    prisma.settings.count(),
    prisma.mediaAsset.count(),
    prisma.platformDistribution.count(),
  ]);
  console.log("Neon Counts:", { topics, assets, tasks, settings, media, distributions });
  console.log("NEON_CONNECTED_SUCCESS");
}

main()
  .catch((e) => {
    console.error("Neon Connection Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

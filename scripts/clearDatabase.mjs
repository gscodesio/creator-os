import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log("Starting full database wipe of all dummy data...");

  await prisma.$transaction(async (tx) => {
    // 1. Delete dependent distributions
    const deletedDist = await tx.platformDistribution.deleteMany({});
    console.log(`- Deleted ${deletedDist.count} platform distributions`);

    // 2. Delete tasks
    const deletedTasks = await tx.task.deleteMany({});
    console.log(`- Deleted ${deletedTasks.count} tasks`);

    // 3. Delete media assets
    const deletedMedia = await tx.mediaAsset.deleteMany({});
    console.log(`- Deleted ${deletedMedia.count} media assets`);

    // 4. Break topic -> content asset foreign keys
    await tx.topic.updateMany({
      data: { contentAssetId: null },
    });

    // 5. Delete all topics
    const deletedTopics = await tx.topic.deleteMany({});
    console.log(`- Deleted ${deletedTopics.count} topics`);

    // 6. Break parent-child derived links in content assets
    await tx.contentAsset.updateMany({
      data: { parentLongVideoId: null },
    });

    // 7. Delete all content assets
    const deletedAssets = await tx.contentAsset.deleteMany({});
    console.log(`- Deleted ${deletedAssets.count} content assets`);

    // 8. Reset Settings to a pristine, unconfigured initial state
    await tx.settings.upsert({
      where: { id: "default" },
      update: {
        isConfigured: false,
        profileName: null,
        profileRole: null,
        avatar: null,
        timezone: "Asia/Kolkata",
        startOfWeek: null,
        calendarView: null,
        contentSort: null,
        theme: null,
        advanceBufferDays: null,
        isCustomBuffer: null,
        maintainAutoBuffer: null,
        ytLongCount: null,
        ytLongDays: null,
        ytShortsCount: null,
        igReelsCount: null,
        igDerivedCount: null,
        igStandaloneCount: null,
        liPostsCount: null,
        liInfCount: null,
        liVidCount: null,
        carTarget: null,
        carouselFrequency: null,
        autoTaskGen: null,
        autoRepurposing: null,
        autoBufferCalc: null,
        dailyCapacity: null,
        customCapacity: null,
        priorityOrder: null,
        derivedReelsPerLongVideo: 3,
        overallStartDate: "",
        currentSimulatedDate: "",
        useSimulatedDate: false,
        useSeparateDates: false,
        youtubeDate: "",
        instagramDate: "",
        linkedinDate: "",
        carouselDate: "",
        connectedPlatforms: null,
        platformOrder: null,
        minSchedulingGap: null,
        maxSchedulingGap: null,
        restrictSameDay: null,
      },
      create: {
        id: "default",
        isConfigured: false,
        derivedReelsPerLongVideo: 3,
        timezone: "Asia/Kolkata",
      },
    });
    console.log("- Reset Settings to pristine unconfigured state (isConfigured: false)");
  });

  console.log("DATABASE_WIPE_COMPLETE: All dummy data has been deleted.");
}

clearDatabase()
  .catch((err) => {
    console.error("Error clearing database:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

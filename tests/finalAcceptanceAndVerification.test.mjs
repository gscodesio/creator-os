import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

import { setupTestAuth, teardownTestAuth } from "./testSessionHelper.mjs";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const prisma = new PrismaClient();

async function cleanDatabase() {
  await prisma.$transaction(async (tx) => {
    await tx.platformDistribution.deleteMany();
    await tx.task.deleteMany();
    await tx.mediaAsset.deleteMany();
    await tx.topic.updateMany({ data: { contentAssetId: null } });
    await tx.topic.deleteMany();
    await tx.contentAsset.deleteMany();
  });
}

test.describe("Creator OS — Final End-to-End Scenarios & Rule Enforcement", () => {
  test.before(async () => {
    await setupTestAuth(BASE_URL, "final-accept");
  });

  test.beforeEach(async () => {
    await cleanDatabase();
  });

  test.after(async () => {
    await cleanDatabase();
    await teardownTestAuth();
    await prisma.$disconnect();
  });

  // Scenario A — Unconfigured application
  test("Scenario A: Unconfigured state has no tasks, no buffer deficits, and clean settings", async () => {
    const settingsRes = await fetch(`${BASE_URL}/api/settings`);
    assert.equal(settingsRes.status, 200);
    const settingsData = await settingsRes.json();
    assert.equal(settingsData.isConfigured, false);

    const tasksRes = await fetch(`${BASE_URL}/api/tasks`);
    assert.equal(tasksRes.status, 200);
    const tasksData = await tasksRes.json();
    assert.equal(tasksData.tasks.length, 0);
    assert.equal(tasksData.counts.today, 0);

    const bufferRes = await fetch(`${BASE_URL}/api/buffer`);
    assert.equal(bufferRes.status, 200);
    const bufferData = await bufferRes.json();
    assert.equal(bufferData.isConfigured, false);
    assert.equal(bufferData.totalShortfall, 0);
  });

  // Scenario B — Initial Settings Persistence Across Sections
  test("Scenario B: Persist and restore full multi-section settings in Neon", async () => {
    const payload = {
      isConfigured: true,
      profile: {
        name: "Jane Doe",
        role: "Lead Tech Creator",
        timezone: "Asia/Kolkata",
      },
      workspacePreferences: {
        startOfWeek: "Sunday",
        calendarView: "Month",
        contentSort: "Date (Newest first)",
        theme: "System",
      },
      publishingFrequency: {
        youtubeLong: { count: 3, days: ["Mon", "Wed", "Fri"] },
        youtubeShorts: { count: 14, schedule: "Daily" },
        instagramReels: { count: 14, derivedCount: 8, standaloneCount: 6 },
        linkedinPosts: { count: 5, informativeCount: 3, videoRelatedCount: 2 },
        carousel: { frequency: "Weekly", target: 4 },
      },
      advanceBuffer: {
        days: 21,
        isCustom: true,
        maintainAuto: false,
      },
      schedulingRules: {
        sameDayBlocked: true,
        minGapDays: 3,
        maxGapDays: 6,
        platformOrder: "Instagram First",
      },
      connectedPlatforms: ["youtube", "instagram", "linkedin", "tiktok"],
      taskPreferences: {
        autoTaskGen: true,
        autoRepurposing: true,
        autoBufferCalc: true,
        dailyCapacity: "High",
        customCapacity: 8,
      },
      launchPlan: {
        overallStartDate: "2026-11-20",
        currentSimulatedDate: "2026-11-05",
        useSimulatedDate: true,
        platformDates: {
          youtube: "2026-11-20",
          instagram: "2026-11-18",
          linkedin: "2026-11-22",
          carousel: "2026-11-20",
        },
      },
    };

    const putRes = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(putRes.status, 200);

    // Verify retrieval from backend
    const getRes = await fetch(`${BASE_URL}/api/settings`);
    assert.equal(getRes.status, 200);
    const saved = await getRes.json();

    assert.equal(saved.isConfigured, true);
    assert.equal(saved.profile.name, "Jane Doe");
    assert.equal(saved.profile.role, "Lead Tech Creator");
    assert.equal(saved.advanceBuffer.days, 21);
    assert.equal(saved.advanceBuffer.isCustom, true);
    assert.equal(saved.publishingFrequency.youtubeLong.count, 3);
    assert.equal(saved.publishingFrequency.instagramReels.derivedCount, 8);
    assert.equal(saved.schedulingRules.minGapDays, 3);
    assert.equal(saved.schedulingRules.maxGapDays, 6);
    assert.equal(saved.schedulingRules.platformOrder, "Instagram First");
    assert.equal(saved.launchPlan.overallStartDate, "2026-11-20");
    assert.equal(saved.launchPlan.useSimulatedDate, true);
    assert.ok(saved.connectedPlatforms.includes("tiktok"));
  });

  // Scenario C — Workflow Persistence & Derived Reels Idempotency
  test("Scenario C: Topic start production and YouTube Long derivation of exactly 3 child Reels", async () => {
    // 1. Create a Topic
    const topicRes = await fetch(`${BASE_URL}/api/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Mastering Next.js 16 Fullstack",
        type: "YouTube Long",
        status: "idea",
      }),
    });
    assert.equal(topicRes.status, 201);
    const topic = await topicRes.json();

    // 2. Start Production
    const startRes = await fetch(`${BASE_URL}/api/topics/${topic.id}/start-production`, {
      method: "POST",
    });
    assert.equal(startRes.status, 200);
    const startData = await startRes.json();
    assert.ok(startData.asset.id);
    const parentAssetId = startData.asset.id;

    // Verify Idempotency of start production
    const repeatStartRes = await fetch(`${BASE_URL}/api/topics/${topic.id}/start-production`, {
      method: "POST",
    });
    assert.equal(repeatStartRes.status, 200);
    const repeatStartData = await repeatStartRes.json();
    assert.equal(repeatStartData.asset.id, parentAssetId);

    // 3. Advance to script and shoot
    await fetch(`${BASE_URL}/api/content/${parentAssetId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStage: "shooting" }),
    });

    // 4. Export long video to derive child reels
    const exportRes1 = await fetch(`${BASE_URL}/api/content/${parentAssetId}/export`, {
      method: "POST",
    });
    assert.equal(exportRes1.status, 200);
    const exportData1 = await exportRes1.json();
    assert.equal(exportData1.reels.length, 3);

    // 5. Idempotent Export: Calling export again must return the same 3 reels without duplicates
    const exportRes2 = await fetch(`${BASE_URL}/api/content/${parentAssetId}/export`, {
      method: "POST",
    });
    assert.equal(exportRes2.status, 200);
    const exportData2 = await exportRes2.json();
    assert.equal(exportData2.reels.length, 3);

    // Verify DB count of child reels is exactly 3
    const dbChildReels = await prisma.contentAsset.findMany({
      where: { parentLongVideoId: parentAssetId },
    });
    assert.equal(dbChildReels.length, 3);
  });

  // Scenario D — Server-Side Scheduling Restrictions & Idempotency
  test("Scenario D: Server rejects prohibited same-day and invalid spacing, and is idempotent", async () => {
    // Configure settings with restrictSameDay=true, minGap=2, maxGap=5, platformOrder='Instagram First'
    await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schedulingRules: {
          sameDayBlocked: true,
          minGapDays: 2,
          maxGapDays: 5,
          platformOrder: "Instagram First",
        },
      }),
    });

    // Create a standalone reel
    const assetRes = await fetch(`${BASE_URL}/api/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Micro Productivity Hack",
        type: "Standalone Reel",
      }),
    });
    assert.equal(assetRes.status, 201);
    const asset = await assetRes.json();

    // 1. Schedule on Instagram on 2026-11-10
    const igRes1 = await fetch(`${BASE_URL}/api/content/${asset.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "Instagram",
        date: "2026-11-10",
        time: "10:00 AM",
      }),
    });
    assert.equal(igRes1.status, 200);

    // 2. Reject same-day YouTube Shorts schedule (2026-11-10) -> Must return 400
    const sameDayRes = await fetch(`${BASE_URL}/api/content/${asset.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "YouTube Shorts",
        date: "2026-11-10",
        time: "02:00 PM",
      }),
    });
    assert.equal(sameDayRes.status, 400);
    const sameDayErr = await sameDayRes.json();
    assert.ok(sameDayErr.error.includes("Same-day publishing is blocked"));

    // 3. Reject min-gap violation (2026-11-11 is 1 day gap, minimum is 2) -> Must return 400
    const minGapRes = await fetch(`${BASE_URL}/api/content/${asset.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "YouTube Shorts",
        date: "2026-11-11",
        time: "10:00 AM",
      }),
    });
    assert.equal(minGapRes.status, 400);
    const minGapErr = await minGapRes.json();
    assert.ok(minGapErr.error.includes("Minimum required gap"));

    // 4. Reject platform order violation (Instagram First: YouTube Shorts cannot be before Instagram on 2026-11-05) -> Must return 400
    const orderRes = await fetch(`${BASE_URL}/api/content/${asset.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "YouTube Shorts",
        date: "2026-11-05",
        time: "10:00 AM",
      }),
    });
    assert.equal(orderRes.status, 400);
    const orderErr = await orderRes.json();
    assert.ok(orderErr.error.includes("Platform order restriction"));

    // 5. Valid YouTube Shorts schedule: 3 days after Instagram (2026-11-13) -> Must return 200
    const validYtRes = await fetch(`${BASE_URL}/api/content/${asset.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "YouTube Shorts",
        date: "2026-11-13",
        time: "10:00 AM",
      }),
    });
    assert.equal(validYtRes.status, 200);

    // 6. Idempotency test: Re-scheduling Instagram on 2026-11-10 must NOT create duplicate distributions
    const reSchedRes = await fetch(`${BASE_URL}/api/content/${asset.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "Instagram",
        date: "2026-11-10",
        time: "11:00 AM",
      }),
    });
    assert.equal(reSchedRes.status, 200);

    const distCount = await prisma.platformDistribution.count({
      where: { contentAssetId: asset.id },
    });
    assert.equal(distCount, 2); // Exactly 1 Instagram + 1 YouTube Shorts, zero duplicates!
  });

  // Scenario E — Error Handling
  test("Scenario E: Rejects invalid requests gracefully with honest error codes", async () => {
    // Missing required fields
    const badReq = await fetch(`${BASE_URL}/api/content/non-existent-id/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "Instagram" }), // missing date
    });
    assert.equal(badReq.status, 400);

    // Invalid settings payload (e.g. invalid buffer days > 90)
    const badSettings = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ advanceBuffer: { days: 999 } }),
    });
    assert.equal(badSettings.status, 400);
  });
});

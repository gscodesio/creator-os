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

test.describe("Creator OS — Priority Order, Configurable Reels & Task Persistence", () => {
  test.before(async () => {
    await setupTestAuth(BASE_URL, "priority-reels");
  });

  test.beforeEach(async () => {
    await cleanDatabase();
  });

  test.after(async () => {
    await cleanDatabase();
    await teardownTestAuth();
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------------------
  // 1. MAKE PRIORITY ORDER SETTINGS FUNCTIONAL
  // -------------------------------------------------------------------------
  test("1. Saved priority order actively influences task ordering and persists in Neon", async () => {
    // A. Configure base settings
    const initialSettings = {
      isConfigured: true,
      profile: { name: "Alex", role: "Creator", timezone: "Asia/Kolkata" },
      workspacePreferences: { startOfWeek: "Sunday", calendarView: "Month", contentSort: "Newest", theme: "Dark" },
      publishingFrequency: {
        youtubeLong: { count: 2, days: ["Tue", "Fri"] },
        youtubeShorts: { count: 7 },
        instagramReels: { count: 7, derivedCount: 4, standaloneCount: 3 },
        linkedinPosts: { count: 4 },
        carousel: { target: 2 },
        derivedReelsPerLongVideo: 3,
      },
      advanceBuffer: { days: 14, maintainAuto: true },
      taskPreferences: {
        autoTaskGen: true,
        autoBufferCalc: true,
        autoRepurposing: true,
        dailyCapacity: "Auto",
        priorityOrder: [
          "Buffer gaps",
          "Current production steps",
          "Publishing deadlines",
          "Repurposing requirements",
          "Future work / preparation",
        ],
      },
      launchPlan: { overallStartDate: "2026-11-20" },
      schedulingRules: { minGapDays: 2, maxGapDays: 5 },
    };

    const saveRes = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(initialSettings),
    });
    assert.equal(saveRes.status, 200);

    // Create an in-production YouTube Long Video (Scripting stage -> task is Script)
    const assetRes = await fetch(`${BASE_URL}/api/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Deep Dive into Node.js Microservices",
        type: "YouTube Long",
        workflowStatus: "scripting",
        stage: "Script",
      }),
    });
    assert.equal(assetRes.status, 201);

    // Sync tasks
    const syncRes1 = await fetch(`${BASE_URL}/api/tasks/sync`, { method: "POST" });
    assert.equal(syncRes1.status, 200);
    const data1 = await syncRes1.json();
    const tasks1 = data1.tasks;

    const prepTask1 = tasks1.find((t) => t.isPreparationTask);
    const prodTask1 = tasks1.find((t) => t.actionStage === "Script");

    assert.ok(prepTask1, "Should have generated a buffer gap preparation task");
    assert.ok(prodTask1, "Should have generated a production Script task");

    // Under "Buffer gaps" first, prepTask1 should be ranked above prodTask1
    const prepIdx1 = tasks1.findIndex((t) => t.id === prepTask1.id);
    const prodIdx1 = tasks1.findIndex((t) => t.id === prodTask1.id);
    assert.ok(
      prepIdx1 < prodIdx1,
      `Buffer gaps priority should place prep task (${prepIdx1}) ahead of production task (${prodIdx1})`
    );

    // B. Reorder priority: Put "Current production steps" #1
    const reorderedSettings = {
      taskPreferences: {
        priorityOrder: [
          "Current production steps",
          "Buffer gaps",
          "Publishing deadlines",
          "Repurposing requirements",
          "Future work / preparation",
        ],
      },
    };

    const updateRes = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reorderedSettings),
    });
    assert.equal(updateRes.status, 200);

    // Sync tasks again
    const syncRes2 = await fetch(`${BASE_URL}/api/tasks/sync`, { method: "POST" });
    assert.equal(syncRes2.status, 200);
    const data2 = await syncRes2.json();
    const tasks2 = data2.tasks;

    const prepTask2 = tasks2.find((t) => t.isPreparationTask);
    const prodTask2 = tasks2.find((t) => t.actionStage === "Script");

    const prepIdx2 = tasks2.findIndex((t) => t.id === prepTask2.id);
    const prodIdx2 = tasks2.findIndex((t) => t.id === prodTask2.id);

    assert.ok(
      prodIdx2 < prepIdx2,
      `Production steps priority should place production task (${prodIdx2}) ahead of prep task (${prepIdx2})`
    );

    // C. Verify persistence in Neon and across browser refresh
    const getSettingsRes = await fetch(`${BASE_URL}/api/settings`);
    assert.equal(getSettingsRes.status, 200);
    const savedSettings = await getSettingsRes.json();
    assert.deepEqual(
      savedSettings.taskPreferences.priorityOrder.slice(0, 2),
      ["Current production steps", "Buffer gaps"],
      "Saved priority order must persist and remain active in Neon"
    );
  });

  // -------------------------------------------------------------------------
  // 2. MAKE DERIVED REELS PER LONG VIDEO CONFIGURABLE
  // -------------------------------------------------------------------------
  test("2. Derived Reels per Long Video is configurable, bounded, and persists", async () => {
    // A. Valid setting update: 4
    const resValid = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        derivedReelsPerLongVideo: 4,
      }),
    });
    assert.equal(resValid.status, 200);
    const validData = await resValid.json();
    assert.equal(validData.derivedReelsPerLongVideo, 4);

    // Verify in database
    const dbRecord = await prisma.settings.findFirst({
      orderBy: { updatedAt: "desc" },
    });
    assert.equal(dbRecord?.derivedReelsPerLongVideo, 4);

    // B. Invalid setting update: out of range (> 10 or < 1)
    const resInvalidHigh = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        derivedReelsPerLongVideo: 15,
      }),
    });
    assert.equal(resInvalidHigh.status, 400);

    const resInvalidLow = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        derivedReelsPerLongVideo: 0,
      }),
    });
    assert.equal(resInvalidLow.status, 400);

    // Value in DB should remain 4
    const dbRecord2 = await prisma.settings.findFirst({
      orderBy: { updatedAt: "desc" },
    });
    assert.equal(dbRecord2?.derivedReelsPerLongVideo, 4);
  });

  // -------------------------------------------------------------------------
  // 3. FIX PARTIAL CHILD-REEL IDEMPOTENCY
  // -------------------------------------------------------------------------
  test("3. Child-Reel export handles zero, partial, complete, excess, repeated, and concurrent cases", async () => {
    // Configure target = 3
    await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        derivedReelsPerLongVideo: 3,
      }),
    });

    // Create a long video
    const parentRes = await fetch(`${BASE_URL}/api/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Ultimate Guide to System Design",
        type: "YouTube Long",
        workflowStatus: "editing",
        stage: "Edit",
      }),
    });
    assert.equal(parentRes.status, 201);
    const parent = await parentRes.json();

    // --- CASE 0: Zero Reels exist -> Creates 3 ---
    const exportRes1 = await fetch(`${BASE_URL}/api/content/${parent.id}/export`, {
      method: "POST",
    });
    assert.equal(exportRes1.status, 200);
    const exportData1 = await exportRes1.json();
    assert.equal(exportData1.reels.length, 3, "Should create exactly 3 child reels from zero");

    const reelsInDb1 = await prisma.contentAsset.findMany({
      where: { parentLongVideoId: parent.id, type: "Derived Reel" },
    });
    assert.equal(reelsInDb1.length, 3);
    assert.ok(reelsInDb1.some((r) => r.title.includes("Reel 1")));
    assert.ok(reelsInDb1.some((r) => r.title.includes("Reel 2")));
    assert.ok(reelsInDb1.some((r) => r.title.includes("Reel 3")));

    // --- CASE 5 & 3: Repeated request & Complete target exists -> 0 duplicates ---
    const exportResRepeat = await fetch(`${BASE_URL}/api/content/${parent.id}/export`, {
      method: "POST",
    });
    assert.equal(exportResRepeat.status, 200);
    const exportDataRepeat = await exportResRepeat.json();
    assert.equal(exportDataRepeat.reels.length, 3);

    const reelsInDbRepeat = await prisma.contentAsset.findMany({
      where: { parentLongVideoId: parent.id, type: "Derived Reel" },
    });
    assert.equal(reelsInDbRepeat.length, 3, "Repeated export must not create duplicates");

    // --- CASE 1: Partial - 1 exists -> Creates only 2 missing ---
    // Delete Reel 2 and Reel 3
    const reel2 = reelsInDb1.find((r) => r.title.includes("Reel 2"));
    const reel3 = reelsInDb1.find((r) => r.title.includes("Reel 3"));
    await prisma.contentAsset.deleteMany({
      where: { id: { in: [reel2.id, reel3.id] } },
    });

    const reelsAfterDelete = await prisma.contentAsset.findMany({
      where: { parentLongVideoId: parent.id, type: "Derived Reel" },
    });
    assert.equal(reelsAfterDelete.length, 1, "Only Reel 1 remains");

    const exportResPartial1 = await fetch(`${BASE_URL}/api/content/${parent.id}/export`, {
      method: "POST",
    });
    assert.equal(exportResPartial1.status, 200);
    const reelsInDbPartial1 = await prisma.contentAsset.findMany({
      where: { parentLongVideoId: parent.id, type: "Derived Reel" },
    });
    assert.equal(reelsInDbPartial1.length, 3, "Must create 2 missing reels to reach target 3");

    // --- CASE 2: Partial - 2 exist -> Creates only 1 missing ---
    // Delete only Reel 3
    await prisma.contentAsset.deleteMany({
      where: {
        parentLongVideoId: parent.id,
        type: "Derived Reel",
        title: { contains: "Reel 3" },
      },
    });

    const exportResPartial2 = await fetch(`${BASE_URL}/api/content/${parent.id}/export`, {
      method: "POST",
    });
    assert.equal(exportResPartial2.status, 200);
    const reelsInDbPartial2 = await prisma.contentAsset.findMany({
      where: { parentLongVideoId: parent.id, type: "Derived Reel" },
    });
    assert.equal(reelsInDbPartial2.length, 3, "Must create 1 missing reel to reach target 3");

    // --- CASE 4: Excess exists (4 exist, target 3) -> Does not delete existing content ---
    await prisma.contentAsset.create({
      data: {
        id: `${parent.id}-reel-4`,
        title: `${parent.title} — Reel 4`,
        type: "Derived Reel",
        reelType: "Long Video Derived",
        workflowStatus: "editing",
        stage: "Editing",
        parentLongVideoId: parent.id,
        thumbText: "REEL 4",
      },
    });

    const exportResExcess = await fetch(`${BASE_URL}/api/content/${parent.id}/export`, {
      method: "POST",
    });
    assert.equal(exportResExcess.status, 200);
    const exportDataExcess = await exportResExcess.json();
    assert.equal(exportDataExcess.reels.length, 4, "Excess reels must be preserved, not deleted");

    const reelsInDbExcess = await prisma.contentAsset.findMany({
      where: { parentLongVideoId: parent.id, type: "Derived Reel" },
    });
    assert.equal(reelsInDbExcess.length, 4);

    // --- CASE 6: Concurrent requests safety ---
    // Create new parent video
    const parent2Res = await fetch(`${BASE_URL}/api/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Concurrent Export Stress Test",
        type: "YouTube Long",
        workflowStatus: "editing",
        stage: "Edit",
      }),
    });
    const parent2 = await parent2Res.json();

    // Trigger 3 concurrent exports at the exact same moment
    const [resA, resB, resC] = await Promise.all([
      fetch(`${BASE_URL}/api/content/${parent2.id}/export`, { method: "POST" }),
      fetch(`${BASE_URL}/api/content/${parent2.id}/export`, { method: "POST" }),
      fetch(`${BASE_URL}/api/content/${parent2.id}/export`, { method: "POST" }),
    ]);

    assert.equal(resA.status, 200);
    assert.equal(resB.status, 200);
    assert.equal(resC.status, 200);

    const concurrentReels = await prisma.contentAsset.findMany({
      where: { parentLongVideoId: parent2.id, type: "Derived Reel" },
    });
    assert.equal(concurrentReels.length, 3, "Concurrent exports must safely result in exactly 3 child reels");
  });

  // -------------------------------------------------------------------------
  // 4. VERIFY TASK PERSISTENCE ACROSS WORKFLOW CHANGES & REFRESH
  // -------------------------------------------------------------------------
  test("4. Authoritative task state writes to Neon across topic start, progress, export, completion, and refresh", async () => {
    // A. Setup configured settings
    await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isConfigured: true,
        profile: { name: "Alex", role: "Creator", timezone: "Asia/Kolkata" },
        workspacePreferences: { startOfWeek: "Sunday", calendarView: "Month", contentSort: "Newest", theme: "Dark" },
        advanceBuffer: { days: 14, maintainAuto: true },
        publishingFrequency: {
          youtubeLong: { count: 2, days: ["Tue", "Fri"] },
          youtubeShorts: { count: 7 },
          instagramReels: { count: 7, derivedCount: 4, standaloneCount: 3 },
          linkedinPosts: { count: 4 },
          carousel: { target: 2 },
          derivedReelsPerLongVideo: 3,
        },
        taskPreferences: {
          autoTaskGen: true,
          autoBufferCalc: true,
          autoRepurposing: true,
          priorityOrder: [
            "Current production steps",
            "Publishing deadlines",
            "Buffer gaps",
            "Repurposing requirements",
            "Future work / preparation",
          ],
        },
        launchPlan: { overallStartDate: "2026-11-20" },
        schedulingRules: { minGapDays: 2, maxGapDays: 5 },
      }),
    });

    // B. Create Topic
    const topicRes = await fetch(`${BASE_URL}/api/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Production Architecture in 2026",
        type: "YouTube Long",
        status: "planning",
      }),
    });
    assert.equal(topicRes.status, 201);
    const topic = await topicRes.json();

    // C. Topic start -> writes ContentAsset and initial Task in Neon
    const startRes = await fetch(`${BASE_URL}/api/topics/${topic.id}/start-production`, {
      method: "POST",
    });
    assert.equal(startRes.status, 200);
    const startData = await startRes.json();
    const assetId = startData.asset.id;

    // Check Neon tasks
    const tasksAfterStart = await prisma.task.findMany({
      where: { contentId: assetId },
    });
    assert.ok(tasksAfterStart.length > 0, "Initial task must be persisted in Neon");
    const scriptTask = tasksAfterStart.find((t) => t.actionStage === "Script" || t.badge === "Planning");
    assert.ok(scriptTask, "Initial Script task must exist in Neon");

    // Verify browser refresh simulation (GET /api/tasks)
    const refresh1 = await fetch(`${BASE_URL}/api/tasks`);
    assert.equal(refresh1.status, 200);
    const refreshData1 = await refresh1.json();
    const taskFoundOnRefresh1 = refreshData1.tasks.find((t) => t.id === scriptTask.id);
    assert.ok(taskFoundOnRefresh1, "Task must remain visible after refresh with stable ID");

    // D. Complete Task -> Authoritatively marks task Completed, advances ContentAsset to Shoot, writes Shoot task
    const completeRes = await fetch(`${BASE_URL}/api/tasks/${scriptTask.id}/complete`, {
      method: "POST",
    });
    assert.equal(completeRes.status, 200);

    // Verify task state in Neon
    const completedTaskInDb = await prisma.task.findUnique({
      where: { id: scriptTask.id },
    });
    assert.equal(completedTaskInDb?.status, "Completed");
    assert.ok(completedTaskInDb?.completedAt, "Completed task must have timestamp");

    // Verify ContentAsset advanced in Neon
    const assetInDb = await prisma.contentAsset.findUnique({
      where: { id: assetId },
    });
    assert.equal(assetInDb?.workflowStatus, "shooting", "ContentAsset in Neon must advance to next stage (shooting)");

    // Verify next task (Shoot) is written to Neon
    const shootTaskInDb = await prisma.task.findFirst({
      where: { contentId: assetId, status: { not: "Completed" } },
    });
    assert.ok(shootTaskInDb, "Next stage Shoot task must be written to Neon");
    assert.equal(shootTaskInDb?.actionStage, "Shoot");

    // Verify browser refresh simulation (counts and consistency)
    const refresh2 = await fetch(`${BASE_URL}/api/tasks`);
    const refreshData2 = await refresh2.json();
    assert.ok(refreshData2.counts.completed >= 1, "Completed count must include completed task");
    assert.ok(
      refreshData2.tasks.some((t) => t.id === scriptTask.id && t.status === "Completed"),
      "Completed task must stay Completed after refresh"
    );
    assert.ok(
      refreshData2.tasks.some((t) => t.id === shootTaskInDb.id && t.status === "Today"),
      "Next stage task must stay in Today/Upcoming after refresh"
    );

    // E. Reopen Task -> Restores task to Today in Neon
    const reopenRes = await fetch(`${BASE_URL}/api/tasks/${scriptTask.id}/reopen`, {
      method: "POST",
    });
    assert.equal(reopenRes.status, 200);

    const reopenedTaskInDb = await prisma.task.findUnique({
      where: { id: scriptTask.id },
    });
    assert.equal(reopenedTaskInDb?.status, "Today");
    assert.equal(reopenedTaskInDb?.completedAt, null);

    // Refresh after reopen
    const refresh3 = await fetch(`${BASE_URL}/api/tasks`);
    const refreshData3 = await refresh3.json();
    const reopenedOnRefresh = refreshData3.tasks.find((t) => t.id === scriptTask.id);
    assert.equal(reopenedOnRefresh?.status, "Today");
  });
});

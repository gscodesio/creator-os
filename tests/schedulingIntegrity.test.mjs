import "dotenv/config";
import test, { describe, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

import { setupTestAuth, teardownTestAuth } from "./testSessionHelper.mjs";

const BASE_URL = "http://localhost:3000";
const prisma = new PrismaClient();

describe("Scheduling Rules and Distribution Integrity Suite", { concurrency: 1 }, () => {
  let testReelId = null;

  test("Setup: configure scheduling rules and create test Reel", async () => {
    await setupTestAuth(BASE_URL, "sched-integrity");
    // 1. Configure scheduling rules: minGap 2, maxGap 5, sameDayBlocked true
    const setRes = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        advanceBuffer: { days: 14 },
        schedulingRules: {
          sameDayBlocked: true,
          minGapDays: 2,
          maxGapDays: 5,
          platformOrder: "Balanced",
        },
      }),
    });
    assert.equal(setRes.status, 200);

    // 2. Create standalone reel
    const createRes = await fetch(`${BASE_URL}/api/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Integrity Test Reel",
        type: "Standalone Reel",
        workflowStatus: "ready",
      }),
    });
    assert.equal(createRes.status, 201);
    const asset = await createRes.json();
    testReelId = asset.id;
    assert.ok(testReelId);
  });

  test("Rule 1: Schedule first platform (Instagram on 2026-10-15)", async () => {
    const res = await fetch(`${BASE_URL}/api/content/${testReelId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "instagram",
        date: "2026-10-15",
        time: "10:00 AM",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.workflowStatus, "scheduled");

    // Verify 1 distribution in database
    const dists = await prisma.platformDistribution.findMany({
      where: { contentAssetId: testReelId },
    });
    assert.equal(dists.length, 1);
    assert.equal(dists[0].platform, "instagram");
    assert.equal(dists[0].scheduledDate, "2026-10-15");
  });

  test("Rule 2: Server-side validation BLOCKS same-day distribution (YouTube Shorts on 2026-10-15)", async () => {
    const res = await fetch(`${BASE_URL}/api/content/${testReelId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "youtube",
        date: "2026-10-15",
        time: "02:00 PM",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Same-day publishing is blocked/i);

    // Verify existing schedule was left unchanged and no new distribution was created
    const dists = await prisma.platformDistribution.findMany({
      where: { contentAssetId: testReelId },
    });
    assert.equal(dists.length, 1);
    assert.equal(dists[0].platform, "instagram");
  });

  test("Rule 3: Server-side validation BLOCKS gap < minGap (1 day gap on 2026-10-16)", async () => {
    const res = await fetch(`${BASE_URL}/api/content/${testReelId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "youtube",
        date: "2026-10-16",
        time: "10:00 AM",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Minimum required gap is 2 days/i);
  });

  test("Rule 4: Server-side validation BLOCKS gap > maxGap (6 days gap on 2026-10-21)", async () => {
    const res = await fetch(`${BASE_URL}/api/content/${testReelId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "youtube",
        date: "2026-10-21",
        time: "10:00 AM",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Maximum allowed gap is 5 days/i);
  });

  test("Rule 5: Valid gap (3 days gap on 2026-10-18) SUCCEEDS", async () => {
    const res = await fetch(`${BASE_URL}/api/content/${testReelId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "youtube",
        date: "2026-10-18",
        time: "10:00 AM",
      }),
    });
    assert.equal(res.status, 200);

    const dists = await prisma.platformDistribution.findMany({
      where: { contentAssetId: testReelId },
    });
    assert.equal(dists.length, 2);
  });

  test("Rule 6: Rescheduling same platform UPDATES existing record (no duplicates)", async () => {
    // Reschedule Instagram from 2026-10-15 to 2026-10-21 (gap with 2026-10-18 is 3 days, valid!)
    const res = await fetch(`${BASE_URL}/api/content/${testReelId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "instagram",
        date: "2026-10-21",
        time: "06:00 PM",
      }),
    });
    assert.equal(res.status, 200);

    // Verify still exactly 2 records, Instagram is updated
    const dists = await prisma.platformDistribution.findMany({
      where: { contentAssetId: testReelId },
    });
    assert.equal(dists.length, 2, "Must not create duplicate distributions on reschedule");
    const igDist = dists.find((d) => d.platform === "instagram");
    assert.equal(igDist.scheduledDate, "2026-10-21");
    assert.equal(igDist.scheduledTime, "06:00 PM");
  });
});

after(async () => {
  await teardownTestAuth();
  await prisma.$disconnect();
});

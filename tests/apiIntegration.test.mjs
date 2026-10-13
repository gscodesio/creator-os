import "dotenv/config";
import test, { describe, after } from "node:test";
import assert from "node:assert/strict";

import { setupTestAuth, teardownTestAuth } from "./testSessionHelper.mjs";

const BASE_URL = "http://localhost:3000";
let uploadedPublicId = null;

describe("API Integration Suite", { concurrency: 1 }, () => {
test("API: Topics CRUD & Start Production", async () => {
  await setupTestAuth(BASE_URL, "api-integ");
  // 1. Create a topic
  const createRes = await fetch(`${BASE_URL}/api/topics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "How to Build Fullstack Apps with Next.js",
      subtitle: "Comprehensive guide for devs",
      type: "YouTube Long",
      status: "idea",
    }),
  });
  assert.equal(createRes.status, 201);
  const createdTopic = await createRes.json();
  assert.ok(createdTopic.id);
  assert.equal(createdTopic.title, "How to Build Fullstack Apps with Next.js");
  assert.equal(createdTopic.status, "idea");

  // 2. Fetch topics
  const listRes = await fetch(`${BASE_URL}/api/topics`);
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.ok(Array.isArray(listData.topics));
  const found = listData.topics.find((t) => t.id === createdTopic.id);
  assert.ok(found);

  // 3. Update topic
  const updateRes = await fetch(`${BASE_URL}/api/topics/${createdTopic.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "planning" }),
  });
  assert.equal(updateRes.status, 200);
  const updatedTopic = await updateRes.json();
  assert.equal(updatedTopic.status, "planning");

  // 4. Start production for topic
  const startProdRes = await fetch(`${BASE_URL}/api/topics/${createdTopic.id}/start-production`, {
    method: "POST",
  });
  assert.equal(startProdRes.status, 200);
  const startProdData = await startProdRes.json();
  assert.equal(startProdData.success, true);
  assert.ok(startProdData.asset);
  assert.equal(startProdData.asset.type, "YouTube Long");
  assert.equal(startProdData.asset.workflowStatus, "scripting");

  // 5. Delete topic
  const delRes = await fetch(`${BASE_URL}/api/topics/${createdTopic.id}`, {
    method: "DELETE",
  });
  assert.equal(delRes.status, 200);
});

test("API: Content Asset Lifecycle & YouTube Long Derivation of Exactly 3 Reels", async () => {
  // 1. Create YouTube Long Video
  const createRes = await fetch(`${BASE_URL}/api/content`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "System Architecture Deep Dive",
      type: "YouTube Long",
      workflowStatus: "scripting",
    }),
  });
  assert.equal(createRes.status, 201);
  const parentVideo = await createRes.json();
  assert.equal(parentVideo.type, "YouTube Long");
  assert.equal(parentVideo.workflowStatus, "scripting");

  // 2. Progress stage to shooting, then editing
  const progressRes1 = await fetch(`${BASE_URL}/api/content/${parentVideo.id}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetStage: "shooting" }),
  });
  assert.equal(progressRes1.status, 200);
  const progressed1 = await progressRes1.json();
  assert.equal(progressed1.workflowStatus, "shooting");

  const progressRes2 = await fetch(`${BASE_URL}/api/content/${parentVideo.id}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetStage: "editing" }),
  });
  assert.equal(progressRes2.status, 200);
  const progressed2 = await progressRes2.json();
  assert.equal(progressed2.workflowStatus, "editing");

  // 3. Export YouTube Long Video -> Derives exactly 3 child Reels
  const exportRes = await fetch(`${BASE_URL}/api/content/${parentVideo.id}/export`, {
    method: "POST",
  });
  assert.equal(exportRes.status, 200);
  const exportData = await exportRes.json();
  assert.equal(exportData.parent.workflowStatus, "exported");
  assert.equal(exportData.reels.length, 3, "Must derive exactly 3 child reels");
  assert.equal(exportData.reels[0].type, "Derived Reel");
  assert.equal(exportData.reels[0].parentLongVideoId, parentVideo.id);
  assert.equal(exportData.reels[0].workflowStatus, "editing");
  assert.equal(exportData.reels[1].workflowStatus, "editing");
  assert.equal(exportData.reels[2].workflowStatus, "editing");

  // 4. Schedule child Reel 1
  const schedRes = await fetch(`${BASE_URL}/api/content/${exportData.reels[0].id}/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform: "instagram",
      date: "2026-10-25",
      time: "11:00 AM",
    }),
  });
  assert.equal(schedRes.status, 200);
  const schedData = await schedRes.json();
  assert.equal(schedData.workflowStatus, "scheduled");
});

test("API: Tasks Completion & Reopen", async () => {
  // 1. Get tasks
  const tasksRes = await fetch(`${BASE_URL}/api/tasks`);
  assert.equal(tasksRes.status, 200);
  const tasksData = await tasksRes.json();
  assert.ok(Array.isArray(tasksData.tasks));
  assert.ok(tasksData.counts);

  // 2. Create custom task
  const createRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: `custom-task-${Date.now()}`,
      title: "Review script draft",
      reason: "Urgent deadline",
      badge: "Writing",
      color: "bg-blue-500",
      type: "YouTube Long",
      category: "Production",
      status: "Today",
      priority: "High",
      contentTitle: "Custom Test Content",
    }),
  });
  assert.equal(createRes.status, 201);
  const customTask = await createRes.json();
  assert.equal(customTask.status, "Today");

  // 3. Complete task
  const completeRes = await fetch(`${BASE_URL}/api/tasks/${customTask.id}/complete`, {
    method: "POST",
  });
  assert.equal(completeRes.status, 200);
  const completed = await completeRes.json();
  assert.equal(completed.status, "Completed");
  assert.ok(completed.completedAt);

  // 4. Reopen task
  const reopenRes = await fetch(`${BASE_URL}/api/tasks/${customTask.id}/reopen`, {
    method: "POST",
  });
  assert.equal(reopenRes.status, 200);
  const reopened = await reopenRes.json();
  assert.ok(!reopened.completedAt);
});

let uploadedPublicId = null;

test("API: Settings, Buffer & Analytics Endpoints", async () => {
  // 1. Settings GET (Initially unconfigured on clean state)
  const settingsRes = await fetch(`${BASE_URL}/api/settings`);
  assert.equal(settingsRes.status, 200);
  const settingsData = await settingsRes.json();
  if (settingsData.isConfigured) {
    assert.ok(settingsData.advanceBuffer);
  } else {
    assert.equal(settingsData.isConfigured, false);
  }

  // 2. Settings PUT - Explicit configuration
  const updateRes = await fetch(`${BASE_URL}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      isConfigured: true,
      profile: { name: "Creator", role: "Solo", timezone: "Asia/Kolkata" },
      workspacePreferences: { startOfWeek: "Sunday", calendarView: "Month", contentSort: "Newest", theme: "Dark" },
      advanceBuffer: { days: 21 },
      publishingFrequency: {
        youtubeLong: { count: 2, days: ["Tue", "Fri"] },
      },
      taskPreferences: { autoTaskGen: true, autoRepurposing: true, autoBufferCalc: true },
      launchPlan: { overallStartDate: "2026-11-20" },
      schedulingRules: { minGapDays: 2, maxGapDays: 5 },
    }),
  });
  assert.equal(updateRes.status, 200);
  const updatedSettings = await updateRes.json();
  assert.equal(updatedSettings.advanceBuffer.days, 21);
  assert.equal(updatedSettings.isConfigured, true);

  // Restore to 14 days
  await fetch(`${BASE_URL}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ advanceBuffer: { days: 14 } }),
  });

  // 3. Buffer calculation
  const bufferRes = await fetch(`${BASE_URL}/api/buffer`);
  assert.equal(bufferRes.status, 200);
  const bufferData = await bufferRes.json();
  assert.ok(bufferData.quotas);
  assert.ok(bufferData.windowDays >= 7);

  // 4. Analytics
  const analyticsRes = await fetch(`${BASE_URL}/api/analytics`);
  assert.equal(analyticsRes.status, 200);
  const analyticsData = await analyticsRes.json();
  assert.ok(analyticsData.typeBreakdown);
  assert.ok(analyticsData.statusBreakdown);

  // 5. Calendar events
  const calendarRes = await fetch(`${BASE_URL}/api/calendar`);
  assert.equal(calendarRes.status, 200);
  const calendarData = await calendarRes.json();
  assert.ok(Array.isArray(calendarData));

  // 6. Global Search
  const searchRes = await fetch(`${BASE_URL}/api/search?q=System`);
  assert.equal(searchRes.status, 200);
  const searchData = await searchRes.json();
  assert.ok(Array.isArray(searchData.results));
});

test("API: Media Upload Handling", async () => {
  // Real valid PNG buffer upload
  const formData = new FormData();
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  const fileBlob = new Blob([pngBuffer], { type: "image/png" });
  formData.append("file", fileBlob, "sample_thumbnail.png");
  formData.append("purpose", "thumbnail");

  const uploadRes = await fetch(`${BASE_URL}/api/media/upload`, {
    method: "POST",
    body: formData,
  });
  assert.equal(uploadRes.status, 200);
  const uploadData = await uploadRes.json();
  assert.ok(uploadData.public_id);
  assert.ok(uploadData.secure_url);
  uploadedPublicId = uploadData.public_id;
});

after(async () => {
    // Teardown: Clean up test records and Cloudinary test media to preserve clean state
    if (uploadedPublicId) {
      try {
        const { v2: cloudinary } = await import("cloudinary");
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        await cloudinary.uploader.destroy(uploadedPublicId);
      } catch (e) {
        console.error("Cloudinary cleanup error:", e);
      }
    }

    await teardownTestAuth();
  });
});

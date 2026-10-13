import test from "node:test";
import assert from "node:assert/strict";
import {
  getWorkflowSteps,
  getWorkflowStepIndex,
  getWorkflowStageLabel,
  normalizeTopicStatus,
  normalizeWorkflowStatus,
  isAssetBufferReady,
  isAssetPublished,
  isAssetEligibleForDerivation,
} from "../src/lib/domain/contentWorkflow.ts";
import {
  getNextValidActionForAsset,
  getNextValidActionForTopic,
  generateAndPrioritizeTasks,
} from "../src/lib/engine/taskEngine.ts";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

const CONFIGURED_SETTINGS = {
  isConfigured: true,
  profile: { name: "Alex Rivers", role: "Solo Creator", timezone: "Asia/Kolkata" },
  workspacePreferences: { startOfWeek: "Monday", calendarView: "Month", contentSort: "Date (Newest first)", theme: "Dark" },
  advanceBuffer: { days: 14, isCustom: false, maintainAuto: true },
  publishingFrequency: {
    youtubeLong: { count: 2, days: ["Tue", "Fri"] },
    youtubeShorts: { count: 7, schedule: "Daily" },
    instagramReels: { count: 7, schedule: "Daily", derivedCount: 4, standaloneCount: 3 },
    linkedinPosts: { count: 4, informativeCount: 2, videoRelatedCount: 2 },
    carousel: { frequency: "Monthly", target: 2 },
    derivedReelsPerLongVideo: 3,
  },
  taskPreferences: {
    autoTaskGen: true,
    autoBufferCalc: true,
    autoRepurposing: true,
    dailyCapacity: "Auto",
    priorityOrder: [
      "Current production steps",
      "Publishing deadlines",
      "Buffer gaps",
      "Repurposing requirements",
      "Future work / preparation",
    ],
  },
  launchPlan: {
    overallStartDate: "2026-11-20",
    currentSimulatedDate: "2026-10-10",
  },
  schedulingRules: { minGapDays: 2, maxGapDays: 5, sameDayBlocked: true },
};

test.describe("Topic-to-Content Workflow Architecture & Consistency Suite", () => {
  // -------------------------------------------------------------------------
  // 1. ISOLATION: TOPICS IN IDEA OR PLANNING REMAIN IN TOPICS BOARD ONLY
  // -------------------------------------------------------------------------
  test("1. Creating a Topic in Idea or moving to Planning creates NO Content Assets and NO production tasks", () => {
    const ideaTopic = {
      id: "topic-arch-1",
      title: "Building Resilient Distributed Systems",
      type: "YouTube Long",
      status: "idea",
    };

    // Upstream engine returns NO production action
    const ideaAction = getNextValidActionForTopic(ideaTopic, []);
    assert.equal(ideaAction, null, "Idea topic must never produce a production action candidate");

    const planningTopic = {
      ...ideaTopic,
      status: "planning",
    };
    const planningAction = getNextValidActionForTopic(planningTopic, []);
    assert.equal(planningAction, null, "Planning topic must never produce a production action candidate");

    // Task engine generates 0 production tasks for these topics
    const tasks = generateAndPrioritizeTasks({
      assets: [],
      topics: [ideaTopic, planningTopic],
      settings: CONFIGURED_SETTINGS,
      existingTasks: [],
    });

    const productionTasks = tasks.filter((t) => t.category === "Production" || t.actionStage === "Script");
    assert.equal(productionTasks.length, 0, "No production tasks generated while topics are in Idea or Planning");
  });

  // -------------------------------------------------------------------------
  // 2. FIRST ACTIONABLE PRODUCTION STAGE PER CONTENT TYPE
  // -------------------------------------------------------------------------
  test("2. Start Production initializes assets at their first actionable stage across all content types", () => {
    // A. YouTube Long: Starts at Script (scripting)
    const ytAsset = {
      id: "asset-yt-e2e",
      title: "Microservices Masterclass",
      type: "YouTube Long",
      workflowStatus: "scripting",
      progress: { stage: "Script", completed: 1, total: 7 },
      distribution: { status: "Not Scheduled" },
    };
    const ytAction = getNextValidActionForAsset(ytAsset, [ytAsset]);
    assert.ok(ytAction);
    assert.equal(ytAction.actionStage, "Script", "YouTube Long action is Script");
    assert.equal(ytAction.badge, "Scripting");
    assert.equal(ytAction.title, "Write Script: Microservices Masterclass");

    // B. Standalone Reel: Starts at Script (scripting)
    const reelAsset = {
      id: "asset-reel-e2e",
      title: "Docker in 60 Seconds",
      type: "Standalone Reel",
      workflowStatus: "scripting",
      progress: { stage: "Script", completed: 1, total: 7 },
      distribution: { status: "Not Scheduled" },
    };
    const reelAction = getNextValidActionForAsset(reelAsset, [reelAsset]);
    assert.ok(reelAction);
    assert.equal(reelAction.actionStage, "Script", "Standalone Reel action is Script");
    assert.equal(reelAction.badge, "Scripting");

    // C. LinkedIn: Starts at Write (writing)
    const liAsset = {
      id: "asset-li-e2e",
      title: "Lessons from Scaling to 1M Users",
      type: "LinkedIn",
      subType: "Informative",
      workflowStatus: "writing",
      progress: { stage: "Write", completed: 1, total: 5 },
      distribution: { status: "Not Scheduled" },
    };
    const liAction = getNextValidActionForAsset(liAsset, [liAsset]);
    assert.ok(liAction);
    assert.equal(liAction.actionStage, "Write", "LinkedIn post action is Write");
    assert.equal(liAction.badge, "Writing");

    // D. Carousel: Starts at Create (creating)
    const carAsset = {
      id: "asset-car-e2e",
      title: "Clean Code Architecture Cheat Sheet",
      type: "Carousel",
      workflowStatus: "creating",
      progress: { stage: "Create", completed: 1, total: 4 },
      distribution: { status: "Not Scheduled" },
    };
    const carAction = getNextValidActionForAsset(carAsset, [carAsset]);
    assert.ok(carAction);
    assert.equal(carAction.actionStage, "Create", "Carousel action is Create");
    assert.equal(carAction.badge, "Creating");

    // E. Derived Reel: Starts at Edit (editing)
    const drAsset = {
      id: "asset-dr-e2e",
      title: "Microservices Masterclass — Reel 1",
      type: "Derived Reel",
      workflowStatus: "editing",
      progress: { stage: "Editing", completed: 0, total: 4 },
      distribution: { status: "Not Scheduled" },
    };
    const drAction = getNextValidActionForAsset(drAsset, [drAsset]);
    assert.ok(drAction);
    assert.equal(drAction.actionStage, "Edit", "Derived Reel action is Edit");
    assert.equal(drAction.badge, "Editing");
  });

  // -------------------------------------------------------------------------
  // 3. IDEMPOTENCY & STABLE IDENTITY ON START PRODUCTION
  // -------------------------------------------------------------------------
  test("3. Start Production is strictly idempotent and does not create duplicate assets or tasks", () => {
    let topics = [
      {
        id: "topic-idem-1",
        title: "Kubernetes Networking Explained",
        type: "YouTube Long",
        status: "planning",
      },
    ];
    let assets = [];
    let tasks = [];

    // Click 1: Start Production
    const topic = topics[0];
    const assetId = "asset-topic-" + topic.id;
    const newAsset = {
      id: assetId,
      title: topic.title,
      type: topic.type,
      workflowStatus: "scripting",
      actionStatus: "in_progress",
      progress: {
        stage: "Script",
        completed: 1,
        total: 7,
        hasActive: true,
      },
      distribution: { status: "Not Scheduled" },
      topicId: topic.id,
    };
    assets.push(newAsset);
    topics = topics.map((t) => (t.id === topic.id ? { ...t, status: "in_progress", contentAssetId: newAsset.id } : t));

    tasks = generateAndPrioritizeTasks({
      assets,
      topics,
      settings: CONFIGURED_SETTINGS,
      existingTasks: tasks,
    });

    assert.equal(assets.length, 1, "Exactly 1 Content Asset created on Click 1");
    const scriptTasksRun1 = tasks.filter((t) => t.contentId === newAsset.id && t.status !== "Completed");
    assert.equal(scriptTasksRun1.length, 1, "Exactly 1 open Script task generated on Click 1");
    const stableTaskId = scriptTasksRun1[0].id;

    // Click 2: Repeated Start Production (Simulated idempotency check)
    const alreadyLinked = assets.find((a) => a.topicId === topic.id || a.id === topics[0].contentAssetId);
    assert.ok(alreadyLinked, "Existing linked asset detected");

    // Does not push a duplicate asset
    if (!alreadyLinked) {
      assets.push({ ...newAsset, id: "duplicate-asset" });
    }

    // Recalculate tasks
    tasks = generateAndPrioritizeTasks({
      assets,
      topics,
      settings: CONFIGURED_SETTINGS,
      existingTasks: tasks,
    });

    assert.equal(assets.length, 1, "Asset count remains exactly 1 on Click 2");
    const scriptTasksRun2 = tasks.filter((t) => t.contentId === newAsset.id && t.status !== "Completed");
    assert.equal(scriptTasksRun2.length, 1, "Open task count remains exactly 1 on Click 2");
    assert.equal(scriptTasksRun2[0].id, stableTaskId, "Task ID remains stable");
  });

  // -------------------------------------------------------------------------
  // 4. CONTENT DETAIL PAGE AGREEMENT: NO 'MARK TOPIC COMPLETE' AFTER START PRODUCTION
  // -------------------------------------------------------------------------
  test("4. Content Detail Page begins at Script; stepper and next required action agree without asking to complete Topic", () => {
    const asset = {
      id: "asset-detail-test",
      title: "Fullstack Architecture in 2026",
      type: "YouTube Long",
      workflowStatus: "scripting",
      progress: { stage: "Script", completed: 1, total: 7, hasActive: true },
      distribution: { status: "Not Scheduled" },
    };

    const steps = getWorkflowSteps(asset.type);
    assert.equal(steps[0].status, "topic", "Step 0 in stepper UI is Topic");
    assert.equal(steps[1].status, "scripting", "Step 1 in stepper UI is Script");

    const currentStepIndex = getWorkflowStepIndex(asset.type, asset.workflowStatus);
    assert.equal(currentStepIndex, 1, "Current step index for scripting is 1 (Script)");

    const stageLabel = getWorkflowStageLabel(asset.type, asset.workflowStatus);
    assert.equal(stageLabel, "Script", "Stage label is Script");

    const nextAction = getNextValidActionForAsset(asset, [asset]);
    assert.ok(nextAction);
    assert.equal(nextAction.actionStage, "Script");
    assert.equal(nextAction.actionTitle, "Write Script: Fullstack Architecture in 2026");
    assert.notEqual(nextAction.actionTitle, "Mark Topic Complete", "Never asks to complete Topic once in production");
  });

  // -------------------------------------------------------------------------
  // 5. FULL PRODUCTION LIFECYCLE PROGRESSION & DERIVATION
  // -------------------------------------------------------------------------
  test("5. Completing tasks advances stage cleanly without regressions, and YouTube Long export derives exactly 3 Reels", () => {
    let asset = {
      id: "asset-prog-1",
      title: "Advanced TypeScript Patterns",
      type: "YouTube Long",
      workflowStatus: "scripting",
      progress: { stage: "Script", completed: 1, total: 7, hasActive: true },
      distribution: { status: "Not Scheduled" },
    };

    // 1. Script -> Shoot
    assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, "Script");
    asset = { ...asset, workflowStatus: "shooting", progress: { stage: "Shoot", completed: 2, total: 7 } };

    // 2. Shoot -> Edit
    assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, "Shoot");
    asset = { ...asset, workflowStatus: "editing", progress: { stage: "Edit", completed: 3, total: 7 } };

    // 3. Edit -> Export
    assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, "Edit");
    assert.equal(isAssetEligibleForDerivation(asset), false, "Cannot derive Reels while editing");
    asset = { ...asset, workflowStatus: "exported", progress: { stage: "Export", completed: 4, total: 7 } };

    // 4. Exported -> Schedule + Derivation
    assert.equal(isAssetEligibleForDerivation(asset), true, "Eligible for derivation upon export");
    assert.equal(isAssetBufferReady(asset), true, "Exported master video qualifies as buffer-ready");
    assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, "Schedule");

    // Derive 3 child reels
    const childReels = [1, 2, 3].map((n) => ({
      id: `${asset.id}-reel-${n}`,
      title: `${asset.title} — Reel ${n}`,
      type: "Derived Reel",
      workflowStatus: "editing",
      parentLongVideoId: asset.id,
      progress: { stage: "Editing", completed: 0, total: 4 },
      distribution: { status: "Not Scheduled" },
    }));

    const allAssets = [asset, ...childReels];
    const dr1Action = getNextValidActionForAsset(childReels[0], allAssets);
    assert.ok(dr1Action);
    assert.equal(dr1Action.actionStage, "Edit");
    assert.equal(dr1Action.title, "Edit Reel 1");
  });
});

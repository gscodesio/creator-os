import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isAssetBufferReady,
  isAssetEligibleForDerivation,
  isChildReelUnlocked,
  getNextWorkflowStatus,
  normalizeTopicStatus,
  getWorkflowSteps,
  isAssetScheduled,
  isAssetPublished,
} from '../src/lib/domain/contentWorkflow.ts';

import {
  getNextValidActionForAsset,
  getNextValidActionForTopic,
  generateAndPrioritizeTasks,
  analyzeBufferDeficits,
} from '../src/lib/engine/taskEngine.ts';

// ---------------------------------------------------------------------------
// TEST FIXTURES (Isolated from app runtime)
// ---------------------------------------------------------------------------
const SETTINGS = {
  isConfigured: true,
  advanceBuffer: { days: 14, isCustom: false, maintainAuto: true },
  publishingFrequency: {
    youtubeLong: { count: 2, days: ['Tue', 'Fri'] },
    youtubeShorts: { count: 7, schedule: 'Daily' },
    instagramReels: { count: 7, schedule: 'Daily', derivedCount: 4, standaloneCount: 3 },
    linkedinPosts: { count: 4, informativeCount: 2, videoRelatedCount: 2 },
    carousel: { frequency: 'Monthly', target: 2 },
  },
  taskPreferences: {
    autoTaskGen: true,
    dailyCapacity: 'Auto',
    priorityOrder: ['Publishing deadlines', 'Buffer gaps', 'Current production steps'],
  },
  launchPlan: {
    overallStartDate: '2026-10-20',
    currentSimulatedDate: '2026-10-10',
  },
};

// ===========================================================================
// TEST 1: Topic Lifecycle & Start Production (Idea -> Planning -> In Progress)
// ===========================================================================
test('1. Topic Lifecycle: Idea and Planning generate NO tasks; Start Production generates first task', () => {
  const ideaTopic = {
    id: 'topic-1',
    title: 'Modern Architecture',
    type: 'YouTube Long',
    status: 'idea',
  };

  // No production tasks for Idea
  assert.equal(getNextValidActionForTopic(ideaTopic), null);

  // Transition to Planning
  const planningTopic = { ...ideaTopic, status: 'planning' };
  assert.equal(getNextValidActionForTopic(planningTopic), null);

  // Start Production creates linked Content Asset with stable ID
  const linkedAsset = {
    id: 'asset-topic-1',
    title: ideaTopic.title,
    type: 'YouTube Long',
    workflowStatus: 'scripting',
    topicId: ideaTopic.id,
    progress: { stage: 'Script', completed: 1, total: 7, hasActive: true },
    distribution: { status: 'Not Scheduled' },
  };

  const inProgressTopic = {
    ...planningTopic,
    status: 'in_progress',
    contentAssetId: linkedAsset.id,
  };

  assert.equal(inProgressTopic.status, 'in_progress');
  assert.equal(inProgressTopic.contentAssetId, linkedAsset.id);

  // First valid task generated for the linked asset
  const firstAction = getNextValidActionForAsset(linkedAsset, [linkedAsset]);
  assert.notEqual(firstAction, null);
  assert.equal(firstAction.actionStage, 'Script');
  assert.equal(firstAction.title, 'Write Script: Modern Architecture');
});

// ===========================================================================
// TEST 2: YouTube Long Video Complete Workflow & 3 Derived Reels Generation
// ===========================================================================
test('2. YouTube Long Video Workflow: Script -> Shoot -> Edit -> Export (Derives 3 Reels) -> Schedule -> Publish', () => {
  let asset = {
    id: 'yt-long-1',
    title: 'Complete Next.js Guide',
    type: 'YouTube Long',
    workflowStatus: 'scripting',
    progress: { stage: 'Script', completed: 1, total: 7, hasActive: true },
    distribution: { status: 'Not Scheduled' },
  };

  // 1. Script
  assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, 'Script');
  asset = { ...asset, workflowStatus: 'shooting', progress: { stage: 'Shoot', completed: 2, total: 7 } };

  // 2. Shoot
  assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, 'Shoot');
  asset = { ...asset, workflowStatus: 'editing', progress: { stage: 'Edit', completed: 3, total: 7 } };

  // 3. Edit
  assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, 'Edit');
  asset = { ...asset, workflowStatus: 'exported', progress: { stage: 'Export', completed: 4, total: 7 } };

  // 4. Export -> Schedule
  assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, 'Schedule');

  // Master Long Video is now eligible for derivation
  assert.equal(isAssetEligibleForDerivation(asset), true);

  // Derive exactly 3 child Reels with stable IDs and editing stage
  const childReels = [1, 2, 3].map((n) => ({
    id: `${asset.id}-reel-${n}`,
    title: `${asset.title} — Reel ${n}`,
    type: 'Derived Reel',
    reelType: 'Long Video Derived',
    workflowStatus: 'editing',
    progress: { stage: 'Editing', completed: 0, total: 4, hasActive: true },
    distribution: { status: 'Not Scheduled' },
    parentLongVideoId: asset.id,
  }));

  assert.equal(childReels.length, 3);
  assert.equal(childReels[0].workflowStatus, 'editing');
  assert.equal(childReels[1].workflowStatus, 'editing');
  assert.equal(childReels[2].workflowStatus, 'editing');

  // All 3 child Reels generate Edit tasks immediately upon Long Video export
  const allAssets = [asset, ...childReels];
  const reel1Task = getNextValidActionForAsset(childReels[0], allAssets);
  const reel2Task = getNextValidActionForAsset(childReels[1], allAssets);
  const reel3Task = getNextValidActionForAsset(childReels[2], allAssets);

  assert.equal(reel1Task?.actionStage, 'Edit');
  assert.equal(reel1Task?.title, 'Edit Reel 1');
  assert.equal(reel2Task?.actionStage, 'Edit');
  assert.equal(reel2Task?.title, 'Edit Reel 2');
  assert.equal(reel3Task?.actionStage, 'Edit');
  assert.equal(reel3Task?.title, 'Edit Reel 3');

  // 5. Schedule Long Video
  const longVideoScheduleAction = getNextValidActionForAsset(asset, allAssets);
  assert.equal(longVideoScheduleAction?.actionStage, 'Schedule');

  asset = { ...asset, workflowStatus: 'scheduled', distribution: { status: 'Scheduled' } };

  // 6. Publish Long Video
  const longVideoPublishAction = getNextValidActionForAsset(asset, allAssets);
  assert.equal(longVideoPublishAction?.actionStage, 'Publish');

  asset = { ...asset, workflowStatus: 'published', distribution: { status: 'Published' } };
  assert.equal(isAssetPublished(asset), true);
  assert.equal(getNextValidActionForAsset(asset, allAssets), null, 'Published asset has no remaining tasks');
});

// ===========================================================================
// TEST 3: Derived Reels Progress Independently
// ===========================================================================
test('3. Derived Reels: Reel 1 advances to Export while Reel 2 and 3 remain independently in Editing', () => {
  const parentId = 'yt-long-1';
  let reel1 = {
    id: `${parentId}-reel-1`,
    title: 'Next.js Guide — Reel 1',
    type: 'Derived Reel',
    workflowStatus: 'editing',
    progress: { stage: 'Editing', completed: 0, total: 4 },
    distribution: { status: 'Not Scheduled' },
    parentLongVideoId: parentId,
  };
  let reel2 = {
    id: `${parentId}-reel-2`,
    title: 'Next.js Guide — Reel 2',
    type: 'Derived Reel',
    workflowStatus: 'editing',
    progress: { stage: 'Editing', completed: 0, total: 4 },
    distribution: { status: 'Not Scheduled' },
    parentLongVideoId: parentId,
  };
  let reel3 = {
    id: `${parentId}-reel-3`,
    title: 'Next.js Guide — Reel 3',
    type: 'Derived Reel',
    workflowStatus: 'editing',
    progress: { stage: 'Editing', completed: 0, total: 4 },
    distribution: { status: 'Not Scheduled' },
    parentLongVideoId: parentId,
  };

  // Reel 1 finishes Edit -> advances to Export
  reel1 = { ...reel1, workflowStatus: 'exported', progress: { stage: 'Export', completed: 1, total: 4 } };

  const allAssets = [reel1, reel2, reel3];

  // Reel 1 has Schedule action
  const action1 = getNextValidActionForAsset(reel1, allAssets);
  assert.equal(action1?.actionStage, 'Schedule');

  // Reel 2 and Reel 3 remain in Edit stage independently!
  const action2 = getNextValidActionForAsset(reel2, allAssets);
  assert.equal(action2?.actionStage, 'Edit');
  assert.equal(action2?.title, 'Edit Reel 2');

  const action3 = getNextValidActionForAsset(reel3, allAssets);
  assert.equal(action3?.actionStage, 'Edit');
  assert.equal(action3?.title, 'Edit Reel 3');
});

// ===========================================================================
// TEST 4: Standalone Reel Workflow
// ===========================================================================
test('4. Standalone Reel Workflow: Script -> Shoot -> Edit -> Export -> Schedule -> Publish', () => {
  let asset = {
    id: 'sr-1',
    title: 'Quick React Hook Tip',
    type: 'Standalone Reel',
    workflowStatus: 'scripting',
    progress: { stage: 'Script', completed: 1, total: 7 },
    distribution: { status: 'Not Scheduled' },
  };

  assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, 'Script');
  asset = { ...asset, workflowStatus: 'shooting' };

  assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, 'Shoot');
  asset = { ...asset, workflowStatus: 'editing' };

  assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, 'Edit');
  asset = { ...asset, workflowStatus: 'exported' };

  assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, 'Schedule');
  asset = { ...asset, workflowStatus: 'scheduled', distribution: { status: 'Scheduled' } };

  assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, 'Publish');
  asset = { ...asset, workflowStatus: 'published', distribution: { status: 'Published' } };

  assert.equal(isAssetPublished(asset), true);
  assert.equal(getNextValidActionForAsset(asset, [asset]), null);
});

// ===========================================================================
// TEST 5: LinkedIn Informative and Long Video Related Workflows
// ===========================================================================
test('5. LinkedIn Workflows (Informative & Long Video Related): Write -> Ready -> Schedule -> Publish', () => {
  // Informative
  let infAsset = {
    id: 'li-inf-1',
    title: 'Top 5 Career Mistakes',
    type: 'LinkedIn',
    subType: 'Informative',
    workflowStatus: 'writing',
    progress: { stage: 'Write', completed: 1, total: 5 },
    distribution: { status: 'Not Scheduled' },
  };

  assert.equal(getNextValidActionForAsset(infAsset, [infAsset]).actionStage, 'Write');
  infAsset = { ...infAsset, workflowStatus: 'ready' };

  assert.equal(getNextValidActionForAsset(infAsset, [infAsset]).actionStage, 'Schedule');
  infAsset = { ...infAsset, workflowStatus: 'scheduled', distribution: { status: 'Scheduled' } };

  assert.equal(getNextValidActionForAsset(infAsset, [infAsset]).actionStage, 'Publish');
  infAsset = { ...infAsset, workflowStatus: 'published', distribution: { status: 'Published' } };
  assert.equal(isAssetPublished(infAsset), true);

  // Long Video Related
  let vidAsset = {
    id: 'li-vid-1',
    title: 'Next.js 15 Deep Dive Summary',
    type: 'LinkedIn',
    subType: 'Long Video Related',
    workflowStatus: 'writing',
    progress: { stage: 'Write', completed: 1, total: 5 },
    distribution: { status: 'Not Scheduled' },
  };

  assert.equal(getNextValidActionForAsset(vidAsset, [vidAsset]).actionStage, 'Write');
  vidAsset = { ...vidAsset, workflowStatus: 'ready' };
  assert.equal(getNextValidActionForAsset(vidAsset, [vidAsset]).actionStage, 'Schedule');
});

// ===========================================================================
// TEST 6: Carousel Workflow (Topic -> Create -> Schedule -> Publish)
// ===========================================================================
test('6. Carousel Workflow: Topic -> Create -> Schedule -> Publish (No script, design, or ready stages)', () => {
  const steps = getWorkflowSteps('Carousel');
  assert.equal(steps.length, 4, 'Carousel has exactly 4 canonical workflow steps');
  assert.deepEqual(
    steps.map((s) => s.label),
    ['Topic', 'Create', 'Schedule', 'Publish'],
    'Carousel stages are exactly Topic, Create, Schedule, Publish'
  );

  let asset = {
    id: 'car-1',
    title: 'System Design Patterns',
    type: 'Carousel',
    workflowStatus: 'creating',
    progress: { stage: 'Create', completed: 1, total: 4 },
    distribution: { status: 'Not Scheduled' },
  };

  assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, 'Create');
  asset = { ...asset, workflowStatus: 'scheduled', distribution: { status: 'Scheduled' } };

  assert.equal(getNextValidActionForAsset(asset, [asset]).actionStage, 'Publish');
  asset = { ...asset, workflowStatus: 'published', distribution: { status: 'Published' } };
  assert.equal(isAssetPublished(asset), true);
  assert.equal(getNextValidActionForAsset(asset, [asset]), null);
});

// ===========================================================================
// TEST 7: Settings Dynamically Drive Buffer Deficits & Health
// ===========================================================================
test('7. Settings Control: Changing publishing frequency recalculates buffer quotas dynamically', () => {
  const emptyAssets = [];
  const deficitsDefault = analyzeBufferDeficits(emptyAssets, SETTINGS);
  assert.equal(deficitsDefault.quotas.youtubeLong.target, 4); // 2/wk * 2 wks (14d)

  // Modify settings: increase YouTube Long to 3 per week
  const updatedSettings = {
    ...SETTINGS,
    publishingFrequency: {
      ...SETTINGS.publishingFrequency,
      youtubeLong: { count: 3, days: ['Tue', 'Thu', 'Sat'] },
    },
  };

  const deficitsUpdated = analyzeBufferDeficits(emptyAssets, updatedSettings);
  assert.equal(deficitsUpdated.quotas.youtubeLong.target, 6); // 3/wk * 2 wks (14d)
  assert.equal(deficitsUpdated.quotas.youtubeLong.deficit, 6);
});

// ===========================================================================
// TEST 8: Buffer Readiness Gate
// ===========================================================================
test('8. Buffer Readiness: Only exported or ready assets qualify for advance inventory', () => {
  const inProgressLong = {
    id: 'yt-1',
    type: 'YouTube Long',
    workflowStatus: 'editing',
    distribution: { status: 'Not Scheduled' },
  };
  assert.equal(isAssetBufferReady(inProgressLong), false, 'Editing long video cannot count toward buffer');

  const exportedLong = {
    ...inProgressLong,
    workflowStatus: 'exported',
  };
  assert.equal(isAssetBufferReady(exportedLong), true, 'Exported long video counts toward buffer');

  const editingReel = {
    id: 'reel-1',
    type: 'Derived Reel',
    workflowStatus: 'editing',
    distribution: { status: 'Not Scheduled' },
  };
  assert.equal(isAssetBufferReady(editingReel), false, 'Editing reel does NOT count toward buffer');

  const exportedReel = {
    ...editingReel,
    workflowStatus: 'exported',
  };
  assert.equal(isAssetBufferReady(exportedReel), true, 'Exported reel counts toward buffer');
});

// ===========================================================================
// TEST 9: Single Source of Truth for Tasks (Today & Upcoming are filtered views)
// ===========================================================================
test('9. Unified Task Store: Today and Upcoming are filtered views of one task collection with unique stable IDs', () => {
  const assets = [
    {
      id: 'a-1',
      title: 'Post 1',
      type: 'LinkedIn',
      workflowStatus: 'writing',
      progress: { stage: 'Write', completed: 0, total: 5 },
      distribution: { status: 'Not Scheduled' },
    },
    {
      id: 'a-2',
      title: 'Video 2',
      type: 'YouTube Long',
      workflowStatus: 'topic',
      progress: { stage: 'Topic', completed: 0, total: 7 },
      distribution: { status: 'Not Scheduled' },
    },
  ];

  const tasks = generateAndPrioritizeTasks({
    assets,
    topics: [],
    calendarEvents: [],
    settings: SETTINGS,
    existingTasks: [],
    referenceDate: '2026-10-10',
  });

  const taskIds = tasks.map((t) => t.id);
  const uniqueTaskIds = new Set(taskIds);
  assert.equal(taskIds.length, uniqueTaskIds.size, 'All generated tasks must have unique IDs');

  const todayTasks = tasks.filter((t) => t.status === 'Today');
  const upcomingTasks = tasks.filter((t) => t.status === 'Upcoming');

  // Today and Upcoming are disjoint partitions of the open tasks
  const intersection = todayTasks.filter((t) => upcomingTasks.some((u) => u.id === t.id));
  assert.equal(intersection.length, 0, 'No task can appear in both Today and Upcoming');
  assert.equal(todayTasks.length + upcomingTasks.length, tasks.length);
});

// ===========================================================================
// TEST 10: Idempotency (Repeated Start Production & Task Generation)
// ===========================================================================
test('10. Idempotency: Repeated task generation and start production calls produce no duplicate records', () => {
  const asset = {
    id: 'asset-idempotent-1',
    title: 'Idempotent Test',
    type: 'YouTube Long',
    workflowStatus: 'scripting',
    progress: { stage: 'Script', completed: 1, total: 7 },
    distribution: { status: 'Not Scheduled' },
  };

  const tasksRun1 = generateAndPrioritizeTasks({
    assets: [asset],
    topics: [],
    calendarEvents: [],
    settings: SETTINGS,
    existingTasks: [],
    referenceDate: '2026-10-10',
  });

  assert.equal(tasksRun1.length, 1);
  const originalTaskId = tasksRun1[0].id;

  // Run 2 with existingTasks passed in
  const tasksRun2 = generateAndPrioritizeTasks({
    assets: [asset],
    topics: [],
    calendarEvents: [],
    settings: SETTINGS,
    existingTasks: tasksRun1,
    referenceDate: '2026-10-10',
  });

  assert.equal(tasksRun2.length, 1, 'Task count remains 1 on recalculation');
  assert.equal(tasksRun2[0].id, originalTaskId, 'Task ID remains stable');
});

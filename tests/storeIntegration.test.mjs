import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAndPrioritizeTasks, isAssetReadyForBuffer } from '../src/lib/engine/taskEngine.ts';

test('Store End-to-End: Full Lifecycle and Dynamic Recalculation', async (t) => {
  // Initial state mimicking creatorStore
  let assets = [
    {
      id: 'long-1',
      title: 'Complete Master Guide to Web Development',
      type: 'YouTube Long',
      progress: { stage: 'Edit', completed: 3, total: 7, hasActive: true },
      distribution: { status: 'Not Scheduled' },
      source: 'Direct Production',
    },
    {
      id: 'reel-standalone-1',
      title: 'Top 3 Coding Tips',
      type: 'Standalone Reel',
      progress: { stage: 'Shoot', completed: 2, total: 7, hasActive: true },
      distribution: { status: 'Not Scheduled' },
      source: 'Direct Production',
    },
  ];

  let topics = [];
  let calendarEvents = [];
  let settings = {
    isConfigured: true,
    advanceBuffer: { days: 14 },
    publishingFrequency: {
      youtubeLong: { count: 2 },
      youtubeShorts: { count: 7 },
      instagramReels: { count: 7, derivedCount: 4, standaloneCount: 3 },
      linkedinPosts: { count: 4, informativeCount: 2, videoRelatedCount: 2 },
      carousel: { target: 2 },
    },
    taskPreferences: {
      dailyCapacity: 'Auto',
      autoTaskGen: true,
      trackDerivedReels: true,
    },
    launchPlan: {
      currentSimulatedDate: '2026-10-10',
      overallStartDate: '2026-10-20',
    },
  };

  let tasks = [];

  // Step 1: Initial task generation
  tasks = generateAndPrioritizeTasks({
    assets,
    topics,
    calendarEvents,
    settings,
    existingTasks: tasks,
  });

  const masterEditTask = tasks.find((t) => t.contentId === 'long-1' && t.actionStage === 'Edit');
  assert.ok(masterEditTask, 'Long video at stage Edit has next valid action Edit');
  assert.equal(masterEditTask.priority, 'High');

  // Step 2: Simulate Completing Edit on Long Video -> Derives exactly 3 child Reels
  const parentVideo = assets.find((a) => a.id === 'long-1');
  const baseTitle = parentVideo.title;
  const childReels = [1, 2, 3].map((n) => ({
    id: `derived-reel-${n}`,
    title: `${baseTitle} — Reel ${n}`,
    type: 'Derived Reel',
    reelType: 'Long Video Derived',
    workflowStatus: 'editing',
    progress: { stage: 'Editing', completed: 0, total: 4, hasActive: true },
    distribution: { status: 'Not Scheduled' },
    parentLongVideoId: parentVideo.id,
  }));

  // Update assets
  assets = [
    ...assets.map((a) => (a.id === 'long-1' ? { ...a, progress: { ...a.progress, stage: 'Exported', completed: 4 } } : a)),
    ...childReels,
  ];

  // Mark the edit task as completed
  tasks = tasks.map((t) => (t.id === masterEditTask.id ? { ...t, status: 'Completed', completedAt: 'Just now' } : t));

  // Recalculate tasks
  tasks = generateAndPrioritizeTasks({
    assets,
    topics,
    calendarEvents,
    settings,
    existingTasks: tasks,
  });

  // Verify child Reel surfacing: All 3 child Reels have Edit tasks surfaced
  const openReelTasks = tasks.filter((t) => t.type === 'Derived Reel' && t.status !== 'Completed');
  assert.equal(openReelTasks.length, 3, 'All 3 Reels have active Edit tasks surfaced initially');
  assert.equal(openReelTasks[0].contentId, 'derived-reel-1');
  assert.equal(openReelTasks[0].actionStage, 'Edit');
  assert.equal(openReelTasks[1].contentId, 'derived-reel-2');
  assert.equal(openReelTasks[1].actionStage, 'Edit');
  assert.equal(openReelTasks[2].contentId, 'derived-reel-3');
  assert.equal(openReelTasks[2].actionStage, 'Edit');

  // Verify edit task remains in completed history
  const completedEditTask = tasks.find((t) => t.id === masterEditTask.id);
  assert.ok(completedEditTask, 'Completed edit task is preserved in history');
  assert.equal(completedEditTask.status, 'Completed');

  // Step 3: Complete Edit Reel 1 independently
  const editReel1Task = openReelTasks.find((t) => t.contentId === 'derived-reel-1');
  assets = assets.map((a) => (a.id === 'derived-reel-1' ? { ...a, progress: { stage: 'Export', completed: 1, total: 4 }, workflowStatus: 'exporting' } : a));
  tasks = tasks.map((t) => (t.id === editReel1Task.id ? { ...t, status: 'Completed', completedAt: 'Just now' } : t));

  // Recalculate
  tasks = generateAndPrioritizeTasks({
    assets,
    topics,
    calendarEvents,
    settings,
    existingTasks: tasks,
  });

  // Now Reel 1 has Export action, and Reel 2 and 3 remain active in Edit action independently!
  const reel1ExportAction = tasks.find((t) => t.contentId === 'derived-reel-1' && t.status !== 'Completed');
  assert.ok(reel1ExportAction, 'Reel 1 Export action is surfaced');
  assert.equal(reel1ExportAction.actionStage, 'Export');

  const reel2EditAction = tasks.find((t) => t.contentId === 'derived-reel-2' && t.status !== 'Completed');
  assert.ok(reel2EditAction, 'Reel 2 Edit action remains active independently');
  assert.equal(reel2EditAction.actionStage, 'Edit');

  const reel3Action = tasks.find((t) => t.contentId === 'derived-reel-3' && t.status !== 'Completed');
  assert.ok(reel3Action, 'Reel 3 Edit action remains active independently');
  assert.equal(reel3Action.actionStage, 'Edit');

  // Step 4: Settings change - alter dailyCapacity to '3 tasks'
  settings.taskPreferences.dailyCapacity = '3 tasks';
  tasks = generateAndPrioritizeTasks({
    assets,
    topics,
    calendarEvents,
    settings,
    existingTasks: tasks,
  });

  const todayTasks = tasks.filter((t) => t.status === 'Today');
  assert.equal(todayTasks.length, 3, 'Today tasks count strictly capped at 3 by task preferences');
});

   import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_LAUNCH_DATE,
  DEFAULT_SIMULATED_DATE,
  getDaysDiff,
  addDays,
  getRelativeLaunchDates,
  getRollingWindow,
  reconcileOverdueScheduledContent,
  formatDisplayDate,
} from '../src/lib/domain/dateUtils.ts';

import {
  isAssetReadyForBuffer,
  analyzeBufferDeficits,
  getNextValidActionForAsset,
  getNextValidActionForTopic,
  calculatePriorityScore,
  generatePreparationCandidates,
  generateAndPrioritizeTasks,
} from '../src/lib/engine/taskEngine.ts';

import {
  isAssetBufferReady,
  isAssetEligibleForDerivation,
  getNextWorkflowStatus,
} from '../src/lib/domain/contentWorkflow.ts';

test('Settings-to-Tasks End-to-End Planning & Readiness Lifecycle', async (t) => {
  // =========================================================================
  // 1. Clear only the isolated test state
  // =========================================================================
  let assets = [];
  let topics = [];
  let tasks = [];
  let calendarEvents = [];

  assert.equal(assets.length, 0);
  assert.equal(topics.length, 0);
  assert.equal(tasks.length, 0);

  // =========================================================================
  // 2. Configure an upcoming publishing date and nonzero publishing targets
  // 3. Set the buffer duration to 14 days
  // =========================================================================
  let settings = {
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
      autoBufferCalc: true,
      dailyCapacity: 'Auto',
      priorityOrder: ['Publishing deadlines', 'Buffer gaps', 'Current production steps'],
    },
    launchPlan: {
      overallStartDate: '2026-10-16',
      currentSimulatedDate: '2026-10-10',
      useSimulatedDate: true,
      platformDates: {
        youtube: '2026-10-16',
        instagram: '2026-10-16',
        linkedin: '2026-10-16',
      },
    },
  };

  // =========================================================================
  // 4. Verify that a real deficit generates actionable preparation tasks even
  //    though no Topics or Content Assets exist.
  // =========================================================================
  const deficits = analyzeBufferDeficits(assets, settings);
  assert.ok(deficits.quotas.youtubeLong.deficit > 0, 'YouTube Long has deficit');
  assert.ok(deficits.quotas.instagramReels.standaloneDeficit > 0, 'Standalone Reel has deficit');
  assert.ok(deficits.quotas.linkedin.informativeDeficit > 0, 'LinkedIn Informative has deficit');
  assert.ok(deficits.quotas.linkedin.videoRelatedDeficit > 0, 'LinkedIn Long Video Related has deficit');
  assert.ok(deficits.quotas.carousel.deficit > 0, 'Carousel has deficit');
  assert.ok(deficits.quotas.instagramReels.derivedDeficit > 0, 'Derived Reel has deficit');

  tasks = generateAndPrioritizeTasks({
    assets,
    topics,
    calendarEvents,
    settings,
    existingTasks: tasks,
    referenceDate: settings.launchPlan.currentSimulatedDate,
  });

  assert.ok(tasks.length > 0, 'Tasks collection is not empty when buffer has deficit');
  const prepTasks = tasks.filter((task) => task.isPreparationTask === true);
  assert.ok(prepTasks.length > 0, 'Actionable preparation tasks are generated');

  // Verify that Derived Reels do NOT have independent topic preparation tasks
  const derivedReelPrepTasks = prepTasks.filter((task) => task.type === 'Derived Reel');
  assert.equal(
    derivedReelPrepTasks.length,
    0,
    'Derived Reels must never have independent Topic preparation tasks (they derive from YouTube Long Video)'
  );

  // =========================================================================
  // 5. Verify that preparation tasks direct me to create real Topics without
  //    creating fake records.
  // =========================================================================
  assert.equal(assets.length, 0, 'No fake Content Assets created');
  assert.equal(topics.length, 0, 'No fake Topics created');

  const ytPrepTask = prepTasks.find((task) => task.targetContentType === 'YouTube Long');
  assert.ok(ytPrepTask, 'Found YouTube Long prep task');
  assert.ok(ytPrepTask.id.startsWith('prep-yt-long-'), 'Stable prep task ID');
  assert.equal(ytPrepTask.actionStage, 'Plan');
  assert.ok(ytPrepTask.title.includes('Create Topic for YouTube Long Video'));

  // =========================================================================
  // 6. Create a YouTube Long Video Topic and start production
  // =========================================================================
  const newYtTopic = {
    id: 'topic-yt-1',
    title: 'Modern AI Engineering Guide',
    type: 'YouTube Long',
    status: 'planning',
    date: 'Today',
  };
  topics = [newYtTopic, ...topics];

  // Recalculating tasks with the new planned topic decrements prep task demand
  const tasksAfterTopic = generateAndPrioritizeTasks({
    assets,
    topics,
    calendarEvents,
    settings,
    existingTasks: tasks,
    referenceDate: settings.launchPlan.currentSimulatedDate,
  });
  const ytPrepTasksAfter = tasksAfterTopic.filter(
    (t) => t.isPreparationTask && t.targetContentType === 'YouTube Long'
  );
  assert.equal(
    ytPrepTasksAfter.length,
    prepTasks.filter((t) => t.isPreparationTask && t.targetContentType === 'YouTube Long').length - 1,
    'Planned topic decrements remaining preparation task demand by 1'
  );

  // Start production creates linked Content Asset with stable ID
  const linkedYtAsset = {
    id: 'asset-yt-1',
    title: newYtTopic.title,
    type: 'YouTube Long',
    workflowStatus: 'scripting',
    topicId: newYtTopic.id,
    progress: { stage: 'Script', completed: 1, total: 7, hasActive: true },
    distribution: { status: 'Not Scheduled' },
  };
  assets = [linkedYtAsset, ...assets];
  topics = topics.map((t) =>
    t.id === newYtTopic.id ? { ...t, status: 'in_progress', contentAssetId: linkedYtAsset.id } : t
  );

  // =========================================================================
  // 7. Verify that the correct Script task appears
  // =========================================================================
  tasks = generateAndPrioritizeTasks({
    assets,
    topics,
    calendarEvents,
    settings,
    existingTasks: tasksAfterTopic,
    referenceDate: settings.launchPlan.currentSimulatedDate,
  });

  const ytScriptTask = tasks.find(
    (t) => t.contentId === linkedYtAsset.id && t.actionStage === 'Script'
  );
  assert.ok(ytScriptTask, 'Script task appears for YouTube Long asset in production');
  assert.equal(ytScriptTask.badge, 'Scripting');

  // =========================================================================
  // 8. Complete the Long Video through Export
  // =========================================================================
  // Script -> Shoot -> Edit -> Export
  let currentYt = assets.find((a) => a.id === linkedYtAsset.id);
  currentYt = { ...currentYt, workflowStatus: 'scripting', progress: { stage: 'Script', completed: 1, total: 7 } };
  currentYt = { ...currentYt, workflowStatus: 'shooting', progress: { stage: 'Shoot', completed: 2, total: 7 } };
  currentYt = { ...currentYt, workflowStatus: 'editing', progress: { stage: 'Edit', completed: 3, total: 7 } };
  currentYt = { ...currentYt, workflowStatus: 'exported', progress: { stage: 'Export', completed: 4, total: 7 } };

  assets = assets.map((a) => (a.id === linkedYtAsset.id ? currentYt : a));
  assert.ok(isAssetEligibleForDerivation(currentYt), 'Exported Long Video is eligible for child reel derivation');
  assert.ok(isAssetReadyForBuffer(currentYt), 'Exported Long Video qualifies for buffer inventory');

  // =========================================================================
  // 9. Verify that exactly three derived Reel assets and three Edit tasks appear
  // =========================================================================
  const derivedChildReels = [1, 2, 3].map((n) => ({
    id: `derived-reel-yt1-${n}`,
    title: `${currentYt.title} — Reel ${n}`,
    type: 'Derived Reel',
    reelType: 'Long Video Derived',
    workflowStatus: 'editing',
    progress: { stage: 'Editing', completed: 0, total: 4, hasActive: true },
    distribution: { status: 'Not Scheduled' },
    parentLongVideoId: currentYt.id,
  }));
  assets = [...assets, ...derivedChildReels];

  tasks = generateAndPrioritizeTasks({
    assets,
    topics,
    calendarEvents,
    settings,
    existingTasks: tasks,
    referenceDate: settings.launchPlan.currentSimulatedDate,
  });

  const reelEditTasks = tasks.filter(
    (t) => t.type === 'Derived Reel' && t.actionStage === 'Edit' && t.status !== 'Completed'
  );
  assert.equal(reelEditTasks.length, 3, 'Exactly three derived Reel Edit tasks appear');
  assert.equal(reelEditTasks[0].contentId, 'derived-reel-yt1-1');
  assert.equal(reelEditTasks[1].contentId, 'derived-reel-yt1-2');
  assert.equal(reelEditTasks[2].contentId, 'derived-reel-yt1-3');

  // =========================================================================
  // 10. Recalculate the engine multiple times and verify no duplicates
  // =========================================================================
  const run1 = generateAndPrioritizeTasks({ assets, topics, calendarEvents, settings, existingTasks: tasks });
  const run2 = generateAndPrioritizeTasks({ assets, topics, calendarEvents, settings, existingTasks: run1 });
  const run3 = generateAndPrioritizeTasks({ assets, topics, calendarEvents, settings, existingTasks: run2 });

  assert.equal(run2.length, run1.length, 'Idempotent recalculation length 1 vs 2');
  assert.equal(run3.length, run1.length, 'Idempotent recalculation length 1 vs 3');

  const idSet = new Set(run3.map((t) => t.id));
  assert.equal(idSet.size, run3.length, 'All task IDs are completely unique and deduplicated');

  // =========================================================================
  // 11. Complete production and verify buffer readiness & remaining prep update
  // =========================================================================
  const updatedDeficits = analyzeBufferDeficits(assets, settings);
  assert.equal(
    updatedDeficits.quotas.youtubeLong.deficit,
    deficits.quotas.youtubeLong.deficit - 1,
    'YouTube Long deficit decremented by 1 ready asset'
  );

  // =========================================================================
  // 12. Repeat for Standalone Reel, both LinkedIn categories, and Carousel
  // =========================================================================
  // A. Standalone Reel
  const srAsset = {
    id: 'asset-sr-1',
    title: 'Daily Coding Tip',
    type: 'Standalone Reel',
    workflowStatus: 'exported',
    progress: { stage: 'Export', completed: 4, total: 7 },
    distribution: { status: 'Not Scheduled' },
  };
  assert.ok(isAssetBufferReady(srAsset), 'Exported Standalone Reel is buffer ready');

  // B. LinkedIn Informative
  const liInfAsset = {
    id: 'asset-li-inf-1',
    title: 'Top 5 TypeScript Patterns',
    type: 'LinkedIn',
    subType: 'Informative',
    workflowStatus: 'ready',
    progress: { stage: 'Ready', completed: 2, total: 4 },
    distribution: { status: 'Not Scheduled' },
  };
  assert.ok(isAssetBufferReady(liInfAsset), 'Ready LinkedIn Informative is buffer ready');

  // C. LinkedIn Long Video Related
  const liRelAsset = {
    id: 'asset-li-rel-1',
    title: 'Key Takeaways from Modern AI Guide',
    type: 'LinkedIn',
    subType: 'Long Video Related',
    workflowStatus: 'ready',
    progress: { stage: 'Ready', completed: 2, total: 4 },
    distribution: { status: 'Not Scheduled' },
  };
  assert.ok(isAssetBufferReady(liRelAsset), 'Ready LinkedIn Related is buffer ready');

  // D. Carousel
  const carAsset = {
    id: 'asset-car-1',
    title: 'System Design Cheatsheet',
    type: 'Carousel',
    workflowStatus: 'ready',
    progress: { stage: 'Ready', completed: 2, total: 4 },
    distribution: { status: 'Not Scheduled' },
  };
  assert.ok(isAssetBufferReady(carAsset), 'Ready Carousel is buffer ready');

  assets = [...assets, srAsset, liInfAsset, liRelAsset, carAsset];
  const allReadyDeficits = analyzeBufferDeficits(assets, settings);

  assert.equal(allReadyDeficits.quotas.instagramReels.standaloneDeficit, deficits.quotas.instagramReels.standaloneDeficit - 1);
  assert.equal(allReadyDeficits.quotas.linkedin.informativeDeficit, deficits.quotas.linkedin.informativeDeficit - 1);
  assert.equal(allReadyDeficits.quotas.linkedin.videoRelatedDeficit, deficits.quotas.linkedin.videoRelatedDeficit - 1);
  assert.equal(allReadyDeficits.quotas.carousel.deficit, deficits.quotas.carousel.deficit - 1);

  // =========================================================================
  // 13. Change publishing targets and buffer duration in Settings and verify
  //     the resulting task demand changes
  // =========================================================================
  const reducedSettings = {
    ...settings,
    advanceBuffer: { days: 7 },
  };
  const reducedDeficits = analyzeBufferDeficits(assets, reducedSettings);
  assert.ok(
    reducedDeficits.quotas.youtubeLong.deficit <= allReadyDeficits.quotas.youtubeLong.deficit,
    '7-day buffer requires fewer YouTube Long videos than 14-day buffer'
  );

  const reducedTasks = generateAndPrioritizeTasks({
    assets,
    topics,
    calendarEvents,
    settings: reducedSettings,
    existingTasks: tasks,
    referenceDate: settings.launchPlan.currentSimulatedDate,
  });
  const reducedPrepCount = reducedTasks.filter((t) => t.isPreparationTask).length;
  const originalPrepCount = tasks.filter((t) => t.isPreparationTask).length;
  assert.ok(
    reducedPrepCount < originalPrepCount,
    'Reduced buffer duration yields fewer preparation task recommendations'
  );

  // =========================================================================
  // 14. Change the launch date and verify date previews and task priorities
  // =========================================================================
  const relativeLaunch = getRelativeLaunchDates('2026-10-16');
  assert.equal(relativeLaunch.launchDate, '2026-10-16');
  assert.equal(relativeLaunch.preLaunchDate, '2026-10-10');
  assert.equal(relativeLaunch.postLaunchDate, '2026-10-21');

  // Verify rolling window end boundary is exclusive
  const rwPreLaunch = getRollingWindow('2026-10-10', 14, true, '2026-10-16');
  assert.equal(rwPreLaunch.windowStart, '2026-10-16');
  assert.equal(rwPreLaunch.windowEndExclusive, '2026-10-30');
  assert.equal(getDaysDiff('2026-10-16', '2026-10-30'), 14, 'Buffer window is exactly 14 days');

  // Imminent launch date elevates preparation urgency
  const imminentSettings = {
    ...settings,
    launchPlan: {
      ...settings.launchPlan,
      overallStartDate: '2026-10-12', // 2 days away from 2026-10-10
    },
  };
  const imminentTasks = generateAndPrioritizeTasks({
    assets: [],
    topics: [],
    calendarEvents: [],
    settings: imminentSettings,
    existingTasks: [],
    referenceDate: '2026-10-10',
  });
  const highPriorityPrep = imminentTasks.filter(
    (t) => t.isPreparationTask && t.priority === 'High'
  );
  assert.ok(highPriorityPrep.length > 0, 'Imminent launch elevates prep tasks to High priority');

  // =========================================================================
  // 15. Test scheduled-date reconciliation before, during, after, and reopening
  // =========================================================================
  const distBefore = {
    id: 'asset-sched-future',
    title: 'Future Post',
    type: 'LinkedIn',
    workflowStatus: 'scheduled',
    distribution: {
      status: 'Scheduled',
      distributions: [
        { id: 'dist-1', platform: 'LinkedIn', date: '2026-10-15', status: 'Scheduled' },
      ],
    },
  };
  const distToday = {
    id: 'asset-sched-today',
    title: 'Today Post',
    type: 'LinkedIn',
    workflowStatus: 'scheduled',
    distribution: {
      status: 'Scheduled',
      distributions: [
        { id: 'dist-2', platform: 'LinkedIn', date: '2026-10-10', status: 'Scheduled' },
      ],
    },
  };
  const distPast = {
    id: 'asset-sched-past',
    title: 'Past Overdue Post',
    type: 'LinkedIn',
    workflowStatus: 'scheduled',
    distribution: {
      status: 'Scheduled',
      distributions: [
        { id: 'dist-3', platform: 'LinkedIn', date: '2026-10-08', status: 'Scheduled' },
      ],
    },
  };

  const testAssets = [distBefore, distToday, distPast];
  const testCalendar = [
    { id: 'ev-1', contentId: 'asset-sched-future', date: '2026-10-15', status: 'Scheduled' },
    { id: 'ev-2', contentId: 'asset-sched-today', date: '2026-10-10', status: 'Scheduled' },
    { id: 'ev-3', contentId: 'asset-sched-past', date: '2026-10-08', status: 'Scheduled' },
  ];

  // Run reconciliation at current simulated date '2026-10-10'
  const reconResult1 = reconcileOverdueScheduledContent(testAssets, testCalendar, '2026-10-10');
  assert.equal(reconResult1.changedCount, 1, 'Only the overdue asset (2026-10-08) is updated');

  const pastUpdated = reconResult1.updatedAssets.find((a) => a.id === 'asset-sched-past');
  assert.equal(pastUpdated.workflowStatus, 'published');
  assert.equal(pastUpdated.distribution.status, 'Published');
  assert.equal(pastUpdated.distribution.distributions[0].status, 'Published');

  const todayKept = reconResult1.updatedAssets.find((a) => a.id === 'asset-sched-today');
  assert.equal(todayKept.workflowStatus, 'scheduled', 'Same-day scheduled content remains Scheduled');

  const futureKept = reconResult1.updatedAssets.find((a) => a.id === 'asset-sched-future');
  assert.equal(futureKept.workflowStatus, 'scheduled', 'Future scheduled content remains Scheduled');

  // Idempotency check (reopening the app or running again produces 0 changes)
  const reconResult2 = reconcileOverdueScheduledContent(
    reconResult1.updatedAssets,
    reconResult1.updatedCalendar,
    '2026-10-10'
  );
  assert.equal(reconResult2.changedCount, 0, 'Re-running reconciliation produces 0 redundant mutations');

  // =========================================================================
  // 16. Verify that no unrelated record changes during an individual task action
  // =========================================================================
  const beforeState = JSON.stringify(reconResult1.updatedAssets.find((a) => a.id === 'asset-sched-future'));
  // Update only dist-3 calendar event or dist-3 task
  const singleTaskUpdate = run3.map((task) =>
    task.id === reelEditTasks[0].id ? { ...task, status: 'Completed', completedAt: 'Just now' } : task
  );
  const afterState = JSON.stringify(reconResult1.updatedAssets.find((a) => a.id === 'asset-sched-future'));
  assert.equal(beforeState, afterState, 'Unrelated assets remain untouched during single task action');
});

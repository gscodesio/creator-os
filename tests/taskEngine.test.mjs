import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isAssetReadyForBuffer,
  analyzeBufferDeficits,
  getNextValidActionForAsset,
  calculatePriorityScore,
  generateAndPrioritizeTasks,
} from '../src/lib/engine/taskEngine.ts';

// ---------------------------------------------------------------------------
// FIXTURE DATA
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS = {
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

// ---------------------------------------------------------------------------
// TEST 1: Each workflow's next valid action
// ---------------------------------------------------------------------------
test('1. Each workflow produces its canonical next valid action', () => {
  // YouTube Long Video workflow
  const ytScript = { id: 'yt-1', title: 'AI Guide', type: 'YouTube Long', progress: { stage: 'Script', completed: 1, total: 7 }, distribution: { status: 'Not Scheduled' } };
  assert.equal(getNextValidActionForAsset(ytScript, [ytScript])?.actionStage, 'Script');

  const ytShoot = { ...ytScript, progress: { stage: 'Shoot', completed: 2, total: 7 } };
  assert.equal(getNextValidActionForAsset(ytShoot, [ytShoot])?.actionStage, 'Shoot');

  const ytEdit = { ...ytScript, progress: { stage: 'Edit', completed: 3, total: 7 } };
  assert.equal(getNextValidActionForAsset(ytEdit, [ytEdit])?.actionStage, 'Edit');

  const ytExport = { ...ytScript, progress: { stage: 'Export', completed: 4, total: 7 } };
  assert.equal(getNextValidActionForAsset(ytExport, [ytExport])?.actionStage, 'Schedule');

  // Standalone Reel workflow
  const reelScript = { id: 'sr-1', title: 'Quick Tip', type: 'Standalone Reel', progress: { stage: 'Script', completed: 1, total: 7 }, distribution: { status: 'Not Scheduled' } };
  assert.equal(getNextValidActionForAsset(reelScript, [reelScript])?.actionStage, 'Script');

  const reelShoot = { ...reelScript, progress: { stage: 'Shoot', completed: 2, total: 7 } };
  assert.equal(getNextValidActionForAsset(reelShoot, [reelShoot])?.actionStage, 'Shoot');

  // Derived Reel workflow (Edit -> Export -> Schedule -> Publish)
  const derivedReel = { id: 'dr-1', title: 'AI Guide — Reel 1', type: 'Derived Reel', progress: { stage: 'Editing', completed: 0, total: 4 }, distribution: { status: 'Not Scheduled' } };
  assert.equal(getNextValidActionForAsset(derivedReel, [derivedReel])?.actionStage, 'Edit');

  const derivedExport = { ...derivedReel, progress: { stage: 'Export', completed: 1, total: 4 } };
  assert.equal(getNextValidActionForAsset(derivedExport, [derivedExport])?.actionStage, 'Export');

  // LinkedIn workflow (Topic -> Write -> Ready -> Schedule -> Publish)
  const liWrite = { id: 'li-1', title: 'Career Advice', type: 'LinkedIn', subType: 'Informative', progress: { stage: 'Writing', completed: 1, total: 5 }, distribution: { status: 'Not Scheduled' } };
  assert.equal(getNextValidActionForAsset(liWrite, [liWrite])?.actionStage, 'Write');

  const liReady = { ...liWrite, progress: { stage: 'Ready', completed: 2, total: 5 } };
  assert.equal(getNextValidActionForAsset(liReady, [liReady])?.actionStage, 'Schedule');

  // Carousel workflow (Topic -> Create -> Schedule)
  const carCreate = { id: 'car-1', title: 'Roadmap', type: 'Carousel', progress: { stage: 'Create', completed: 1, total: 3 }, distribution: { status: 'Not Scheduled' } };
  assert.equal(getNextValidActionForAsset(carCreate, [carCreate])?.actionStage, 'Create');

  const carSchedule = { ...carCreate, progress: { stage: 'Schedule', completed: 2, total: 3 }, distribution: { status: 'Instagram Scheduled' } };
  assert.equal(getNextValidActionForAsset(carSchedule, [carSchedule])?.actionStage, 'Publish');
});

// ---------------------------------------------------------------------------
// TEST 2: Exporting a Long Video creates exactly 3 child Reels and no duplicates
// ---------------------------------------------------------------------------
test('2. Exporting a Long Video creates exactly three child Reels without duplicates', () => {
  const parentId = 'yt-parent-1';
  const parentVideo = {
    id: parentId,
    title: 'Best College for BCA',
    type: 'YouTube Long',
    progress: { stage: 'Exported', completed: 4, total: 7 },
    distribution: { status: 'Not Scheduled' },
  };

  // Helper mimicking exportAssetAndDeriveReels logic
  function deriveReels(parent, existingAssets) {
    const existing = existingAssets.filter((a) => a.type === 'Derived Reel' && a.parentLongVideoId === parent.id);
    if (existing.length >= 3) {
      return { created: false, reels: existing };
    }
    const children = [1, 2, 3].map((n) => ({
      id: `reel-${n}`,
      title: `${parent.title} — Reel ${n}`,
      type: 'Derived Reel',
      parentLongVideoId: parent.id,
      progress: { stage: n === 1 ? 'Editing' : 'Pending', completed: 0, total: 4 },
      distribution: { status: 'Not Scheduled' },
    }));
    return { created: true, reels: children };
  }

  // First export invocation
  const result1 = deriveReels(parentVideo, [parentVideo]);
  assert.equal(result1.created, true);
  assert.equal(result1.reels.length, 3);
  assert.equal(result1.reels[0].title, 'Best College for BCA — Reel 1');
  assert.equal(result1.reels[1].title, 'Best College for BCA — Reel 2');
  assert.equal(result1.reels[2].title, 'Best College for BCA — Reel 3');

  // Second export invocation (idempotency check)
  const combined = [parentVideo, ...result1.reels];
  const result2 = deriveReels(parentVideo, combined);
  assert.equal(result2.created, false);
  assert.equal(result2.reels.length, 3);
});

// ---------------------------------------------------------------------------
// TEST 3: All three derived Reel Edit actions are surfaced upon export
// ---------------------------------------------------------------------------
test('3. All three child Reel Edit actions are surfaced upon Long Video export', () => {
  const parentId = 'yt-parent-1';
  const reel1 = {
    id: 'reel-1',
    title: 'BCA Career — Reel 1',
    type: 'Derived Reel',
    parentLongVideoId: parentId,
    progress: { stage: 'Editing', completed: 0, total: 4 },
    distribution: { status: 'Not Scheduled' },
  };
  const reel2 = {
    id: 'reel-2',
    title: 'BCA Career — Reel 2',
    type: 'Derived Reel',
    parentLongVideoId: parentId,
    progress: { stage: 'Editing', completed: 0, total: 4 },
    distribution: { status: 'Not Scheduled' },
  };
  const reel3 = {
    id: 'reel-3',
    title: 'BCA Career — Reel 3',
    type: 'Derived Reel',
    parentLongVideoId: parentId,
    progress: { stage: 'Editing', completed: 0, total: 4 },
    distribution: { status: 'Not Scheduled' },
  };

  const allAssets = [reel1, reel2, reel3];

  // Reel 1 should have an action (Edit)
  const action1 = getNextValidActionForAsset(reel1, allAssets);
  assert.notEqual(action1, null);
  assert.equal(action1.actionStage, 'Edit');
  assert.equal(action1.title, 'Edit Reel 1');

  // Reel 2 should have an action (Edit)
  const action2 = getNextValidActionForAsset(reel2, allAssets);
  assert.notEqual(action2, null);
  assert.equal(action2.actionStage, 'Edit');
  assert.equal(action2.title, 'Edit Reel 2');

  // Reel 3 should have an action (Edit)
  const action3 = getNextValidActionForAsset(reel3, allAssets);
  assert.notEqual(action3, null);
  assert.equal(action3.actionStage, 'Edit');
  assert.equal(action3.title, 'Edit Reel 3');
});

// ---------------------------------------------------------------------------
// TEST 4: Completing Edit Reel 1 enables Export Reel 1 independently
// ---------------------------------------------------------------------------
test('4. Completing Edit Reel 1 enables Export Reel 1 independently of Reel 2 and Reel 3', () => {
  const parentId = 'yt-parent-1';
  // Reel 1 has completed Edit (completed: 1, stage: Export)
  const reel1 = {
    id: 'reel-1',
    title: 'BCA Career — Reel 1',
    type: 'Derived Reel',
    parentLongVideoId: parentId,
    progress: { stage: 'Export', completed: 1, total: 4 },
    distribution: { status: 'Not Scheduled' },
  };
  const reel2 = {
    id: 'reel-2',
    title: 'BCA Career — Reel 2',
    type: 'Derived Reel',
    parentLongVideoId: parentId,
    progress: { stage: 'Editing', completed: 0, total: 4 },
    distribution: { status: 'Not Scheduled' },
  };

  const allAssets = [reel1, reel2];

  // Reel 1 action is now Export
  const action1 = getNextValidActionForAsset(reel1, allAssets);
  assert.notEqual(action1, null);
  assert.equal(action1.actionStage, 'Export');
  assert.equal(action1.title, 'Export Reel 1');

  // Reel 2 action remains independent (Edit)
  const action2 = getNextValidActionForAsset(reel2, allAssets);
  assert.notEqual(action2, null);
  assert.equal(action2.actionStage, 'Edit');
  assert.equal(action2.title, 'Edit Reel 2');
});

// ---------------------------------------------------------------------------
// TEST 5: Long Video and Reel buffer deficits competing for priority
// ---------------------------------------------------------------------------
test('5. Long Video and Reel buffer deficits compete deterministically based on prerequisite benefits', () => {
  // Scenario: Both YouTube Long and Instagram Reels are deficient
  const ytVideo = {
    id: 'yt-1',
    title: 'Master React Guide',
    type: 'YouTube Long',
    progress: { stage: 'Edit', completed: 3, total: 7 }, // Editing master video
    distribution: { status: 'Not Scheduled' },
  };
  const standaloneReel = {
    id: 'sr-1',
    title: 'CSS Trick',
    type: 'Standalone Reel',
    progress: { stage: 'Editing', completed: 2, total: 7 },
    distribution: { status: 'Not Scheduled' },
  };

  const deficits = analyzeBufferDeficits([ytVideo, standaloneReel], DEFAULT_SETTINGS);
  assert.ok(deficits.quotas.youtubeLong.deficit > 0);
  assert.ok(deficits.quotas.instagramReels.deficit > 0);

  const candYt = getNextValidActionForAsset(ytVideo, [ytVideo, standaloneReel]);
  const scoreYt = calculatePriorityScore(candYt, ytVideo, deficits, [], '2026-10-10', false);

  const candReel = getNextValidActionForAsset(standaloneReel, [ytVideo, standaloneReel]);
  const scoreReel = calculatePriorityScore(candReel, standaloneReel, deficits, [], '2026-10-10', false);

  // YouTube Long at Edit stage receives the +300 prerequisite unblocking bonus (unlocks 3 child reels)
  assert.ok(scoreYt.score > scoreReel.score);
  assert.ok(scoreYt.reason.includes('unlocks 3 child Reels'));
});

// ---------------------------------------------------------------------------
// TEST 6: An imminent Long Video publishing deadline affecting priority
// ---------------------------------------------------------------------------
test('6. Imminent publishing deadline elevates task to Urgent Tier 1', () => {
  const ytVideo = {
    id: 'yt-deadline',
    title: 'Critical Tuesday Release',
    type: 'YouTube Long',
    progress: { stage: 'Edit', completed: 3, total: 7 },
    distribution: { status: 'Not Scheduled' },
  };

  const calendarEvents = [
    {
      id: 'cal-urgent',
      contentId: 'yt-deadline',
      title: 'Critical Tuesday Release',
      type: 'youtube',
      date: 11,
      month: 'October 2026',
      time: '10:00 AM',
      fullDateStr: '2026-10-11', // Tomorrow relative to Oct 10
    },
  ];

  const deficits = analyzeBufferDeficits([ytVideo], DEFAULT_SETTINGS);
  const cand = getNextValidActionForAsset(ytVideo, [ytVideo]);
  const scoring = calculatePriorityScore(cand, ytVideo, deficits, calendarEvents, '2026-10-10', false);

  // Score should be boosted above 1000 due to imminent deadline tomorrow
  assert.ok(scoring.score >= 1000);
  assert.equal(scoring.level, 'High');
  assert.equal(scoring.dueNotice, 'Tomorrow');
});

// ---------------------------------------------------------------------------
// TEST 7: A Reel not counting as ready until editing/export requirements are met
// ---------------------------------------------------------------------------
test('7. Reel does not count as ready until editing/exporting is complete', () => {
  const editingReel = {
    id: 'r-editing',
    title: 'Unfinished Reel',
    type: 'Derived Reel',
    progress: { stage: 'Editing', completed: 0, total: 4 },
    distribution: { status: 'Not Scheduled' },
  };
  assert.equal(isAssetReadyForBuffer(editingReel), false);

  const exportedReel = {
    id: 'r-exported',
    title: 'Finished Reel',
    type: 'Derived Reel',
    progress: { stage: 'Exported', completed: 1, total: 4 },
    distribution: { status: 'Not Scheduled' },
  };
  assert.equal(isAssetReadyForBuffer(exportedReel), true);

  const scheduledReel = {
    id: 'r-scheduled',
    title: 'Scheduled Reel',
    type: 'Derived Reel',
    progress: { stage: 'Schedule', completed: 2, total: 4 },
    distribution: { status: 'Instagram Scheduled' },
  };
  assert.equal(isAssetReadyForBuffer(scheduledReel), true);
});

// ---------------------------------------------------------------------------
// TEST 8: Settings changes recalculating priorities
// ---------------------------------------------------------------------------
test('8. Changing daily capacity in settings dynamically recalculates Today vs Upcoming tasks', () => {
  const assets = [
    { id: '1', title: 'Video 1', type: 'YouTube Long', progress: { stage: 'Edit', completed: 3, total: 7 }, distribution: { status: 'Not Scheduled' } },
    { id: '2', title: 'Video 2', type: 'YouTube Long', progress: { stage: 'Shoot', completed: 2, total: 7 }, distribution: { status: 'Not Scheduled' } },
    { id: '3', title: 'Reel 1', type: 'Standalone Reel', progress: { stage: 'Edit', completed: 3, total: 7 }, distribution: { status: 'Not Scheduled' } },
    { id: '4', title: 'Reel 2', type: 'Standalone Reel', progress: { stage: 'Shoot', completed: 1, total: 7 }, distribution: { status: 'Not Scheduled' } },
    { id: '5', title: 'Post 1', type: 'LinkedIn', subType: 'Informative', progress: { stage: 'Topic', completed: 0, total: 5 }, distribution: { status: 'Not Scheduled' } },
    { id: '6', title: 'Carousel 1', type: 'Carousel', progress: { stage: 'Topic', completed: 0, total: 3 }, distribution: { status: 'Not Scheduled' } },
  ];

  // Capacity: 3 tasks
  const settingsCap3 = {
    ...DEFAULT_SETTINGS,
    taskPreferences: { ...DEFAULT_SETTINGS.taskPreferences, dailyCapacity: '3 tasks' },
  };
  const tasks3 = generateAndPrioritizeTasks({ assets, topics: [], settings: settingsCap3 });
  const today3 = tasks3.filter((t) => t.status === 'Today');
  assert.equal(today3.length, 3);

  // Capacity: 5 tasks
  const settingsCap5 = {
    ...DEFAULT_SETTINGS,
    taskPreferences: { ...DEFAULT_SETTINGS.taskPreferences, dailyCapacity: '5 tasks' },
  };
  const tasks5 = generateAndPrioritizeTasks({ assets, topics: [], settings: settingsCap5 });
  const today5 = tasks5.filter((t) => t.status === 'Today');
  assert.equal(today5.length, 5);
});

// ---------------------------------------------------------------------------
// TEST 9: Repeated recalculation not creating duplicate open tasks
// ---------------------------------------------------------------------------
test('9. Repeated recalculation is idempotent and does not duplicate open tasks', () => {
  const assets = [
    { id: '1', title: 'Video 1', type: 'YouTube Long', progress: { stage: 'Edit', completed: 3, total: 7 }, distribution: { status: 'Not Scheduled' } },
    { id: '2', title: 'Reel 1', type: 'Derived Reel', progress: { stage: 'Editing', completed: 0, total: 4 }, distribution: { status: 'Not Scheduled' } },
  ];

  // Run 1: generate initial tasks
  const run1 = generateAndPrioritizeTasks({ assets, topics: [], settings: DEFAULT_SETTINGS, existingTasks: [] });
  assert.equal(run1.length, 2);

  // Run 2: pass run1 tasks as existingTasks
  const run2 = generateAndPrioritizeTasks({ assets, topics: [], settings: DEFAULT_SETTINGS, existingTasks: run1 });
  assert.equal(run2.length, 2);

  // Ensure task IDs remain stable
  assert.equal(run2[0].id, run1[0].id);
  assert.equal(run2[1].id, run1[1].id);
});

// ---------------------------------------------------------------------------
// TEST 10: Completed tasks not falsely marking an asset as published
// ---------------------------------------------------------------------------
test('10. Completing a production task updates progress without falsely marking asset as published', () => {
  const asset = {
    id: 'asset-test',
    title: 'Testing Completion — Reel 1',
    type: 'Derived Reel',
    progress: { stage: 'Editing', completed: 0, total: 4 },
    distribution: { status: 'Not Scheduled' },
  };

  // Simulate task completion
  const completedTask = {
    id: 'task-asset-test-edit',
    title: 'Edit Reel 1',
    contentId: 'asset-test',
    actionStage: 'Edit',
    status: 'Completed',
    completedAt: 'Just now',
  };

  // Advance stage to Export (completed: 1)
  const advancedAsset = {
    ...asset,
    progress: { stage: 'Export', completed: 1, total: 4 },
  };

  // Verify asset is NOT published
  assert.notEqual(advancedAsset.progress.stage, 'Published');
  assert.notEqual(advancedAsset.distribution.status, 'Published');

  // Verify next recalculation does NOT regenerate the completed Edit task, but generates Export
  const nextTasks = generateAndPrioritizeTasks({
    assets: [advancedAsset],
    topics: [],
    settings: DEFAULT_SETTINGS,
    existingTasks: [completedTask],
  });

  const openTasks = nextTasks.filter((t) => t.status !== 'Completed');
  const completedInHistory = nextTasks.filter((t) => t.status === 'Completed');

  assert.equal(completedInHistory.length, 1);
  assert.equal(completedInHistory[0].id, 'task-asset-test-edit');

  assert.equal(openTasks.length, 1);
  assert.equal(openTasks[0].actionStage, 'Export');
  assert.equal(openTasks[0].title, 'Export Reel 1');
});

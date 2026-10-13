import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAssetBufferReady,
  isAssetInProduction,
  isAssetScheduled,
  isAssetPublished,
  isAssetEligibleForDerivation,
  isChildReelUnlocked,
  isAssetEligibleForSchedule,
  getNextWorkflowStatus,
  getNextTopicWorkflowStatus,
  normalizeWorkflowStatus,
  getWorkflowStepIndex,
  migrateContentAsset,
  getWorkflowSteps,
} from '../src/lib/domain/contentWorkflow.ts';
import {
  generateAndPrioritizeTasks,
  getNextValidActionForAsset,
} from '../src/lib/engine/taskEngine.ts';

test('Status-Driven Architecture: Explicit typed states govern buffer readiness', () => {
  // An asset in 'exporting' stage must NOT count as buffer ready because export has NOT completed yet
  const exportingAsset = {
    id: 'yt-1',
    title: 'How to Build Fast NextJS Apps',
    type: 'YouTube Long',
    workflowStatus: 'exporting',
    actionStatus: 'in_progress',
    progress: { stage: 'Export', completed: 4, total: 7, hasActive: true },
    distribution: { status: 'Not Scheduled' },
  };

  assert.equal(
    isAssetBufferReady(exportingAsset),
    false,
    'Asset currently in exporting stage must NOT be buffer ready until export transition completes'
  );

  // Asset in 'editing', 'shooting', 'scripting', 'topic' must NOT be buffer ready
  ['topic', 'scripting', 'shooting', 'editing'].forEach((status) => {
    assert.equal(
      isAssetBufferReady({ ...exportingAsset, workflowStatus: status }),
      false,
      `Status "${status}" must not be buffer ready regardless of progress numbers`
    );
  });

  // Only when export transition succeeds to 'exported' (or ready/scheduled/published) does it count
  const exportedAsset = {
    ...exportingAsset,
    workflowStatus: 'exported',
    actionStatus: 'completed',
    progress: { stage: 'Exported', completed: 5, total: 7, hasActive: false },
  };
  assert.equal(isAssetBufferReady(exportedAsset), true, 'Asset in "exported" status IS buffer ready');

  const scheduledAsset = {
    ...exportingAsset,
    workflowStatus: 'scheduled',
    distribution: { status: 'YouTube Scheduled', date: '2026-10-18' },
  };
  assert.equal(isAssetBufferReady(scheduledAsset), true, 'Scheduled asset is buffer ready');

  const publishedAsset = {
    ...exportingAsset,
    workflowStatus: 'published',
    distribution: { status: 'Published' },
  };
  assert.equal(isAssetBufferReady(publishedAsset), true, 'Published asset is buffer ready');
});

test('Status-Driven Architecture: Scheduling eligibility requires export/ready completion', () => {
  const editingAsset = {
    id: 'reel-1',
    title: 'Quick React Tips',
    type: 'Standalone Reel',
    workflowStatus: 'editing',
    distribution: { status: 'Not Scheduled' },
  };
  assert.equal(
    isAssetEligibleForSchedule(editingAsset),
    false,
    'Asset still in editing cannot be scheduled'
  );

  const exportingAsset = {
    ...editingAsset,
    workflowStatus: 'exporting',
  };
  assert.equal(
    isAssetEligibleForSchedule(exportingAsset),
    false,
    'Asset still in exporting cannot be scheduled'
  );

  const exportedAsset = {
    ...editingAsset,
    workflowStatus: 'exported',
  };
  assert.equal(
    isAssetEligibleForSchedule(exportedAsset),
    true,
    'Asset in exported status is eligible for scheduling'
  );

  const linkedinWriting = {
    id: 'li-1',
    title: 'Founder Story',
    type: 'LinkedIn',
    workflowStatus: 'writing',
    distribution: { status: 'Not Scheduled' },
  };
  assert.equal(
    isAssetEligibleForSchedule(linkedinWriting),
    false,
    'LinkedIn post still in writing cannot be scheduled'
  );

  const linkedinReady = {
    ...linkedinWriting,
    workflowStatus: 'ready',
  };
  assert.equal(
    isAssetEligibleForSchedule(linkedinReady),
    true,
    'LinkedIn post in ready status is eligible for scheduling'
  );
});

test('Status-Driven Architecture: Derivation eligibility and child reel independent unblocking', () => {
  const parentVideo = {
    id: 'parent-1',
    title: 'Masterclass in System Design',
    type: 'YouTube Long',
    workflowStatus: 'editing',
    distribution: { status: 'Not Scheduled' },
  };

  assert.equal(
    isAssetEligibleForDerivation(parentVideo),
    false,
    'Editing long video cannot derive child reels'
  );

  const exportedParent = {
    ...parentVideo,
    workflowStatus: 'exported',
  };
  assert.equal(
    isAssetEligibleForDerivation(exportedParent),
    true,
    'Exported long video is eligible to derive child reels'
  );

  // Child Reels
  const reel1 = {
    id: 'child-1',
    title: 'Masterclass in System Design — Reel 1',
    type: 'Derived Reel',
    workflowStatus: 'editing',
    parentLongVideoId: 'parent-1',
    distribution: { status: 'Not Scheduled' },
  };

  const reel2 = {
    id: 'child-2',
    title: 'Masterclass in System Design — Reel 2',
    type: 'Derived Reel',
    workflowStatus: 'editing',
    parentLongVideoId: 'parent-1',
    distribution: { status: 'Not Scheduled' },
  };

  const reel3 = {
    id: 'child-3',
    title: 'Masterclass in System Design — Reel 3',
    type: 'Derived Reel',
    workflowStatus: 'editing',
    parentLongVideoId: 'parent-1',
    distribution: { status: 'Not Scheduled' },
  };

  const allAssets = [exportedParent, reel1, reel2, reel3];

  // All child reels are unlocked independently
  assert.equal(isChildReelUnlocked(reel1, allAssets), true, 'Reel 1 is unlocked');
  assert.equal(isChildReelUnlocked(reel2, allAssets), true, 'Reel 2 is unlocked');
  assert.equal(isChildReelUnlocked(reel3, allAssets), true, 'Reel 3 is unlocked');
});

test('Status-Driven Architecture: Canonical next valid action mapping', () => {
  // YouTube Long
  const ytScripting = {
    id: 'yt-s',
    title: 'AI Workflows',
    type: 'YouTube Long',
    workflowStatus: 'scripting',
    distribution: { status: 'Not Scheduled' },
  };
  const action1 = getNextValidActionForAsset(ytScripting, [ytScripting]);
  assert.equal(action1.actionStage, 'Script');
  assert.equal(getNextWorkflowStatus(ytScripting), 'shooting');

  const ytShooting = { ...ytScripting, workflowStatus: 'shooting' };
  assert.equal(getNextValidActionForAsset(ytShooting, [ytShooting]).actionStage, 'Shoot');
  assert.equal(getNextWorkflowStatus(ytShooting), 'editing');

  const ytEditing = { ...ytScripting, workflowStatus: 'editing' };
  assert.equal(getNextValidActionForAsset(ytEditing, [ytEditing]).actionStage, 'Edit');
  assert.equal(getNextWorkflowStatus(ytEditing), 'exported');

  const ytExported = { ...ytScripting, workflowStatus: 'exported' };
  assert.equal(getNextValidActionForAsset(ytExported, [ytExported]).actionStage, 'Schedule');
  assert.equal(getNextWorkflowStatus(ytExported), 'scheduled');

  // LinkedIn Post
  const liWriting = {
    id: 'li-w',
    title: 'Career Advice',
    type: 'LinkedIn',
    workflowStatus: 'writing',
    distribution: { status: 'Not Scheduled' },
  };
  assert.equal(getNextValidActionForAsset(liWriting, [liWriting]).actionStage, 'Write');
  assert.equal(getNextWorkflowStatus(liWriting), 'ready');

  const liReady = { ...liWriting, workflowStatus: 'ready' };
  assert.equal(getNextValidActionForAsset(liReady, [liReady]).actionStage, 'Schedule');
  assert.equal(getNextWorkflowStatus(liReady), 'scheduled');

  // Carousel (Topic -> Create -> Schedule -> Publish)
  const carCreating = {
    id: 'car-c',
    title: '5 Design Rules',
    type: 'Carousel',
    workflowStatus: 'creating',
    distribution: { status: 'Not Scheduled' },
  };
  assert.equal(getNextValidActionForAsset(carCreating, [carCreating]).actionStage, 'Create');
  assert.equal(getNextWorkflowStatus(carCreating), 'scheduled');

  const carScheduled = { ...carCreating, workflowStatus: 'scheduled' };
  assert.equal(getNextValidActionForAsset(carScheduled, [carScheduled]).actionStage, 'Publish');
  assert.equal(getNextWorkflowStatus(carScheduled), 'published');
});

test('Status-Driven Architecture: Safe migration of legacy localStorage assets', () => {
  const legacyAsset = {
    id: 'legacy-1',
    title: 'Legacy Video Asset',
    type: 'YouTube Long',
    progress: { stage: 'Exported', completed: 4, total: 7 },
    distribution: { status: 'Not Scheduled' },
    source: 'Direct Production',
  };

  const migrated = migrateContentAsset(legacyAsset);
  assert.equal(
    migrated.workflowStatus,
    'exported',
    'Legacy stage "Exported" is correctly migrated to workflowStatus "exported"'
  );
  assert.equal(migrated.actionStatus, 'completed');
  assert.equal(isAssetBufferReady(migrated), true);

  const legacyScheduled = {
    id: 'legacy-2',
    title: 'Legacy Scheduled Reel',
    type: 'Standalone Reel',
    progress: { stage: 'Schedule', completed: 5, total: 7 },
    distribution: { status: 'Instagram Scheduled', date: '2026-10-15' },
    source: 'Direct Production',
  };
  const migratedScheduled = migrateContentAsset(legacyScheduled);
  assert.equal(migratedScheduled.workflowStatus, 'scheduled');
  assert.equal(isAssetScheduled(migratedScheduled), true);
});

test('Status-Driven Architecture: Numeric indexes are purely derived presentation helpers', () => {
  // getWorkflowStepIndex produces UI stepper index for progress bar circles
  assert.equal(getWorkflowStepIndex('YouTube Long', 'topic'), 0);
  assert.equal(getWorkflowStepIndex('YouTube Long', 'scripting'), 1);
  assert.equal(getWorkflowStepIndex('YouTube Long', 'shooting'), 2);
  assert.equal(getWorkflowStepIndex('YouTube Long', 'editing'), 3);
  assert.equal(getWorkflowStepIndex('YouTube Long', 'exporting'), 4);
  assert.equal(getWorkflowStepIndex('YouTube Long', 'exported'), 4);
  assert.equal(getWorkflowStepIndex('YouTube Long', 'scheduled'), 5);
  assert.equal(getWorkflowStepIndex('YouTube Long', 'published'), 6);

  // Derived Reel (starts at Edit)
  assert.equal(getWorkflowStepIndex('Derived Reel', 'editing'), 0);
  assert.equal(getWorkflowStepIndex('Derived Reel', 'exporting'), 1);
  assert.equal(getWorkflowStepIndex('Derived Reel', 'exported'), 1);
  assert.equal(getWorkflowStepIndex('Derived Reel', 'scheduled'), 2);
  assert.equal(getWorkflowStepIndex('Derived Reel', 'published'), 3);

  // Carousel (Topic -> Create -> Schedule -> Publish)
  assert.equal(getWorkflowStepIndex('Carousel', 'topic'), 0);
  assert.equal(getWorkflowStepIndex('Carousel', 'creating'), 1);
  assert.equal(getWorkflowStepIndex('Carousel', 'scheduled'), 2);
  assert.equal(getWorkflowStepIndex('Carousel', 'published'), 3);
});

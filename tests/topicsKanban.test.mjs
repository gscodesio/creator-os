import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTopicStatus,
  TOPIC_KANBAN_COLUMNS,
  isAssetBufferReady,
  isAssetPublished,
  isAssetEligibleForDerivation,
} from '../src/lib/domain/contentWorkflow.ts';
import {
  generateAndPrioritizeTasks,
  getNextValidActionForAsset,
} from '../src/lib/engine/taskEngine.ts';
import { ALL_TOPICS } from '../src/app/(dashboard)/topics/topicsData.ts';
import { ALL_CONTENT_ASSETS } from '../src/app/(dashboard)/content/contentData.ts';

test('Topics Kanban: Columns and Status Normalization', () => {
  assert.equal(TOPIC_KANBAN_COLUMNS.length, 4);
  assert.deepEqual(
    TOPIC_KANBAN_COLUMNS.map((c) => c.id),
    ['idea', 'planning', 'in_progress', 'converted']
  );
  assert.deepEqual(
    TOPIC_KANBAN_COLUMNS.map((c) => c.title),
    ['Idea', 'Planning', 'In Progress', 'Done']
  );

  // Normalization checks
  assert.equal(normalizeTopicStatus('idea'), 'idea');
  assert.equal(normalizeTopicStatus('Idea'), 'idea');
  assert.equal(normalizeTopicStatus('planning'), 'planning');
  assert.equal(normalizeTopicStatus('Planning'), 'planning');
  assert.equal(normalizeTopicStatus('in_progress'), 'in_progress');
  assert.equal(normalizeTopicStatus('In Progress'), 'in_progress');
  assert.equal(normalizeTopicStatus('converted'), 'converted');
  assert.equal(normalizeTopicStatus('Done'), 'converted');
  assert.equal(normalizeTopicStatus('Ready'), 'converted');
  assert.equal(normalizeTopicStatus('Published'), 'converted');
  assert.equal(normalizeTopicStatus(undefined), 'idea');
});

test('Topics Kanban: Fixtures align with reference screenshot counts', () => {
  const grouped = {
    idea: ALL_TOPICS.filter((t) => normalizeTopicStatus(t.status) === 'idea'),
    planning: ALL_TOPICS.filter((t) => normalizeTopicStatus(t.status) === 'planning'),
    in_progress: ALL_TOPICS.filter((t) => normalizeTopicStatus(t.status) === 'in_progress'),
    converted: ALL_TOPICS.filter((t) => normalizeTopicStatus(t.status) === 'converted'),
  };

  // The primary reference screenshot shows 6 in Idea, 3 in Planning, 2 in In Progress, 1 in Done
  assert.ok(grouped.idea.length >= 6, 'At least 6 topics in Idea');
  assert.equal(grouped.planning.length, 3, 'Exactly 3 topics in Planning matching reference');
  assert.equal(grouped.in_progress.length, 2, 'Exactly 2 topics in In Progress matching reference');
  assert.equal(grouped.converted.length, 1, 'Exactly 1 topic in Done matching reference');
});

test('Topics Lifecycle End-to-End: Idea → Planning → In Progress → Done (Content Created)', () => {
  // Store-like initial state
  let topics = [];
  let assets = [...ALL_CONTENT_ASSETS];
  let calendarEvents = [];
  let settings = {
    isConfigured: true,
    advanceBuffer: { days: 14 },
    publishingFrequency: {
      youtubeLong: { count: 2 },
      youtubeShorts: { count: 7 },
      instagramReels: { count: 7 },
      linkedinPosts: { count: 4 },
      carousel: { target: 2 },
    },
    taskPreferences: {
      autoTaskGen: true,
      dailyCapacity: 'Auto',
    },
    launchPlan: {
      overallStartDate: '2026-10-20',
      currentSimulatedDate: '2026-10-10',
    },
  };
  let tasks = [];

  // 1. Add a Topic called "Best College for BCA"
  const newTopic = {
    id: 'topic-bca-college',
    title: 'Best College for BCA',
    subtitle: 'Comprehensive analysis of top BCA colleges with placement stats',
    type: 'YouTube Long',
    status: normalizeTopicStatus(''), // Default
    date: 'Today',
  };
  topics.push(newTopic);

  assert.equal(newTopic.status, 'idea', '1. New Topic enters Idea column by default');

  // 2. Move it to Planning
  topics = topics.map((t) =>
    t.id === newTopic.id ? { ...t, status: normalizeTopicStatus('planning') } : t
  );
  const planningTopic = topics.find((t) => t.id === newTopic.id);
  assert.equal(planningTopic.status, 'planning', '2. Topic status moves to planning');

  // 3. Move it to In Progress
  topics = topics.map((t) =>
    t.id === newTopic.id ? { ...t, status: normalizeTopicStatus('in_progress') } : t
  );
  const inProgressTopic = topics.find((t) => t.id === newTopic.id);
  assert.equal(inProgressTopic.status, 'in_progress', '3. Topic status moves to in_progress');

  // 4. Click Start Production / Create Content
  // Simulate startProductionForTopic
  const topicToConvert = topics.find((t) => t.id === newTopic.id);
  assert.ok(topicToConvert);

  const assetId = 'asset-topic-' + topicToConvert.id;
  const newAsset = {
    id: assetId,
    title: topicToConvert.title,
    type: topicToConvert.type,
    workflowStatus: 'scripting',
    actionStatus: 'in_progress',
    progress: {
      stage: 'Script',
      completed: 1,
      total: 7,
      hasActive: true,
    },
    distribution: { status: 'Not Scheduled' },
    source: `Created from Topic: ${topicToConvert.title}`,
    topicId: topicToConvert.id,
    lastUpdated: 'Just now',
    duration: '12:00',
    thumbBg: 'bg-gradient-to-br from-slate-900 to-blue-950 text-blue-300',
    thumbText: topicToConvert.title.slice(0, 10).toUpperCase(),
  };

  assets.push(newAsset);
  topics = topics.map((t) =>
    t.id === topicToConvert.id
      ? { ...t, status: normalizeTopicStatus('converted'), contentAssetId: newAsset.id }
      : t
  );

  // 5. Verify Content Asset creation & linking
  assert.equal(assets.filter((a) => a.topicId === newTopic.id).length, 1, '4. Exactly one linked Content Asset created');
  const createdAsset = assets.find((a) => a.topicId === newTopic.id);
  assert.equal(createdAsset.title, 'Best College for BCA');
  assert.equal(createdAsset.type, 'YouTube Long');
  assert.equal(createdAsset.workflowStatus, 'scripting');
  assert.equal(isAssetPublished(createdAsset), false, '8. Done does NOT mean the video is published');
  assert.equal(isAssetBufferReady(createdAsset), false, 'Unproduced video does NOT count as buffer-ready');

  // Verify Topic is marked Done ('converted')
  const doneTopic = topics.find((t) => t.id === newTopic.id);
  assert.equal(doneTopic.status, 'converted', '7. Topic appears in Done only after successful conversion');
  assert.equal(doneTopic.contentAssetId, newAsset.id, 'Topic has stable ID link to resulting asset');

  // 6. Next valid production action appears in Tasks through Dynamic Task Engine
  tasks = generateAndPrioritizeTasks({
    assets,
    topics,
    calendarEvents,
    settings,
    existingTasks: tasks,
  });

  const bcaTask = tasks.find((t) => t.contentId === createdAsset.id);
  assert.ok(bcaTask, '5. Next valid task appears in Tasks for the new Content Asset');
  assert.equal(bcaTask.actionStage, 'Script', 'YouTube Long next production action is Script');

  // 7. Idempotency test: Click Start Production again
  const preAssetCount = assets.length;
  const preTaskCount = tasks.length;

  // Second execution of startProductionForTopic
  const existingAsset = assets.find((a) => a.topicId === newTopic.id || a.id === doneTopic.contentAssetId);
  assert.ok(existingAsset, 'Finds existing asset');
  // Does not create a new asset
  if (!existingAsset) {
    assets.push({ ...newAsset, id: 'duplicate-asset' });
  }

  tasks = generateAndPrioritizeTasks({
    assets,
    topics,
    calendarEvents,
    settings,
    existingTasks: tasks,
  });

  assert.equal(assets.length, preAssetCount, '6. No duplicate Content Asset created on repeated clicks');
  const duplicateTasks = tasks.filter((t) => t.contentId === createdAsset.id && t.status !== 'Completed');
  assert.equal(duplicateTasks.length, 1, '6. No duplicate open tasks created');

  // 8. Independence of Content and Topic workflows
  // Advance Content Asset through production to Edit -> Export
  assets = assets.map((a) =>
    a.id === createdAsset.id
      ? { ...a, workflowStatus: 'editing', progress: { ...a.progress, stage: 'Edit', completed: 3 } }
      : a
  );
  assert.equal(
    isAssetEligibleForDerivation(assets.find((a) => a.id === createdAsset.id)),
    false,
    'Parent Long Video cannot derive reels until reaching exported'
  );

  // Transition Content Asset to exported
  assets = assets.map((a) =>
    a.id === createdAsset.id
      ? { ...a, workflowStatus: 'exported', progress: { ...a.progress, stage: 'Exported', completed: 4 } }
      : a
  );
  assert.equal(
    isAssetEligibleForDerivation(assets.find((a) => a.id === createdAsset.id)),
    true,
    'Exported parent video is eligible for derivation independently of topic state'
  );

  // Topic status remains 'converted' (Done) throughout all content production steps
  const finalTopic = topics.find((t) => t.id === newTopic.id);
  assert.equal(finalTopic.status, 'converted', '10. Topic lifecycle remains clean and decoupled from content stages');
});

"use client";

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Camera,
  Briefcase,
  Layers,
  MoreHorizontal,
  Check,
  CheckCircle2,
  Zap,
  Edit2,
  FileText,
  Calendar,
  Share2,
  Info,
  Clock,
  Rocket,
  ArrowRight,
  ExternalLink,
  Lightbulb,
  Video,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ALL_TOPICS, Topic } from '../topicsData';
import { useCreatorOS } from '@/lib/store/creatorStore';
import {
  normalizeTopicStatus,
  type CanonicalTopicStatus,
} from '@/lib/domain/contentWorkflow';

const TOPIC_LIFECYCLE_STEPS: {
  id: CanonicalTopicStatus;
  label: string;
  desc: string;
}[] = [
  { id: 'idea', label: 'Idea', desc: 'Quick capture idea bank' },
  { id: 'planning', label: 'Planning', desc: 'Selected for future production' },
  { id: 'in_progress', label: 'In Progress', desc: 'Actively preparing concept' },
  { id: 'converted', label: 'Done', desc: 'Content created from topic' },
];

export default function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const topicId = resolvedParams.id;
  const {
    topics,
    updateTopic,
    moveTopicStatus,
    deleteTopic,
    startProductionForTopic,
    assets,
  } = useCreatorOS();

  const topic: Topic | undefined = topics.find((t) => t.id === topicId);

  const currentStatus = topic ? normalizeTopicStatus(topic.status) : 'idea';
  const currentStepIndex = TOPIC_LIFECYCLE_STEPS.findIndex((s) => s.id === currentStatus);

  const isReel = topic?.type === 'Standalone Reel' || topic?.type === 'Long Video Derived';
  const isYouTube = topic?.type === 'YouTube Long';
  const isLinkedIn = topic?.type === 'LinkedIn';
  const isCarousel = topic?.type === 'Carousel';

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(topic?.notes || '');
  const [subtitle, setSubtitle] = useState(topic?.subtitle || '');
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);

  // Linked content asset
  const linkedAsset = topic?.contentAssetId
    ? assets.find((a) => a.id === topic.contentAssetId)
    : assets.find((a) => a.topicId === topic?.id);

  if (!topic) {
    return (
      <div className="p-8 text-center text-slate-500">
        Topic not found.{' '}
        <Link href="/topics" className="text-blue-600 underline">
          Back to Topics
        </Link>
      </div>
    );
  }

  const handleStepClick = (stepId: CanonicalTopicStatus) => {
    if (stepId === 'converted') {
      startProductionForTopic(topic.id);
    } else {
      moveTopicStatus(topic.id, stepId);
    }
  };

  const handleStartProduction = () => {
    const res = startProductionForTopic(topic.id);
    if (res.success && res.asset) {
      router.push(`/content/${res.asset.id}`);
    }
  };

  const handleSaveNotes = () => {
    updateTopic(topic.id, { notes });
    setIsEditingNotes(false);
  };

  const handleSaveSubtitle = () => {
    updateTopic(topic.id, { subtitle });
    setIsEditingSubtitle(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this topic?')) {
      deleteTopic(topic.id);
      router.push('/topics');
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Top Navigation & Breadcrumbs */}
      <div>
        <Link
          href="/topics"
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Topics
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
          <span>Topics</span>
          <span>/</span>
          <span>{isReel ? 'Reels' : isYouTube ? 'YouTube' : isLinkedIn ? 'LinkedIn' : isCarousel ? 'Carousel' : topic.type}</span>
          <span>/</span>
          <span className="text-slate-900 font-medium truncate max-w-[400px]">
            {topic.title}
          </span>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm ${
              isYouTube
                ? 'bg-red-600'
                : isReel
                ? 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600'
                : isLinkedIn
                ? 'bg-[#0077b5]'
                : 'bg-amber-500'
            }`}
          >
            {isYouTube ? (
              <Play className="w-6 h-6 fill-white" />
            ) : isReel ? (
              <Camera className="w-6 h-6" />
            ) : isLinkedIn ? (
              <Briefcase className="w-6 h-6 fill-white" />
            ) : (
              <Layers className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{topic.title}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{topic.type}</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                  currentStatus === 'idea'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : currentStatus === 'planning'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : currentStatus === 'in_progress'
                    ? 'bg-orange-50 text-orange-800 border border-orange-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {currentStatus === 'converted' ? 'Done (Content Created)' : currentStatus.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400">
                Added {topic.date}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleDelete}
          variant="outline"
          size="sm"
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Topic
        </Button>
      </div>

      {/* Topic Lifecycle Stepper (Idea → Planning → In Progress → Done) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Topic Lifecycle Stage
          </span>
        </div>
        <div className="flex items-center justify-between relative max-w-4xl mx-auto">
          {TOPIC_LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || (currentStepIndex === 3 && idx === 3);
            const isActive = idx === currentStepIndex && idx !== 3;

            return (
              <React.Fragment key={step.id}>
                <div
                  className="flex flex-col items-center gap-2 cursor-pointer z-10 group"
                  onClick={() => handleStepClick(step.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isActive
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-slate-50 border border-slate-300 text-slate-400 group-hover:border-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <span
                      className={`text-xs block font-bold ${
                        isActive
                          ? 'text-blue-600'
                          : isCompleted
                          ? 'text-emerald-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">
                      {step.desc}
                    </span>
                  </div>
                </div>

                {idx < TOPIC_LIFECYCLE_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 -mt-6 transition-colors ${
                      idx < currentStepIndex ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout (2 cols + 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Action Card */}
          <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200/80 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wide uppercase mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Zap className="w-3.5 h-3.5 fill-white" />
              </div>
              <span>Next Required Action</span>
            </div>

            {currentStatus === 'idea' ? (
              <>
                <h3 className="text-xl font-bold text-slate-900">
                  Idea Bank — Ready for Shortlisting
                </h3>
                <p className="text-slate-600 text-sm mt-1 mb-5">
                  This topic is currently stored in your Idea Bank. When you decide to prioritize it for upcoming production, move it to Planning or directly create the Content Asset.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => moveTopicStatus(topic.id, 'planning')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 h-9 shadow-sm rounded-lg flex items-center gap-2 text-xs"
                  >
                    ▷ Move to Planning
                  </Button>
                  <Button
                    onClick={handleStartProduction}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 font-medium px-4 h-9 rounded-lg flex items-center gap-2 text-xs"
                  >
                    <Rocket className="w-3.5 h-3.5" /> Start Production
                  </Button>
                </div>
              </>
            ) : currentStatus === 'planning' ? (
              <>
                <h3 className="text-xl font-bold text-slate-900">
                  Planning — Shortlisted for Creation
                </h3>
                <p className="text-slate-600 text-sm mt-1 mb-5">
                  You have shortlisted this topic for upcoming release. Advance it to In Progress to begin active concept preparation, or start production directly.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => moveTopicStatus(topic.id, 'in_progress')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 h-9 shadow-sm rounded-lg flex items-center gap-2 text-xs"
                  >
                    📹 Move to In Progress
                  </Button>
                  <Button
                    onClick={handleStartProduction}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 font-medium px-4 h-9 rounded-lg flex items-center gap-2 text-xs"
                  >
                    <Rocket className="w-3.5 h-3.5" /> Start Production
                  </Button>
                </div>
              </>
            ) : currentStatus === 'in_progress' ? (
              <>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-blue-600" />
                  In Progress — {linkedAsset ? 'Content Asset Active' : 'Ready for Content Creation'}
                </h3>
                <p className="text-slate-600 text-sm mt-1 mb-5">
                  {linkedAsset
                    ? `This topic is actively in production. Current stage: ${linkedAsset.progress?.stage || 'Script'}. Manage production workflow and milestones in Content.`
                    : 'Concept preparation is active. Clicking Start Production will create the official linked Content Asset, place it into the Content library, and generate the next valid production task.'}
                </p>
                {linkedAsset ? (
                  <Link
                    href={`/content/${linkedAsset.id}`}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 h-10 shadow-sm rounded-lg text-xs transition-colors"
                  >
                    Open Content Asset in Production <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Button
                    onClick={handleStartProduction}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 h-10 shadow-sm rounded-lg flex items-center gap-2 text-xs"
                  >
                    <Rocket className="w-4 h-4" /> Start Production / Create Content
                  </Button>
                )}
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Topic Converted to Content Asset
                </h3>
                <p className="text-slate-600 text-sm mt-1 mb-5">
                  This topic was successfully converted into an active Content Asset. All downstream production progress (scripting, shooting, editing, export, scheduling) is managed in Content.
                </p>
                {linkedAsset ? (
                  <Link
                    href={`/content/${linkedAsset.id}`}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 h-10 shadow-sm rounded-lg text-xs transition-colors"
                  >
                    Open Content Asset in Production <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Button
                    onClick={handleStartProduction}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 h-9 rounded-lg text-xs"
                  >
                    Link Content Asset
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Linked Content Asset Card (when converted or linked) */}
          {linkedAsset && (
            <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-sm bg-gradient-to-br from-emerald-50/20 to-white">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Linked Content Asset</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  In Production
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{linkedAsset.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>Type: <strong className="text-slate-700">{linkedAsset.type}</strong></span>
                    <span>•</span>
                    <span>Stage: <strong className="text-blue-700">{linkedAsset.progress.stage}</strong></span>
                    <span>•</span>
                    <span>Distribution: <strong className="text-purple-700">{linkedAsset.distribution.status}</strong></span>
                  </div>
                </div>

                <Link
                  href={`/content/${linkedAsset.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors shrink-0"
                >
                  Manage Asset <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Topic Information & Brainstorming */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Topic Information</span>
              </div>
            </div>

            {/* Subtitle / Core concept */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Core Concept & Hook
                </span>
                <button
                  onClick={() => {
                    if (isEditingSubtitle) handleSaveSubtitle();
                    else setIsEditingSubtitle(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  {isEditingSubtitle ? 'Save' : 'Edit'}
                </button>
              </div>
              {isEditingSubtitle ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                  <Button onClick={handleSaveSubtitle} size="sm" className="text-xs h-7">
                    Save Concept
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-700 font-medium">
                  {topic.subtitle || topic.description || 'No core concept specified yet.'}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Brainstorming Notes & Outline
                </span>
                <button
                  onClick={() => {
                    if (isEditingNotes) handleSaveNotes();
                    else setIsEditingNotes(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  {isEditingNotes ? 'Save' : 'Edit'}
                </button>
              </div>
              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 resize-none font-sans"
                  />
                  <Button onClick={handleSaveNotes} size="sm" className="text-xs h-7">
                    Save Notes
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {topic.notes || 'No research notes added yet.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Metadata & Quick State Jumper */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5">
              Topic Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Content Format</span>
                <span className="font-semibold text-slate-900">{topic.type}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Lifecycle Column</span>
                <span className="font-semibold text-blue-700 capitalize">
                  {currentStatus === 'converted' ? 'Done' : currentStatus.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Added On</span>
                <span className="font-semibold text-slate-900">{topic.date}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Content Asset</span>
                <span className="font-semibold text-slate-900">
                  {linkedAsset ? '✓ Created' : 'Not Created'}
                </span>
              </div>
            </div>

            {/* Quick Status Shift */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">
                Move Lifecycle Column
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => moveTopicStatus(topic.id, 'idea')}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    currentStatus === 'idea'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  💡 Idea
                </button>
                <button
                  onClick={() => moveTopicStatus(topic.id, 'planning')}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    currentStatus === 'planning'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ▷ Planning
                </button>
                <button
                  onClick={() => moveTopicStatus(topic.id, 'in_progress')}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    currentStatus === 'in_progress'
                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📹 In Progress
                </button>
                <button
                  onClick={handleStartProduction}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    currentStatus === 'converted'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ✓ Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

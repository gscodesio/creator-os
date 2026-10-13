"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Target,
  Settings,
  Send,
  CalendarDays,
  MoreVertical,
  Play,
  Video,
  Briefcase,
  MessageSquare,
  Pencil,
  Scissors,
  Video as Camera,
  LayoutTemplate,
  RotateCcw,
  Rocket,
  AlertCircle,
  Sparkles,
  Lightbulb,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreatorOS, formatDisplayDate } from '@/lib/store/creatorStore';
import { toast } from 'sonner';

export default function TasksPage() {
  const router = useRouter();
  const { tasks, startTask, completeTask, reopenTask, launchReadiness, settings } = useCreatorOS();
  const [activeTab, setActiveTab] = useState<'Today' | 'Upcoming' | 'Completed'>('Today');

  const todayTasks = tasks.filter((t) => t.status === 'Today');
  const upcomingTasks = tasks.filter((t) => t.status === 'Upcoming');
  const completedTasks = tasks.filter((t) => t.status === 'Completed');

  const urgentTasks = todayTasks.filter((t) => t.category === 'Urgent');
  const productionTasks = todayTasks.filter((t) => t.category === 'Production');
  const publishingTasks = todayTasks.filter((t) => t.category === 'Publishing');

  const highPriorityToday = todayTasks.filter((t) => t.priority === 'High').length;
  const prodToday = productionTasks.length;
  const pubToday = publishingTasks.length;

  const currentTabTasks =
    activeTab === 'Today'
      ? todayTasks
      : activeTab === 'Upcoming'
      ? upcomingTasks
      : completedTasks;


  const handleToggleTask = (taskId: string, isCompleted: boolean) => {
    if (isCompleted) {
      reopenTask(taskId);
      toast.success("Task reopened and returned to Today");
    } else {
      completeTask(taskId);
      toast.success("Task marked as completed! 🎉");
    }
  };

  const handleOpenContent = (contentId?: string) => {
    if (contentId) {
      router.push(`/content/${contentId}`);
    } else {
      router.push('/content');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {activeTab === 'Today' ? "Today's Tasks" : activeTab === 'Upcoming' ? 'Upcoming Tasks' : 'Completed Tasks'}
          </h1>
          <p className="text-slate-500 mt-1">
            {activeTab === 'Today'
              ? "Here's exactly what you need to do today."
              : activeTab === 'Upcoming'
              ? 'Plan ahead to maintain your rolling buffer target.'
              : 'Tasks and milestones successfully accomplished.'}
          </p>
        </div>
      </div>

      {/* ⚙️ Setup Required State */}
      {settings.isConfigured === false && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Set Up Your Creator OS</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Personalize your publishing goals, content buffer, launch schedule, and daily task capacity in Settings to get your content workflow ready.
          </p>
          <Button
            onClick={() => router.push('/settings')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 h-9 font-semibold rounded-lg"
          >
            Configure Your Settings
          </Button>
        </div>
      )}

      {/* 🚀 Pre-Launch Mode Banner */}
      {launchReadiness.isPreLaunch && settings.isConfigured !== false && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-300/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Pre-Launch Mode Active
                </span>
                <span className="text-xs font-bold text-slate-700">
                  Publishing Starts on {formatDisplayDate(launchReadiness.overallStartDate)} ({launchReadiness.daysUntilLaunch} Days Away)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Dates before {formatDisplayDate(launchReadiness.overallStartDate)} are not treated as overdue or missed. Today&apos;s tasks prioritize production actions (Script, Shoot, Edit, Export) to build your {settings.advanceBuffer.days}-day initial launch buffer.
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                <span className="font-semibold text-slate-700">
                  Buffer Readiness: <strong className="text-blue-700">{launchReadiness.readinessScore}%</strong> ({launchReadiness.totalUniqueReady}/{launchReadiness.totalUniqueRequired} unique assets ready)
                </span>
                {launchReadiness.missingSummary.length > 0 && (
                  <span className="text-amber-700 font-medium">
                    • Missing: {launchReadiness.missingSummary.slice(0, 3).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push("/settings/buffer")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
          >
            Launch Settings →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('Today')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'Today'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Today
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'Today' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {todayTasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('Upcoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'Upcoming'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Upcoming
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'Upcoming' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {upcomingTasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('Completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'Completed'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Completed
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'Completed' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {completedTasks.length}
          </span>
        </button>
      </div>

      {/* Metric Banner */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <div className="p-5 flex-1 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-lg">{todayTasks.length} tasks today</div>
            <div className="text-sm text-slate-500">Stay consistent. You&apos;ve got this!</div>
          </div>
        </div>

        <div className="p-5 flex-1 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-2xl leading-none">{highPriorityToday}</div>
            <div className="text-sm text-slate-500 mt-1">High Priority</div>
          </div>
        </div>

        <div className="p-5 flex-1 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-2xl leading-none">{prodToday}</div>
            <div className="text-sm text-slate-500 mt-1">Production</div>
          </div>
        </div>

        <div className="p-5 flex-1 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-2xl leading-none">{pubToday}</div>
            <div className="text-sm text-slate-500 mt-1">Publishing</div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-4">
        {currentTabTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
            No tasks found in this section.
          </div>
        ) : (
          currentTabTasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            return (
              <div
                key={task.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center hover:border-blue-300 transition-colors group"
              >
                {/* Interactive Checkbox */}
                <div
                  onClick={() => handleToggleTask(task.id, isCompleted)}
                  role="checkbox"
                  aria-checked={isCompleted}
                  className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'border-slate-300 bg-white hover:border-blue-500'
                  }`}
                >
                  {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                </div>

                {/* Content preview thumbnail */}
                <div className="w-32 h-16 bg-slate-900 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white text-center p-2 border border-slate-200 overflow-hidden leading-tight">
                  {task.contentTitle.slice(0, 24).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      {task.actionStage === 'Plan' || task.isPreparationTask ? (
                        <Lightbulb className="w-3 h-3 text-amber-600" />
                      ) : task.badge === 'Editing' ? (
                        <Scissors className="w-3 h-3" />
                      ) : task.badge === 'Shooting' ? (
                        <Camera className="w-3 h-3" />
                      ) : task.badge === 'Writing' ? (
                        <Pencil className="w-3 h-3" />
                      ) : (
                        <Target className="w-3 h-3" />
                      )}
                    </div>
                    <h3 className={`font-bold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 truncate ml-8">{task.contentTitle}</p>

                  <div className="flex flex-wrap items-center gap-2 mt-3 ml-8">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-semibold">
                      {task.type === 'YouTube Long' ? (
                        <Play className="w-3 h-3 text-red-600 fill-red-600" />
                      ) : task.type === 'Derived Reel' || task.type === 'Standalone Reel' ? (
                        <Camera className="w-3 h-3 text-pink-500" />
                      ) : task.type === 'LinkedIn' ? (
                        <Briefcase className="w-3 h-3 text-blue-600 fill-blue-600" />
                      ) : (
                        <LayoutTemplate className="w-3 h-3 text-amber-500" />
                      )}
                      <span>{task.type}</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        task.priority === 'High'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          task.priority === 'High'
                            ? 'bg-red-600'
                            : task.priority === 'Medium'
                            ? 'bg-amber-500'
                            : 'bg-slate-500'
                        }`}
                      />
                      {task.priority}
                    </div>

                    {task.dueNotice && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold">
                        <CalendarDays className="w-3 h-3" /> {task.dueNotice}
                      </div>
                    )}

                    {task.reason && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 ml-2">
                        <MessageSquare className="w-3.5 h-3.5" /> {task.reason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto mt-4 md:mt-0 w-full md:w-auto pl-8 md:pl-0">
                  {activeTab === 'Upcoming' && (
                    <Button
                      onClick={() => startTask(task.id)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      Start Today
                    </Button>
                  )}
                  {activeTab === 'Completed' && (
                    <Button
                      onClick={() => reopenTask(task.id)}
                      variant="outline"
                      size="sm"
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reopen
                    </Button>
                  )}
                  {task.isPreparationTask || task.actionStage === 'Plan' ? (
                    <Button
                      onClick={() => {
                        const q = new URLSearchParams({
                          new: 'true',
                          type: task.type,
                          ...(task.targetSubType ? { subType: task.targetSubType } : {}),
                        });
                        router.push(`/topics?${q.toString()}`);
                      }}
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Topic
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleOpenContent(task.contentId)}
                      variant="outline"
                      className="w-full md:w-auto border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      Open Content
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
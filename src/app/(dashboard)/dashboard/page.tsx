"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Info,
  Square,
  CheckSquare,
  Play as Youtube,
  Camera as Instagram,
  Briefcase as Linkedin,
  MonitorPlay,
  PlaySquare,
  BarChart,
  Video,
  ListTodo,
  CalendarDays,
  Plus,
  Play,
  PencilRuler,
  Check,
  ChevronDown,
  MoreHorizontal,
  Rocket,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useCreatorOS, formatDisplayDate } from "@/lib/store/creatorStore";
import { getEffectiveDate, parseDateString, formatDateString } from "@/lib/domain/dateUtils";

export default function DashboardPage() {
  const router = useRouter();
  const {
    tasks,
    completeTask,
    startTask,
    calendarEvents,
    assets,
    topics,
    settings,
    bufferStats,
    launchReadiness,
  } = useCreatorOS();

  const effectiveDate = React.useMemo(() => getEffectiveDate(settings), [settings]);
  const effectiveDateObj = React.useMemo(() => parseDateString(effectiveDate), [effectiveDate]);
  const monthYearLabel = React.useMemo(
    () => effectiveDateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [effectiveDateObj]
  );

  const weekStrip = React.useMemo(() => {
    const dayOfWeek = effectiveDateObj.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const days: Array<{ dayNum: number; fullDate: string; isToday: boolean }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(effectiveDateObj);
      d.setDate(effectiveDateObj.getDate() + mondayOffset + i);
      const fullDate = formatDateString(d);
      days.push({
        dayNum: d.getDate(),
        fullDate,
        isToday: fullDate === effectiveDate,
      });
    }
    return days;
  }, [effectiveDate, effectiveDateObj]);

  const todayTasks = tasks.filter((t) => t.status === "Today");
  const upcomingEvents = calendarEvents.slice(0, 7);
  const recentAssets = assets.slice(0, 5);
  const recentTopics = topics.slice(0, 3);

  // Quotas shorthand
  const q = bufferStats.quotas;
  const ytLongPct = settings.isConfigured ? Math.min(100, Math.round((q.youtubeLong.ready / Math.max(1, q.youtubeLong.target)) * 100)) : 0;
  const ytShortsPct = settings.isConfigured ? Math.min(100, Math.round((q.youtubeShorts.ready / Math.max(1, q.youtubeShorts.target)) * 100)) : 0;
  const igPct = settings.isConfigured ? Math.min(100, Math.round((q.instagramReels.ready / Math.max(1, q.instagramReels.target)) * 100)) : 0;
  const liPct = settings.isConfigured ? Math.min(100, Math.round((q.linkedin.ready / Math.max(1, q.linkedin.target)) * 100)) : 0;
  const carPct = settings.isConfigured ? Math.min(100, Math.round((q.carousel.ready / Math.max(1, q.carousel.target)) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* ⚙️ First-Time Setup  State */}
      {settings.isConfigured === false && (
        <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-blue-800/50">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                FIRST-TIME SETUP
              </span>
              <span className="text-sm font-bold text-white">Set Up Your Creator OS</span>
            </div>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Personalize your publishing goals, content buffer, launch schedule, and daily task capacity to get your content workflow ready.
            </p>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors shrink-0 flex items-center gap-2"
          >
            Configure Your Settings →
          </Link>
        </div>
      )}

      {/* 🚀 Pre-Launch Mode Banner */}
      {launchReadiness.isPreLaunch && settings.isConfigured !== false && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-300/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Pre-Launch Preparation Mode
                </span>
                <span className="text-xs font-bold text-slate-700">
                  Launching on {formatDisplayDate(launchReadiness.overallStartDate)} ({launchReadiness.daysUntilLaunch} Days Remaining)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Publishing dates prior to {formatDisplayDate(launchReadiness.overallStartDate)} are not treated as overdue. Focus on producing required content to fulfill your {settings.advanceBuffer.days}-day initial launch buffer.
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                <span className="font-semibold text-slate-700">
                  Buffer Readiness: <strong className="text-blue-700">{launchReadiness.readinessScore}%</strong> ({launchReadiness.totalUniqueReady}/{launchReadiness.totalUniqueRequired} unique assets ready)
                </span>
                {launchReadiness.missingSummary.length > 0 && (
                  <span className="text-amber-700 font-medium">
                    • Missing: {launchReadiness.missingSummary.slice(0, 2).join(", ")}{launchReadiness.missingSummary.length > 2 ? ` +${launchReadiness.missingSummary.length - 2} more` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/settings/buffer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
          >
            Manage Launch Plan →
          </Link>
        </div>
      )}

      {/* Header & Buffer Overview */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Good Morning! 👋</h1>
          <p className="text-slate-500 mt-1">Here&apos;s your content overview and today&apos;s tasks.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Advance Buffer Card */}
          <Link
            href="/settings/buffer"
            className="bg-slate-100/60 hover:bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-col min-w-[200px] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium text-sm">
                Advance Buffer <Info className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-semibold text-slate-800">
                {settings.isConfigured ? `${settings.advanceBuffer.days} days` : "Not set"} <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-auto">{settings.isConfigured ? bufferStats.windowLabel : "Configure settings to set buffer"}</p>
          </Link>

          {/* Buffer Health / Launch Readiness Card */}
          <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col min-w-[200px] relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 font-medium text-sm z-10">
                {!settings.isConfigured ? "Buffer Status" : launchReadiness.isPreLaunch ? "Launch Readiness" : "Buffer Health"}
              </span>
              <BarChart className="h-4 w-4 text-green-500 z-10" />
            </div>
            <div className="flex items-center gap-2 mb-1 mt-auto">
              <div
                className={`h-2 w-2 rounded-full ${
                  !settings.isConfigured
                    ? "bg-slate-400"
                    : launchReadiness.isPreLaunch
                    ? launchReadiness.readinessScore >= 100
                      ? "bg-green-500"
                      : "bg-amber-500"
                    : bufferStats.healthStatus === "Healthy"
                    ? "bg-green-500"
                    : bufferStats.healthStatus === "Production Needed"
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
              />
              <span
                className={`font-bold ${
                  !settings.isConfigured
                    ? "text-slate-600"
                    : launchReadiness.isPreLaunch
                    ? launchReadiness.readinessScore >= 100
                      ? "text-green-600"
                      : "text-amber-600"
                    : bufferStats.healthStatus === "Healthy"
                    ? "text-green-600"
                    : bufferStats.healthStatus === "Production Needed"
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {!settings.isConfigured
                  ? "Setup Required"
                  : launchReadiness.isPreLaunch
                  ? `${launchReadiness.readinessScore}% Buffer Ready`
                  : bufferStats.healthStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 z-10">
              {!settings.isConfigured
                ? "Configure Settings to enable tracking"
                : launchReadiness.isPreLaunch
                ? `${launchReadiness.daysUntilLaunch} days to publishing launch`
                : `You're ${bufferStats.aheadDays} days ahead`}
            </p>
            {/* Decorative Sparkline */}
            <div className="absolute right-4 bottom-2 flex items-end gap-1 opacity-20">
              <div className="w-1.5 h-3 bg-green-600 rounded-sm"></div>
              <div className="w-1.5 h-5 bg-green-600 rounded-sm"></div>
              <div className="w-1.5 h-4 bg-green-600 rounded-sm"></div>
              <div className="w-1.5 h-7 bg-green-600 rounded-sm"></div>
              <div className="w-1.5 h-6 bg-green-600 rounded-sm"></div>
              <div className="w-1.5 h-9 bg-green-600 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Metric & Progress Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* YouTube */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500 fill-red-500" />
              <span className="font-semibold text-slate-800 text-sm">YouTube</span>
            </div>
            <Link href="/settings/frequency" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Settings
            </Link>
          </div>

          <div className="space-y-3 mt-auto">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600">Long Videos</span>
                <span className="font-medium text-slate-900">
                  {settings.isConfigured ? `${q.youtubeLong.ready} / ${q.youtubeLong.target}` : "— / —"}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${ytLongPct}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600">Shorts</span>
                <span className="font-medium text-slate-900">
                  {settings.isConfigured ? `${q.youtubeShorts.ready} / ${q.youtubeShorts.target}` : "— / —"}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${ytShortsPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Instagram */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              <span className="font-semibold text-slate-800 text-sm">Instagram</span>
            </div>
            <Link href="/settings/frequency" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Settings
            </Link>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-600">Reels</span>
              <span className="font-medium text-slate-900">
                {settings.isConfigured ? `${q.instagramReels.ready} / ${q.instagramReels.target}` : "— / —"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full flex overflow-hidden mb-3">
              <div className="h-full bg-purple-500" style={{ width: `${igPct}%` }}></div>
            </div>
            <div className="flex flex-col gap-1 text-[10px] text-slate-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>From Long Videos
                </div>
                <span className="font-medium">
                  {settings.isConfigured ? `${launchReadiness.breakdown.derivedReels.ready} / ${launchReadiness.breakdown.derivedReels.required}` : "— / —"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-300"></div>Standalone Reels
                </div>
                <span className="font-medium">
                  {settings.isConfigured ? `${launchReadiness.breakdown.standaloneReels.ready} / ${launchReadiness.breakdown.standaloneReels.required}` : "— / —"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LinkedIn */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-blue-600 fill-blue-600" />
              <span className="font-semibold text-slate-800 text-sm">LinkedIn</span>
            </div>
            <Link href="/settings/frequency" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Settings
            </Link>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-600">Posts</span>
              <span className="font-medium text-slate-900">
                {settings.isConfigured ? `${q.linkedin.ready} / ${q.linkedin.target}` : "— / —"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full flex overflow-hidden mb-3">
              <div className="h-full bg-blue-500" style={{ width: `${liPct}%` }}></div>
            </div>
            <div className="flex flex-col gap-1 text-[10px] text-slate-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>Informative
                </div>
                <span className="font-medium">
                  {settings.isConfigured ? `${q.linkedin.informativeReady} / ${launchReadiness.breakdown.linkedinInformative.required}` : "— / —"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>Video Related
                </div>
                <span className="font-medium">
                  {settings.isConfigured ? `${q.linkedin.videoRelatedReady} / ${launchReadiness.breakdown.linkedinVideoRelated.required}` : "— / —"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MonitorPlay className="h-5 w-5 text-orange-500 fill-orange-500" />
              <span className="font-semibold text-slate-800 text-sm">Carousel</span>
            </div>
            <Link href="/settings/frequency" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Settings
            </Link>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-600">Carousels</span>
              <span className="font-medium text-slate-900">
                {settings.isConfigured ? `${q.carousel.ready} / ${q.carousel.target}` : "— / —"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${carPct}%` }}></div>
            </div>
            <div className="text-[10px] text-slate-500">Monthly Target Buffer</div>
          </div>
        </div>

        {/* Content Buffer Breakdown */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-medium text-xs text-slate-700 mb-3">
            Content Buffer {settings.isConfigured ? `(${settings.advanceBuffer.days} Days)` : "(Unconfigured)"}
          </h3>
          <div className="space-y-2 mt-auto">
            <div className="grid grid-cols-[80px_1fr_30px] items-center gap-2 text-[10px]">
              <span className="text-slate-600 flex items-center gap-1 truncate">
                <Youtube className="h-3 w-3 text-red-500 fill-red-500" /> YT Long
              </span>
              <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                <div className="h-full bg-green-500" style={{ width: `${ytLongPct}%` }}></div>
              </div>
              <span className="text-right font-medium">
                {settings.isConfigured ? `${q.youtubeLong.ready}/${q.youtubeLong.target}` : "—/—"}
              </span>
            </div>
            <div className="grid grid-cols-[80px_1fr_30px] items-center gap-2 text-[10px]">
              <span className="text-slate-600 flex items-center gap-1 truncate">
                <Youtube className="h-3 w-3 text-red-500 fill-red-500" /> Shorts
              </span>
              <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                <div className="h-full bg-yellow-400" style={{ width: `${ytShortsPct}%` }}></div>
              </div>
              <span className="text-right font-medium">
                {settings.isConfigured ? `${q.youtubeShorts.ready}/${q.youtubeShorts.target}` : "—/—"}
              </span>
            </div>
            <div className="grid grid-cols-[80px_1fr_30px] items-center gap-2 text-[10px]">
              <span className="text-slate-600 flex items-center gap-1 truncate">
                <Instagram className="h-3 w-3 text-pink-500" /> Reels
              </span>
              <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                <div className="h-full bg-purple-500" style={{ width: `${igPct}%` }}></div>
              </div>
              <span className="text-right font-medium">
                {settings.isConfigured ? `${q.instagramReels.ready}/${q.instagramReels.target}` : "—/—"}
              </span>
            </div>
            <div className="grid grid-cols-[80px_1fr_30px] items-center gap-2 text-[10px]">
              <span className="text-slate-600 flex items-center gap-1 truncate">
                <Linkedin className="h-3 w-3 text-blue-500 fill-blue-500" /> LinkedIn
              </span>
              <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                <div className="h-full bg-cyan-500" style={{ width: `${liPct}%` }}></div>
              </div>
              <span className="text-right font-medium">
                {settings.isConfigured ? `${q.linkedin.ready}/${q.linkedin.target}` : "—/—"}
              </span>
            </div>
            <div className="grid grid-cols-[80px_1fr_30px] items-center gap-2 text-[10px]">
              <span className="text-slate-600 flex items-center gap-1 truncate">
                <MonitorPlay className="h-3 w-3 text-orange-500 fill-orange-500" /> Carousels
              </span>
              <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                <div className="h-full bg-orange-500" style={{ width: `${carPct}%` }}></div>
              </div>
              <span className="text-right font-medium">
                {settings.isConfigured ? `${q.carousel.ready}/${q.carousel.target}` : "—/—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Tasks, Schedule, Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-800">Today&apos;s Tasks</h2>
              <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {todayTasks.length} tasks
              </span>
            </div>
            <Link href="/tasks" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[360px]">
            {todayTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">All tasks completed today! 🎉</div>
            ) : (
              todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 flex gap-3 hover:bg-slate-50 transition-colors group cursor-pointer"
                  onClick={() => router.push(task.contentId ? `/content/${task.contentId}` : "/tasks")}
                >
                  <div
                    className="mt-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      completeTask(task.id);
                    }}
                  >
                    <Square className="h-5 w-5 text-slate-300 hover:text-blue-600 cursor-pointer rounded" />
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-start gap-2">
                      <p className="font-medium text-slate-900 text-sm truncate pt-0.5">{task.title}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded flex-shrink-0 ${task.color}`}>
                        {task.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">{task.reason}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startTask(task.id);
                        if (task.contentId) router.push(`/content/${task.contentId}`);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded shadow-sm"
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Upcoming Schedule</h2>
            <Link href="/calendar" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View Calendar
            </Link>
          </div>
          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[360px] p-2">
            {upcomingEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No scheduled content yet. Schedule content from Content or Calendar.
              </div>
            ) : (
              upcomingEvents.map((item, i) => (
                <div
                  key={i}
                  onClick={() => router.push(`/content/${item.contentId}`)}
                  className="px-3 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors rounded-lg cursor-pointer"
                >
                  <div className="w-10 flex-shrink-0 flex flex-col items-center">
                    <span className="text-lg font-bold text-slate-800 leading-none">{item.date}</span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Oct</span>
                  </div>
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                      item.type === "youtube"
                        ? "bg-red-500"
                        : item.type === "instagram"
                        ? "bg-pink-500"
                        : item.type === "linkedin"
                        ? "bg-blue-600"
                        : "bg-orange-500"
                    }`}
                  >
                    {item.type === "youtube" ? (
                      <Youtube className="h-4 w-4 text-white fill-white" />
                    ) : item.type === "instagram" ? (
                      <Instagram className="h-4 w-4 text-white" />
                    ) : item.type === "linkedin" ? (
                      <Linkedin className="h-4 w-4 text-white fill-white" />
                    ) : (
                      <MonitorPlay className="h-4 w-4 text-white fill-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-600 capitalize">{item.type}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">&bull; {item.time}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full shadow-sm">
                    Scheduled
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calendar Preview Widget */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/calendar" className="font-semibold text-slate-800 text-sm hover:text-blue-600">
              {monthYearLabel} &gt;
            </Link>
            <Link
              href="/calendar"
              className="text-[10px] font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-800"
            >
              Open Grid
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <div key={i} className="text-[10px] font-medium text-slate-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center text-sm">
            {weekStrip.map(({ dayNum, fullDate, isToday }) => {
              const dayEvts = calendarEvents.filter(
                (e) => (e.fullDateStr && e.fullDateStr === fullDate) || (!e.fullDateStr && e.date === dayNum)
              );
              return (
                <div key={fullDate} className="p-1 relative flex flex-col items-center">
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full font-medium text-xs ${
                      isToday
                        ? "bg-blue-600 text-white shadow-sm font-semibold"
                        : "text-slate-700"
                    }`}
                  >
                    {dayNum}
                  </span>
                  <div className="flex gap-0.5 mt-0.5 min-h-[6px]">
                    {dayEvts.slice(0, 3).map((e, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          e.type === "youtube"
                            ? "bg-red-500"
                            : e.type === "instagram"
                            ? "bg-pink-500"
                            : e.type === "linkedin"
                            ? "bg-blue-600"
                            : "bg-orange-500"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-[10px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> YouTube
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-pink-500"></div> Instagram
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div> LinkedIn
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div> Carousel
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Content Pipeline & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        {/* Content Pipeline */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="font-semibold text-slate-800">Content Pipeline</h2>
                <span className="text-xs text-slate-500 font-medium">({assets.length} Assets)</span>
              </div>
              <Link
                href="/content"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Content
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3 border-b border-slate-100">Title</th>
                  <th className="px-4 py-3 border-b border-slate-100">Type</th>
                  <th className="px-4 py-3 border-b border-slate-100">Stage</th>
                  <th className="px-4 py-3 border-b border-slate-100">Distribution</th>
                  <th className="px-4 py-3 border-b border-slate-100">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentAssets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-500">
                      No content assets in pipeline yet. Click &quot;Add Content&quot; or start production on a topic.
                    </td>
                  </tr>
                ) : (
                  recentAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => router.push(`/content/${asset.id}`)}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-10 rounded overflow-hidden flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${asset.thumbBg}`}
                          >
                            {asset.thumbText}
                          </div>
                          <span className="font-medium text-slate-900 max-w-[200px] truncate group-hover:text-blue-600 transition-colors">
                            {asset.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-700">
                        {asset.type}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {asset.progress.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {asset.distribution.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{asset.lastUpdated}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Actions & Topics */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4 text-sm">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              <Link
                href="/topics"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#EFF6FF] hover:bg-blue-100 text-blue-700 transition-colors border border-blue-100/50 text-center gap-2"
              >
                <Plus className="h-5 w-5" />
                <span className="text-[11px] font-medium leading-tight">
                  Add
                  <br />
                  Topic
                </span>
              </Link>
              <Link
                href="/content"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#FEF2F2] hover:bg-red-100 text-red-700 transition-colors border border-red-100/50 text-center gap-2"
              >
                <Youtube className="h-5 w-5" />
                <span className="text-[11px] font-medium leading-tight">
                  New
                  <br />
                  Long Video
                </span>
              </Link>
              <Link
                href="/content"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#FDF4FF] hover:bg-fuchsia-100 text-fuchsia-700 transition-colors border border-fuchsia-100/50 text-center gap-2"
              >
                <Instagram className="h-5 w-5" />
                <span className="text-[11px] font-medium leading-tight">
                  New
                  <br />
                  Reel
                </span>
              </Link>
              <Link
                href="/content"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F0F9FF] hover:bg-sky-100 text-sky-700 transition-colors border border-sky-100/50 text-center gap-2"
              >
                <Linkedin className="h-5 w-5" />
                <span className="text-[11px] font-medium leading-tight">
                  New
                  <br />
                  LinkedIn
                </span>
              </Link>
              <Link
                href="/content"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#FFF7ED] hover:bg-orange-100 text-orange-700 transition-colors border border-orange-100/50 text-center gap-2"
              >
                <MonitorPlay className="h-5 w-5" />
                <span className="text-[11px] font-medium leading-tight">
                  New
                  <br />
                  Carousel
                </span>
              </Link>
              <Link
                href="/calendar"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F3E8FF] hover:bg-purple-100 text-purple-700 transition-colors border border-purple-100/50 text-center gap-2"
              >
                <CalendarDays className="h-5 w-5" />
                <span className="text-[11px] font-medium leading-tight">
                  Schedule
                  <br />
                  Content
                </span>
              </Link>
            </div>
          </div>

          {/* Recent Topics */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-sm">Recent Topics</h2>
              <Link href="/topics" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentTopics.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No topics captured yet. Click &quot;Add Topic&quot; to begin.
                </div>
              ) : (
                recentTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.id}`}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                      <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400 border border-slate-200">
                        <Info className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {topic.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {topic.status}
                          </span>
                          <span className="text-xs text-slate-400">{topic.date}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 -rotate-90" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

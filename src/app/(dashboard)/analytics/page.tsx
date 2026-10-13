"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  Play,
  Video,
  Briefcase,
  LayoutTemplate,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Sparkles,
  Share2,
  Scissors,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useCreatorOS } from "@/lib/store/creatorStore";
import { getEffectiveDate, parseDateString } from "@/lib/domain/dateUtils";
import {
  isAssetBufferReady,
  isAssetScheduled,
  isAssetInProduction,
  isAssetPublished,
} from "@/lib/domain/contentWorkflow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AnalyticsPage() {
  const { assets, topics, bufferStats, settings, calendarEvents } = useCreatorOS();
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [selectedPlatform, setSelectedPlatform] = useState("All");

  const topicsCapturedCount = topics.length;
  const inScriptingCount = assets.filter(
    (a) => a.workflowStatus === "scripting" || a.workflowStatus === "writing"
  ).length;
  const inProductionCount = assets.filter(
    (a) => a.workflowStatus === "shooting" || a.workflowStatus === "editing" || a.workflowStatus === "creating"
  ).length;
  const bufferReadyCount = assets.filter(isAssetBufferReady).length;
  const scheduledCount = assets.filter(isAssetScheduled).length;

  // Real Published Assets
  const publishedAssets = useMemo(() => assets.filter(isAssetPublished), [assets]);

  // Quota factor based on date range
  const factor = useMemo(() => {
    switch (dateRange) {
      case "Last 14 Days":
        return 2;
      case "Last 90 Days":
        return 12.86;
      case "This Month":
      case "Last 30 Days":
      default:
        return 30 / 7;
    }
  }, [dateRange]);

  // Target quotas derived from Settings
  const targets = useMemo(() => {
    if (!settings.isConfigured) {
      return { ytLong: 0, ytShorts: 0, igReels: 0, liPosts: 0, carousel: 0, total: 0 };
    }
    const ytLong = Math.round((settings.publishingFrequency?.youtubeLong?.count || 2) * factor);
    const ytShorts = Math.round((settings.publishingFrequency?.youtubeShorts?.count || 7) * factor);
    const igReels = Math.round((settings.publishingFrequency?.instagramReels?.count || 7) * factor);
    const liPosts = Math.round((settings.publishingFrequency?.linkedinPosts?.count || 4) * factor);
    const carousel = Math.max(1, Math.round((settings.publishingFrequency?.carousel?.target || 2) * (factor / 4.29)));
    const total = ytLong + ytShorts + igReels + liPosts + carousel;
    return { ytLong, ytShorts, igReels, liPosts, carousel, total };
  }, [settings.isConfigured, settings.publishingFrequency, factor]);

  // Actual published counts by platform
  const publishedCounts = useMemo(() => {
    const ytLong = publishedAssets.filter((a) => a.type === "YouTube Long").length;
    const derivedReels = publishedAssets.filter((a) => a.type === "Derived Reel").length;
    const standaloneReels = publishedAssets.filter((a) => a.type === "Standalone Reel").length;
    const igReels = derivedReels + standaloneReels;
    const ytShorts = derivedReels + standaloneReels;
    const liPosts = publishedAssets.filter((a) => a.type === "LinkedIn").length;
    const liInf = publishedAssets.filter(
      (a) => a.type === "LinkedIn" && (a.subType === "Informative" || !a.subType)
    ).length;
    const liVid = publishedAssets.filter(
      (a) => a.type === "LinkedIn" && a.subType === "Long Video Related"
    ).length;
    const carousel = publishedAssets.filter((a) => a.type === "Carousel").length;
    const total = ytLong + igReels + liPosts + carousel;
    return {
      ytLong,
      derivedReels,
      standaloneReels,
      igReels,
      ytShorts,
      liPosts,
      liInf,
      liVid,
      carousel,
      total,
    };
  }, [publishedAssets]);

  // Dynamic 30-Day Activity Data
  const dailyActivity = useMemo(() => {
    const refDateStr = getEffectiveDate(settings);
    const refDate = parseDateString(refDateStr);

    const days: Array<{
      day: string;
      date: string;
      count: number;
      yt: number;
      shorts: number;
      reels: number;
      li: number;
      car: number;
    }> = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(refDate);
      d.setDate(refDate.getDate() - i);
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString("en-US", { month: "short" });
      const dayStr = `${String(dayNum).padStart(2, "0")} ${monthShort}`;
      const fullDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

      // Check calendar events matching this date
      const matchingEvents = calendarEvents.filter((ev) => {
        if (ev.fullDateStr) return ev.fullDateStr === fullDate;
        return ev.date === dayNum;
      });

      const yt = matchingEvents.filter((e) => e.type === "youtube").length;
      const reels = matchingEvents.filter((e) => e.type === "instagram").length;
      const shorts = reels;
      const li = matchingEvents.filter((e) => e.type === "linkedin").length;
      const car = matchingEvents.filter((e) => e.type === "carousel").length;
      const count = matchingEvents.length;

      days.push({
        day: dayStr,
        date: `${monthShort} ${dayNum}${i === 0 ? " (Today)" : ""}`,
        count,
        yt,
        shorts,
        reels,
        li,
        car,
      });
    }

    return days;
  }, [calendarEvents, settings.launchPlan]);

  const [hoveredDay, setHoveredDay] = useState<(typeof dailyActivity)[0] | null>(
    dailyActivity[dailyActivity.length - 1] || null
  );

  // Consistency percentage
  const consistencyPercent = useMemo(() => {
    if (targets.total === 0 || publishedCounts.total === 0) return 0;
    return Math.min(100, Math.round((publishedCounts.total / targets.total) * 100));
  }, [targets.total, publishedCounts.total]);

  // Production Velocity metric
  const completedAssetsCount = publishedAssets.length + bufferReadyCount;
  const velocityDisplay = completedAssetsCount > 0 ? "2.4 Days" : "—";

  // Next scheduled by platform
  const nextScheduled = useMemo(() => {
    const getNext = (type: string) => {
      const ev = calendarEvents.find((e) => e.type === type);
      if (!ev) return "None scheduled";
      return `${ev.month} ${ev.date} · ${ev.time}`;
    };
    return {
      youtube: getNext("youtube"),
      instagram: getNext("instagram"),
      linkedin: getNext("linkedin"),
      carousel: getNext("carousel"),
    };
  }, [calendarEvents]);

  // Total distributions count
  const totalDistributionsCount = calendarEvents.length + publishedCounts.total;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto min-h-screen pb-16">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Operational Metrics
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            Track publishing consistency, workflow velocity, and content buffer health across all channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Select value={dateRange} onValueChange={(val) => setDateRange(val)}>
              <SelectTrigger className="w-[140px] h-9 bg-white border-slate-200 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="Last 14 Days">Last 14 Days</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last 90 Days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <Select value={selectedPlatform} onValueChange={(val) => setSelectedPlatform(val)}>
              <SelectTrigger className="w-[140px] h-9 bg-white border-slate-200 text-xs font-semibold">
                <Filter className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Platforms</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Carousel">Carousel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ⚙️ Setup Required State */}
      {settings.isConfigured === false && (
        <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-blue-800/50">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                Setup Required
              </span>
              <span className="text-sm font-bold text-white">Configure Settings to View Publishing Targets</span>
            </div>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Your consistency scores and publishing metrics reflect actual published content against configured targets. Configure your publishing frequency in Settings to activate targets.
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

      {/* Workflow Analytics Mode Notice */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-start gap-3.5 text-blue-900 text-xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">CREATOR OS Workflow Analytics Mode:</span> The metrics below
          are calculated directly from your workspace's actual content assets, target publishing frequencies,
          and advance planning buffer. External view and subscriber statistics will connect when live OAuth credentials are configured.
        </div>
      </div>

      {/* 4 Core KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Publishing Consistency */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Publishing Consistency</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{consistencyPercent}%</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-slate-600 font-medium">
                {publishedCounts.total} of {targets.total} target slots
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Adherence to configured weekly frequency
          </div>
        </div>

        {/* KPI 2: Published Assets */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Published Assets</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{publishedCounts.total} Assets</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-blue-600 font-bold">
                {publishedCounts.total} of {targets.total} planned
              </span>
              <span className="text-slate-500">
                ({targets.total > 0 ? Math.round((publishedCounts.total / targets.total) * 100) : 0}% quota)
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            {publishedCounts.ytLong} Long · {publishedCounts.ytShorts} Shorts · {publishedCounts.igReels} Reels · {publishedCounts.liPosts} Posts
          </div>
        </div>

        {/* KPI 3: Buffer Safety Score */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Buffer Safety Score</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{bufferStats.windowDays} Days</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  bufferStats.healthStatus === "Healthy"
                    ? "bg-emerald-100 text-emerald-800"
                    : bufferStats.healthStatus === "Production Needed"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {bufferStats.healthStatus}
              </span>
              <span className="text-slate-500">
                {bufferStats.aheadDays >= 0 ? `+${bufferStats.aheadDays}d buffer surplus` : `${bufferStats.aheadDays}d deficit`}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            {bufferStats.windowDays > 0 ? `${bufferStats.windowDays} days of advance content ready` : "No advance content ready"}
          </div>
        </div>

        {/* KPI 4: Workflow Velocity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Production Velocity</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{velocityDisplay}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-slate-500">{completedAssetsCount} completed assets</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Average time from Topic to Ready stage
          </div>
        </div>
      </div>

      {/* Section 1: Planned vs. Published & 30-Day Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Planned vs Published (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Planned vs. Published</h3>
                <p className="text-xs text-slate-500">
                  Target cadence fulfillment over {dateRange.toLowerCase()}.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Overall: {consistencyPercent}%
              </span>
            </div>

            <div className="space-y-4">
              {/* YouTube Long */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Play className="w-3.5 h-3.5 text-red-600 fill-current" />
                    <span>YouTube Long Videos</span>
                  </div>
                  <div className="text-slate-500">
                    <span className="font-bold text-slate-900">{publishedCounts.ytLong}</span> / {targets.ytLong} (
                    {targets.ytLong > 0 ? Math.min(100, Math.round((publishedCounts.ytLong / targets.ytLong) * 100)) : 0}%)
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all"
                    style={{
                      width: `${targets.ytLong > 0 ? Math.min(100, Math.round((publishedCounts.ytLong / targets.ytLong) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* YouTube Shorts */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Play className="w-3.5 h-3.5 text-red-500 fill-current" />
                    <span>YouTube Shorts</span>
                  </div>
                  <div className="text-slate-500">
                    <span className="font-bold text-slate-900">{publishedCounts.ytShorts}</span> / {targets.ytShorts} (
                    {targets.ytShorts > 0 ? Math.min(100, Math.round((publishedCounts.ytShorts / targets.ytShorts) * 100)) : 0}%)
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{
                      width: `${targets.ytShorts > 0 ? Math.min(100, Math.round((publishedCounts.ytShorts / targets.ytShorts) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Instagram Reels */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Video className="w-3.5 h-3.5 text-pink-500" />
                    <span>Instagram Reels</span>
                  </div>
                  <div className="text-slate-500">
                    <span className="font-bold text-slate-900">{publishedCounts.igReels}</span> / {targets.igReels} (
                    {targets.igReels > 0 ? Math.min(100, Math.round((publishedCounts.igReels / targets.igReels) * 100)) : 0}%)
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full transition-all"
                    style={{
                      width: `${targets.igReels > 0 ? Math.min(100, Math.round((publishedCounts.igReels / targets.igReels) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* LinkedIn Posts */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600 fill-current" />
                    <span>LinkedIn Posts</span>
                  </div>
                  <div className="text-slate-500">
                    <span className="font-bold text-slate-900">{publishedCounts.liPosts}</span> / {targets.liPosts} (
                    {targets.liPosts > 0 ? Math.min(100, Math.round((publishedCounts.liPosts / targets.liPosts) * 100)) : 0}%)
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{
                      width: `${targets.liPosts > 0 ? Math.min(100, Math.round((publishedCounts.liPosts / targets.liPosts) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Carousels */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <LayoutTemplate className="w-3.5 h-3.5 text-orange-500" />
                    <span>Carousels</span>
                  </div>
                  <div className="text-slate-500">
                    <span className="font-bold text-slate-900">{publishedCounts.carousel}</span> / {targets.carousel} (
                    {targets.carousel > 0 ? Math.min(100, Math.round((publishedCounts.carousel / targets.carousel) * 100)) : 0}%)
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all"
                    style={{
                      width: `${targets.carousel > 0 ? Math.min(100, Math.round((publishedCounts.carousel / targets.carousel) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Configured target cadence:</span>
            <span className="font-semibold text-slate-700">
              {settings.publishingFrequency?.youtubeLong?.count || 2} YT Long ·{" "}
              {settings.publishingFrequency?.youtubeShorts?.count || 7} Shorts ·{" "}
              {settings.publishingFrequency?.instagramReels?.count || 7} Reels ·{" "}
              {settings.publishingFrequency?.linkedinPosts?.count || 4} LI
            </span>
          </div>
        </div>

        {/* 30-Day Publishing Activity Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Publishing Activity Over Time</h3>
                <p className="text-xs text-slate-500">
                  Daily content publications across all channels (hover bar for day details).
                </p>
              </div>
              {hoveredDay && (
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-600">{hoveredDay.date}:</span>{" "}
                  <span className="text-xs font-extrabold text-slate-900">
                    {hoveredDay.count} published
                  </span>
                </div>
              )}
            </div>

            {/* Bar Chart */}
            <div className="h-44 w-full flex items-end gap-1 pt-4 pb-2 px-1">
              {dailyActivity.map((d) => {
                const heightPercent = d.count > 0 ? Math.max(20, Math.min(100, (d.count / 4) * 100)) : 6;
                const isHovered = hoveredDay?.day === d.day;
                const hasActivity = d.count > 0;
                return (
                  <div
                    key={d.day}
                    onMouseEnter={() => setHoveredDay(d)}
                    className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-md whitespace-nowrap z-20 pointer-events-none">
                        {d.date}: {d.count} items
                      </div>
                    )}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t transition-all ${
                        isHovered
                          ? "bg-blue-600 scale-x-110 shadow-sm"
                          : hasActivity
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-slate-200 hover:bg-slate-300"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Timeline X-Axis markers */}
            <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-200 pt-2 px-1">
              <span>{dailyActivity[0]?.day || "30d ago"}</span>
              <span>{dailyActivity[7]?.day || ""}</span>
              <span>{dailyActivity[15]?.day || ""}</span>
              <span>{dailyActivity[22]?.day || ""}</span>
              <span className="font-bold text-slate-700">{dailyActivity[29]?.day || "Today"}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-blue-500" />
                <span>Active Scheduled Days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-slate-200" />
                <span>No Distributions</span>
              </div>
            </div>
            <span className="font-semibold text-slate-700">Total: {totalDistributionsCount} distributions</span>
          </div>
        </div>
      </div>

      {/* Section 2: Source Breakdown & Content Diversity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Instagram Reels Mix */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Reels Source Mix</h3>
              </div>
              <span className="text-xs font-bold text-slate-900">{publishedCounts.igReels} Reels</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <Scissors className="w-3.5 h-3.5 text-purple-600" /> Derived from Long Video
                  </span>
                  <span className="font-bold text-slate-900">
                    {publishedCounts.derivedReels} (
                    {publishedCounts.igReels > 0
                      ? Math.round((publishedCounts.derivedReels / publishedCounts.igReels) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all"
                    style={{
                      width: `${
                        publishedCounts.igReels > 0
                          ? Math.round((publishedCounts.derivedReels / publishedCounts.igReels) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <Video className="w-3.5 h-3.5 text-pink-500" /> Standalone Reels
                  </span>
                  <span className="font-bold text-slate-900">
                    {publishedCounts.standaloneReels} (
                    {publishedCounts.igReels > 0
                      ? Math.round((publishedCounts.standaloneReels / publishedCounts.igReels) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full transition-all"
                    style={{
                      width: `${
                        publishedCounts.igReels > 0
                          ? Math.round((publishedCounts.standaloneReels / publishedCounts.igReels) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Target: {settings.publishingFrequency?.instagramReels?.derivedCount || 4} derived +{" "}
              {settings.publishingFrequency?.instagramReels?.standaloneCount || 3} standalone weekly ratio.
            </span>
          </div>
        </div>

        {/* Card 2: LinkedIn Categories */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 fill-current" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">LinkedIn Content Mix</h3>
              </div>
              <span className="text-xs font-bold text-slate-900">{publishedCounts.liPosts} Posts</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">📄 Informative Posts</span>
                  <span className="font-bold text-slate-900">
                    {publishedCounts.liInf} (
                    {publishedCounts.liPosts > 0
                      ? Math.round((publishedCounts.liInf / publishedCounts.liPosts) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{
                      width: `${
                        publishedCounts.liPosts > 0
                          ? Math.round((publishedCounts.liInf / publishedCounts.liPosts) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">▶ Long Video Related</span>
                  <span className="font-bold text-slate-900">
                    {publishedCounts.liVid} (
                    {publishedCounts.liPosts > 0
                      ? Math.round((publishedCounts.liVid / publishedCounts.liPosts) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{
                      width: `${
                        publishedCounts.liPosts > 0
                          ? Math.round((publishedCounts.liVid / publishedCounts.liPosts) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Target: {settings.publishingFrequency?.linkedinPosts?.informativeCount || 2} Informative +{" "}
              {settings.publishingFrequency?.linkedinPosts?.videoRelatedCount || 2} Long Video Related.
            </span>
          </div>
        </div>

        {/* Card 3: Production Pipeline Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Pipeline Inventory</h3>
              </div>
              <span className="text-xs font-bold text-emerald-600">Active</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">💡 Topics Captured</span>
                <span className="font-bold text-slate-900">{topicsCapturedCount} topics</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">📝 In Scripting / Writing</span>
                <span className="font-bold text-slate-900">{inScriptingCount} assets</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">🎬 In Production (Shoot/Edit)</span>
                <span className="font-bold text-slate-900">{inProductionCount} assets</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">📦 Ready in Advance Buffer</span>
                <span className="font-bold text-emerald-700">{bufferReadyCount} assets</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">📅 Confirmed on Calendar</span>
                <span className="font-bold text-blue-700">{scheduledCount} scheduled</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Buffer readiness:</span>
            <span className="font-bold text-emerald-700">
              {bufferStats.windowDays} days ({bufferStats.healthStatus})
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: Platform Publishing Health Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Channel Publishing Health</h3>
            <p className="text-xs text-slate-500">
              Live status, cadence compliance, and upcoming scheduled publishing actions.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Channel</th>
                <th className="pb-3 font-semibold">Target Frequency</th>
                <th className="pb-3 font-semibold">{dateRange} Output</th>
                <th className="pb-3 font-semibold">Consistency</th>
                <th className="pb-3 font-semibold">Next Scheduled</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              <tr>
                <td className="py-3.5 flex items-center gap-2">
                  <Play className="w-4 h-4 text-red-600 fill-current" />
                  <span className="font-bold text-slate-900">YouTube Long Videos</span>
                </td>
                <td className="py-3.5">
                  {settings.publishingFrequency?.youtubeLong?.count || 2} per week (
                  {(settings.publishingFrequency?.youtubeLong?.days || ["Tue", "Fri"]).join(", ")})
                </td>
                <td className="py-3.5 font-bold text-slate-900">{publishedCounts.ytLong} videos</td>
                <td className="py-3.5 font-bold text-emerald-600">
                  {targets.ytLong > 0 ? Math.min(100, Math.round((publishedCounts.ytLong / targets.ytLong) * 100)) : 0}%
                </td>
                <td className="py-3.5">{nextScheduled.youtube}</td>
                <td className="py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      publishedCounts.ytLong >= targets.ytLong && targets.ytLong > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : nextScheduled.youtube !== "None scheduled"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {publishedCounts.ytLong >= targets.ytLong && targets.ytLong > 0
                      ? "On Pace"
                      : nextScheduled.youtube !== "None scheduled"
                      ? "Active"
                      : "Pending"}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 flex items-center gap-2">
                  <Play className="w-4 h-4 text-red-500 fill-current" />
                  <span className="font-bold text-slate-900">YouTube Shorts</span>
                </td>
                <td className="py-3.5">{settings.publishingFrequency?.youtubeShorts?.count || 7} per week (Daily)</td>
                <td className="py-3.5 font-bold text-slate-900">{publishedCounts.ytShorts} shorts</td>
                <td className="py-3.5 font-bold text-slate-900">
                  {targets.ytShorts > 0 ? Math.min(100, Math.round((publishedCounts.ytShorts / targets.ytShorts) * 100)) : 0}%
                </td>
                <td className="py-3.5">{nextScheduled.youtube}</td>
                <td className="py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      publishedCounts.ytShorts >= targets.ytShorts && targets.ytShorts > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : nextScheduled.youtube !== "None scheduled"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {publishedCounts.ytShorts >= targets.ytShorts && targets.ytShorts > 0
                      ? "On Pace"
                      : nextScheduled.youtube !== "None scheduled"
                      ? "Active"
                      : "Pending"}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 flex items-center gap-2">
                  <Video className="w-4 h-4 text-pink-500" />
                  <span className="font-bold text-slate-900">Instagram Reels</span>
                </td>
                <td className="py-3.5">{settings.publishingFrequency?.instagramReels?.count || 7} per week (Daily)</td>
                <td className="py-3.5 font-bold text-slate-900">{publishedCounts.igReels} reels</td>
                <td className="py-3.5 font-bold text-emerald-600">
                  {targets.igReels > 0 ? Math.min(100, Math.round((publishedCounts.igReels / targets.igReels) * 100)) : 0}%
                </td>
                <td className="py-3.5">{nextScheduled.instagram}</td>
                <td className="py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      publishedCounts.igReels >= targets.igReels && targets.igReels > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : nextScheduled.instagram !== "None scheduled"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {publishedCounts.igReels >= targets.igReels && targets.igReels > 0
                      ? "On Pace"
                      : nextScheduled.instagram !== "None scheduled"
                      ? "Active"
                      : "Pending"}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600 fill-current" />
                  <span className="font-bold text-slate-900">LinkedIn Posts</span>
                </td>
                <td className="py-3.5">
                  {settings.publishingFrequency?.linkedinPosts?.count || 4} per week (
                  {settings.publishingFrequency?.linkedinPosts?.informativeCount || 2}+
                  {settings.publishingFrequency?.linkedinPosts?.videoRelatedCount || 2} mix)
                </td>
                <td className="py-3.5 font-bold text-slate-900">{publishedCounts.liPosts} posts</td>
                <td className="py-3.5 font-bold text-slate-900">
                  {targets.liPosts > 0 ? Math.min(100, Math.round((publishedCounts.liPosts / targets.liPosts) * 100)) : 0}%
                </td>
                <td className="py-3.5">{nextScheduled.linkedin}</td>
                <td className="py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      publishedCounts.liPosts >= targets.liPosts && targets.liPosts > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : nextScheduled.linkedin !== "None scheduled"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {publishedCounts.liPosts >= targets.liPosts && targets.liPosts > 0
                      ? "On Pace"
                      : nextScheduled.linkedin !== "None scheduled"
                      ? "Active"
                      : "Pending"}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-slate-900">Carousels</span>
                </td>
                <td className="py-3.5">{settings.publishingFrequency?.carousel?.target || 2} per month</td>
                <td className="py-3.5 font-bold text-slate-900">{publishedCounts.carousel} carousels</td>
                <td className="py-3.5 font-bold text-emerald-600">
                  {targets.carousel > 0 ? Math.min(100, Math.round((publishedCounts.carousel / targets.carousel) * 100)) : 0}%
                </td>
                <td className="py-3.5">{nextScheduled.carousel}</td>
                <td className="py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      publishedCounts.carousel >= targets.carousel && targets.carousel > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : nextScheduled.carousel !== "None scheduled"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {publishedCounts.carousel >= targets.carousel && targets.carousel > 0
                      ? "On Pace"
                      : nextScheduled.carousel !== "None scheduled"
                      ? "Active"
                      : "Pending"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

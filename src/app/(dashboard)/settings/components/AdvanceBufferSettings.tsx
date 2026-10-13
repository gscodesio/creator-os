"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Info,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  Check,
  Play,
  Video,
  Briefcase,
  LayoutTemplate,
  Sliders,
  AlertCircle,
  Rocket,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCreatorOS,
  formatDisplayDate,
  formatShortDate,
  getRelativeLaunchDates,
  getRollingWindow,
} from "@/lib/store/creatorStore";
import { getCurrentDateInTimezone, addDays } from "@/lib/domain/dateUtils";

interface AdvanceBufferSettingsProps {
  onBack?: () => void;
  onSaveNotice?: () => void;
}

export function AdvanceBufferSettings({
  onBack,
  onSaveNotice,
}: AdvanceBufferSettingsProps) {
  const { settings, updateSettings, launchReadiness, setSimulatedDate } = useCreatorOS();
  const [localToast, setLocalToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const tz = settings.profile?.timezone;
  const todayStr = React.useMemo(() => getCurrentDateInTimezone(tz), [tz]);
  const suggestedLaunchDate = React.useMemo(() => addDays(todayStr, 14), [todayStr]);

  const [bufferDays, setBufferDays] = useState<number>(settings.advanceBuffer.days || 0);
  const [customDays, setCustomDays] = useState<string>(settings.advanceBuffer.days ? String(settings.advanceBuffer.days) : "");
  const [isCustom, setIsCustom] = useState<boolean>(settings.advanceBuffer.isCustom || false);

  // Toggles
  const [maintainAuto, setMaintainAuto] = useState<boolean | null>(settings.advanceBuffer.maintainAuto ?? null);
  const [prioritizeMissing, setPrioritizeMissing] = useState<boolean>(true);

  // Launch Plan State
  const [overallStartDate, setOverallStartDate] = useState<string>(
    settings.launchPlan?.overallStartDate || ""
  );
  const [useSeparateDates, setUseSeparateDates] = useState<boolean>(
    settings.launchPlan?.useSeparateDates ?? false
  );
  const [youtubeStartDate, setYoutubeStartDate] = useState<string>(
    settings.launchPlan?.platformDates?.youtube || ""
  );
  const [instagramStartDate, setInstagramStartDate] = useState<string>(
    settings.launchPlan?.platformDates?.instagram || ""
  );
  const [linkedinStartDate, setLinkedinStartDate] = useState<string>(
    settings.launchPlan?.platformDates?.linkedin || ""
  );
  const [carouselStartDate, setCarouselStartDate] = useState<string>(
    settings.launchPlan?.platformDates?.carousel || ""
  );
  const [useSimulatedDate, setUseSimulatedDate] = useState<boolean>(
    settings.launchPlan?.useSimulatedDate ?? false
  );
  const [simulatedDate, setSimulatedDateLocal] = useState<string>(
    settings.launchPlan?.currentSimulatedDate || todayStr
  );
  const [isSavingLaunch, setIsSavingLaunch] = useState(false);
  const [isSavingBuffer, setIsSavingBuffer] = useState(false);

  // Card 1 Save: Launch Plan
  const handleSaveLaunchPlan = async () => {
    if (!overallStartDate) {
      toast.error("Please enter an Overall Publishing Start Date.");
      return;
    }

    setIsSavingLaunch(true);
    try {
      const res = await updateSettings({
        launchPlan: {
          overallStartDate,
          useSeparateDates,
          platformDates: {
            youtube: youtubeStartDate,
            instagram: instagramStartDate,
            linkedin: linkedinStartDate,
            carousel: carouselStartDate,
          },
          currentSimulatedDate: simulatedDate,
          useSimulatedDate,
        },
      });

      if (res.success) {
        toast.success("Launch plan settings saved successfully!");
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to save launch plan");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save launch plan");
    } finally {
      setIsSavingLaunch(false);
    }
  };

  // Card 2 Save: Advance Buffer
  const handleSaveBufferSettings = async () => {
    if (!bufferDays || bufferDays <= 0) {
      toast.error("Please select or enter the number of days for your Advance Buffer.");
      return;
    }

    setIsSavingBuffer(true);
    try {
      const res = await updateSettings({
        advanceBuffer: {
          days: bufferDays,
          isCustom,
          maintainAuto,
        },
      });

      if (res.success) {
        toast.success("Advance buffer settings saved successfully!");
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to save advance buffer");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save advance buffer");
    } finally {
      setIsSavingBuffer(false);
    }
  };

  const handleApplySimulatedDate = (newDate: string) => {
    setSimulatedDateLocal(newDate);
    setSimulatedDate(newDate);
  };

  const bufferOptions = [7, 10, 14, 21, 30];

  const handleSelectDays = (days: number) => {
    setBufferDays(days);
    setIsCustom(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomDays(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setBufferDays(parsed);
      setIsCustom(true);
    }
  };

  const handleReset = () => {
    const savedDays = settings.advanceBuffer?.days ?? 14;
    setBufferDays(savedDays);
    setCustomDays(String(savedDays));
    setIsCustom(settings.advanceBuffer?.isCustom ?? false);
    setMaintainAuto(settings.advanceBuffer?.maintainAuto ?? true);
    setOverallStartDate(settings.launchPlan?.overallStartDate || suggestedLaunchDate);
    setUseSeparateDates(settings.launchPlan?.useSeparateDates ?? false);
    setYoutubeStartDate(settings.launchPlan?.platformDates?.youtube || settings.launchPlan?.overallStartDate || suggestedLaunchDate);
    setInstagramStartDate(settings.launchPlan?.platformDates?.instagram || settings.launchPlan?.overallStartDate || suggestedLaunchDate);
    setLinkedinStartDate(settings.launchPlan?.platformDates?.linkedin || settings.launchPlan?.overallStartDate || suggestedLaunchDate);
    setCarouselStartDate(settings.launchPlan?.platformDates?.carousel || settings.launchPlan?.overallStartDate || suggestedLaunchDate);
    setUseSimulatedDate(settings.launchPlan?.useSimulatedDate ?? false);
    setSimulatedDateLocal(settings.launchPlan?.currentSimulatedDate || todayStr);
    toast.info("Buffer preferences reset to current saved values");
  };

  // Compute calculated demand based on bufferDays
  const ytLongDemand = Math.round((2 / 7) * bufferDays);
  const ytShortsDemand = bufferDays;
  const igReelsDemand = bufferDays;
  const liPostsDemand = Math.round((4 / 7) * bufferDays);
  const totalAssetsNeeded = ytLongDemand + ytShortsDemand + igReelsDemand + liPostsDemand;
  const coveredDays = Math.min(bufferDays, 10);
  const gapAssets = Math.max(0, Math.round(totalAssetsNeeded * (1 - coveredDays / bufferDays)));

  const relativeLaunchDates = getRelativeLaunchDates(overallStartDate);
  const effectiveWindowDate = useSimulatedDate && simulatedDate ? simulatedDate : todayStr;
  const rollingWindow = getRollingWindow(effectiveWindowDate, bufferDays, launchReadiness.isPreLaunch, overallStartDate);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px]">
      {localToast && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
          <Info className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">
            Advance buffer settings saved successfully!
          </span>
        </div>
      )}

      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors w-fit px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Settings
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Advance Buffer</h2>
          <p className="text-slate-500 mt-1">
            Choose how far ahead CREATOR OS should plan your content.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-4 flex items-center gap-3 text-blue-900 text-sm">
        <Info className="w-5 h-5 text-blue-600 shrink-0" />
        <p>
          These targets help CREATOR OS calculate your content needs and maintain your publishing buffer.
          They do not create publishing dates automatically.
        </p>
      </div>

      {/* 🚀 Launch Plan & Pre-Launch Mode Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
        {/* Header & Status Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-lg">Launch Plan & Publishing Start Dates</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    !settings.isConfigured
                      ? "bg-slate-100 text-slate-700 border border-slate-200"
                      : launchReadiness.isPreLaunch
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {!settings.isConfigured
                    ? "Setup Incomplete"
                    : launchReadiness.isPreLaunch
                    ? `Pre-Launch Mode (${launchReadiness.daysUntilLaunch} Days Away)`
                    : "Live Publishing Mode Active"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Configure your publishing launch date. Before this date, publishing slots are not treated as overdue or missed; CREATOR OS focuses on building your initial buffer.
              </p>
            </div>
          </div>

          {/* Quick status callout */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 shrink-0">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Launch: <strong>{formatDisplayDate(overallStartDate)}</strong></span>
          </div>
        </div>

        {/* Start Dates Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-xl border border-slate-200">
          {/* Overall Publishing Start Date */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Overall Publishing Start Date
            </label>
            <input
              type="date"
              value={overallStartDate}
              onChange={(e) => setOverallStartDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500">
              Content publishing starts on this date across platforms unless customized below.
            </p>
          </div>

          {/* Separate Platform Dates Toggle */}
          <div className="flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Separate Platform Start Dates</span>
                <button
                  type="button"
                  onClick={() => setUseSeparateDates(!useSeparateDates)}
                  className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    useSeparateDates ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                      useSeparateDates ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enable optional staggered launch dates for YouTube, Instagram, LinkedIn, and Carousels.
              </p>
            </div>

            <div className="text-[11px] font-semibold text-blue-700 bg-blue-50/80 px-2.5 py-1.5 rounded-md border border-blue-100 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Carousel publishing adheres to configured platform scheduling & buffer rules.</span>
            </div>
          </div>

          {/* Staggered Platform Pickers when toggle enabled */}
          {useSeparateDates && (
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-200 animate-in fade-in-50 duration-200">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                  <Play className="w-3.5 h-3.5 fill-red-600" /> YouTube Launch
                </div>
                <input
                  type="date"
                  value={youtubeStartDate}
                  onChange={(e) => setYoutubeStartDate(e.target.value)}
                  className="border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <span className="text-[10px] text-slate-400">Long Videos (Tue/Fri) + Shorts</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600">
                  <Video className="w-3.5 h-3.5" /> Instagram Launch
                </div>
                <input
                  type="date"
                  value={instagramStartDate}
                  onChange={(e) => setInstagramStartDate(e.target.value)}
                  className="border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <span className="text-[10px] text-slate-400">Reels (Derived + Standalone)</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                  <Briefcase className="w-3.5 h-3.5 fill-blue-700" /> LinkedIn Launch
                </div>
                <input
                  type="date"
                  value={linkedinStartDate}
                  onChange={(e) => setLinkedinStartDate(e.target.value)}
                  className="border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">Informative + Video-Related</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
                  <LayoutTemplate className="w-3.5 h-3.5" /> Carousel Launch
                </div>
                <input
                  type="date"
                  value={carouselStartDate}
                  onChange={(e) => setCarouselStartDate(e.target.value)}
                  className="border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <span className="text-[10px] text-slate-400">Multi-slide carousels</span>
              </div>
            </div>
          )}
        </div>

        {/* Date Simulation & Verification Toolbar */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  Simulated Reference Date <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.2 rounded font-semibold">Testing Tool</span>
                </div>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Simulate a future or past date to verify Pre-Launch mode vs. Post-Launch transition.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-white border border-indigo-200 rounded-lg px-3 py-1.5 shadow-sm">
              <input
                type="checkbox"
                checked={useSimulatedDate}
                onChange={(e) => {
                  setUseSimulatedDate(e.target.checked);
                  if (e.target.checked) {
                    handleApplySimulatedDate(simulatedDate);
                  }
                }}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-indigo-900">Enable Simulation Mode</span>
            </label>
          </div>

          {useSimulatedDate ? (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-indigo-100">
              <input
                type="date"
                value={simulatedDate}
                onChange={(e) => handleApplySimulatedDate(e.target.value)}
                className="border border-indigo-200 bg-white text-xs font-bold text-indigo-900 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleApplySimulatedDate(relativeLaunchDates.preLaunchDate)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors border ${
                  simulatedDate === relativeLaunchDates.preLaunchDate
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50"
                }`}
              >
                {relativeLaunchDates.preLaunchLabel}
              </button>
              <button
                type="button"
                onClick={() => handleApplySimulatedDate(relativeLaunchDates.launchDate)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors border ${
                  simulatedDate === relativeLaunchDates.launchDate
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50"
                }`}
              >
                {relativeLaunchDates.launchLabel}
              </button>
              <button
                type="button"
                onClick={() => handleApplySimulatedDate(relativeLaunchDates.postLaunchDate)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors border ${
                  simulatedDate === relativeLaunchDates.postLaunchDate
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50"
                }`}
              >
                {relativeLaunchDates.postLaunchLabel}
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 italic pt-1">
              Simulation disabled: calculations use real current date (<strong>{todayStr}</strong>) in configured timezone (<strong>{tz || "Asia/Kolkata"}</strong>).
            </div>
          )}
        </div>

        {/* Launch Readiness Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Launch Buffer Readiness ({bufferDays}-Day Initial Buffer)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of actual recorded ready inventory versus required buffer slots before publishing begins.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">{launchReadiness.readinessScore}%</span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">Ready</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                launchReadiness.readinessScore >= 100
                  ? "bg-emerald-500"
                  : launchReadiness.readinessScore >= 50
                  ? "bg-blue-600"
                  : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, launchReadiness.readinessScore)}%` }}
            />
          </div>

          {/* Metrics summary banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-medium">Unique Content Assets Needed</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{launchReadiness.totalUniqueRequired} assets</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Across all content types</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-medium">Actual Ready Inventory</div>
              <div className="text-xl font-bold text-emerald-600 mt-0.5">{launchReadiness.totalUniqueReady} ready</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Strictly exported/ready assets</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-medium">Total Publishing Slots</div>
              <div className="text-xl font-bold text-blue-600 mt-0.5">{launchReadiness.totalPlatformSlots} slots</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Multi-platform distribution capacity</div>
            </div>
          </div>

          {/* Detailed Content Inventory Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. YouTube Long */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-red-600 mb-1">
                  <Play className="w-3 h-3 fill-red-600" /> YT Long
                </div>
                <div className="text-lg font-black text-slate-900">
                  {launchReadiness.breakdown.youtubeLong.ready}{" "}
                  <span className="text-xs font-medium text-slate-400">/ {launchReadiness.breakdown.youtubeLong.required}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px]">
                {launchReadiness.breakdown.youtubeLong.missing > 0 ? (
                  <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                    Missing {launchReadiness.breakdown.youtubeLong.missing}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Full</span>
                )}
              </div>
            </div>

            {/* 2. Derived Reels */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-purple-600 mb-1">
                  <Video className="w-3 h-3" /> Derived Reels
                </div>
                <div className="text-lg font-black text-slate-900">
                  {launchReadiness.breakdown.derivedReels.ready}{" "}
                  <span className="text-xs font-medium text-slate-400">/ {launchReadiness.breakdown.derivedReels.required}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px]">
                {launchReadiness.breakdown.derivedReels.missing > 0 ? (
                  <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                    Missing {launchReadiness.breakdown.derivedReels.missing}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Full</span>
                )}
              </div>
            </div>

            {/* 3. Standalone Reels */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-pink-600 mb-1">
                  <Video className="w-3 h-3" /> Standalone Reels
                </div>
                <div className="text-lg font-black text-slate-900">
                  {launchReadiness.breakdown.standaloneReels.ready}{" "}
                  <span className="text-xs font-medium text-slate-400">/ {launchReadiness.breakdown.standaloneReels.required}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px]">
                {launchReadiness.breakdown.standaloneReels.missing > 0 ? (
                  <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                    Missing {launchReadiness.breakdown.standaloneReels.missing}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Full</span>
                )}
              </div>
            </div>

            {/* 4. LinkedIn Informative */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700 mb-1">
                  <Briefcase className="w-3 h-3 fill-blue-700" /> LI Informative
                </div>
                <div className="text-lg font-black text-slate-900">
                  {launchReadiness.breakdown.linkedinInformative.ready}{" "}
                  <span className="text-xs font-medium text-slate-400">/ {launchReadiness.breakdown.linkedinInformative.required}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px]">
                {launchReadiness.breakdown.linkedinInformative.missing > 0 ? (
                  <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                    Missing {launchReadiness.breakdown.linkedinInformative.missing}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Full</span>
                )}
              </div>
            </div>

            {/* 5. LinkedIn Video-Related */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700 mb-1">
                  <Briefcase className="w-3 h-3 fill-blue-700" /> LI Video-Rel
                </div>
                <div className="text-lg font-black text-slate-900">
                  {launchReadiness.breakdown.linkedinVideoRelated.ready}{" "}
                  <span className="text-xs font-medium text-slate-400">/ {launchReadiness.breakdown.linkedinVideoRelated.required}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px]">
                {launchReadiness.breakdown.linkedinVideoRelated.missing > 0 ? (
                  <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                    Missing {launchReadiness.breakdown.linkedinVideoRelated.missing}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Full</span>
                )}
              </div>
            </div>

            {/* 6. Carousel */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 mb-1">
                  <LayoutTemplate className="w-3 h-3" /> Carousel
                </div>
                <div className="text-lg font-black text-slate-900">
                  {launchReadiness.breakdown.carousel.ready}{" "}
                  <span className="text-xs font-medium text-slate-400">/ {launchReadiness.breakdown.carousel.required}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px]">
                {launchReadiness.breakdown.carousel.missing > 0 ? (
                  <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                    Missing {launchReadiness.breakdown.carousel.missing}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Full</span>
                )}
              </div>
            </div>
          </div>

          {/* Missing items callout & prioritized preparation actions */}
          {launchReadiness.missingSummary.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2 text-xs font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Missing Content for {bufferDays}-Day Buffer Before Launch:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {launchReadiness.missingSummary.map((item, idx) => (
                  <span
                    key={idx}
                    className="bg-white border border-amber-200 text-amber-800 px-2.5 py-1 rounded-md text-xs font-semibold shadow-2xs"
                  >
                    • {item}
                  </span>
                ))}
              </div>

              {/* Priority Production Actions */}
              {launchReadiness.nextPriorityActions.length > 0 && (
                <div className="mt-2 pt-3 border-t border-amber-200/60">
                  <div className="text-xs font-bold text-amber-950 mb-2">
                    Prioritized Production Actions (Resolving Bottlenecks):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {launchReadiness.nextPriorityActions.slice(0, 4).map((act, i) => (
                      <div key={i} className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs">
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>{act.action}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                            {act.stage}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{act.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-900 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Full buffer readiness achieved! You have sufficient inventory ready to launch on {formatDisplayDate(overallStartDate)}.</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSaveLaunchPlan}
              disabled={isSavingLaunch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Rocket className="w-3.5 h-3.5" />
              {isSavingLaunch ? "Saving Launch Plan..." : "Save Launch Plan"}
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Content Planning Buffer & How Far Ahead */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Content Planning Buffer */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Content Planning Buffer</h3>
          </div>

          <div className="flex items-center justify-between gap-6 py-2">
            <div>
              <div className="text-4xl font-black text-blue-600 mb-1">{bufferDays} Days</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                CREATOR OS currently plans and prepares content for the next {bufferDays} days.
              </p>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <Calendar className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Card 2: How far ahead should I plan? */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">How far ahead should I plan?</h3>
                <p className="text-xs text-slate-500">
                  Select the number of days to maintain in your content buffer.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mt-4">
              {bufferOptions.map((days) => {
                const isSelected = bufferDays === days && !isCustom;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleSelectDays(days)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    <span
                      className={`text-lg font-black ${
                        isSelected ? "text-blue-700" : "text-slate-900"
                      }`}
                    >
                      {days}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">Days</span>
                  </button>
                );
              })}

              {/* Custom option */}
              <div
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isCustom
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-500"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-[10px] text-slate-500 font-semibold mb-0.5">Custom</span>
                <div className="flex items-center gap-1 w-full justify-center">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={customDays}
                    onChange={handleCustomChange}
                    onFocus={() => setIsCustom(true)}
                    className="w-10 h-7 text-center font-bold text-sm text-slate-900 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-500">d</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Rolling Planning Window & The Buffer Helps Calculate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 3: Rolling Planning Window */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Rolling Planning Window</h3>
              <p className="text-xs text-slate-500">
                Your planning window moves forward automatically every day.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
            {/* Box 1: Today */}
            <div className="flex-1 w-full border border-blue-200 bg-blue-50/60 rounded-xl p-4 text-center">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                Today
              </div>
              <div className="text-xs text-slate-500 mb-2 font-medium">
                {formatDisplayDate(rollingWindow.todayWindow.startDate)}
              </div>
              <div className="text-base font-bold text-slate-900">
                {formatShortDate(rollingWindow.todayWindow.startDate)}{" "}
                <span className="text-blue-500 mx-1">↓</span>{" "}
                {formatShortDate(rollingWindow.todayWindow.endDateExclusive)}
              </div>
              <div className="mt-2 inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[11px] font-bold">
                {bufferDays} days
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex flex-col items-center justify-center text-slate-400 shrink-0 px-2">
              <span className="text-[10px] text-slate-500 font-semibold mb-1">
                Next day ({formatShortDate(rollingWindow.tomorrowWindow.startDate)})
              </span>
              <div className="text-blue-500 font-mono tracking-widest text-sm">---------→</div>
            </div>

            {/* Box 2: Tomorrow */}
            <div className="flex-1 w-full border border-emerald-200 bg-emerald-50/60 rounded-xl p-4 text-center">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                Tomorrow
              </div>
              <div className="text-xs text-slate-500 mb-2 font-medium">
                {formatDisplayDate(rollingWindow.tomorrowWindow.startDate)}
              </div>
              <div className="text-base font-bold text-slate-900">
                {formatShortDate(rollingWindow.tomorrowWindow.startDate)}{" "}
                <span className="text-emerald-500 mx-1">↓</span>{" "}
                {formatShortDate(rollingWindow.tomorrowWindow.endDateExclusive)}
              </div>
              <div className="mt-2 inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">
                {bufferDays} days
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
            <strong>Rolling Window Convention:</strong> Uses exclusive end-date offset (e.g. 14 days
            starting Oct 10 covers Oct 10 through Oct 23, with rolling target boundary Oct 24) so
            calculated demand and calendar coverage always match.
          </div>
        </div>

        {/* Card 4: The buffer helps calculate */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">The buffer helps calculate:</h3>
          </div>

          <div className="space-y-2.5 py-1">
            {[
              "How much content should already be ready",
              "Which content gaps exist in upcoming dates",
              "Which Reels need to be created or repurposed",
              "Which standalone content needs to be produced",
              "Which LinkedIn content is missing from your mix",
              "Which tasks should be generated next",
              "What should be prepared before future publishing dates",
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Example & Buffer Behavior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 5: Example */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Example</h3>
              <p className="text-xs text-slate-500">
                See how your buffer and publishing targets work together.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Buffer: {bufferDays} Days
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              Publishing targets (per week):
              <span className="font-bold text-slate-900">2 YT Long</span> ·
              <span className="font-bold text-slate-900">7 Shorts</span> ·
              <span className="font-bold text-slate-900">7 Reels</span> ·
              <span className="font-bold text-slate-900">4 LinkedIn</span>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              CREATOR OS calculates the content required for this {bufferDays}-day window based on
              these publishing targets.
            </span>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600 mb-2">Current Coverage (calculated)</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Ready + Scheduled Content</div>
                  <div className="text-sm font-bold text-slate-900">
                    {coveredDays} days covered
                  </div>
                  <div className="text-[11px] text-slate-500">Based on current inventory</div>
                </div>
              </div>

              <div className="border border-red-200 bg-red-50/50 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Content Gap</div>
                  <div className="text-sm font-bold text-red-600">{gapAssets} assets needed</div>
                  <div className="text-[11px] text-slate-500">
                    To maintain your {bufferDays}-day buffer
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 6: Buffer Behavior */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Buffer Behavior</h3>
                <p className="text-xs text-slate-500">Control how CREATOR OS uses your buffer settings.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Maintain buffer automatically</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      When content falls below the configured buffer, CREATOR OS generates the required
                      production tasks automatically.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintainAuto(!maintainAuto)}
                  className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    maintainAuto ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                      maintainAuto ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Prioritize missing content</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tasks related to upcoming publishing gaps are prioritized automatically.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrioritizeMissing(!prioritizeMissing)}
                  className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    prioritizeMissing ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                      prioritizeMissing ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveBufferSettings}
                disabled={isSavingBuffer}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingBuffer ? "Saving Buffer Settings..." : "Save Buffer Settings"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

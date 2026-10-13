"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Info,
  CalendarClock,
  Ban,
  Clock,
  Layers,
  Play,
  Video,
  BarChart3,
  Sliders,
  Sparkles,
  Check,
  X,
  Minus,
  Plus,
  Save,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCreatorOS } from "@/lib/store/creatorStore";

interface SchedulingRulesSettingsProps {
  onBack?: () => void;
  onSaveNotice?: () => void;
}

export function SchedulingRulesSettings({
  onBack,
  onSaveNotice,
}: SchedulingRulesSettingsProps) {
  const { settings, updateSettings } = useCreatorOS();
  const [localToast, setLocalToast] = useState(false);

  // Same Reel Cross-Platform gap state (tri-state / nullable)
  const [sameDayBlocked, setSameDayBlocked] = useState<boolean | null>(
    settings.schedulingRules?.sameDayBlocked ?? null
  );
  const [minGap, setMinGap] = useState<number | null>(
    settings.schedulingRules?.minGapDays ?? null
  );
  const [maxGap, setMaxGap] = useState<number | null>(
    settings.schedulingRules?.maxGapDays ?? null
  );

  // Platform Order state
  const [platformOrder, setPlatformOrder] = useState<string>(
    settings.schedulingRules?.platformOrder || ""
  );

  const [isSavingGaps, setIsSavingGaps] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Content Repetition toggles
  const [avoidSameSource, setAvoidSameSource] = useState<boolean>(true);
  const [avoidSameType, setAvoidSameType] = useState<boolean>(true);
  const [avoidSameTopic, setAvoidSameTopic] = useState<boolean>(true);

  // Long Video + Shorts
  const [allowShortsOnLongDays, setAllowShortsOnLongDays] = useState<boolean>(true);

  // Publishing Frequency respects
  const [respectWeeklyTargets, setRespectWeeklyTargets] = useState<boolean>(true);
  const [respectContentMix, setRespectContentMix] = useState<boolean>(true);
  const [prioritizeUpcomingSlots, setPrioritizeUpcomingSlots] = useState<boolean>(true);

  // Scheduling Preferences
  const [preferEarliestReadiness, setPreferEarliestReadiness] = useState<boolean>(true);
  const [avoidUnfinished, setAvoidUnfinished] = useState<boolean>(true);
  const [doNotScheduleIncomplete, setDoNotScheduleIncomplete] = useState<boolean>(true);

  const handleSaveGaps = async () => {
    if (minGap === null || minGap < 0) {
      toast.error("Please enter a valid minimum gap (0 or greater).");
      return;
    }
    if (maxGap === null || maxGap < 0) {
      toast.error("Please enter a valid maximum gap (0 or greater).");
      return;
    }
    if (minGap > maxGap) {
      toast.error(`Minimum gap (${minGap} days) cannot be greater than maximum gap (${maxGap} days).`);
      return;
    }
    setIsSavingGaps(true);
    try {
      const res = await updateSettings({
        schedulingRules: {
          sameDayBlocked,
          minGapDays: minGap,
          maxGapDays: maxGap,
        },
      });

      if (res.success) {
        toast.success("Cross-platform gap rules saved successfully!");
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to save gap rules");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save gap rules");
    } finally {
      setIsSavingGaps(false);
    }
  };

  const handleSavePlatformOrder = async () => {
    if (!platformOrder) {
      toast.error("Please select a platform scheduling order strategy.");
      return;
    }

    setIsSavingOrder(true);
    try {
      const res = await updateSettings({
        schedulingRules: {
          platformOrder: platformOrder as any,
        },
      });

      if (res.success) {
        toast.success("Platform order preferences saved successfully!");
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to save platform order");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save platform order");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleReset = () => {
    const rules = settings.schedulingRules;
    setSameDayBlocked(rules?.sameDayBlocked ?? true);
    setMinGap(rules?.minGapDays ?? 2);
    setMaxGap(rules?.maxGapDays ?? 5);
    setPlatformOrder(rules?.platformOrder || "Balanced");
    setAvoidSameSource(true);
    setAvoidSameType(true);
    setAvoidSameTopic(true);
    setAllowShortsOnLongDays(true);
    setRespectWeeklyTargets(true);
    setRespectContentMix(true);
    setPrioritizeUpcomingSlots(true);
    setPreferEarliestReadiness(true);
    setAvoidUnfinished(true);
    setDoNotScheduleIncomplete(true);
    toast.info("Scheduling rules reset to current saved values");
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px]">
      {localToast && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
          <Info className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">
            Scheduling rules saved successfully!
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
          <h2 className="text-2xl font-bold text-slate-900">Scheduling Rules</h2>
          <p className="text-slate-500 mt-1">
            Control how CREATOR OS balances and schedules your content.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-4 flex items-center gap-3 text-blue-900 text-sm">
        <Info className="w-5 h-5 text-blue-600 shrink-0" />
        <p>
          These rules help CREATOR OS suggest publishing dates, maintain your content buffer and
          automatically generate tasks. You don't need to manually schedule each post.
        </p>
      </div>

      {/* Row 1: Cross-Platform Reel Scheduling & Platform Order */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Cross-Platform Reel Scheduling */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cross-Platform Reel Scheduling</h3>
              <p className="text-xs text-slate-500">
                The same Reel can be published on Instagram and YouTube Shorts, but not on the same day.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Same-day publishing</div>
                <div className="text-[11px] text-slate-500">
                  Block publishing the same Reel on both platforms on the same day.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-100 text-pink-700">
                Blocked
              </span>
              <button
                type="button"
                onClick={() => setSameDayBlocked(!sameDayBlocked)}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                  sameDayBlocked ? "bg-red-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                    sameDayBlocked ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-900">Minimum gap</span>
              <span className="text-[11px] text-slate-500">Minimum days between posts</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
                  <button
                    onClick={() => setMinGap(Math.max(1, (minGap ?? 2) - 1))}
                    className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs text-slate-900">{minGap ?? "-"}</span>
                  <button
                    onClick={() => {
                      const curMin = minGap ?? 1;
                      const curMax = maxGap ?? 5;
                      if (curMin < curMax) setMinGap(curMin + 1);
                    }}
                    className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs font-semibold text-slate-600">days</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-900">Maximum gap</span>
              <span className="text-[11px] text-slate-500">Maximum days between posts</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
                  <button
                    onClick={() => {
                      const curMin = minGap ?? 1;
                      const curMax = maxGap ?? 5;
                      if (curMax > curMin) setMaxGap(curMax - 1);
                    }}
                    className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs text-slate-900">{maxGap ?? "-"}</span>
                  <button
                    onClick={() => setMaxGap((maxGap ?? 5) + 1)}
                    className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs font-semibold text-slate-600">days</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {minGap !== null && maxGap !== null ? (
                <>Example: If Instagram is Oct 10, YouTube Shorts can be scheduled between Oct {10 + minGap} and Oct {10 + maxGap}.</>
              ) : (
                <>Please configure minimum and maximum gap days to prevent overlapping schedules.</>
              )}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveGaps}
              disabled={isSavingGaps}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingGaps ? "Saving Gap Rules..." : "Save Gap Rules"}
            </button>
          </div>
        </div>

        {/* Card 2: Platform Order */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Platform Order</h3>
                <p className="text-xs text-slate-500">
                  CREATOR OS should avoid always publishing the same Reel on the same platform first.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Scheduling strategy
              </span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: "Instagram First" as const,
                    label: "Instagram First",
                    icon: <Video className="w-4 h-4 text-pink-500" />,
                  },
                  {
                    id: "YouTube First" as const,
                    label: "YouTube First",
                    icon: <Play className="w-4 h-4 text-red-500 fill-current" />,
                  },
                  {
                    id: "Balanced" as const,
                    label: "Balanced",
                    icon: <Layers className="w-4 h-4 text-blue-600" />,
                  },
                ].map((item) => {
                  const isSelected = platformOrder === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPlatformOrder(item.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="mb-2">{item.icon}</div>
                      <span className="text-xs font-bold text-slate-900">{item.label}</span>
                      <div className="mt-2 w-4 h-4 rounded-full border flex items-center justify-center border-slate-300">
                        {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex items-center gap-2 mt-4">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              CREATOR OS rotates platform order using a predictable pattern while respecting your
              scheduling rules. This avoids always publishing on the same platform first.
            </span>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSavePlatformOrder}
              disabled={isSavingOrder}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingOrder ? "Saving Platform Order..." : "Save Platform Order"}
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 3: Content Repetition */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Content Repetition</h3>
                <p className="text-[11px] text-slate-500">Avoid repetitive publishing patterns.</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Avoid same source back-to-back</div>
                  <div className="text-[11px] text-slate-500">
                    Don't publish content from the same source consecutively.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAvoidSameSource(!avoidSameSource)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    avoidSameSource ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      avoidSameSource ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Avoid same content type back-to-back</div>
                  <div className="text-[11px] text-slate-500">
                    Keep different content types in rotation.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAvoidSameType(!avoidSameType)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    avoidSameType ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      avoidSameType ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Avoid same topic/category back-to-back</div>
                  <div className="text-[11px] text-slate-500">
                    Maintain topic variety in your content.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAvoidSameTopic(!avoidSameTopic)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    avoidSameTopic ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      avoidSameTopic ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 text-[11px] text-blue-800 flex items-center gap-1.5 mt-4">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>CREATOR OS tries to keep your feed varied while respecting publishing targets.</span>
          </div>
        </div>

        {/* Card 4: YouTube Long Videos + Shorts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Play className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">YouTube Long Videos + Shorts</h3>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <div className="text-xs font-bold text-slate-900 mb-1">YouTube Long Videos</div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Publishing days:</span>
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold">
                    Tue
                  </span>
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold">
                    Fri
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-900 mb-1">YouTube Shorts</div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Publishing schedule:</span>
                  <Select defaultValue="Daily">
                    <SelectTrigger className="h-7 w-[100px] text-xs bg-white border-slate-200">
                      <SelectValue placeholder="Schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekdays">Weekdays</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Allow Shorts on Long Video days</div>
                  <div className="text-[11px] text-slate-500">
                    Shorts continue daily, including Tuesday and Friday when a Long Video is published.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowShortsOnLongDays(!allowShortsOnLongDays)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    allowShortsOnLongDays ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      allowShortsOnLongDays ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 text-[11px] text-blue-800 flex items-center gap-1.5 mt-4">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              On Long Video days, the Short can come from another ready asset. It is not automatically forced
              to be from the new Long Video.
            </span>
          </div>
        </div>

        {/* Card 5: Publishing Frequency */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Publishing Frequency</h3>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Respect weekly targets</div>
                  <div className="text-[11px] text-slate-500">
                    Follow the frequencies set in Publishing Frequency.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRespectWeeklyTargets(!respectWeeklyTargets)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    respectWeeklyTargets ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      respectWeeklyTargets ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Respect configured content mix</div>
                  <div className="text-[11px] text-slate-500">
                    Use configured mix (e.g. LinkedIn 2+2).
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRespectContentMix(!respectContentMix)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    respectContentMix ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      respectContentMix ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Prioritize upcoming publishing slots</div>
                  <div className="text-[11px] text-slate-500">
                    Give preference to filling earlier upcoming slots.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrioritizeUpcomingSlots(!prioritizeUpcomingSlots)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    prioritizeUpcomingSlots ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      prioritizeUpcomingSlots ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 text-[11px] text-blue-800 flex items-center gap-1.5 mt-4">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Scheduling suggestions should follow the publishing frequencies configured in Settings →
              Publishing Frequency.
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Scheduling Preferences & How CREATOR OS Will Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 6: Scheduling Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Scheduling Preferences</h3>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Prefer available content with earliest readiness
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Use content that has completed required production stages.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferEarliestReadiness(!preferEarliestReadiness)}
                  className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    preferEarliestReadiness ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                      preferEarliestReadiness ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900">Avoid scheduling unfinished content</div>
                  <div className="text-[11px] text-slate-500">
                    Only schedule fully completed content.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAvoidUnfinished(!avoidUnfinished)}
                  className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    avoidUnfinished ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                      avoidUnfinished ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Do not schedule content without required production completion
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Potential content (e.g. uncreated Reels) will not be counted.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDoNotScheduleIncomplete(!doNotScheduleIncomplete)}
                  className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    doNotScheduleIncomplete ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                      doNotScheduleIncomplete ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-800 flex items-center gap-2 mt-4">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Only content that has reached the required production stage can be scheduled.</span>
          </div>
        </div>

        {/* Card 7: How CREATOR OS Will Schedule */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">How CREATOR OS Will Schedule</h3>
                <p className="text-xs text-slate-500">Examples based on your current rules.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Example 1 */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-800 mb-2">Example 1: Same Reel (Valid)</div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-md bg-slate-200 overflow-hidden shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop"
                        alt="Reel A"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Reel A</div>
                      <div className="text-[10px] text-pink-600 font-semibold">Instagram: Oct 10</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-blue-600 font-bold mb-1">↕ 2–5 days gap</div>
                  <div className="text-[10px] text-red-600 font-semibold">YT Shorts: Oct 12 – Oct 15</div>
                </div>
                <div className="mt-3 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 text-center flex items-center justify-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Valid
                </div>
              </div>

              {/* Example 2 */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-800 mb-2">
                    Example 2: Long Video + Short
                  </div>
                  <div className="flex flex-col gap-1.5 mb-2 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-red-600">
                      <Play className="w-3 h-3 fill-current" /> Long Video: Friday
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold text-center">+</div>
                    <div className="flex items-center gap-1.5 font-semibold text-red-600">
                      <Play className="w-3 h-3 fill-current" /> Short: Friday
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 text-center flex items-center justify-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Allowed
                </div>
              </div>

              {/* Example 3 */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-800 mb-2">Example 3: Same Day (Blocked)</div>
                  <div className="flex flex-col gap-1.5 mb-2 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-pink-600">
                      <Video className="w-3 h-3" /> Instagram: Friday
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold text-center">+</div>
                    <div className="flex items-center gap-1.5 font-semibold text-red-600">
                      <Play className="w-3 h-3 fill-current" /> YT Shorts: Friday
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-700 text-center flex items-center justify-center gap-1">
                  <X className="w-3 h-3 stroke-[3]" /> Blocked
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 mt-4">
            Cannot schedule the same Reel on both platforms on the same day.
          </div>
        </div>
      </div>

      {/* Information Note */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200">
        <span>Settings are saved independently per card using each section's Save button.</span>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Reset to Saved
        </button>
      </div>
    </div>
  );
}

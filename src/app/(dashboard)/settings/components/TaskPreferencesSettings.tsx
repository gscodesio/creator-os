"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Info,
  Zap,
  CheckCircle2,
  Check,
  Video,
  Play,
  Briefcase,
  LayoutTemplate,
  Sliders,
  Sparkles,
  Scissors,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Layers,
  Clock,
  Eye,
  AlertCircle,
  Camera,
  FileText,
  Upload,
  Calendar,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useCreatorOS } from "@/lib/store/creatorStore";

interface TaskPreferencesSettingsProps {
  onBack?: () => void;
  onSaveNotice?: () => void;
}

export function TaskPreferencesSettings({
  onBack,
  onSaveNotice,
}: TaskPreferencesSettingsProps) {
  const { settings, updateSettings } = useCreatorOS();
  const [localToast, setLocalToast] = useState(false);

  const tp = settings.taskPreferences;

  // Top Banner toggle
  const [generateAuto, setGenerateAuto] = useState<boolean>(tp?.autoTaskGen ?? true);

  // Content Buffer Protection
  const [bufferFallAuto, setBufferFallAuto] = useState<boolean>(tp?.bufferFallAuto ?? true);
  const [prioritizeMissing, setPrioritizeMissing] = useState<boolean>(tp?.prioritizeMissing ?? true);
  const [countReadyOnly, setCountReadyOnly] = useState<boolean>(tp?.countReadyOnly ?? true);

  // Daily Workload
  const [dailyCapacity, setDailyCapacity] = useState<string>(tp?.dailyCapacity ?? "Auto");

  // Repurposing
  const [trackDerivedReels, setTrackDerivedReels] = useState<boolean>(tp?.trackDerivedReels ?? true);
  const [prioritizeDerived, setPrioritizeDerived] = useState<boolean>(tp?.prioritizeDerived ?? true);
  const [countExportedOnly, setCountExportedOnly] = useState<boolean>(tp?.countExportedOnly ?? true);

  // Task Display toggles
  const [showReason, setShowReason] = useState<boolean>(tp?.showReason ?? true);
  const [showRelated, setShowRelated] = useState<boolean>(tp?.showRelated ?? true);
  const [showPlatform, setShowPlatform] = useState<boolean>(tp?.showPlatform ?? true);
  const [showPriority, setShowPriority] = useState<boolean>(tp?.showPriority ?? true);

  // Next Action Behavior toggle
  const [nextActionBehavior, setNextActionBehavior] = useState<boolean>(tp?.nextActionBehavior ?? true);

  // Task Priority order
  const [priorityOrder, setPriorityOrder] = useState<string[]>(
    tp?.priorityOrder ?? [
      "Publishing deadlines",
      "Buffer gaps",
      "Current production steps",
      "Repurposing requirements",
      "Future work / preparation",
    ]
  );

  const [isSavingPriority, setIsSavingPriority] = useState(false);
  const [isSavingWorkload, setIsSavingWorkload] = useState(false);

  // Sync state if settings change externally
  useEffect(() => {
    if (tp) {
      if (tp.autoTaskGen !== undefined && tp.autoTaskGen !== null) setGenerateAuto(tp.autoTaskGen);
      if (tp.bufferFallAuto !== undefined && tp.bufferFallAuto !== null) setBufferFallAuto(tp.bufferFallAuto);
      if (tp.prioritizeMissing !== undefined) setPrioritizeMissing(tp.prioritizeMissing);
      if (tp.countReadyOnly !== undefined) setCountReadyOnly(tp.countReadyOnly);
      if (tp.dailyCapacity !== undefined) setDailyCapacity(tp.dailyCapacity);
      if (tp.trackDerivedReels !== undefined) setTrackDerivedReels(tp.trackDerivedReels);
      if (tp.prioritizeDerived !== undefined) setPrioritizeDerived(tp.prioritizeDerived);
      if (tp.countExportedOnly !== undefined) setCountExportedOnly(tp.countExportedOnly);
      if (tp.showReason !== undefined) setShowReason(tp.showReason);
      if (tp.showRelated !== undefined) setShowRelated(tp.showRelated);
      if (tp.showPlatform !== undefined) setShowPlatform(tp.showPlatform);
      if (tp.showPriority !== undefined) setShowPriority(tp.showPriority);
      if (tp.nextActionBehavior !== undefined) setNextActionBehavior(tp.nextActionBehavior);
      if (tp.priorityOrder !== undefined) setPriorityOrder(tp.priorityOrder);
    }
  }, [tp]);

  const [isSaving, setIsSaving] = useState(false);

  // Card 2: Save Priority Order
  const handleSavePriorityOrder = async () => {
    setIsSavingPriority(true);
    try {
      const res = await updateSettings({
        taskPreferences: {
          priorityOrder,
        },
      });
      if (res.success) {
        toast.success("Task priority order saved successfully!");
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to save priority order");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save priority order");
    } finally {
      setIsSavingPriority(false);
    }
  };

  // Card 4: Save Daily Workload
  const handleSaveWorkload = async () => {
    setIsSavingWorkload(true);
    try {
      const res = await updateSettings({
        taskPreferences: {
          dailyCapacity,
        },
      });
      if (res.success) {
        toast.success("Daily workload capacity saved successfully!");
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to save workload capacity");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save workload capacity");
    } finally {
      setIsSavingWorkload(false);
    }
  };

  // Immediate toggle persistence
  const handleTogglePreference = async (key: string, value: boolean) => {
    try {
      let payload: any = { [key]: value };
      if (key === "bufferFallAuto") {
        payload = { autoBufferCalc: value, bufferFallAuto: value };
      } else if (key === "trackDerivedReels") {
        payload = { autoRepurposing: value, trackDerivedReels: value };
      }
      const res = await updateSettings({
        taskPreferences: payload,
      });
      if (res.success) {
        toast.success("Preference updated successfully!");
      } else {
        toast.error(res.error || "Failed to update preference");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update preference");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateSettings({
        taskPreferences: {
          autoTaskGen: generateAuto,
          bufferFallAuto,
          prioritizeMissing,
          countReadyOnly,
          dailyCapacity,
          trackDerivedReels,
          prioritizeDerived,
          countExportedOnly,
          showReason,
          showRelated,
          showPlatform,
          showPriority,
          nextActionBehavior,
          priorityOrder,
          autoRepurposing: trackDerivedReels,
          autoBufferCalc: bufferFallAuto,
        },
      });

      if (res.success) {
        toast.success("Task preferences saved successfully!");
        setLocalToast(true);
        setTimeout(() => setLocalToast(false), 3000);
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to save task preferences");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save task preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const curTp = settings.taskPreferences;
    setGenerateAuto(curTp?.autoTaskGen ?? true);
    setBufferFallAuto(curTp?.bufferFallAuto ?? true);
    setPrioritizeMissing(curTp?.prioritizeMissing ?? true);
    setCountReadyOnly(curTp?.countReadyOnly ?? true);
    setDailyCapacity(curTp?.dailyCapacity ?? "Auto");
    setTrackDerivedReels(curTp?.trackDerivedReels ?? true);
    setPrioritizeDerived(curTp?.prioritizeDerived ?? true);
    setCountExportedOnly(curTp?.countExportedOnly ?? true);
    setShowReason(curTp?.showReason ?? true);
    setShowRelated(curTp?.showRelated ?? true);
    setShowPlatform(curTp?.showPlatform ?? true);
    setShowPriority(curTp?.showPriority ?? true);
    setNextActionBehavior(curTp?.nextActionBehavior ?? true);
    setPriorityOrder(
      curTp?.priorityOrder ?? [
        "Publishing deadlines",
        "Buffer gaps",
        "Current production steps",
        "Repurposing requirements",
        "Future work / preparation",
      ]
    );
    toast.info("Task preferences reset to current saved values");
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px]">
      {localToast && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
          <Info className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">
            Task preferences saved successfully!
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
          <h2 className="text-2xl font-bold text-slate-900">Task Preferences</h2>
          <p className="text-slate-500 mt-1">
            Control how CREATOR OS generates and prioritizes your daily work.
          </p>
        </div>
      </div>

      {/* Card 1: Automatic Task Generation Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 fill-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Automatic Task Generation</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                CREATOR OS automatically creates the next valid action based on your content progress,
                dependencies, schedule and settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">Generate tasks automatically</div>
              <div className="text-[11px] text-slate-500">
                Only the next valid and required task will be created.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !generateAuto;
                setGenerateAuto(nextVal);
                handleTogglePreference("autoTaskGen", nextVal);
              }}
              className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                generateAuto ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                  generateAuto ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Pipeline Preview: How it works (example) */}
        <div>
          <span className="text-xs font-semibold text-slate-600 mb-2.5 block">
            How it works (example)
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {/* Step 1: Script Complete */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 min-w-[130px] flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-900">Script Complete</div>
                <div className="text-[10px] text-emerald-700">Current stage</div>
              </div>
            </div>

            <div className="text-slate-300 font-bold px-1 shrink-0">→</div>

            {/* Step 2: Shoot Video */}
            <div className="bg-blue-50 border border-blue-300 rounded-xl p-3 min-w-[130px] flex items-center gap-2 shrink-0 shadow-xs ring-1 ring-blue-500">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                <Camera className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-blue-900">Shoot Video</div>
                <div className="text-[10px] text-blue-700 font-bold">Next action</div>
              </div>
            </div>

            <div className="text-slate-300 font-bold px-1 shrink-0">→</div>

            {/* Step 3: Edit Video */}
            <div className="bg-pink-50/70 border border-pink-200 rounded-xl p-3 min-w-[120px] flex items-center gap-2 shrink-0 opacity-75">
              <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs">
                <Scissors className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-pink-900">Edit Video</div>
              </div>
            </div>

            <div className="text-slate-300 font-bold px-1 shrink-0">→</div>

            {/* Step 4: Export Video */}
            <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-3 min-w-[120px] flex items-center gap-2 shrink-0 opacity-75">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-orange-900">Export Video</div>
              </div>
            </div>

            <div className="text-slate-300 font-bold px-1 shrink-0">→</div>

            {/* Step 5: Schedule */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 min-w-[120px] flex items-center gap-2 shrink-0 opacity-75">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-purple-900">Schedule</div>
              </div>
            </div>

            <div className="text-slate-300 font-bold px-1 shrink-0">→</div>

            {/* Step 6: Publish */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 min-w-[120px] flex items-center gap-2 shrink-0 opacity-75">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-900">Publish</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 2: Task Priority */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Task Priority</h3>
                <p className="text-[11px] text-slate-500">
                  When multiple tasks are possible, this is the order CREATOR OS follows.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {priorityOrder.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 font-bold flex items-center justify-center text-[11px]">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-900">{item}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => {
                        if (index === 0) return;
                        const next = [...priorityOrder];
                        const temp = next[index - 1];
                        next[index - 1] = next[index];
                        next[index] = temp;
                        setPriorityOrder(next);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === priorityOrder.length - 1}
                      onClick={() => {
                        if (index === priorityOrder.length - 1) return;
                        const next = [...priorityOrder];
                        const temp = next[index + 1];
                        next[index + 1] = next[index];
                        next[index] = temp;
                        setPriorityOrder(next);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 text-[11px] text-blue-800 flex items-center gap-1.5 mt-4">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Tasks closer to a publishing deadline are prioritized before optional future work.</span>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSavePriorityOrder}
              disabled={isSavingPriority}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingPriority ? "Saving Priority..." : "Save Priority Order"}
            </button>
          </div>
        </div>

        {/* Card 3: Content Buffer Protection */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Content Buffer Protection</h3>
                <p className="text-[11px] text-slate-500">
                  Create tasks when your content buffer is low based on your publishing frequency.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-bold text-slate-900">
                  Generate tasks when buffer falls below target
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !bufferFallAuto;
                    setBufferFallAuto(nextVal);
                    handleTogglePreference("bufferFallAuto", nextVal);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    bufferFallAuto ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      bufferFallAuto ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-bold text-slate-900">Prioritize missing content</div>
                <button
                  type="button"
                  onClick={() => setPrioritizeMissing(!prioritizeMissing)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    prioritizeMissing ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      prioritizeMissing ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-bold text-slate-900">
                  Count only Ready/Scheduled content in buffer
                </div>
                <button
                  type="button"
                  onClick={() => setCountReadyOnly(!countReadyOnly)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    countReadyOnly ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      countReadyOnly ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Example calculation (Instagram) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-2">
                <span className="text-[11px] font-bold text-slate-800 block mb-1.5">
                  Example (Instagram)
                </span>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">Target 7 Reels / wk</span>
                  <span>-</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded">Planned 5 Reels</span>
                  <span>=</span>
                  <span className="px-2 py-0.5 bg-pink-100 text-pink-700 font-bold rounded">
                    Gap 2 Reels
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>CREATOR OS will create 2 new Reel production tasks.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Daily Workload */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Daily Workload</h3>
                <p className="text-[11px] text-slate-500">
                  Limit how many tasks CREATOR OS recommends for one day.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-900 block mb-2">Daily Task Capacity</span>
              <div className="grid grid-cols-3 gap-2">
                {["Auto", "3 tasks", "5 tasks", "7 tasks", "10 tasks", "Custom"].map((cap) => {
                  const isSelected = dailyCapacity === cap;
                  return (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setDailyCapacity(cap)}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cap}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 text-[11px] text-blue-800 flex items-center gap-1.5 mt-4">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Auto prioritizes the most important tasks based on deadlines, buffer gaps and content needs.
              This is a recommendation, not a hard blocker. You can still work ahead from Upcoming Tasks.
            </span>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveWorkload}
              disabled={isSavingWorkload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingWorkload ? "Saving Workload..." : "Save Workload Capacity"}
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: 2 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 5: Repurposing Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Repurposing Tasks</h3>
                <p className="text-[11px] text-slate-500">
                  Track and manage derived content from your YouTube long videos.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-bold text-slate-900">
                  Automatically track {settings.derivedReelsPerLongVideo || 3} derived child Reels
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !trackDerivedReels;
                    setTrackDerivedReels(nextVal);
                    handleTogglePreference("trackDerivedReels", nextVal);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    trackDerivedReels ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      trackDerivedReels ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-bold text-slate-900">
                  Prioritize incomplete derived Reels
                </div>
                <button
                  type="button"
                  onClick={() => setPrioritizeDerived(!prioritizeDerived)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    prioritizeDerived ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      prioritizeDerived ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-bold text-slate-900">
                  Count only exported/scheduled Reels as Ready
                </div>
                <button
                  type="button"
                  onClick={() => setCountExportedOnly(!countExportedOnly)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    countExportedOnly ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      countExportedOnly ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Repurposing visual box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-3">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop"
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      YouTube Long Video
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      BCA ke baad Job Kaise Milegi?
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px]">
                    Reel 1: Done
                  </div>
                  <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold text-[11px]">
                    Reel 2: In Progress
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[11px]">
                    Reel 3: Not Started
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Next task:</span>
                  <span className="font-bold text-blue-600 flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5" /> Edit Reel 2
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 6: Task Display */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Task Display</h3>
                <p className="text-[11px] text-slate-500">
                  Show useful information with each task so you know what to do and why.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between p-2 border border-slate-200 rounded-lg">
                <span className="text-xs font-semibold text-slate-800">Show task reason</span>
                <button
                  type="button"
                  onClick={() => setShowReason(!showReason)}
                  className={`w-8 h-4.5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    showReason ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3 h-3 bg-white rounded-full transition-transform absolute top-0.5 ${
                      showReason ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 border border-slate-200 rounded-lg">
                <span className="text-xs font-semibold text-slate-800">Show related content</span>
                <button
                  type="button"
                  onClick={() => setShowRelated(!showRelated)}
                  className={`w-8 h-4.5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    showRelated ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3 h-3 bg-white rounded-full transition-transform absolute top-0.5 ${
                      showRelated ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 border border-slate-200 rounded-lg">
                <span className="text-xs font-semibold text-slate-800">Show platform</span>
                <button
                  type="button"
                  onClick={() => setShowPlatform(!showPlatform)}
                  className={`w-8 h-4.5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    showPlatform ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3 h-3 bg-white rounded-full transition-transform absolute top-0.5 ${
                      showPlatform ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 border border-slate-200 rounded-lg">
                <span className="text-xs font-semibold text-slate-800">Show priority</span>
                <button
                  type="button"
                  onClick={() => setShowPriority(!showPriority)}
                  className={`w-8 h-4.5 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    showPriority ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-3 h-3 bg-white rounded-full transition-transform absolute top-0.5 ${
                      showPriority ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Task Preview Card */}
            <div className="mt-4 border border-slate-200 rounded-xl p-3.5 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Task Preview
              </span>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop"
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      Edit Reel 2
                    </div>
                    {showRelated && (
                      <div className="text-[10px] text-slate-500">
                        BCA ke baad Job Kaise Milegi? → Reel 2
                      </div>
                    )}
                  </div>
                </div>

                {showPriority && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700">
                    High Priority
                  </span>
                )}
              </div>

              {showReason && (
                <div className="bg-purple-50/70 border border-purple-100 rounded-lg p-2 text-[11px] text-purple-800 flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-purple-600 shrink-0" />
                  <span>Needed to maintain your long-video derived Reel buffer.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Next Action Behavior (All 5 Workflows, strictly 3 stages for Carousel) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Next Action Behavior</h3>
              <p className="text-xs text-slate-500">
                When you complete a task, CREATOR OS immediately shows the next valid action for that content
                based on its workflow.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNextActionBehavior(!nextActionBehavior)}
            className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
              nextActionBehavior ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                nextActionBehavior ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* 5 Workflows */}
        <div className="grid grid-cols-1 gap-3.5">
          {/* 1. YouTube Long Video */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-[200px]">
              <Play className="w-4 h-4 text-red-600 fill-current" />
              <span className="text-xs font-bold text-slate-900">YouTube Long Video</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Topic</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Script</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Shoot</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Edit</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Export</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Schedule</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                Publish
              </span>
            </div>
          </div>

          {/* 2. Standalone Reel */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-[200px]">
              <Video className="w-4 h-4 text-pink-500" />
              <span className="text-xs font-bold text-slate-900">Instagram Reel (Standalone)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Topic</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Script</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Shoot</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Edit</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Export</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Schedule</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                Publish
              </span>
            </div>
          </div>

          {/* 3. YouTube-Derived Reel */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-[200px]">
              <Scissors className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-900">YouTube Derived Reel</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Edit</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Export</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Schedule</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                Publish
              </span>
            </div>
          </div>

          {/* 4. LinkedIn Post */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-[200px]">
              <Briefcase className="w-4 h-4 text-blue-600 fill-current" />
              <span className="text-xs font-bold text-slate-900">LinkedIn Post</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Topic</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Write</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Ready</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Schedule</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                Publish
              </span>
            </div>
          </div>

          {/* 5. Carousel — STRICT 3 STAGES RULE */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-[200px]">
              <LayoutTemplate className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-slate-900">Carousel</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">
                3 Stages
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Topic</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Create</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                Schedule
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            CREATOR OS only shows the next valid and required action based on the current stage. You
            won't see every possible task, just what you need to do next.
          </span>
        </div>
      </div>

      {/* Information Note */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200">
        <span>Workload capacity and task priority order are saved independently using their respective card Save buttons. Toggles persist immediately.</span>
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

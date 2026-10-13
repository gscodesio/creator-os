"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Globe,
  Sliders,
  Calendar,
  CalendarDays,
  Filter,
  Monitor,
  Sparkles,
  CheckSquare,
  Layers,
  Database,
  CheckCircle,
  Rocket,
  ArrowRight,
  AlertCircle,
  Save,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useCreatorOS, formatDisplayDate } from "@/lib/store/creatorStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GeneralSettingsProps {
  onSaveNotice?: () => void;
}

export function GeneralSettings({ onSaveNotice }: GeneralSettingsProps) {
  const { settings, updateSettings, activateCreatorOS, launchReadiness } = useCreatorOS();

  // Profile State
  const [profileName, setProfileName] = useState(settings?.profile?.name || "");
  const [profileRole, setProfileRole] = useState(settings?.profile?.role || "");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [timezone, setTimezone] = useState(settings?.profile?.timezone || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Workspace Preferences State
  const [startOfWeek, setStartOfWeek] = useState(settings?.workspacePreferences?.startOfWeek || "");
  const [calendarView, setCalendarView] = useState(settings?.workspacePreferences?.calendarView || "");
  const [contentSort, setContentSort] = useState(settings?.workspacePreferences?.contentSort || "");
  const [theme, setTheme] = useState(settings?.workspacePreferences?.theme || "");
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);

  // Workflow Toggles (Tri-state: null = unconfigured, true = ON, false = OFF)
  const [autoTaskGen, setAutoTaskGen] = useState<boolean | null>(
    settings?.taskPreferences?.autoTaskGen ?? null
  );
  const [autoRepurposing, setAutoRepurposing] = useState<boolean | null>(
    settings?.taskPreferences?.autoRepurposing ?? null
  );
  const [autoBufferCalc, setAutoBufferCalc] = useState<boolean | null>(
    settings?.taskPreferences?.autoBufferCalc ?? null
  );
  const [workflowUpdating, setWorkflowUpdating] = useState<string | null>(null);

  // Activation State
  const [isActivating, setIsActivating] = useState(false);
  const [activationMissing, setActivationMissing] = useState<string[]>([]);

  // Synchronize state when store updates from server
  useEffect(() => {
    if (settings?.profile) {
      setProfileName(settings.profile.name || "");
      setProfileRole(settings.profile.role || "");
      setTimezone(settings.profile.timezone || "");
    }
    if (settings?.workspacePreferences) {
      setStartOfWeek(settings.workspacePreferences.startOfWeek || "");
      setCalendarView(settings.workspacePreferences.calendarView || "");
      setContentSort(settings.workspacePreferences.contentSort || "");
      setTheme(settings.workspacePreferences.theme || "");
    }
    if (settings?.taskPreferences) {
      setAutoTaskGen(settings.taskPreferences.autoTaskGen ?? null);
      setAutoRepurposing(settings.taskPreferences.autoRepurposing ?? null);
      setAutoBufferCalc(settings.taskPreferences.autoBufferCalc ?? null);
    }
  }, [settings]);

  // ==========================================
  // CARD 1: CREATOR PROFILE SAVE
  // ==========================================
  const handleSaveProfile = async () => {
    // Frontend validation: Full name is required
    if (!profileName.trim()) {
      toast.error("Creator Profile name cannot be empty.");
      return;
    }

    const changedFields: Record<string, string> = {};
    if (profileName.trim() !== (settings.profile?.name || "")) {
      changedFields.name = profileName.trim();
    }
    if (profileRole.trim() !== (settings.profile?.role || "")) {
      changedFields.role = profileRole.trim();
    }
    if (timezone !== (settings.profile?.timezone || "")) {
      changedFields.timezone = timezone;
    }

    if (Object.keys(changedFields).length === 0) {
      toast.info("No profile changes to save.");
      setIsEditingProfile(false);
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateSettings({
        profile: changedFields as any,
      });

      if (res.success) {
        toast.success("Creator profile updated successfully!");
        setIsEditingProfile(false);
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to update profile");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred saving profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ==========================================
  // CARD 2: WORKSPACE PREFERENCES SAVE
  // ==========================================
  const handleSaveWorkspace = async () => {
    // Frontend validation: Require explicit selection for every field in this card
    const missing: string[] = [];
    if (!startOfWeek) missing.push("Default Start of Week");
    if (!calendarView) missing.push("Default Calendar View");
    if (!contentSort) missing.push("Default Content Sort");
    if (!theme) missing.push("Theme");

    if (missing.length > 0) {
      toast.error(`Please select all required workspace options: ${missing.join(", ")}`);
      return;
    }

    const changedWp: Record<string, string> = {};
    if (startOfWeek !== (settings.workspacePreferences?.startOfWeek || "")) {
      changedWp.startOfWeek = startOfWeek;
    }
    if (calendarView !== (settings.workspacePreferences?.calendarView || "")) {
      changedWp.calendarView = calendarView;
    }
    if (contentSort !== (settings.workspacePreferences?.contentSort || "")) {
      changedWp.contentSort = contentSort;
    }
    if (theme !== (settings.workspacePreferences?.theme || "")) {
      changedWp.theme = theme;
    }

    if (Object.keys(changedWp).length === 0) {
      toast.info("No workspace changes to save.");
      return;
    }

    setIsSavingWorkspace(true);
    try {
      const res = await updateSettings({
        workspacePreferences: changedWp as any,
      });

      if (res.success) {
        toast.success("Workspace preferences saved successfully!");
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to save workspace preferences");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save workspace preferences");
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  // ==========================================
  // CARD 3: CONTENT WORKFLOW TOGGLE AUTOSAVE
  // ==========================================
  const handleToggleWorkflow = async (
    key: "autoTaskGen" | "autoRepurposing" | "autoBufferCalc",
    targetValue: boolean
  ) => {
    const previousValue =
      key === "autoTaskGen"
        ? autoTaskGen
        : key === "autoRepurposing"
        ? autoRepurposing
        : autoBufferCalc;

    // Optimistically update local state
    if (key === "autoTaskGen") setAutoTaskGen(targetValue);
    if (key === "autoRepurposing") setAutoRepurposing(targetValue);
    if (key === "autoBufferCalc") setAutoBufferCalc(targetValue);

    setWorkflowUpdating(key);
    try {
      const payload = {
        taskPreferences: {
          [key]: targetValue,
        },
      };

      const res = await updateSettings(payload);
      if (res.success) {
        const label =
          key === "autoTaskGen"
            ? "Automatic Task Generation"
            : key === "autoRepurposing"
            ? "Automatic Repurposing Tracking"
            : "Automatic Buffer Calculation";
        toast.success(`${label} turned ${targetValue ? "ON" : "OFF"}`);
      } else {
        // Rollback on failure
        if (key === "autoTaskGen") setAutoTaskGen(previousValue);
        if (key === "autoRepurposing") setAutoRepurposing(previousValue);
        if (key === "autoBufferCalc") setAutoBufferCalc(previousValue);
        toast.error(res.error || "Failed to update workflow preference");
      }
    } catch (err: any) {
      // Rollback on network error
      if (key === "autoTaskGen") setAutoTaskGen(previousValue);
      if (key === "autoRepurposing") setAutoRepurposing(previousValue);
      if (key === "autoBufferCalc") setAutoBufferCalc(previousValue);
      toast.error(err?.message || "Failed to save preference");
    } finally {
      setWorkflowUpdating(null);
    }
  };

  // ==========================================
  // FULL INITIAL ACTIVATION
  // ==========================================
  const handleActivateApp = async () => {
    setIsActivating(true);
    setActivationMissing([]);
    try {
      const res = await activateCreatorOS();
      if (res.success) {
        toast.success("Creator OS activated successfully! Autonomous engine is now active.");
      } else {
        if (res.missingSections && res.missingSections.length > 0) {
          setActivationMissing(res.missingSections);
          toast.error("Please configure all required sections before activating.");
        } else {
          toast.error(res.error || "Failed to activate Creator OS");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred during activation");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px]">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">General</h2>
        <p className="text-slate-500 mt-1">Configure your workspace preferences and creator identity.</p>
      </div>

      {/* ⚙️ Setup Mode / Activation Notice */}
      {!settings.isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-xs">
                !
              </div>
              <div>
                <p className="text-sm font-bold text-amber-950">Setup Incomplete — Configure Your Creator OS</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Options below start unselected until explicitly chosen and saved. Complete all required cards to activate your workspace.
                </p>
              </div>
            </div>
            <button
              onClick={handleActivateApp}
              disabled={isActivating}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shrink-0 shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Rocket className="w-3.5 h-3.5" />
              {isActivating ? "Verifying..." : "Activate Creator OS"}
            </button>
          </div>

          {activationMissing.length > 0 && (
            <div className="bg-white/80 border border-amber-300 rounded-lg p-3 text-xs text-amber-900 flex flex-col gap-1.5">
              <span className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Remaining required items before activation:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px] pl-1">
                {activationMissing.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Launch Plan Quick Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Rocket className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm">Publishing Launch Plan</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                  : "Live Publishing Active"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {!settings.isConfigured ? (
                "Configure your publishing launch plan and buffer to activate tracking."
              ) : (
                <>
                  Overall publishing launch date:{" "}
                  <strong>
                    {settings.launchPlan?.overallStartDate
                      ? formatDisplayDate(settings.launchPlan.overallStartDate)
                      : "Not Configured"}
                  </strong>{" "}
                  · Buffer readiness: <strong>{launchReadiness.readinessScore}%</strong>
                </>
              )}
            </p>
          </div>
        </div>
        <Link
          href="/settings/buffer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors shrink-0"
        >
          Configure Launch Plan & Buffer
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ==========================================
            CARD 1: CREATOR PROFILE
            ========================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900">Creator Profile</h3>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
              >
                {isEditingProfile ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200 shrink-0 text-slate-400 font-bold text-lg">
                  {profileName ? profileName.slice(0, 2).toUpperCase() : <User className="w-6 h-6" />}
                </div>
                {isEditingProfile ? (
                  <div className="flex flex-col gap-2 flex-1">
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="h-8 px-2 text-sm font-bold border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Full name (e.g. Gopal)"
                    />
                    <input
                      type="text"
                      value={profileRole}
                      onChange={(e) => setProfileRole(e.target.value)}
                      className="h-7 px-2 text-xs border border-slate-300 rounded text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Role (e.g. Content Creator)"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="font-bold text-slate-900 text-base">
                      {profileName || <span className="text-slate-400 italic">Name not configured</span>}
                    </div>
                    <div className="text-sm text-slate-500">
                      {profileRole || <span className="text-slate-400 italic">Role not configured</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Timezone</span>
                </div>
                <Select
                  value={timezone}
                  onValueChange={(val) => setTimezone(val)}
                >
                  <SelectTrigger className="w-full h-10 bg-white border-slate-200 text-sm">
                    <SelectValue placeholder="Choose timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">India Standard Time (IST) - Asia/Kolkata</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET) - UTC-05:00</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT) - UTC-08:00</SelectItem>
                    <SelectItem value="Europe/London">Greenwich Mean Time (GMT) - UTC+00:00</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingProfile ? "Saving Profile..." : "Save Profile"}
            </button>
          </div>
        </div>

        {/* ==========================================
            CARD 2: WORKSPACE PREFERENCES
            ========================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Workspace Preferences</h3>
                <p className="text-[11px] text-slate-500">All fields must be selected before saving.</p>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Start of Week */}
              <div className="grid grid-cols-[3fr_2fr] items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Default Start of Week</span>
                </div>
                <Select value={startOfWeek} onValueChange={(val) => setStartOfWeek(val)}>
                  <SelectTrigger className="w-full h-9 bg-white border-slate-200 text-sm">
                    <SelectValue placeholder="Choose an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Calendar View */}
              <div className="grid grid-cols-[3fr_2fr] items-center gap-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Default Calendar View</span>
                </div>
                <Select value={calendarView} onValueChange={(val) => setCalendarView(val)}>
                  <SelectTrigger className="w-full h-9 bg-white border-slate-200 text-sm">
                    <SelectValue placeholder="Choose an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Month">Month</SelectItem>
                    <SelectItem value="Week">Week</SelectItem>
                    <SelectItem value="Year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Sort */}
              <div className="grid grid-cols-[3fr_2fr] items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Default Content Sort</span>
                </div>
                <Select value={contentSort} onValueChange={(val) => setContentSort(val)}>
                  <SelectTrigger className="w-full h-9 bg-white border-slate-200 text-sm">
                    <SelectValue placeholder="Choose an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Recently Updated">Recently Updated</SelectItem>
                    <SelectItem value="Creation Date">Creation Date</SelectItem>
                    <SelectItem value="Alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="Workflow Stage">Workflow Stage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme */}
              <div className="grid grid-cols-[3fr_2fr] items-center gap-4">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Theme</span>
                </div>
                <Select value={theme} onValueChange={(val) => setTheme(val)}>
                  <SelectTrigger className="w-full h-9 bg-white border-slate-200 text-sm">
                    <SelectValue placeholder="Choose an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="System Default">System Default</SelectItem>
                    <SelectItem value="Light">Light</SelectItem>
                    <SelectItem value="Dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={handleSaveWorkspace}
              disabled={isSavingWorkspace}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingWorkspace ? "Saving Preferences..." : "Save Workspace Preferences"}
            </button>
          </div>
        </div>

        {/* ==========================================
            CARD 3: CONTENT WORKFLOW (TRI-STATE AUTOSAVE)
            ========================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden md:col-span-2">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Content Workflow</h3>
                <p className="text-[11px] text-slate-500">Each option saves immediately when explicitly toggled ON or OFF.</p>
              </div>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-6">
            {/* 1. Automatic Task Generation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Automatic Task Generation</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automatically create the next valid task based on content progress.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {autoTaskGen === null ? (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                    Not configured
                  </span>
                ) : (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      autoTaskGen ? "text-emerald-700 bg-emerald-100" : "text-slate-600 bg-slate-200"
                    }`}
                  >
                    {autoTaskGen ? "ON" : "OFF"}
                  </span>
                )}
                <div className="flex rounded-lg border border-slate-300 p-0.5 bg-white">
                  <button
                    type="button"
                    disabled={workflowUpdating === "autoTaskGen"}
                    onClick={() => handleToggleWorkflow("autoTaskGen", false)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      autoTaskGen === false
                        ? "bg-slate-700 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    OFF
                  </button>
                  <button
                    type="button"
                    disabled={workflowUpdating === "autoTaskGen"}
                    onClick={() => handleToggleWorkflow("autoTaskGen", true)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      autoTaskGen === true
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ON
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Automatic Repurposing Tracking */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Automatic Repurposing Tracking</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track Derived Reels for YouTube Long Videos upon export.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {autoRepurposing === null ? (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                    Not configured
                  </span>
                ) : (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      autoRepurposing ? "text-emerald-700 bg-emerald-100" : "text-slate-600 bg-slate-200"
                    }`}
                  >
                    {autoRepurposing ? "ON" : "OFF"}
                  </span>
                )}
                <div className="flex rounded-lg border border-slate-300 p-0.5 bg-white">
                  <button
                    type="button"
                    disabled={workflowUpdating === "autoRepurposing"}
                    onClick={() => handleToggleWorkflow("autoRepurposing", false)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      autoRepurposing === false
                        ? "bg-slate-700 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    OFF
                  </button>
                  <button
                    type="button"
                    disabled={workflowUpdating === "autoRepurposing"}
                    onClick={() => handleToggleWorkflow("autoRepurposing", true)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      autoRepurposing === true
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ON
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Automatic Buffer Calculation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Automatic Buffer Calculation</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Use publishing frequency and configured advance buffer to calculate content needs.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {autoBufferCalc === null ? (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                    Not configured
                  </span>
                ) : (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      autoBufferCalc ? "text-emerald-700 bg-emerald-100" : "text-slate-600 bg-slate-200"
                    }`}
                  >
                    {autoBufferCalc ? "ON" : "OFF"}
                  </span>
                )}
                <div className="flex rounded-lg border border-slate-300 p-0.5 bg-white">
                  <button
                    type="button"
                    disabled={workflowUpdating === "autoBufferCalc"}
                    onClick={() => handleToggleWorkflow("autoBufferCalc", false)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      autoBufferCalc === false
                        ? "bg-slate-700 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    OFF
                  </button>
                  <button
                    type="button"
                    disabled={workflowUpdating === "autoBufferCalc"}
                    onClick={() => handleToggleWorkflow("autoBufferCalc", true)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      autoBufferCalc === true
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

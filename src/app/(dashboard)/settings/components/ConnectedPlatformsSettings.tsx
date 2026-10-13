"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Info,
  Play,
  Video,
  Briefcase,
  Plus,
  MoreVertical,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";

import { toast } from "sonner";
import { useCreatorOS } from "@/lib/store/creatorStore";

interface ConnectedPlatformsSettingsProps {
  onBack?: () => void;
  onSaveNotice?: () => void;
}

export function ConnectedPlatformsSettings({
  onBack,
  onSaveNotice,
}: ConnectedPlatformsSettingsProps) {
  const { settings, updateSettings } = useCreatorOS();
  const [localToast, setLocalToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal state for Manage / Connect
  const [modalPlatform, setModalPlatform] = useState<string | null>(null);

  // Connection state from persisted settings - do NOT pre-connect for unconfigured accounts
  const savedPlatforms: string[] = settings.connectedPlatforms || [];
  const [connections, setConnections] = useState<{ [key: string]: boolean }>({
    youtube: savedPlatforms.includes("youtube"),
    instagram: savedPlatforms.includes("instagram"),
    linkedin: savedPlatforms.includes("linkedin"),
    x: savedPlatforms.includes("x"),
    facebook: savedPlatforms.includes("facebook"),
    tiktok: savedPlatforms.includes("tiktok"),
    other: savedPlatforms.includes("other"),
  });

  const handleSave = async () => {
    setIsSaving(true);
    const activeList = Object.keys(connections).filter((k) => connections[k]);
    try {
      const res = await updateSettings({
        connectedPlatforms: activeList,
      });
      if (res.success) {
        toast.success("Connected platforms saved successfully!");
        if (onSaveNotice) {
          onSaveNotice();
        } else {
          setLocalToast(true);
          setTimeout(() => setLocalToast(false), 3000);
        }
      } else {
        toast.error(res.error || "Failed to save connected platforms");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save connected platforms");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleConnection = async (platformKey: string) => {
    const updated = {
      ...connections,
      [platformKey]: !connections[platformKey],
    };
    setConnections(updated);
    setModalPlatform(null);

    const activeList = Object.keys(updated).filter((k) => updated[k]);
    try {
      const res = await updateSettings({
        connectedPlatforms: activeList,
      });
      if (res.success) {
        toast.success(`Platform connection for ${platformKey} updated!`);
      } else {
        toast.error(res.error || "Failed to update platform connection");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update platform connection");
    }
  };

  const handleReset = () => {
    const saved = settings.connectedPlatforms || [];
    setConnections({
      youtube: saved.includes("youtube"),
      instagram: saved.includes("instagram"),
      linkedin: saved.includes("linkedin"),
      x: saved.includes("x"),
      facebook: saved.includes("facebook"),
      tiktok: saved.includes("tiktok"),
      other: saved.includes("other"),
    });
    toast.info("Reset connected platforms to saved state");
  };

  const connectedCount = ["youtube", "instagram", "linkedin"].filter(
    (k) => connections[k]
  ).length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px]">
      {localToast && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
          <Info className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">
            Platform connections updated successfully!
          </span>
        </div>
      )}

      {/* Top Breadcrumb & Title */}
      <div className="flex items-center justify-between">
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
            <h2 className="text-2xl font-bold text-slate-900">Connected Platforms</h2>
            <p className="text-slate-500 mt-1">
              Connect the platforms where you publish your content.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalPlatform("new")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Platform
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-4 flex items-center gap-3 text-blue-900 text-sm">
        <Info className="w-5 h-5 text-blue-600 shrink-0" />
        <p>
          Connect your social media accounts to enable publishing and scheduling. You can add more
          platforms anytime. Connecting a platform does not create content, it only makes it available
          for publishing.
        </p>
      </div>

      {/* Section 1: Connected Platforms */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">
            Connected Platforms ({connectedCount})
          </h3>
          <span className="text-xs text-slate-500">
            These platforms are connected and can be used for publishing and scheduling.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* YouTube Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <span className="font-bold text-slate-900 text-base">YouTube</span>
                </div>
                <div className="flex items-center gap-2">
                  {connections.youtube ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Not Connected
                    </span>
                  )}
                  <button
                    onClick={() => setModalPlatform("youtube")}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                {connections.youtube ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      <img
                        src="https://i.pravatar.cc/150?u=gopal"
                        alt="Gopal Shukla"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">@gopalshukla0018</div>
                      <div className="text-[11px] text-slate-500">Connected channel</div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 italic py-1">
                    No YouTube channel currently connected.
                  </div>
                )}
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Supported content types
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                    Long Videos
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Shorts
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    Community Posts
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleConnection("youtube")}
              className={`mt-6 w-full py-2 px-3 border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                connections.youtube
                  ? "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                  : "border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700"
              }`}
            >
              {connections.youtube ? (
                <>Disconnect / Manage <ArrowRight className="w-3.5 h-3.5" /></>
              ) : (
                <><Plus className="w-3.5 h-3.5" /> Connect YouTube</>
              )}
            </button>
          </div>

          {/* Instagram Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-base">Instagram</span>
                </div>
                <div className="flex items-center gap-2">
                  {connections.instagram ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Not Connected
                    </span>
                  )}
                  <button
                    onClick={() => setModalPlatform("instagram")}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                {connections.instagram ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      <img
                        src="https://i.pravatar.cc/150?u=gopal"
                        alt="Gopal Shukla"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">@gopalshukla0018</div>
                      <div className="text-[11px] text-slate-500">Connected account</div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 italic py-1">
                    No Instagram account currently connected.
                  </div>
                )}
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Supported content types
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                    Reels
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleConnection("instagram")}
              className={`mt-6 w-full py-2 px-3 border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                connections.instagram
                  ? "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                  : "border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700"
              }`}
            >
              {connections.instagram ? (
                <>Disconnect / Manage <ArrowRight className="w-3.5 h-3.5" /></>
              ) : (
                <><Plus className="w-3.5 h-3.5" /> Connect Instagram</>
              )}
            </button>
          </div>

          {/* LinkedIn Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 fill-current" />
                  </div>
                  <span className="font-bold text-slate-900 text-base">LinkedIn</span>
                </div>
                <div className="flex items-center gap-2">
                  {connections.linkedin ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Not Connected
                    </span>
                  )}
                  <button
                    onClick={() => setModalPlatform("linkedin")}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                {connections.linkedin ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      <img
                        src="https://i.pravatar.cc/150?u=gopal"
                        alt="Gopal Shukla"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Gopal Shukla</div>
                      <div className="text-[11px] text-slate-500">Connected account</div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 italic py-1">
                    No LinkedIn account currently connected.
                  </div>
                )}
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Supported content types
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Posts
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleConnection("linkedin")}
              className={`mt-6 w-full py-2 px-3 border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                connections.linkedin
                  ? "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                  : "border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700"
              }`}
            >
              {connections.linkedin ? (
                <>Disconnect / Manage <ArrowRight className="w-3.5 h-3.5" /></>
              ) : (
                <><Plus className="w-3.5 h-3.5" /> Connect LinkedIn</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Add a Platform */}
      <div className="flex flex-col gap-3 mt-2">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Add a Platform</h3>
          <p className="text-xs text-slate-500">
            Add another platform whenever you are ready to publish there.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* X / Twitter */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-bold text-base">
                  𝕏
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold">
                  Not Connected
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">X / Twitter</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Share short updates, thoughts and links.
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                  Supports
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">
                  Posts
                </span>
              </div>
            </div>

            <button
              onClick={() => setModalPlatform("x")}
              className="mt-4 w-full py-1.5 px-3 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Connect
            </button>
          </div>

          {/* Facebook */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                  f
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold">
                  Not Connected
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Facebook</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Share posts, reels and updates with your audience.
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                  Supports
                </span>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">
                    Posts
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-pink-50 text-pink-700">
                    Reels
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setModalPlatform("facebook")}
              className="mt-4 w-full py-1.5 px-3 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Connect
            </button>
          </div>

          {/* TikTok */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-bold text-base">
                  ♪
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold">
                  Not Connected
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">TikTok</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Publish short videos to reach a wider audience.
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                  Supports
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700">
                  Short Videos
                </span>
              </div>
            </div>

            <button
              onClick={() => setModalPlatform("tiktok")}
              className="mt-4 w-full py-1.5 px-3 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Connect
            </button>
          </div>

          {/* Other Platform */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-base">
                  •••
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold">
                  Not Connected
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Other Platform</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Add a custom platform if it's not listed here.
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                  Supports
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                  Custom
                </span>
              </div>
            </div>

            <button
              onClick={() => setModalPlatform("other")}
              className="mt-4 w-full py-1.5 px-3 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Connect
            </button>
          </div>
        </div>
      </div>

      {/* Important Notice Box (Matches Reference 22) */}
      <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-5 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="flex flex-col gap-1.5 text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900 text-sm">Important Platform Rules:</span>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>Only connected platforms can be used for actual publishing and scheduling.</li>
            <li>You can add more platforms later without affecting your existing content.</li>
            <li>
              Disconnecting a platform will not delete your existing content. Your content and
              history will remain in CREATOR OS.
            </li>
            <li>
              After connecting a platform, you can set its publishing frequency in Settings →
              Publishing Frequency.
            </li>
            <li className="font-medium text-slate-700">
              Note: Google Drive is an asset repository link destination, not a social publishing platform, and is managed directly on content cards.
            </li>
          </ul>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
        >
          {isSaving ? "Saving Platforms..." : "Save Connected Platforms"}
        </button>
      </div>

      {/* Honest Demo Connection Modal */}
      {modalPlatform && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-base">
                  {modalPlatform === "new"
                    ? "Connect New Platform"
                    : `Manage ${modalPlatform.toUpperCase()}`}
                </h4>
              </div>
              <button
                onClick={() => setModalPlatform(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                <strong>Demo Mode Active:</strong> External OAuth connections (YouTube API, Meta
                Graph API, LinkedIn Partner API) are configured in local simulation mode.
              </p>
              <p>
                No third-party social tokens are required during this preview. Toggling this
                setting updates your local distribution rules and content scheduling targets.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
              <span className="font-semibold text-slate-700">Account Publishing Status:</span>
              <span className="font-bold text-emerald-700">Active / Allowed</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setModalPlatform(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => toggleConnection(modalPlatform)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Apply Demo Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

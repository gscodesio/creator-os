"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Info,
  Play,
  Video,
  Briefcase,
  LayoutTemplate,
  Plus,
  Minus,
  Sparkles,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useCreatorOS } from "@/lib/store/creatorStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PublishingFrequencySettingsProps {
  onBack?: () => void;
  onSaveNotice?: () => void;
}

export function PublishingFrequencySettings({
  onBack,
  onSaveNotice,
}: PublishingFrequencySettingsProps) {
  const { settings, updateSettings } = useCreatorOS();
  const pf = settings.publishingFrequency;

  // YouTube state
  const [ytLong, setYtLong] = useState<number | null>(pf?.youtubeLong?.count ?? null);
  const [ytLongDays, setYtLongDays] = useState<string[]>(pf?.youtubeLong?.days ?? []);
  const [ytShorts, setYtShorts] = useState<number | null>(pf?.youtubeShorts?.count ?? null);
  const [ytShortsSchedule, setYtShortsSchedule] = useState<string>(pf?.youtubeShorts?.schedule || "");
  const [ytShortsDays, setYtShortsDays] = useState<string[]>(pf?.youtubeShorts?.days ?? []);
  const [isSavingYt, setIsSavingYt] = useState(false);

  // Instagram state
  const [igReels, setIgReels] = useState<number | null>(pf?.instagramReels?.count ?? null);
  const [igSchedule, setIgSchedule] = useState<string>(pf?.instagramReels?.schedule || "");
  const [igDays, setIgDays] = useState<string[]>(pf?.instagramReels?.days ?? []);
  const [igDerived, setIgDerived] = useState<number | null>(pf?.instagramReels?.derivedCount ?? null);
  const [igStandalone, setIgStandalone] = useState<number | null>(pf?.instagramReels?.standaloneCount ?? null);
  const [derivedReelsPerLongVideo, setDerivedReelsPerLongVideo] = useState<number>(
    pf?.derivedReelsPerLongVideo ?? settings.derivedReelsPerLongVideo ?? 3
  );
  const [isSavingIg, setIsSavingIg] = useState(false);

  // LinkedIn state
  const [liPosts, setLiPosts] = useState<number | null>(pf?.linkedinPosts?.count ?? null);
  const [liInf, setLiInf] = useState<number | null>(pf?.linkedinPosts?.informativeCount ?? null);
  const [liVid, setLiVid] = useState<number | null>(pf?.linkedinPosts?.videoRelatedCount ?? null);
  const [isSavingLi, setIsSavingLi] = useState(false);

  // Carousel state
  const [carouselFreq, setCarouselFreq] = useState<string>(pf?.carousel?.frequency || "");
  const [carouselTarget, setCarouselTarget] = useState<number | null>(pf?.carousel?.target ?? null);
  const [isSavingCar, setIsSavingCar] = useState(false);

  useEffect(() => {
    if (pf) {
      if (pf.youtubeLong?.count !== undefined) setYtLong(pf.youtubeLong.count);
      if (pf.youtubeLong?.days !== undefined) setYtLongDays(pf.youtubeLong.days);
      if (pf.youtubeShorts?.count !== undefined) setYtShorts(pf.youtubeShorts.count);
      if (pf.youtubeShorts?.schedule !== undefined) setYtShortsSchedule(pf.youtubeShorts.schedule);
      if (pf.youtubeShorts?.days !== undefined) setYtShortsDays(pf.youtubeShorts.days);

      if (pf.instagramReels?.count !== undefined) setIgReels(pf.instagramReels.count);
      if (pf.instagramReels?.schedule !== undefined) setIgSchedule(pf.instagramReels.schedule);
      if (pf.instagramReels?.days !== undefined) setIgDays(pf.instagramReels.days);
      if (pf.instagramReels?.derivedCount !== undefined) setIgDerived(pf.instagramReels.derivedCount);
      if (pf.instagramReels?.standaloneCount !== undefined) setIgStandalone(pf.instagramReels.standaloneCount);
      if (pf.derivedReelsPerLongVideo !== undefined) setDerivedReelsPerLongVideo(pf.derivedReelsPerLongVideo);

      if (pf.linkedinPosts?.count !== undefined) setLiPosts(pf.linkedinPosts.count);
      if (pf.linkedinPosts?.informativeCount !== undefined) setLiInf(pf.linkedinPosts.informativeCount);
      if (pf.linkedinPosts?.videoRelatedCount !== undefined) setLiVid(pf.linkedinPosts.videoRelatedCount);

      if (pf.carousel?.frequency !== undefined) setCarouselFreq(pf.carousel.frequency);
      if (pf.carousel?.target !== undefined) setCarouselTarget(pf.carousel.target);
    }
  }, [pf]);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleYtLongDay = (day: string) => {
    if (ytLongDays.includes(day)) {
      setYtLongDays(ytLongDays.filter((d) => d !== day));
    } else {
      setYtLongDays([...ytLongDays, day]);
    }
  };

  const toggleDay = (
    currentDays: string[],
    setDays: React.Dispatch<React.SetStateAction<string[]>>,
    day: string
  ) => {
    if (currentDays.includes(day)) {
      setDays(currentDays.filter((d) => d !== day));
    } else {
      setDays([...currentDays, day]);
    }
  };

  // CARD 1 SAVE: YOUTUBE
  const handleSaveYouTube = async () => {
    if (ytLong === null || ytLong < 0) {
      toast.error("Please set a valid target for YouTube Long Videos.");
      return;
    }
    if (ytLong > 0 && ytLongDays.length === 0) {
      toast.error("Please select at least one preferred publishing day for YouTube Long Videos.");
      return;
    }
    if (ytShorts === null || ytShorts < 0) {
      toast.error("Please set a valid target for YouTube Shorts.");
      return;
    }

    setIsSavingYt(true);
    try {
      const res = await updateSettings({
        publishingFrequency: {
          youtubeLong: { count: ytLong, days: ytLongDays },
          youtubeShorts: { count: ytShorts, schedule: ytShortsSchedule || "Daily", days: ytShortsDays },
        },
      });

      if (res.success) {
        toast.success("YouTube publishing frequencies saved!");
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to save YouTube settings");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error saving YouTube settings");
    } finally {
      setIsSavingYt(false);
    }
  };

  // CARD 2 SAVE: INSTAGRAM
  const handleSaveInstagram = async () => {
    if (igReels === null || igReels < 0) {
      toast.error("Please set a valid target for Instagram Reels.");
      return;
    }
    const derived = igDerived ?? Math.round(igReels / 2);
    const standalone = igStandalone ?? (igReels - derived);

    setIsSavingIg(true);
    try {
      const res = await updateSettings({
        derivedReelsPerLongVideo,
        publishingFrequency: {
          instagramReels: {
            count: igReels,
            schedule: igSchedule || "Daily",
            derivedCount: derived,
            standaloneCount: standalone,
            days: igDays,
          },
          derivedReelsPerLongVideo,
        },
      });

      if (res.success) {
        toast.success("Instagram publishing frequencies saved!");
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to save Instagram settings");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error saving Instagram settings");
    } finally {
      setIsSavingIg(false);
    }
  };

  // CARD 3 SAVE: LINKEDIN
  const handleSaveLinkedIn = async () => {
    if (liPosts === null || liPosts < 0) {
      toast.error("Please set a valid target for LinkedIn Posts.");
      return;
    }
    const inf = liInf ?? Math.round(liPosts / 2);
    const vid = liVid ?? (liPosts - inf);

    setIsSavingLi(true);
    try {
      const res = await updateSettings({
        publishingFrequency: {
          linkedinPosts: {
            count: liPosts,
            informativeCount: inf,
            videoRelatedCount: vid,
          },
        },
      });

      if (res.success) {
        toast.success("LinkedIn publishing frequencies saved!");
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to save LinkedIn settings");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error saving LinkedIn settings");
    } finally {
      setIsSavingLi(false);
    }
  };

  // CARD 4 SAVE: CAROUSEL
  const handleSaveCarousel = async () => {
    if (carouselTarget === null || carouselTarget < 0) {
      toast.error("Please set a valid target for Carousel.");
      return;
    }
    if (!carouselFreq) {
      toast.error("Please select a Carousel publishing frequency.");
      return;
    }

    setIsSavingCar(true);
    try {
      const res = await updateSettings({
        publishingFrequency: {
          carousel: {
            target: carouselTarget,
            frequency: carouselFreq,
          },
        },
      });

      if (res.success) {
        toast.success("Carousel publishing preferences saved!");
        if (onSaveNotice) onSaveNotice();
      } else {
        toast.error(res.error || "Failed to save Carousel settings");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error saving Carousel settings");
    } finally {
      setIsSavingCar(false);
    }
  };

  const totalWeekly =
    (ytLong ?? 0) + (ytShorts ?? 0) + (igReels ?? 0) + (liPosts ?? 0);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px]">
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
          <h2 className="text-2xl font-bold text-slate-900">Publishing Frequency</h2>
          <p className="text-slate-500 mt-1">
            Configure weekly target slots for each platform. Each card saves independently.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ==========================================
            CARD 1: YOUTUBE
            ========================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Play className="w-4 h-4 fill-current" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">YouTube</h3>
            </div>

            {/* YouTube Long Videos */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-red-500 fill-current" />
                    YouTube Long Videos
                  </div>
                  <div className="text-xs text-slate-500">Target per week</div>
                </div>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-slate-50">
                  <button
                    onClick={() => setYtLong(Math.max(0, (ytLong ?? 2) - 1))}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-slate-900">
                    {ytLong !== null ? ytLong : "-"}
                  </span>
                  <button
                    onClick={() => setYtLong((ytLong ?? 0) + 1)}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-600 mb-1.5 block">Preferred days</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {daysOfWeek.map((day) => {
                    const isActive = ytLongDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleYtLongDay(day)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* YouTube Shorts */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-red-500 fill-current" />
                    YouTube Shorts
                  </div>
                  <div className="text-xs text-slate-500">Target per week</div>
                </div>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-slate-50">
                  <button
                    onClick={() => setYtShorts(Math.max(0, (ytShorts ?? 7) - 1))}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-slate-900">
                    {ytShorts !== null ? ytShorts : "-"}
                  </span>
                  <button
                    onClick={() => setYtShorts((ytShorts ?? 0) + 1)}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Preferred schedule</span>
                  <Select
                    value={ytShortsSchedule}
                    onValueChange={(val) => setYtShortsSchedule(val)}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-white border-slate-200">
                      <SelectValue placeholder="Choose schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekdays">Weekdays only</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {daysOfWeek.map((day) => {
                    const isActive = ytShortsDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(ytShortsDays, setYtShortsDays, day)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveYouTube}
              disabled={isSavingYt}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingYt ? "Saving YouTube..." : "Save YouTube Settings"}
            </button>
          </div>
        </div>

        {/* ==========================================
            CARD 2: INSTAGRAM
            ========================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Instagram</h3>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-pink-500" />
                    Instagram Reels
                  </div>
                  <div className="text-xs text-slate-500">Target per week</div>
                </div>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-slate-50">
                  <button
                    onClick={() => {
                      const next = Math.max(0, (igReels ?? 7) - 1);
                      setIgReels(next);
                    }}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-slate-900">
                    {igReels !== null ? igReels : "-"}
                  </span>
                  <button
                    onClick={() => setIgReels((igReels ?? 0) + 1)}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Derived Reels per Long Video (1..10) */}
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Derived Reels Target per Long Video
                    </span>
                    <span className="text-[11px] text-purple-700">Configurable (1 to 10 child Reels)</span>
                  </div>
                  <div className="flex items-center gap-1.5 border border-purple-200 rounded-lg p-1 bg-white">
                    <button
                      type="button"
                      onClick={() => setDerivedReelsPerLongVideo(Math.max(1, derivedReelsPerLongVideo - 1))}
                      className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-700 hover:bg-purple-100 text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-black text-xs text-purple-900">
                      {derivedReelsPerLongVideo}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDerivedReelsPerLongVideo(Math.min(10, derivedReelsPerLongVideo + 1))}
                      className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-700 hover:bg-purple-100 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-600 mb-1.5 block">Preferred days</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {daysOfWeek.map((day) => {
                    const isActive = igDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(igDays, setIgDays, day)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveInstagram}
              disabled={isSavingIg}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingIg ? "Saving Instagram..." : "Save Instagram Settings"}
            </button>
          </div>
        </div>

        {/* ==========================================
            CARD 3: LINKEDIN
            ========================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4 fill-current" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">LinkedIn</h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600 fill-current" />
                    LinkedIn Posts
                  </div>
                  <div className="text-xs text-slate-500">Target per week</div>
                </div>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-slate-50">
                  <button
                    onClick={() => {
                      const next = Math.max(0, (liPosts ?? 4) - 1);
                      setLiPosts(next);
                    }}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-slate-900">
                    {liPosts !== null ? liPosts : "-"}
                  </span>
                  <button
                    onClick={() => setLiPosts((liPosts ?? 0) + 1)}
                    className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-600 mb-2 block">
                  Content mix (per week)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <span>📄</span> Informative
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setLiInf(Math.max(0, (liInf ?? 2) - 1))}
                        className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 text-xs"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm text-slate-900">{liInf !== null ? liInf : "-"}</span>
                      <button
                        onClick={() => setLiInf((liInf ?? 0) + 1)}
                        className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Play className="w-3.5 h-3.5 text-red-500 fill-current" /> Video Related
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setLiVid(Math.max(0, (liVid ?? 2) - 1))}
                        className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 text-xs"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm text-slate-900">{liVid !== null ? liVid : "-"}</span>
                      <button
                        onClick={() => setLiVid((liVid ?? 0) + 1)}
                        className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveLinkedIn}
              disabled={isSavingLi}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingLi ? "Saving LinkedIn..." : "Save LinkedIn Settings"}
            </button>
          </div>
        </div>

        {/* ==========================================
            CARD 4: CAROUSEL
            ========================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <LayoutTemplate className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Carousel</h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-600 mb-1.5 block">Frequency</span>
                  <Select
                    value={carouselFreq}
                    onValueChange={(val) => setCarouselFreq(val)}
                  >
                    <SelectTrigger className="w-full h-9 text-xs bg-white border-slate-200">
                      <SelectValue placeholder="Choose an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2 per week">2 per week (Recommended)</SelectItem>
                      <SelectItem value="Weekly">Weekly (1 per week)</SelectItem>
                      <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-600 mb-1.5 block">Target</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
                      <button
                        onClick={() => setCarouselTarget(Math.max(0, (carouselTarget ?? 2) - 1))}
                        className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-slate-900">
                        {carouselTarget !== null ? carouselTarget : "-"}
                      </span>
                      <button
                        onClick={() => setCarouselTarget((carouselTarget ?? 0) + 1)}
                        className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                Specification default is 2 per week. Select your preferred frequency above.
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveCarousel}
              disabled={isSavingCar}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingCar ? "Saving Carousel..." : "Save Carousel Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            Σ
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Total Configured Publishing Slots</div>
            <div className="text-xs text-slate-500">{totalWeekly} weekly distribution actions across platforms</div>
          </div>
        </div>
      </div>
    </div>
  );
}

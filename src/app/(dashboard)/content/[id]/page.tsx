"use client";

import React, { useState, use } from 'react';
import Link from 'next/link';
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
  ChevronRight,
  Clock,
  ExternalLink,
  UploadCloud,
  Link as LinkIcon,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useCreatorOS } from '@/lib/store/creatorStore';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  getWorkflowSteps,
  getWorkflowStepIndex,
  getNextWorkflowStatus,
  isAssetEligibleForDerivation,
} from '@/lib/domain/contentWorkflow';
import styles from './contentDetail.module.css';

export default function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const assetId = resolvedParams.id;

  const router = useRouter();
  const {
    assets,
    updateAsset,
    deleteAsset,
    advanceAssetStage,
    exportAssetAndDeriveReels,
    scheduleContent,
    settings
  } = useCreatorOS();

  const asset = assets.find((a) => a.id === assetId) || assets[0];

  const isYouTube = asset?.type === 'YouTube Long';
  const isDerivedReel = asset?.type === 'Derived Reel';
  const isStandaloneReel = asset?.type === 'Standalone Reel';
  const isLinkedIn = asset?.type === 'LinkedIn';
  const isCarousel = asset?.type === 'Carousel';

  // Determine workflow steps per type from canonical domain model
  const workflowSteps = asset ? getWorkflowSteps(asset.type) : [];
  const steps = workflowSteps.map((s) => s.label);
  const currentStep = asset ? getWorkflowStepIndex(asset.type, asset.workflowStatus) : 0;

  // Drive link state
  const [driveUrl, setDriveUrl] = useState(
    asset?.googleDriveUrl || 'https://drive.google.com/drive/folders/creator-os-assets'
  );
  const [isEditingDrive, setIsEditingDrive] = useState(false);

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [schedPlatform, setSchedPlatform] = useState<"youtube" | "instagram" | "linkedin" | "carousel">(
    isYouTube ? "youtube" : isLinkedIn ? "linkedin" : isCarousel ? "carousel" : "instagram"
  );
  const [schedDate, setSchedDate] = useState("2026-10-15");
  const [schedTime, setSchedTime] = useState("10:00 AM");
  const [schedError, setSchedError] = useState("");
  const [schedSuccess, setSchedSuccess] = useState(false);

  // Cloudinary Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    const isImage = validImageTypes.includes(file.type);
    const isVideo = validVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      toast.error("Invalid file type. Please upload a JPEG, PNG, WEBP, GIF, MP4, or MOV file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate size: 15MB for image, 100MB for video
    const maxBytes = isImage ? 15 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`File too large. Maximum size is ${isImage ? "15MB" : "100MB"}.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("contentId", asset.id);

      setUploadProgress(50);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploadProgress(100);

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast.success("Media uploaded to Cloudinary successfully!");
      if (data.media) {
        const currentMedia = asset.mediaAssets || [];
        updateAsset(asset.id, {
          mediaAssets: [data.media, ...currentMedia.filter((m) => m.id !== data.media.id)],
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload media to Cloudinary");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!asset) {
    return (
      <div className="p-8 text-center text-slate-500">
        Content asset not found.{' '}
        <Link href="/content" className="text-blue-600 underline">
          Back to Content
        </Link>
      </div>
    );
  }

  // Derived child reels
  const childReels = assets.filter(
    (a) => a.parentLongVideoId === asset.id || (a.type === 'Derived Reel' && a.source.includes(asset.title))
  );

  const handleStepClick = (idx: number) => {
    if (!workflowSteps[idx]) return;
    const targetStatus = workflowSteps[idx].status;
    if (targetStatus === 'topic') {
      toast.info('Topic phase is already completed. Asset is in production.');
      return;
    }
    advanceAssetStage(asset.id, targetStatus);
    if (isYouTube && (targetStatus === 'exported' || targetStatus === 'scheduled' || targetStatus === 'published')) {
      exportAssetAndDeriveReels(asset.id);
    }
  };

  const handleNextAction = () => {
    const nextStatus = getNextWorkflowStatus(asset);
    advanceAssetStage(asset.id, nextStatus);

    // If long video reaches export or beyond, derived reels are created
    if (isYouTube && (nextStatus === 'exported' || nextStatus === 'scheduled' || nextStatus === 'published')) {
      exportAssetAndDeriveReels(asset.id);
    }
  };

  const handleToggleDriveEdit = () => {
    if (isEditingDrive) {
      updateAsset(asset.id, { googleDriveUrl: driveUrl });
    }
    setIsEditingDrive(!isEditingDrive);
  };

  const handleTriggerDerivedReels = () => {
    exportAssetAndDeriveReels(asset.id);
  };

  const handleScheduleSubmit = async () => {
    setSchedError("");
    const res = await scheduleContent({
      contentId: asset.id,
      platform: schedPlatform,
      date: schedDate,
      time: schedTime,
    });

    if (!res.success) {
      setSchedError(res.error || "Failed to schedule asset.");
    } else {
      setSchedSuccess(true);
      setTimeout(() => {
        setSchedSuccess(false);
        setIsScheduleOpen(false);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Top Navigation & Breadcrumbs */}
      <div>
        <Link
          href="/content"
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Content
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
          <span>Content</span>
          <span>/</span>
          <span>{asset.type}</span>
          <span>/</span>
          <span className="text-slate-900 font-medium truncate max-w-[400px]">
            {asset.title}
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
                : isStandaloneReel || isDerivedReel
                ? 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600'
                : isLinkedIn
                ? 'bg-[#0077b5]'
                : 'bg-amber-500'
            }`}
          >
            {isYouTube ? (
              <Play className="w-6 h-6 fill-white" />
            ) : isStandaloneReel || isDerivedReel ? (
              <Camera className="w-6 h-6" />
            ) : isLinkedIn ? (
              <Briefcase className="w-6 h-6 fill-white" />
            ) : (
              <Layers className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{asset.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{asset.type}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {steps[currentStep]}
              </span>
              {asset.duration && (
                <span className="text-xs text-slate-400 font-mono">
                  Duration: {asset.duration}
                </span>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-xs">
            <DropdownMenuItem
              onClick={() => {
                if (asset) {
                  advanceAssetStage(asset.id, currentStep + 1);
                  toast.success(`Advanced stage for "${asset.title}"`);
                }
              }}
            >
              Advance Next Stage
            </DropdownMenuItem>
            {isYouTube && (
              <DropdownMenuItem
                onClick={() => {
                  if (asset) {
                    const res = exportAssetAndDeriveReels(asset.id);
                    toast.success(`Exported Long Video & derived ${res.reels.length} Reels!`);
                  }
                }}
                className="text-purple-700 font-semibold hover:bg-purple-50"
              >
                Export & Derive 3 Reels
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setIsScheduleOpen(true)}>
              Schedule Publication
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (asset) {
                  deleteAsset(asset.id);
                  toast.success(`Deleted asset "${asset.title}"`);
                  router.push('/content');
                }
              }}
              className="text-rose-600 hover:bg-rose-50"
            >
              Delete Asset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stepper Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between relative max-w-4xl mx-auto">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;
            return (
              <React.Fragment key={step}>
                <div
                  className="flex flex-col items-center gap-2 cursor-pointer z-10"
                  onClick={() => handleStepClick(idx)}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isActive
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-slate-50 border border-slate-300 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isActive ? (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? 'text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 -mt-6 transition-colors ${
                      idx < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
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
            <h3 className="text-xl font-bold text-slate-900">
              {currentStep === steps.length - 1
                ? 'Asset Published'
                : currentStep === steps.length - 2
                ? 'Schedule Content'
                : steps[currentStep] === 'Script'
                ? 'Write Script'
                : steps[currentStep] === 'Write'
                ? 'Draft Post'
                : steps[currentStep] === 'Create'
                ? 'Create Slides'
                : `Complete ${steps[currentStep]}`}
            </h3>
            <p className="text-slate-600 text-sm mt-1 mb-5">
              {currentStep < steps.length - 1
                ? `Proceed through the ${steps[currentStep]} phase to keep your advance buffer target on schedule.`
                : 'Asset is ready and scheduled for distribution across connected platforms.'}
            </p>
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNextAction}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 h-10 shadow-sm rounded-lg flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                {steps[currentStep] === 'Script'
                  ? 'Complete Script'
                  : steps[currentStep] === 'Write'
                  ? 'Complete Writing'
                  : `Mark ${steps[currentStep]} Complete`}
              </Button>
            ) : (
              <span className="inline-flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" /> Workflow Completed
              </span>
            )}
          </div>

          {/* Asset Details Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Asset Information</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleDriveEdit}
                className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1.5 h-8 px-2.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {isEditingDrive ? 'Done' : 'Edit Links'}
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Title</span>
                <p className="text-sm font-semibold text-slate-900 mt-1 truncate">{asset.title}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Content Type</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">{asset.type}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Stage</span>
                <div className="mt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {steps[currentStep]}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Source</span>
                <p className="text-sm font-semibold text-slate-900 mt-1 truncate">{asset.source}</p>
              </div>
            </div>

            {/* Media & Google Drive Links */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-slate-700 block">
                Google Drive Working Asset Link (Raw video, project files, slides)
              </span>
              {isEditingDrive ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                    placeholder="https://drive.google.com/..."
                  />
                  <Button
                    onClick={handleToggleDriveEdit}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 truncate">
                  <span className="truncate">{driveUrl}</span>
                  <a
                    href={driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-3 text-blue-600 hover:text-blue-700 font-sans font-medium flex items-center gap-1 flex-shrink-0"
                  >
                    Open Drive <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Cloudinary Media Storage */}
            <div className="space-y-3 pt-4 mt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    Cloudinary Media Storage (Production Assets)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload production exports, clips, and thumbnail artwork directly to Cloudinary.
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 px-3 rounded-lg flex items-center gap-1.5 shrink-0"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {isUploading ? "Uploading..." : "Upload Media"}
                </Button>
              </div>

              {isUploading && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center justify-between text-xs text-emerald-800 font-medium mb-1.5">
                    <span>Uploading file and saving asset...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress || 20}%` }}
                    />
                  </div>
                </div>
              )}

              {asset.mediaAssets && asset.mediaAssets.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {asset.mediaAssets.map((media) => (
                    <div
                      key={media.id || media.publicId}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {media.resourceType === "video" ? (
                          <div className="w-9 h-9 rounded bg-indigo-900 text-white flex items-center justify-center shrink-0">
                            <Play className="w-4 h-4 fill-white" />
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={media.secureUrl}
                            alt="Cloudinary thumbnail"
                            className="w-9 h-9 rounded object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {media.publicId.split("/").pop()}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {media.resourceType.toUpperCase()} {media.format ? `• ${media.format.toUpperCase()}` : ""}{" "}
                            {media.bytes ? `• ${(media.bytes / (1024 * 1024)).toFixed(1)} MB` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(media.secureUrl);
                            toast.success("Cloudinary URL copied to clipboard");
                          }}
                          className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                        >
                          Copy URL
                        </Button>
                        <a
                          href={media.secureUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 text-xs"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  No Cloudinary media attached yet. Click &quot;Upload Media&quot; to securely store assets in the cloud.
                </p>
              )}
            </div>
          </div>

          {/* If YouTube: Repurposing Card showing configurable child reels */}
          {isYouTube && (() => {
            const derivedTarget = settings.derivedReelsPerLongVideo || 3;
            return (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                    <Share2 className="w-4 h-4 text-purple-600" />
                    <span>Repurposing ({derivedTarget} Derived Reels)</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    1 Parent → {derivedTarget} Children
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Exporting this Long Video automatically establishes {derivedTarget} child Reel assets for short-form distribution.
                </p>

                {childReels.length > 0 ? (
                  <div className="space-y-3">
                    {childReels.map((reel, rIdx) => (
                      <Link
                        key={reel.id}
                        href={`/content/${reel.id}`}
                        className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-900 text-white flex items-center justify-center text-xs font-bold">
                            R{rIdx + 1}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                              {reel.title}
                            </h4>
                            <p className="text-[11px] text-slate-500">Edit → Export → Schedule → Publish</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {reel.progress.stage}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-xs text-purple-900">
                      <p className="font-semibold">Derived reels not generated yet.</p>
                      <p className="text-purple-700 text-[11px]">
                        Advance to the &quot;Export&quot; stage or generate now to create the {derivedTarget} standard child reels.
                      </p>
                    </div>
                    <Button
                      onClick={handleTriggerDerivedReels}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold h-8 px-3 rounded-lg flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Generate {derivedTarget} Reels
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-6">
          {/* Production Checklist */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base mb-4">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span>Production Milestones</span>
            </div>

            <div className="space-y-1.5 text-sm">
              {steps.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isActive = idx === currentStep;
                return (
                  <div
                    key={step}
                    onClick={() => handleStepClick(idx)}
                    role="button"
                    tabIndex={0}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                      isActive ? 'bg-blue-50 text-blue-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isCompleted ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : isActive ? (
                      <div className="w-4 h-4 rounded-full border-2 border-blue-600 flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                    )}
                    <span className={idx > currentStep ? 'text-slate-400' : ''}>
                      {step} {isCompleted ? 'completed' : isActive ? 'in progress' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribution & Scheduling Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base mb-2">
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>Distribution Status</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Manage multi-platform release and scheduling gap rules.
            </p>

            <div className="space-y-3 mb-5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Status</span>
                <span className="px-2.5 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  {asset.distribution.status}
                </span>
              </div>
              {asset.distribution.date && (
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Scheduled Date</span>
                  <span className="font-semibold text-slate-900">{asset.distribution.date}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Timezone</span>
                <span className="font-semibold text-slate-900">Asia/Kolkata (IST)</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500 font-medium">Target Window</span>
                <span className="font-semibold text-slate-900">{settings.advanceBuffer.days}-Day Advance Buffer</span>
              </div>
            </div>

            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-10 rounded-lg flex items-center justify-center gap-2 shadow-sm mb-3">
                  <Calendar className="w-4 h-4" /> Schedule Publication
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                  <DialogTitle>Schedule Publication</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Target Platform
                    </label>
                    <Select value={schedPlatform} onValueChange={(val: any) => setSchedPlatform(val)}>
                      <SelectTrigger className="w-full h-9 bg-white border-slate-200 text-xs">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {isYouTube && <SelectItem value="youtube">YouTube Long Video</SelectItem>}
                        {(isStandaloneReel || isDerivedReel) && (
                          <>
                            <SelectItem value="instagram">Instagram Reel</SelectItem>
                            <SelectItem value="youtube">YouTube Shorts</SelectItem>
                          </>
                        )}
                        {isLinkedIn && <SelectItem value="linkedin">LinkedIn Post</SelectItem>}
                        {isCarousel && <SelectItem value="carousel">Carousel (Instagram / LinkedIn)</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Release Date
                      </label>
                      <input
                        type="date"
                        value={schedDate}
                        onChange={(e) => setSchedDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg h-9 px-3 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Release Time
                      </label>
                      <input
                        type="time"
                        value={schedTime}
                        onChange={(e) => setSchedTime(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg h-9 px-3 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {(isStandaloneReel || isDerivedReel) && (
                    <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-blue-800 leading-normal">
                      <p className="font-semibold flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        Scheduling Gap Rule Enforced:
                      </p>
                      <p className="mt-0.5 text-blue-700">
                        2 to 5 days gap between Instagram and YouTube Shorts. Same-day release is blocked.
                      </p>
                    </div>
                  )}

                  {schedError && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                      <span>{schedError}</span>
                    </div>
                  )}

                  {schedSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span>Successfully scheduled and added to Calendar!</span>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleScheduleSubmit}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Confirm Schedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {(isStandaloneReel || isDerivedReel) && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-blue-800 leading-normal">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>
                  Hard scheduling constraint enforced: 2 to 5 days gap between Instagram and YouTube Shorts. Same-day publication is strictly blocked.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

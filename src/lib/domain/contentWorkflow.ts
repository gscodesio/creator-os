/**
 * CREATOR OS — Centralized Canonical Workflow & Status-Driven Logic
 *
 * All business logic (readiness, task generation, stage transitions, child reel unblocking,
 * scheduling eligibility, and buffer health) is driven by explicit, typed statuses.
 *
 * Numeric indexes are derived strictly for UI stepper/progress presentation.
 */

export type ContentWorkflowStatus =
  | "topic"
  | "scripting"
  | "shooting"
  | "editing"
  | "exporting"
  | "exported"
  | "pending"
  | "writing"
  | "creating"
  | "ready"
  | "scheduled"
  | "published";

export type CanonicalTopicStatus = "idea" | "planning" | "in_progress" | "converted";

export type TopicWorkflowStatus =
  | CanonicalTopicStatus
  | "Idea"
  | "Planning"
  | "In Progress"
  | "Ready"
  | "Published"
  | "Done";

export function normalizeTopicStatus(status?: string): CanonicalTopicStatus {
  if (!status) return "idea";
  const s = status.trim().toLowerCase();
  if (s === "idea") return "idea";
  if (s === "planning") return "planning";
  if (s === "in progress" || s === "in_progress") return "in_progress";
  if (s === "converted" || s === "done" || s === "ready" || s === "published") return "converted";
  return "idea";
}

export interface TopicKanbanColumnDef {
  id: CanonicalTopicStatus;
  title: string;
  description: string;
  badgeBg: string;
  badgeText: string;
}

export const TOPIC_KANBAN_COLUMNS: TopicKanbanColumnDef[] = [
  {
    id: "idea",
    title: "Idea",
    description: "Topics saved for future content.",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
  },
  {
    id: "planning",
    title: "Planning",
    description: "Topics selected to create soon.",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-800",
  },
  {
    id: "in_progress",
    title: "In Progress",
    description: "Currently creating this content.",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-800",
  },
  {
    id: "converted",
    title: "Done",
    description: "Content created from this topic.",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
  },
];

export type ActionStatus = "pending" | "in_progress" | "completed";

export interface WorkflowStepDefinition {
  status: ContentWorkflowStatus;
  label: string;
}

// Canonical Workflow Definitions
export const YOUTUBE_LONG_WORKFLOW: WorkflowStepDefinition[] = [
  { status: "topic", label: "Topic" },
  { status: "scripting", label: "Script" },
  { status: "shooting", label: "Shoot" },
  { status: "editing", label: "Edit" },
  { status: "exported", label: "Export" },
  { status: "scheduled", label: "Schedule" },
  { status: "published", label: "Publish" },
];

export const STANDALONE_REEL_WORKFLOW: WorkflowStepDefinition[] = [
  { status: "topic", label: "Topic" },
  { status: "scripting", label: "Script" },
  { status: "shooting", label: "Shoot" },
  { status: "editing", label: "Edit" },
  { status: "exported", label: "Export" },
  { status: "scheduled", label: "Schedule" },
  { status: "published", label: "Publish" },
];

export const DERIVED_REEL_WORKFLOW: WorkflowStepDefinition[] = [
  { status: "editing", label: "Edit" },
  { status: "exported", label: "Export" },
  { status: "scheduled", label: "Schedule" },
  { status: "published", label: "Publish" },
];

export const LINKEDIN_WORKFLOW: WorkflowStepDefinition[] = [
  { status: "topic", label: "Topic" },
  { status: "writing", label: "Write" },
  { status: "ready", label: "Ready" },
  { status: "scheduled", label: "Schedule" },
  { status: "published", label: "Publish" },
];

export const CAROUSEL_WORKFLOW: WorkflowStepDefinition[] = [
  { status: "topic", label: "Topic" },
  { status: "creating", label: "Create" },
  { status: "scheduled", label: "Schedule" },
  { status: "published", label: "Publish" },
];

export const TOPIC_WORKFLOW_STEPS: {
  status: TopicWorkflowStatus;
  label: string;
}[] = [
  { status: "Idea", label: "Idea" },
  { status: "Planning", label: "Planning" },
  { status: "In Progress", label: "In Progress" },
  { status: "Ready", label: "Ready" },
  { status: "Published", label: "Published" },
];

/**
 * Returns the workflow step definitions for a given content type.
 */
export function getWorkflowSteps(type: string): WorkflowStepDefinition[] {
  switch (type) {
    case "YouTube Long":
      return YOUTUBE_LONG_WORKFLOW;
    case "Standalone Reel":
      return STANDALONE_REEL_WORKFLOW;
    case "Derived Reel":
      return DERIVED_REEL_WORKFLOW;
    case "LinkedIn":
      return LINKEDIN_WORKFLOW;
    case "Carousel":
      return CAROUSEL_WORKFLOW;
    default:
      return YOUTUBE_LONG_WORKFLOW;
  }
}

/**
 * Normalizes any legacy string stage into a canonical ContentWorkflowStatus.
 * Used for safe hydration and migration.
 */
export function normalizeWorkflowStatus(
  stageStr?: string,
  type?: string,
  distStatus?: string,
): ContentWorkflowStatus {
  if (distStatus === "Published") return "published";
  if (
    distStatus &&
    distStatus !== "Not Scheduled" &&
    distStatus.includes("Scheduled")
  ) {
    return "scheduled";
  }

  const s = (stageStr || "").trim().toLowerCase();

  if (s === "published") return "published";
  if (s === "scheduled" || s === "schedule") return "scheduled";
  if (s === "exporting") return "exporting";
  if (s === "exported") return "exported";
  if (s === "export") {
    return type === "Derived Reel" ? "exporting" : "exported";
  }
  if (s === "ready")
    return type === "Derived Reel" ||
      type === "Standalone Reel" ||
      type === "YouTube Long"
      ? "exported"
      : "ready";
  if (s === "pending") return "pending";
  if (s === "editing" || s === "edit") return "editing";
  if (s === "shooting" || s === "shoot") return "shooting";
  if (s === "scripting" || s === "script") return "scripting";
  if (s === "writing" || s === "write") return "writing";
  if (s === "creating" || s === "create") return "creating";
  if (s === "topic" || s === "planning" || s === "idea" || !s) {
    if (type === "YouTube Long") return "scripting";
    if (type === "Standalone Reel") return "scripting";
    if (type === "LinkedIn") return "writing";
    if (type === "Carousel") return "creating";
    if (type === "Derived Reel") return "editing";
    return "scripting";
  }

  // Fallback defaults
  if (type === "Derived Reel") return "editing";
  if (type === "LinkedIn") return "writing";
  if (type === "Carousel") return "creating";
  if (type === "Standalone Reel") return "scripting";
  return "scripting";
}

/**
 * Buffer Readiness Rule:
 * Determines whether an asset is ready to count toward advance inventory buffer.
 *
 * Strict Rule:
 * Unedited, unexported, in-progress, or pending assets DO NOT count.
 * Only exported, ready, scheduled, or published assets qualify.
 */
export function isAssetBufferReady(asset: {
  type: string;
  workflowStatus?: ContentWorkflowStatus;
  progress?: { stage: string };
  distribution?: { status: string };
}): boolean {
  const distStatus = asset.distribution?.status || "Not Scheduled";
  if (distStatus === "Published") return true;
  if (distStatus !== "Not Scheduled" && distStatus.includes("Scheduled"))
    return true;

  const status =
    asset.workflowStatus ||
    normalizeWorkflowStatus(asset.progress?.stage, asset.type, distStatus);

  if (status === "published" || status === "scheduled") {
    return true;
  }

  switch (asset.type) {
    case "YouTube Long":
      // Master video is ready once exported!
      return status === "exported";

    case "Derived Reel":
      // Derived reel is ready ONLY once exported!
      // 'editing' or 'pending' does NOT count!
      return status === "exported";

    case "Standalone Reel":
      // Standalone reel is ready once exported!
      return status === "exported";

    case "LinkedIn":
      // LinkedIn post is ready once drafted and marked ready!
      return status === "ready";

    case "Carousel":
      // Carousel is ready once created and marked ready!
      return status === "ready";

    default:
      return false;
  }
}

/**
 * Returns whether an asset is currently in production (active work needed).
 */
export function isAssetInProduction(asset: {
  type: string;
  workflowStatus?: ContentWorkflowStatus;
  progress?: { stage: string; hasActive?: boolean };
  distribution?: { status: string };
}): boolean {
  if (isAssetBufferReady(asset)) return false;
  const distStatus = asset.distribution?.status || "Not Scheduled";
  if (
    distStatus === "Published" ||
    (distStatus !== "Not Scheduled" && distStatus.includes("Scheduled"))
  ) {
    return false;
  }
  const status =
    asset.workflowStatus ||
    normalizeWorkflowStatus(asset.progress?.stage, asset.type, distStatus);
  return (
    status !== "published" && status !== "scheduled" && status !== "pending"
  );
}

/**
 * Returns whether an asset is scheduled for distribution.
 */
export function isAssetScheduled(asset: {
  distribution?: { status: string };
  workflowStatus?: ContentWorkflowStatus;
}): boolean {
  const distStatus = asset.distribution?.status || "Not Scheduled";
  return distStatus !== "Not Scheduled" && distStatus.includes("Scheduled");
}

/**
 * Returns whether an asset is published.
 */
export function isAssetPublished(asset: {
  distribution?: { status: string };
  workflowStatus?: ContentWorkflowStatus;
  progress?: { stage: string };
}): boolean {
  const distStatus = asset.distribution?.status || "Not Scheduled";
  if (distStatus === "Published") return true;
  const status =
    asset.workflowStatus ||
    normalizeWorkflowStatus(asset.progress?.stage, "", distStatus);
  return status === "published";
}

/**
 * Master Video Repurposing Rule:
 * A YouTube Long Video is eligible to derive exactly 3 child Reels once it reaches 'exported' status.
 */
export function isAssetEligibleForDerivation(asset: {
  type: string;
  workflowStatus?: ContentWorkflowStatus;
  progress?: { stage: string };
  distribution?: { status: string };
}): boolean {
  if (asset.type !== "YouTube Long") return false;
  const status =
    asset.workflowStatus ||
    normalizeWorkflowStatus(
      asset.progress?.stage,
      asset.type,
      asset.distribution?.status,
    );
  return (
    status === "exported" || status === "scheduled" || status === "published"
  );
}

/**
 * Child Reel Workflow Independence Rule:
 * All three derived Reels operate with independent workflow states immediately upon export.
 * Completing Edit Reel 1 unlocks Export Reel 1 independently of Reel 2 and Reel 3.
 */
export function isChildReelUnlocked(
  childReel?: {
    title?: string;
    parentLongVideoId?: string;
  },
  allAssets?: {
    id: string;
    title: string;
    type: string;
    parentLongVideoId?: string;
    workflowStatus?: ContentWorkflowStatus;
    progress?: { stage: string };
    distribution?: { status: string };
  }[],
): boolean {
  // All derived reels have independent workflows and are unlocked for their respective stage
  return true;
}

/**
 * Scheduling Eligibility Rule:
 * An asset can be scheduled ONLY after its production actions are complete:
 * - YouTube Long / Reels: must be exported
 * - LinkedIn / Carousel: must be ready
 */
export function isAssetEligibleForSchedule(asset: {
  type: string;
  workflowStatus?: ContentWorkflowStatus;
  progress?: { stage: string };
  distribution?: { status: string };
}): boolean {
  const status =
    asset.workflowStatus ||
    normalizeWorkflowStatus(
      asset.progress?.stage,
      asset.type,
      asset.distribution?.status,
    );
  if (status === "scheduled" || status === "published") return true;

  if (
    asset.type === "YouTube Long" ||
    asset.type === "Derived Reel" ||
    asset.type === "Standalone Reel"
  ) {
    return status === "exported";
  }
  if (asset.type === "LinkedIn" || asset.type === "Carousel") {
    return status === "ready";
  }
  return false;
}

/**
 * Returns the next canonical workflow status when progressing an asset.
 */
export function getNextWorkflowStatus(asset: {
  type: string;
  workflowStatus?: ContentWorkflowStatus;
  progress?: { stage: string };
  distribution?: { status: string };
}): ContentWorkflowStatus {
  const currentStatus =
    asset.workflowStatus ||
    normalizeWorkflowStatus(
      asset.progress?.stage,
      asset.type,
      asset.distribution?.status,
    );

  switch (asset.type) {
    case "YouTube Long":
    case "Standalone Reel":
      switch (currentStatus) {
        case "topic":
          return "scripting";
        case "scripting":
          return "shooting";
        case "shooting":
          return "editing";
        case "editing":
          return "exported";
        case "exporting":
          return "exported";
        case "exported":
          return "scheduled";
        case "scheduled":
          return "published";
        default:
          return "published";
      }

    case "Derived Reel":
      switch (currentStatus) {
        case "pending":
        case "editing":
          return "exported";
        case "exporting":
          return "exported";
        case "exported":
          return "scheduled";
        case "scheduled":
          return "published";
        default:
          return "published";
      }

    case "LinkedIn":
      switch (currentStatus) {
        case "topic":
          return "writing";
        case "writing":
          return "ready";
        case "ready":
          return "scheduled";
        case "scheduled":
          return "published";
        default:
          return "published";
      }

    case "Carousel":
      switch (currentStatus) {
        case "topic":
          return "creating";
        case "creating":
        case "ready":
          return "scheduled";
        case "scheduled":
          return "published";
        default:
          return "published";
      }

    default:
      return "published";
  }
}

/**
 * Returns the next topic status when advancing through its lifecycle.
 */
export function getNextTopicWorkflowStatus(
  status: TopicWorkflowStatus,
): CanonicalTopicStatus {
  const norm = normalizeTopicStatus(status);
  switch (norm) {
    case "idea":
      return "planning";
    case "planning":
      return "in_progress";
    case "in_progress":
      return "converted";
    case "converted":
      return "converted";
    default:
      return "planning";
  }
}

/**
 * PRESENTATION ONLY: Returns the display step index for rendering stepper UI bars.
 * MUST NOT be used for business readiness, task eligibility, or transition logic!
 */
export function getWorkflowStepIndex(
  type: string,
  status?: ContentWorkflowStatus,
): number {
  const steps = getWorkflowSteps(type);
  if (!status) return 0;
  const idx = steps.findIndex((s) => s.status === status);
  if (idx !== -1) return idx;

  // Status mapping if status is not in the exact step array
  if (status === "pending") return 0;
  if (status === "exporting")
    return steps.findIndex((s) => s.status === "exported");
  if (status === "ready" && type.includes("Reel"))
    return steps.findIndex((s) => s.status === "exported");
  if (status === "published") return steps.length - 1;
  return 0;
}

/**
 * PRESENTATION ONLY: Returns total steps for a workflow.
 */
export function getWorkflowTotalSteps(type: string): number {
  return getWorkflowSteps(type).length;
}

/**
 * Returns the human-readable stage label for a workflow status.
 */
export function getWorkflowStageLabel(
  type: string,
  status: ContentWorkflowStatus,
): string {
  const steps = getWorkflowSteps(type);
  const found = steps.find((s) => s.status === status);
  if (found) return found.label;
  if (status === "pending") return "Pending";
  if (status === "exporting") return "Exporting";
  if (status === "exported") return "Exported";
  if (status === "ready") return "Ready";
  if (status === "scheduled") return "Scheduled";
  if (status === "published") return "Published";
  return "In Progress";
}

/**
 * Safe hydration and data migration: ensures every asset has explicit, typed workflowStatus.
 */
export function migrateContentAsset(asset: any): any {
  const distStatus = asset.distribution?.status || "Not Scheduled";
  const rawStatus =
    asset.workflowStatus && asset.workflowStatus !== "topic"
      ? asset.workflowStatus
      : undefined;
  const workflowStatus: ContentWorkflowStatus =
    rawStatus ||
    normalizeWorkflowStatus(asset.progress?.stage, asset.type, distStatus);

  const steps = getWorkflowSteps(asset.type || "");
  const stepIdx = getWorkflowStepIndex(asset.type || "", workflowStatus);
  const stageLabel = getWorkflowStageLabel(asset.type || "", workflowStatus);

  return {
    ...asset,
    workflowStatus,
    actionStatus:
      asset.actionStatus ||
      (workflowStatus === "published" ||
      workflowStatus === "scheduled" ||
      workflowStatus === "exported" ||
      workflowStatus === "ready"
        ? "completed"
        : "in_progress"),
    progress: {
      total: steps.length,
      hasActive: workflowStatus !== "published",
      ...asset.progress,
      stage: stageLabel,
      completed: stepIdx,
    },
    distribution: asset.distribution || { status: "Not Scheduled" },
  };
}

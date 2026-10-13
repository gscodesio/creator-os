  import type { ContentWorkflowStatus, ActionStatus } from '@/lib/domain/contentWorkflow';

  export interface MediaAssetItem {
    id: string;
    publicId: string;
    secureUrl: string;
    resourceType: string;
    format?: string | null;
    bytes?: number | null;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
    createdAt?: string | Date;
  }

  export interface ContentAsset {
    id: string;
    title: string;
    type: 'YouTube Long' | 'Derived Reel' | 'Standalone Reel' | 'LinkedIn' | 'Carousel';
    subType?: 'Informative' | 'Long Video Related';
    reelType?: 'Standalone' | 'Long Video Derived';
    workflowStatus: ContentWorkflowStatus;
    actionStatus?: ActionStatus;
    progress: {
      stage: string;
      completed: number;
      total: number;
      hasActive?: boolean;
    };
    distribution: {
      status: 'Not Scheduled' | 'Instagram Scheduled' | 'YouTube Scheduled' | 'Both Scheduled' | 'LinkedIn Scheduled' | 'Scheduled' | 'Published';
      date?: string;
      youtubeDate?: string;
      youtubeTime?: string;
      instagramDate?: string;
      instagramTime?: string;
      linkedinDate?: string;
      linkedinTime?: string;
      carouselDate?: string;
      carouselTime?: string;
    };
    source: string;
    isParentLink?: boolean;
    parentLongVideoId?: string;
    topicId?: string;
    driveAsset?: string;
    repurposing?: {
      readyCount: number;
      totalCount: number;
    };
    lastUpdated: string;
    duration?: string;
    thumbBg: string;
    thumbText: string;
    thumbSub?: string;
    googleDriveUrl?: string;
    mediaAssets?: MediaAssetItem[];
  }

  export const ALL_CONTENT_ASSETS: ContentAsset[] = [
    {
      id: '1',
      title: 'BCA ke baad Job Kaise Milegi?',
      type: 'YouTube Long',
      workflowStatus: 'editing',
      actionStatus: 'in_progress',
      progress: { stage: 'Editing', completed: 3, total: 7, hasActive: true },
      distribution: { status: 'Not Scheduled' },
      source: 'Standalone',
      isParentLink: true,
      repurposing: { readyCount: 0, totalCount: 3 },
      lastUpdated: 'Today',
      duration: '12:34',
      thumbBg: 'bg-gradient-to-br from-amber-950 via-slate-900 to-black text-amber-300',
      thumbText: 'JOB?',
      thumbSub: 'BCA',
      googleDriveUrl: 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j',
    },
    {
      id: '2',
      title: 'Why Your Projects Are Getting You Rejected — Reel 1',
      type: 'Derived Reel',
      reelType: 'Long Video Derived',
      workflowStatus: 'editing',
      actionStatus: 'in_progress',
      progress: { stage: 'Editing', completed: 0, total: 4, hasActive: true },
      distribution: { status: 'Not Scheduled' },
      source: 'From: BCA ke baad Job Kaise Milegi?',
      isParentLink: true,
      lastUpdated: 'Today',
      duration: '0:29',
      thumbBg: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white',
      thumbText: 'REEL 1',
      googleDriveUrl: 'https://drive.google.com/file/d/1reel1-sample',
    },
    {
      id: '3',
      title: 'Why Your Projects Are Getting You Rejected — Reel 2',
      type: 'Derived Reel',
      reelType: 'Long Video Derived',
      workflowStatus: 'pending',
      actionStatus: 'pending',
      progress: { stage: 'Pending', completed: 0, total: 4, hasActive: false },
      distribution: { status: 'Not Scheduled' },
      source: 'From: BCA ke baad Job Kaise Milegi?',
      isParentLink: true,
      lastUpdated: 'Today',
      duration: '0:32',
      thumbBg: 'bg-gradient-to-br from-slate-900 via-purple-950 to-purple-900 text-white',
      thumbText: 'REEL 2',
      googleDriveUrl: 'https://drive.google.com/file/d/1reel2-sample',
    },
    {
      id: '4',
      title: 'Why Your Projects Are Getting You Rejected — Reel 3',
      type: 'Derived Reel',
      reelType: 'Long Video Derived',
      workflowStatus: 'exporting',
      actionStatus: 'in_progress',
      progress: { stage: 'Exporting', completed: 1, total: 4, hasActive: true },
      distribution: { status: 'Not Scheduled' },
      source: 'From: BCA ke baad Job Kaise Milegi?',
      isParentLink: true,
      lastUpdated: 'Yesterday',
      duration: '0:28',
      thumbBg: 'bg-gradient-to-br from-slate-900 via-pink-950 to-rose-900 text-white',
      thumbText: 'REEL 3',
      googleDriveUrl: 'https://drive.google.com/file/d/1reel3-sample',
    },
    {
      id: '5',
      title: '5 Mistakes BCA Students Make While Learning Coding',
      type: 'Standalone Reel',
      reelType: 'Standalone',
      workflowStatus: 'shooting',
      actionStatus: 'in_progress',
      progress: { stage: 'Shooting', completed: 2, total: 7, hasActive: true },
      distribution: { status: 'Not Scheduled' },
      source: 'Standalone',
      lastUpdated: 'Today',
      duration: '0:45',
      thumbBg: 'bg-gradient-to-br from-red-950 via-black to-slate-900 text-red-400',
      thumbText: '5 MISTAKES',
      googleDriveUrl: 'https://drive.google.com/drive/folders/reel5mistakes',
    },
    {
      id: '6',
      title: '3 Skills Every BCA Student Needs',
      type: 'Standalone Reel',
      reelType: 'Standalone',
      workflowStatus: 'scheduled',
      actionStatus: 'completed',
      progress: { stage: 'Scheduled', completed: 5, total: 7, hasActive: true },
      distribution: { status: 'Instagram Scheduled' },
      source: 'Standalone',
      lastUpdated: 'Yesterday',
      duration: '0:35',
      thumbBg: 'bg-gradient-to-br from-amber-950 via-yellow-950 to-black text-amber-300',
      thumbText: '3 SKILLS',
      googleDriveUrl: 'https://drive.google.com/file/d/1skills-reel',
    },
    {
      id: '7',
      title: 'Study Motivation for College Students',
      type: 'Standalone Reel',
      reelType: 'Standalone',
      workflowStatus: 'scheduled',
      actionStatus: 'completed',
      progress: { stage: 'Scheduled', completed: 5, total: 7, hasActive: true },
      distribution: { status: 'YouTube Scheduled' },
      source: 'Standalone',
      lastUpdated: 'Yesterday',
      duration: '0:38',
      thumbBg: 'bg-gradient-to-br from-rose-950 via-black to-slate-900 text-rose-300',
      thumbText: 'STUDY MOTIVATION',
      googleDriveUrl: 'https://drive.google.com/file/d/1studymotivation',
    },
    {
      id: '8',
      title: 'A Day in My College Life',
      type: 'Standalone Reel',
      reelType: 'Standalone',
      workflowStatus: 'scheduled',
      actionStatus: 'completed',
      progress: { stage: 'Editing', completed: 3, total: 7, hasActive: true },
      distribution: { status: 'Both Scheduled' },
      source: 'Standalone',
      lastUpdated: 'Oct 6, 2026',
      duration: '0:27',
      thumbBg: 'bg-gradient-to-br from-emerald-950 via-black to-slate-900 text-emerald-300',
      thumbText: 'DAY IN COLLEGE',
      googleDriveUrl: 'https://drive.google.com/file/d/1dayinlife',
    },
    {
      id: '9',
      title: 'BCA vs BTech — Quick Comparison',
      type: 'Standalone Reel',
      reelType: 'Standalone',
      workflowStatus: 'exported',
      actionStatus: 'completed',
      progress: { stage: 'Ready', completed: 4, total: 7, hasActive: false },
      distribution: { status: 'Not Scheduled' },
      source: 'Standalone',
      lastUpdated: 'Oct 4, 2026',
      duration: '0:31',
      thumbBg: 'bg-gradient-to-br from-orange-950 via-black to-slate-900 text-orange-300',
      thumbText: 'BCA VS BTECH',
      googleDriveUrl: 'https://drive.google.com/file/d/1bcavsbtech-reel',
    },
    {
      id: '10',
      title: 'Best Projects for BCA Students',
      type: 'YouTube Long',
      workflowStatus: 'scheduled',
      actionStatus: 'completed',
      progress: { stage: 'Scheduled', completed: 5, total: 7, hasActive: true },
      distribution: { status: 'YouTube Scheduled', date: 'Oct 12, 2026' },
      source: 'Standalone',
      repurposing: { readyCount: 2, totalCount: 3 },
      lastUpdated: 'Yesterday',
      duration: '14:20',
      thumbBg: 'bg-gradient-to-br from-yellow-950 to-black text-yellow-400',
      thumbText: 'BEST PROJECTS',
      thumbSub: 'PLACEMENT',
      googleDriveUrl: 'https://drive.google.com/drive/folders/bestprojects-yt',
    },
    {
      id: '11',
      title: 'Why Your Projects Are Getting You Rejected',
      type: 'YouTube Long',
      workflowStatus: 'published',
      actionStatus: 'completed',
      progress: { stage: 'Published', completed: 6, total: 7, hasActive: false },
      distribution: { status: 'Published', date: 'Oct 5, 2026' },
      source: 'Standalone',
      repurposing: { readyCount: 3, totalCount: 3 },
      lastUpdated: 'Oct 5, 2026',
      duration: '16:45',
      thumbBg: 'bg-gradient-to-br from-red-950 to-black text-red-400',
      thumbText: 'PROJECTS REJECTED',
      thumbSub: 'FIX THEM',
      googleDriveUrl: 'https://drive.google.com/drive/folders/projectsrejected-yt',
    },
    {
      id: '12',
      title: 'BCA vs BTech — Which One Should You Choose?',
      type: 'YouTube Long',
      workflowStatus: 'published',
      actionStatus: 'completed',
      progress: { stage: 'Published', completed: 6, total: 7, hasActive: false },
      distribution: { status: 'Published', date: 'Sep 24, 2026' },
      source: 'Standalone',
      repurposing: { readyCount: 3, totalCount: 3 },
      lastUpdated: 'Sep 24, 2026',
      duration: '15:10',
      thumbBg: 'bg-gradient-to-br from-orange-950 to-black text-orange-400',
      thumbText: 'BCA VS BTECH',
      thumbSub: 'REALITY',
      googleDriveUrl: 'https://drive.google.com/drive/folders/bcavsbtech-yt',
    },
    {
      id: '13',
      title: 'Why Projects Matter More Than Certificates',
      type: 'LinkedIn',
      subType: 'Informative',
      workflowStatus: 'writing',
      actionStatus: 'in_progress',
      progress: { stage: 'Writing', completed: 1, total: 5, hasActive: true },
      distribution: { status: 'Not Scheduled' },
      source: 'Standalone',
      lastUpdated: 'Today',
      thumbBg: 'bg-gradient-to-br from-blue-900 to-slate-900 text-blue-300',
      thumbText: 'PROJECTS VS CERTIFICATES',
      googleDriveUrl: 'https://drive.google.com/file/d/1linkedin-projects',
    },
    {
      id: '14',
      title: 'How I Would Build a Developer Portfolio as a BCA Student',
      type: 'LinkedIn',
      subType: 'Informative',
      workflowStatus: 'scheduled',
      actionStatus: 'completed',
      progress: { stage: 'Scheduling', completed: 3, total: 5, hasActive: true },
      distribution: { status: 'LinkedIn Scheduled' },
      source: 'Standalone',
      lastUpdated: 'Yesterday',
      thumbBg: 'bg-gradient-to-br from-cyan-950 to-slate-900 text-cyan-300',
      thumbText: 'DEVELOPER PORTFOLIO',
      googleDriveUrl: 'https://drive.google.com/file/d/1linkedin-portfolio',
    },
    {
      id: '15',
      title: 'Your Projects Are Getting You Rejected — Here\'s Why',
      type: 'LinkedIn',
      subType: 'Long Video Related',
      workflowStatus: 'writing',
      actionStatus: 'in_progress',
      progress: { stage: 'Writing', completed: 1, total: 5, hasActive: true },
      distribution: { status: 'Not Scheduled' },
      source: 'From: BCA ke baad Job Kaise Milegi?',
      isParentLink: true,
      lastUpdated: 'Oct 6, 2026',
      thumbBg: 'bg-gradient-to-br from-indigo-950 to-slate-900 text-indigo-300',
      thumbText: 'PROJECTS REJECTED',
      googleDriveUrl: 'https://drive.google.com/file/d/1linkedin-rejected',
    },
    {
      id: '16',
      title: 'BCA to Software Engineer — What Actually Matters',
      type: 'LinkedIn',
      subType: 'Long Video Related',
      workflowStatus: 'published',
      actionStatus: 'completed',
      progress: { stage: 'Published', completed: 4, total: 5, hasActive: false },
      distribution: { status: 'Published' },
      source: 'From: BCA to Software Engineer',
      isParentLink: true,
      lastUpdated: 'Oct 4, 2026',
      thumbBg: 'bg-gradient-to-br from-blue-950 to-slate-900 text-blue-300',
      thumbText: 'BCA TO SWE',
      googleDriveUrl: 'https://drive.google.com/file/d/1linkedin-swe',
    },
    {
      id: '17',
      title: 'How to Choose Your Tech Career?',
      type: 'Carousel',
      workflowStatus: 'creating',
      actionStatus: 'in_progress',
      progress: { stage: 'Create', completed: 1, total: 4, hasActive: true },
      distribution: { status: 'Not Scheduled' },
      source: 'Standalone',
      driveAsset: 'Not Added',
      lastUpdated: 'Today',
      thumbBg: 'bg-gradient-to-br from-indigo-950 to-purple-950 text-indigo-300',
      thumbText: 'TECH CAREER?',
      googleDriveUrl: '',
    },
    {
      id: '18',
      title: 'BCA Roadmap: 1st Year to Job',
      type: 'Carousel',
      workflowStatus: 'scheduled',
      actionStatus: 'completed',
      progress: { stage: 'Scheduled', completed: 3, total: 5, hasActive: true },
      distribution: { status: 'Scheduled' },
      source: 'YouTube: BCA ke baad Job Kaise Milegi?',
      isParentLink: true,
      driveAsset: 'Google Drive ↗',
      lastUpdated: 'Yesterday',
      thumbBg: 'bg-gradient-to-br from-amber-950 to-yellow-950 text-amber-300',
      thumbText: 'BCA ROADMAP',
      googleDriveUrl: 'https://drive.google.com/drive/folders/1bcaroadmap-carousel',
    },
    {
      id: '19',
      title: '7 Things Every BCA Student Should Know',
      type: 'Carousel',
      workflowStatus: 'published',
      actionStatus: 'completed',
      progress: { stage: 'Published', completed: 4, total: 5, hasActive: false },
      distribution: { status: 'Published' },
      source: 'Standalone',
      driveAsset: 'Google Drive ↗',
      lastUpdated: 'Oct 3, 2026',
      thumbBg: 'bg-gradient-to-br from-purple-950 to-indigo-950 text-purple-300',
      thumbText: '7 THINGS',
      googleDriveUrl: 'https://drive.google.com/drive/folders/17things-carousel',
    },
    {
      id: 'asset-react-jobs',
      title: 'React vs Next.js for Jobs',
      type: 'YouTube Long',
      workflowStatus: 'scripting',
      actionStatus: 'in_progress',
      progress: { stage: 'Script', completed: 1, total: 7, hasActive: true },
      distribution: { status: 'Not Scheduled' },
      source: 'Created from Topic: React vs Next.js for Jobs',
      topicId: '2',
      lastUpdated: '20 Sep 2024',
      duration: '14:20',
      thumbBg: 'bg-gradient-to-br from-slate-900 to-cyan-950 text-cyan-400',
      thumbText: 'React vs Next.js',
      thumbSub: 'JOBS',
      googleDriveUrl: 'https://drive.google.com/drive/folders/react-nextjs-jobs',
    }
  ];

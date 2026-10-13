"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  Play,
  Camera,
  Briefcase,
  Layers,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  UploadCloud,
  ExternalLink,
  RotateCw,
  Clock,
  AlertCircle
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
import { ContentAsset } from './contentData';
import { useCreatorOS } from '@/lib/store/creatorStore';
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
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  isAssetBufferReady,
  isAssetInProduction,
  isAssetScheduled,
  isAssetPublished,
  getWorkflowSteps,
  getWorkflowStepIndex,
  getWorkflowStageLabel,
} from '@/lib/domain/contentWorkflow';
import styles from './content.module.css';

export default function ContentPage() {
  const router = useRouter();
  const {
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    advanceAssetStage,
    exportAssetAndDeriveReels,
    topics,
  } = useCreatorOS();
  const [activeTab, setActiveTab] = useState<'All' | 'YouTube' | 'Reels' | 'LinkedIn' | 'Carousel'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [reelTypeFilter, setReelTypeFilter] = useState('All');
  const [postTypeFilter, setPostTypeFilter] = useState('All');
  const [distributionFilter, setDistributionFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Recently Updated');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Add Content form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ContentAsset['type']>('YouTube Long');
  const [newSource, setNewSource] = useState('Standalone');
  const [titleError, setTitleError] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Filtered and Sorted Assets
  const filteredAssets = useMemo(() => {
    let result = assets.filter(item => {
      // Tab filtering
      if (activeTab === 'YouTube' && item.type !== 'YouTube Long') return false;
      if (activeTab === 'Reels' && item.type !== 'Standalone Reel' && item.type !== 'Derived Reel') return false;
      if (activeTab === 'LinkedIn' && item.type !== 'LinkedIn') return false;
      if (activeTab === 'Carousel' && item.type !== 'Carousel') return false;

      // Dropdown filters
      if (activeTab === 'All' && contentTypeFilter !== 'All') {
        if (contentTypeFilter === 'YouTube' && item.type !== 'YouTube Long') return false;
        if (contentTypeFilter === 'Reels' && item.type !== 'Standalone Reel' && item.type !== 'Derived Reel') return false;
        if (contentTypeFilter === 'LinkedIn' && item.type !== 'LinkedIn') return false;
        if (contentTypeFilter === 'Carousel' && item.type !== 'Carousel') return false;
      }

      if (activeTab === 'Reels' && reelTypeFilter !== 'All') {
        if (reelTypeFilter === 'Standalone' && item.type !== 'Standalone Reel') return false;
        if (reelTypeFilter === 'Long Video Derived' && item.type !== 'Derived Reel') return false;
      }

      if (activeTab === 'LinkedIn' && postTypeFilter !== 'All') {
        if (postTypeFilter === 'Informative' && item.subType !== 'Informative') return false;
        if (postTypeFilter === 'Long Video Related' && item.subType !== 'Long Video Related') return false;
      }

      if (statusFilter !== 'All') {
        const wfStatus = item.workflowStatus;
        const sFilter = statusFilter.toLowerCase();
        if (sFilter === 'editing' && wfStatus !== 'editing') return false;
        if (sFilter === 'shooting' && wfStatus !== 'shooting') return false;
        if (sFilter === 'scheduled' && !isAssetScheduled(item)) return false;
        if (sFilter === 'published' && !isAssetPublished(item)) return false;
      }

      if (distributionFilter !== 'All') {
        if (distributionFilter === 'Not Scheduled' && item.distribution.status !== 'Not Scheduled') return false;
        if (distributionFilter === 'Scheduled' && !item.distribution.status.includes('Scheduled')) return false;
        if (distributionFilter === 'Published' && item.distribution.status !== 'Published') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
        );
      }

      return true;
    });

    // Sorting
    if (sortBy === 'Title A-Z') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [assets, activeTab, contentTypeFilter, reelTypeFilter, postTypeFilter, statusFilter, distributionFilter, searchQuery, sortBy]);

  // Tab counts dynamically from shared store
  const allCount = assets.length;
  const youtubeCount = assets.filter(a => a.type === 'YouTube Long').length;
  const reelsCount = assets.filter(a => a.type === 'Standalone Reel' || a.type === 'Derived Reel').length;
  const linkedinCount = assets.filter(a => a.type === 'LinkedIn').length;
  const carouselCount = assets.filter(a => a.type === 'Carousel').length;

  const tabs = [
    { id: 'All', label: 'All', count: allCount, icon: null },
    {
      id: 'YouTube',
      label: 'YouTube',
      count: youtubeCount,
      icon: <Play className="w-4 h-4 text-red-600 fill-red-600" />,
    },
    {
      id: 'Reels',
      label: 'Reels',
      count: reelsCount,
      icon: <Camera className="w-4 h-4 text-pink-500" />,
    },
    {
      id: 'LinkedIn',
      label: 'LinkedIn',
      count: linkedinCount,
      icon: <Briefcase className="w-4 h-4 text-blue-600 fill-blue-600" />,
    },
    {
      id: 'Carousel',
      label: 'Carousel',
      count: carouselCount,
      icon: <Layers className="w-4 h-4 text-amber-500" />,
    },
  ];

  // Dynamic tab stats
  const currentTabAssets = useMemo(() => {
    return assets.filter(item => {
      if (activeTab === 'YouTube') return item.type === 'YouTube Long';
      if (activeTab === 'Reels') return item.type === 'Standalone Reel' || item.type === 'Derived Reel';
      if (activeTab === 'LinkedIn') return item.type === 'LinkedIn';
      if (activeTab === 'Carousel') return item.type === 'Carousel';
      return true;
    });
  }, [assets, activeTab]);

  const stats = useMemo(() => {
    const inProd = currentTabAssets.filter(a => isAssetInProduction(a)).length;
    const ready = currentTabAssets.filter(a => isAssetBufferReady(a)).length;
    const scheduled = currentTabAssets.filter(a => isAssetScheduled(a)).length;
    const published = currentTabAssets.filter(a => isAssetPublished(a)).length;
    return { inProd, ready, scheduled, published };
  }, [currentTabAssets]);

  // Tab subtitle
  const tabSubtitle = {
    All: 'Track every content asset from production to publication.',
    YouTube: 'Manage your YouTube videos from production to publication.',
    Reels: 'Manage your Reels from production to publication.',
    LinkedIn: 'Manage your LinkedIn posts from creation to publication.',
    Carousel: 'Manage your carousel content from creation to publication.',
  }[activeTab];

  // Search placeholder
  const searchPlaceholder = {
    All: 'Search content...',
    YouTube: 'Search YouTube videos...',
    Reels: 'Search Reels...',
    LinkedIn: 'Search LinkedIn posts...',
    Carousel: 'Search carousels...',
  }[activeTab];

  // Checkbox helpers
  const isAllSelected = filteredAssets.length > 0 && filteredAssets.every(a => selectedIds.includes(a.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredAssets.some(a => a.id === id)));
    } else {
      const newIds = Array.from(new Set([...selectedIds, ...filteredAssets.map(a => a.id)]));
      setSelectedIds(newIds);
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAddContent = () => {
    if (!newTitle.trim()) {
      setTitleError('Content title is required');
      return;
    }
    setTitleError('');

    const initialWorkflowStatus =
      newType === 'LinkedIn'
        ? 'writing'
        : newType === 'Carousel'
        ? 'creating'
        : newType === 'Derived Reel'
        ? 'editing'
        : 'scripting';

    const steps = getWorkflowSteps(newType);
    const stepIdx = getWorkflowStepIndex(newType, initialWorkflowStatus);
    const stageLabel = getWorkflowStageLabel(newType, initialWorkflowStatus);

    addAsset({
      title: newTitle.trim(),
      type: newType,
      source: newSource,
      workflowStatus: initialWorkflowStatus,
      actionStatus: 'in_progress',
      progress: {
        stage: stageLabel,
        completed: stepIdx,
        total: steps.length,
        hasActive: true,
      },
      distribution: { status: 'Not Scheduled' },
      lastUpdated: 'Just now',
      duration: newType === 'YouTube Long' ? '12:00' : '0:45',
      thumbBg: 'bg-gradient-to-br from-slate-900 to-blue-950 text-blue-300',
      thumbText: newTitle.slice(0, 10).toUpperCase(),
    });

    setNewTitle('');
    setIsAddOpen(false);
  };

  // Stepper dots renderer
  const renderProgressDots = (progress: ContentAsset['progress']) => {
    const dots = [];
    for (let i = 0; i < progress.total; i++) {
      if (i < progress.completed) {
        dots.push(
          <div
            key={i}
            className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs"
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        );
      } else if (i === progress.completed && progress.hasActive) {
        dots.push(
          <div
            key={i}
            className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 flex items-center justify-center bg-white flex-shrink-0"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          </div>
        );
      } else {
        dots.push(
          <div
            key={i}
            className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-white flex-shrink-0"
          />
        );
      }
    }

    const currentCount = progress.completed + (progress.hasActive ? 1 : 0);

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">{dots}</div>
        <span className="text-xs text-slate-500 font-medium">
          {progress.stage} · {currentCount}/{progress.total}
        </span>
      </div>
    );
  };

  // Distribution status badge renderer
  const renderDistributionBadge = (dist: ContentAsset['distribution']) => {
    if (dist.status === 'Not Scheduled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Not Scheduled
        </span>
      );
    }
    if (dist.status === 'Instagram Scheduled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Camera className="w-3.5 h-3.5 text-pink-500" />
          Instagram Scheduled
        </span>
      );
    }
    if (dist.status === 'YouTube Scheduled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <Play className="w-3.5 h-3.5 text-red-600 fill-red-600" />
          YouTube Scheduled {dist.date && <span className="font-normal text-slate-500 ml-1">· {dist.date}</span>}
        </span>
      );
    }
    if (dist.status === 'Both Scheduled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-purple-50 to-pink-50 text-purple-800 border border-purple-200">
          <div className="flex items-center -space-x-1">
            <Camera className="w-3.5 h-3.5 text-pink-500" />
            <Play className="w-3.5 h-3.5 text-red-600 fill-red-600" />
          </div>
          Both Scheduled
        </span>
      );
    }
    if (dist.status === 'LinkedIn Scheduled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          LinkedIn Scheduled
        </span>
      );
    }
    if (dist.status === 'Scheduled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Calendar className="w-3.5 h-3.5 text-purple-600" />
          Scheduled
        </span>
      );
    }
    if (dist.status === 'Published') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
          Published {dist.date && <span className="font-normal text-slate-500 ml-1">· {dist.date}</span>}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Content</h1>
          <p className="text-sm text-slate-500 mt-1">{tabSubtitle}</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 h-10 shadow-sm rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add Content Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Content Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (titleError) setTitleError('');
                  }}
                  className={`w-full mt-1.5 border rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-1 ${titleError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'}`}
                  placeholder="e.g. Master React in 100 Minutes"
                />
                {titleError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {titleError}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Content Type</label>
                <Select
                  value={newType}
                  onValueChange={(val: any) => setNewType(val)}
                >
                  <SelectTrigger className="w-full mt-1.5 h-10 bg-white border-slate-200">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YouTube Long">YouTube Long Video</SelectItem>
                    <SelectItem value="Standalone Reel">Standalone Reel</SelectItem>
                    <SelectItem value="Derived Reel">Derived Reel</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn Post</SelectItem>
                    <SelectItem value="Carousel">Carousel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Source Relationship</label>
                <Select
                  value={newSource}
                  onValueChange={(val: string) => setNewSource(val)}
                >
                  <SelectTrigger className="w-full mt-1.5 h-10 bg-white border-slate-200">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standalone">Standalone</SelectItem>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={`From: ${t.title}`}>
                        From: {t.title}
                      </SelectItem>
                    ))}
                    {assets
                      .filter((a) => a.type === "YouTube Long")
                      .map((a) => (
                        <SelectItem key={a.id} value={`From: ${a.title}`}>
                          From: {a.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddContent} className="bg-blue-600 hover:bg-blue-700 text-white">
                Create Asset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                setContentTypeFilter('All');
                setStatusFilter('All');
                setPlatformFilter('All');
                setReelTypeFilter('All');
                setPostTypeFilter('All');
                setDistributionFilter('All');
                setSearchQuery('');
              }}
              className={`px-3.5 py-2 rounded-full text-sm font-medium flex items-center gap-2 border transition-all ${
                isActive
                  ? 'bg-white border-blue-500 text-blue-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          {/* Tab Specific Filters */}
          {activeTab === 'All' && (
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-500 mb-1">Content Type</span>
              <Select value={contentTypeFilter} onValueChange={(val) => setContentTypeFilter(val)}>
                <SelectTrigger className="h-10 w-[130px] bg-white border-slate-200 text-sm">
                  <SelectValue placeholder="Content Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Reels">Reels</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {activeTab === 'Reels' && (
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-500 mb-1">Reel Type</span>
              <Select value={reelTypeFilter} onValueChange={(val) => setReelTypeFilter(val)}>
                <SelectTrigger className="h-10 w-[160px] bg-white border-slate-200 text-sm">
                  <SelectValue placeholder="Reel Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Standalone">Standalone</SelectItem>
                  <SelectItem value="Long Video Derived">Long Video Derived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {activeTab === 'LinkedIn' && (
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-500 mb-1">Post Type</span>
              <Select value={postTypeFilter} onValueChange={(val) => setPostTypeFilter(val)}>
                <SelectTrigger className="h-10 w-[160px] bg-white border-slate-200 text-sm">
                  <SelectValue placeholder="Post Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Informative">Informative</SelectItem>
                  <SelectItem value="Long Video Related">Long Video Related</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-500 mb-1">Production Status</span>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
              <SelectTrigger className="h-10 w-[140px] bg-white border-slate-200 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Editing">Editing</SelectItem>
                <SelectItem value="Shooting">Shooting</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(activeTab === 'All' || activeTab === 'Reels' || activeTab === 'LinkedIn' || activeTab === 'Carousel') && (
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-500 mb-1">Distribution</span>
              <Select value={distributionFilter} onValueChange={(val) => setDistributionFilter(val)}>
                <SelectTrigger className="h-10 w-[140px] bg-white border-slate-200 text-sm">
                  <SelectValue placeholder="Distribution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Not Scheduled">Not Scheduled</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-500 mb-1">Sort by</span>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
              <SelectTrigger className="h-10 w-[160px] bg-white border-slate-200 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Recently Updated">Recently Updated</SelectItem>
                <SelectItem value="Title A-Z">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stat Banners matching Images 9, 10, 11, 12, 13 */}
      {activeTab === 'All' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
              <Layers className="w-4 h-4 fill-white" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">{currentTabAssets.length} content assets</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-blue-600" /> {stats.inProd} In Production
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> {stats.ready} Ready
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" /> {stats.scheduled} Scheduled
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-800 border border-green-200 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-green-600" /> {stats.published} Published
            </span>
          </div>
        </div>
      )}

      {activeTab === 'YouTube' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white flex-shrink-0">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">{currentTabAssets.length} YouTube Long Videos</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-blue-600" /> {stats.inProd} In Production
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> {stats.ready} Ready
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" /> {stats.scheduled} Scheduled
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-800 border border-green-200 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-green-600" /> {stats.published} Published
            </span>
          </div>
        </div>
      )}

      {activeTab === 'Reels' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">{currentTabAssets.length} Reel Assets</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-blue-600" /> {stats.inProd} In Production
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> {stats.ready} Ready
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" /> {stats.scheduled} Scheduled
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-800 border border-green-200 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-green-600" /> {stats.published} Published
            </span>
          </div>
        </div>
      )}

      {activeTab === 'LinkedIn' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0077b5] flex items-center justify-center text-white flex-shrink-0">
              <Briefcase className="w-4 h-4 fill-white" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">{currentTabAssets.length} LinkedIn Posts</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-blue-600" /> {stats.inProd} In Production
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> {stats.ready} Ready
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" /> {stats.scheduled} Scheduled
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-800 border border-green-200 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-green-600" /> {stats.published} Published
            </span>
          </div>
        </div>
      )}

      {activeTab === 'Carousel' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white flex-shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">{currentTabAssets.length} Carousel Assets</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-blue-600" /> {stats.inProd} In Production
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> {stats.ready} Ready
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" /> {stats.scheduled} Scheduled
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-800 border border-green-200 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-green-600" /> {stats.published} Published
            </span>
          </div>
        </div>
      )}

      {/* Main Content Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs">
              <tr>
                <th className="px-4 py-3.5 w-10">
                  <div
                    onClick={toggleSelectAll}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                      isAllSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </th>

                {/* Column Headers depending on Tab */}
                {activeTab === 'YouTube' ? (
                  <>
                    <th className="px-4 py-3.5">Video</th>
                    <th className="px-4 py-3.5">Content Type</th>
                    <th className="px-4 py-3.5">Production Progress</th>
                    <th className="px-4 py-3.5">Distribution Status</th>
                    <th className="px-4 py-3.5">Repurposing</th>
                    <th className="px-4 py-3.5">Last Updated</th>
                  </>
                ) : activeTab === 'Reels' ? (
                  <>
                    <th className="px-4 py-3.5">Thumbnail</th>
                    <th className="px-4 py-3.5">Title</th>
                    <th className="px-4 py-3.5">Reel Type</th>
                    <th className="px-4 py-3.5">Production Progress</th>
                    <th className="px-4 py-3.5">Distribution Status</th>
                    <th className="px-4 py-3.5">Source / Related Content</th>
                    <th className="px-4 py-3.5">Last Updated</th>
                  </>
                ) : activeTab === 'LinkedIn' ? (
                  <>
                    <th className="px-4 py-3.5">Preview</th>
                    <th className="px-4 py-3.5">Title</th>
                    <th className="px-4 py-3.5">Post Type</th>
                    <th className="px-4 py-3.5">Production Progress</th>
                    <th className="px-4 py-3.5">Distribution Status</th>
                    <th className="px-4 py-3.5">Source / Related Content</th>
                    <th className="px-4 py-3.5">Last Updated</th>
                  </>
                ) : activeTab === 'Carousel' ? (
                  <>
                    <th className="px-4 py-3.5">Preview</th>
                    <th className="px-4 py-3.5">Title</th>
                    <th className="px-4 py-3.5">Content Type</th>
                    <th className="px-4 py-3.5">Production Progress</th>
                    <th className="px-4 py-3.5">Distribution Status</th>
                    <th className="px-4 py-3.5">Source / Related Content</th>
                    <th className="px-4 py-3.5">Drive Asset</th>
                    <th className="px-4 py-3.5">Last Updated</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3.5">Title</th>
                    <th className="px-4 py-3.5">Content Type</th>
                    <th className="px-4 py-3.5">Production Progress</th>
                    <th className="px-4 py-3.5">Distribution Status</th>
                    <th className="px-4 py-3.5">Source / Related Content</th>
                    <th className="px-4 py-3.5">Last Updated</th>
                  </>
                )}
                <th className="px-4 py-3.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">
                    No content assets found.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const isChecked = selectedIds.includes(asset.id);
                  return (
                    <tr
                      key={asset.id}
                      onClick={() => router.push(`/content/${asset.id}`)}
                      className="hover:bg-slate-50/70 cursor-pointer group transition-colors"
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5" onClick={(e) => toggleSelect(asset.id, e)}>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </td>

                      {/* YouTube Tab Layout (Image 10) */}
                      {activeTab === 'YouTube' ? (
                        <>
                          <td className="px-4 py-3.5 min-w-[320px]">
                            <div className="flex items-center gap-3">
                              <div className={`w-14 h-9 rounded-lg flex flex-col items-center justify-center p-1 text-center leading-none flex-shrink-0 relative overflow-hidden shadow-sm ${asset.thumbBg}`}>
                                <span className="text-[9px] font-black leading-tight max-w-full truncate px-0.5">{asset.thumbText}</span>
                                {asset.duration && (
                                  <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-mono px-1 rounded">
                                    {asset.duration}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate">
                                {asset.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                            <span className="inline-flex items-center gap-1.5">
                              <Play className="w-3.5 h-3.5 text-red-600 fill-red-600" />
                              YouTube Long
                            </span>
                          </td>
                          <td className="px-4 py-3.5">{renderProgressDots(asset.progress)}</td>
                          <td className="px-4 py-3.5">{renderDistributionBadge(asset.distribution)}</td>
                          <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            {asset.repurposing && (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
                                  <Calendar className="w-3 h-3" />
                                  {asset.repurposing.readyCount}/{asset.repurposing.totalCount} Reels Ready
                                </span>
                                <button
                                  onClick={() => setActiveTab('Reels')}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium text-left mt-0.5 inline-flex items-center gap-0.5"
                                >
                                  View 3 Reels →
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">{asset.lastUpdated}</td>
                        </>
                      ) : activeTab === 'Reels' ? (
                        <>
                          {/* Reels Tab Layout (Image 11) */}
                          <td className="px-4 py-3.5">
                            <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center p-1 text-center leading-none flex-shrink-0 relative overflow-hidden shadow-sm ${asset.thumbBg}`}>
                              <span className="text-[9px] font-black leading-tight max-w-full truncate px-0.5">{asset.thumbText}</span>
                              {asset.duration && (
                                <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-mono px-1 rounded">
                                  {asset.duration}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 min-w-[280px]">
                            <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate block">
                              {asset.title}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {asset.reelType === 'Long Video Derived' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                                Long Video Derived
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <Camera className="w-3.5 h-3.5 text-pink-500" />
                                Standalone Reel
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">{renderProgressDots(asset.progress)}</td>
                          <td className="px-4 py-3.5">{renderDistributionBadge(asset.distribution)}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-600">
                            {asset.source === 'Standalone' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                                Standalone
                              </span>
                            ) : (
                              <span className="text-slate-600">{asset.source}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">{asset.lastUpdated}</td>
                        </>
                      ) : activeTab === 'LinkedIn' ? (
                        <>
                          {/* LinkedIn Tab Layout (Image 12) */}
                          <td className="px-4 py-3.5">
                            <div className={`w-14 h-12 rounded-lg flex flex-col items-center justify-center p-1 text-center leading-none flex-shrink-0 shadow-sm ${asset.thumbBg}`}>
                              <span className="text-[8.5px] font-black leading-tight max-w-full truncate px-0.5">{asset.thumbText}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 min-w-[280px]">
                            <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate block">
                              {asset.title}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {asset.subType === 'Informative' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <Briefcase className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                                Informative
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                                Long Video Related
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">{renderProgressDots(asset.progress)}</td>
                          <td className="px-4 py-3.5">{renderDistributionBadge(asset.distribution)}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-600">
                            {asset.source === 'Standalone' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                                Standalone
                              </span>
                            ) : (
                              <span className="text-slate-600">{asset.source}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">{asset.lastUpdated}</td>
                        </>
                      ) : activeTab === 'Carousel' ? (
                        <>
                          {/* Carousel Tab Layout (Image 13) */}
                          <td className="px-4 py-3.5">
                            <div className={`w-14 h-12 rounded-lg flex flex-col items-center justify-center p-1 text-center leading-none flex-shrink-0 shadow-sm ${asset.thumbBg}`}>
                              <span className="text-[8.5px] font-black leading-tight max-w-full truncate px-0.5">{asset.thumbText}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 min-w-[260px]">
                            <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate block">
                              {asset.title}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Layers className="w-3.5 h-3.5 text-amber-500" />
                              Carousel
                            </span>
                          </td>
                          <td className="px-4 py-3.5">{renderProgressDots(asset.progress)}</td>
                          <td className="px-4 py-3.5">{renderDistributionBadge(asset.distribution)}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-600">
                            {asset.source === 'Standalone' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                                Standalone
                              </span>
                            ) : (
                              <span className="text-slate-600">{asset.source}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs">
                            {asset.driveAsset === 'Not Added' ? (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <LinkIcon className="w-3 h-3" /> Not Added
                              </span>
                            ) : (
                              <a
                                href={asset.googleDriveUrl || '#'}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                              >
                                Google Drive <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">{asset.lastUpdated}</td>
                        </>
                      ) : (
                        <>
                          {/* All Tab Layout (Image 9) */}
                          <td className="px-4 py-3.5 min-w-[320px]">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center p-1 text-center leading-none flex-shrink-0 shadow-sm overflow-hidden ${asset.thumbBg}`}>
                                <span className="text-[9px] font-black leading-tight max-w-full truncate px-0.5">{asset.thumbText}</span>
                                {asset.thumbSub && (
                                  <span className="text-[7.5px] font-semibold opacity-75 mt-0.5 max-w-full truncate px-0.5">{asset.thumbSub}</span>
                                )}
                              </div>
                              <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate">
                                {asset.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                            {asset.type === 'YouTube Long' ? (
                              <span className="inline-flex items-center gap-1.5 text-slate-800">
                                <Play className="w-3.5 h-3.5 text-red-600 fill-red-600" />
                                YouTube Long
                              </span>
                            ) : asset.type === 'Derived Reel' ? (
                              <span className="inline-flex items-center gap-1.5 text-purple-700">
                                <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                                Derived Reel
                              </span>
                            ) : asset.type === 'Standalone Reel' ? (
                              <span className="inline-flex items-center gap-1.5 text-slate-800">
                                <Camera className="w-3.5 h-3.5 text-pink-500" />
                                Standalone Reel
                              </span>
                            ) : asset.type === 'LinkedIn' ? (
                              <span className="inline-flex items-center gap-1.5 text-slate-800">
                                <Briefcase className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                                LinkedIn
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-slate-800">
                                <Layers className="w-3.5 h-3.5 text-amber-500" />
                                Carousel
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">{renderProgressDots(asset.progress)}</td>
                          <td className="px-4 py-3.5">{renderDistributionBadge(asset.distribution)}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-600">
                            {asset.source === 'Standalone' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                                Standalone
                              </span>
                            ) : (
                              <span className="text-slate-600">{asset.source}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">{asset.lastUpdated}</td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuItem onClick={() => router.push(`/content/${asset.id}`)}>
                              View Asset Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                advanceAssetStage(asset.id, asset.progress.completed + 1);
                                toast.success(`Advanced stage for "${asset.title}"`);
                              }}
                            >
                              Advance Next Stage
                            </DropdownMenuItem>
                            {asset.type === 'YouTube Long' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const res = exportAssetAndDeriveReels(asset.id);
                                  toast.success(`Exported Long Video & derived ${res.reels.length} Reels!`);
                                }}
                                className="text-purple-700 font-semibold hover:bg-purple-50"
                              >
                                Export & Derive 3 Reels
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => router.push('/calendar')}>
                              Schedule Publication
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                deleteAsset(asset.id);
                                toast.success(`Deleted asset "${asset.title}"`);
                              }}
                              className="text-rose-600 hover:bg-rose-50"
                            >
                              Delete Asset
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 px-1">
        <span>
          Showing 1–{filteredAssets.length} of {filteredAssets.length}{' '}
          {activeTab === 'All'
            ? 'content assets'
            : activeTab === 'YouTube'
            ? 'YouTube videos'
            : activeTab === 'Reels'
            ? 'Reels'
            : activeTab === 'LinkedIn'
            ? 'LinkedIn posts'
            : 'Carousels'}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500" disabled>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500" disabled>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
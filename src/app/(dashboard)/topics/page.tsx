"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Camera,
  Briefcase,
  Layers,
  Calendar,
  CheckCircle2,
  Sparkles,
  Rocket,
  ArrowRight,
  ExternalLink,
  Kanban,
  List,
  ChevronDown,
  Trash2,
  Lightbulb,
  Video,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Topic } from './topicsData';
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
  TOPIC_KANBAN_COLUMNS,
  normalizeTopicStatus,
  type CanonicalTopicStatus,
} from '@/lib/domain/contentWorkflow';

function TopicsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    topics,
    addTopic,
    moveTopicStatus,
    deleteTopic,
    startProductionForTopic,
    assets,
  } = useCreatorOS();

  // Navigation & filter state
  const [activeTab, setActiveTab] = useState<'All' | 'YouTube' | 'Reels' | 'LinkedIn' | 'Carousel' | 'Others'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'Newest First' | 'Oldest First' | 'Title A-Z'>('Newest First');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Add Topic Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState<CanonicalTopicStatus>('idea');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newType, setNewType] = useState<Topic['type']>('YouTube Long');
  const [newSubType, setNewSubType] = useState<Topic['subType'] | undefined>(undefined);
  const [newNotes, setNewNotes] = useState('');
  const [titleError, setTitleError] = useState('');

  // Handle URL navigation for prep task topic creation
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      const typeParam = searchParams.get('type');
      const subTypeParam = searchParams.get('subType');
      if (
        typeParam &&
        ['YouTube Long', 'Standalone Reel', 'LinkedIn', 'Carousel'].includes(typeParam)
      ) {
        setNewType(typeParam as Topic['type']);
      }
      if (subTypeParam) {
        setNewSubType(subTypeParam as any);
      } else if (typeParam === 'LinkedIn') {
        setNewSubType('Informative');
      }
      setTargetColumn('planning');
      setIsAddOpen(true);
    }
  }, [searchParams]);

  // Toast / feedback message state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    assetId?: string;
  } | null>(null);

  // Active dropdown menu state for card actions
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Drag and drop state
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<CanonicalTopicStatus | null>(null);

  // Compute counts for filter pills
  const youtubeCount = useMemo(
    () => topics.filter((t) => t.type === 'YouTube Long').length,
    [topics]
  );
  const reelsCount = useMemo(
    () => topics.filter((t) => t.type === 'Standalone Reel' || t.type === 'Long Video Derived').length,
    [topics]
  );
  const linkedinCount = useMemo(
    () => topics.filter((t) => t.type === 'LinkedIn').length,
    [topics]
  );
  const carouselCount = useMemo(
    () => topics.filter((t) => t.type === 'Carousel').length,
    [topics]
  );
  const othersCount = useMemo(
    () => topics.filter((t) => t.type !== 'YouTube Long' && t.type !== 'Standalone Reel' && t.type !== 'Long Video Derived' && t.type !== 'LinkedIn' && t.type !== 'Carousel').length,
    [topics]
  );

  const filterPills = [
    { id: 'All' as const, label: `All (${topics.length})` },
    { id: 'YouTube' as const, label: `YouTube (${youtubeCount})` },
    { id: 'Reels' as const, label: `Reels (${reelsCount})` },
    { id: 'LinkedIn' as const, label: `LinkedIn (${linkedinCount})` },
    { id: 'Carousel' as const, label: `Carousel (${carouselCount})` },
    { id: 'Others' as const, label: `Others (${othersCount})` },
  ];

  // Filter topics by search query and active tab
  const filteredTopics = useMemo(() => {
    return topics
      .filter((t) => {
        // Tab filter
        if (activeTab === 'YouTube' && t.type !== 'YouTube Long') return false;
        if (activeTab === 'Reels' && t.type !== 'Standalone Reel' && t.type !== 'Long Video Derived') return false;
        if (activeTab === 'LinkedIn' && t.type !== 'LinkedIn') return false;
        if (activeTab === 'Carousel' && t.type !== 'Carousel') return false;
        if (activeTab === 'Others' && (t.type === 'YouTube Long' || t.type === 'Standalone Reel' || t.type === 'Long Video Derived' || t.type === 'LinkedIn' || t.type === 'Carousel')) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            t.title.toLowerCase().includes(q) ||
            (t.subtitle && t.subtitle.toLowerCase().includes(q)) ||
            (t.notes && t.notes.toLowerCase().includes(q)) ||
            t.type.toLowerCase().includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'Title A-Z') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'Oldest First') {
          return a.id.localeCompare(b.id);
        }
        // Newest First (default)
        return b.id.localeCompare(a.id);
      });
  }, [topics, activeTab, searchQuery, sortBy]);

  // Group filtered topics into the 4 Kanban columns
  const columnsData = useMemo(() => {
    const grouped: Record<CanonicalTopicStatus, Topic[]> = {
      idea: [],
      planning: [],
      in_progress: [],
      converted: [],
    };

    filteredTopics.forEach((topic) => {
      const canonical = normalizeTopicStatus(topic.status);
      grouped[canonical].push(topic);
    });

    return grouped;
  }, [filteredTopics]);

  // Handle open Add Modal from specific column
  const handleOpenAdd = (column: CanonicalTopicStatus = 'idea') => {
    setTargetColumn(column);
    setNewTitle('');
    setNewSubtitle('');
    setNewNotes('');
    setNewSubType(undefined);
    setTitleError('');
    setIsAddOpen(true);
  };

  // Submit new topic
  const handleCreateTopic = () => {
    if (!newTitle.trim()) {
      setTitleError('Topic title is required');
      return;
    }
    setTitleError('');

    addTopic({
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || undefined,
      type: newType,
      subType: newType === 'LinkedIn' ? (newSubType || 'Informative') : newType === 'Standalone Reel' ? 'Standalone' : undefined,
      status: targetColumn,
      notes: newNotes.trim() || undefined,
      date: 'Today',
      thumbBg: 'bg-gradient-to-br from-slate-900 to-blue-950 text-blue-300',
      thumbText: newTitle.slice(0, 10).toUpperCase(),
    });

    setIsAddOpen(false);
  };

  // Handle Start Production / Create Content action
  const handleStartProduction = (topicId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const res = startProductionForTopic(topicId);
    if (res.success && res.asset) {
      setToastMessage({
        text: `Content Asset created: "${res.asset.title}". Added to Content and Tasks.`,
        assetId: res.asset.id,
      });
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, topicId: string) => {
    setDraggedTopicId(topicId);
    e.dataTransfer.setData('text/plain', topicId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: CanonicalTopicStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: CanonicalTopicStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const topicId = e.dataTransfer.getData('text/plain') || draggedTopicId;
    if (!topicId) return;

    if (targetStatus === 'converted') {
      // Moving to Done executes conversion to Content Asset
      handleStartProduction(topicId);
    } else {
      moveTopicStatus(topicId, targetStatus);
    }
    setDraggedTopicId(null);
  };

  // Content type badge renderer
  const renderContentTypeBadge = (type: string) => {
    switch (type) {
      case 'YouTube Long':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
            <Play className="w-3 h-3 fill-rose-600 text-rose-600" />
            YouTube Long
          </span>
        );
      case 'Standalone Reel':
      case 'Long Video Derived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
            <Camera className="w-3 h-3 text-purple-600" />
            {type === 'Long Video Derived' ? 'Reel (Derived)' : 'Reel (Standalone)'}
          </span>
        );
      case 'LinkedIn':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
            <Briefcase className="w-3 h-3 text-blue-600 fill-blue-600" />
            LinkedIn Post
          </span>
        );
      case 'Carousel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
            <Layers className="w-3 h-3 text-amber-600" />
            Carousel
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  // Column icon renderer
  const renderColumnIcon = (colId: CanonicalTopicStatus) => {
    switch (colId) {
      case 'idea':
        return (
          <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
        );
      case 'planning':
        return (
          <div className="w-5 h-5 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center">
            <Play className="w-3.5 h-3.5 fill-rose-600" />
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-5 h-5 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
            <Video className="w-3.5 h-3.5" />
          </div>
        );
      case 'converted':
        return (
          <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Top Search & Global Add Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
          />
        </div>

        <Button
          onClick={() => handleOpenAdd('idea')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 h-9 rounded-xl shadow-xs flex items-center gap-1.5 transition-all self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Topic
        </Button>
      </div>

      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Topics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          All your content ideas in one place. Turn ideas into content when you&apos;re ready.
        </p>
      </div>

      {/* Filter Tabs, Sort, and View Modes */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {filterPills.map((pill) => {
            const isActive = activeTab === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setActiveTab(pill.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Right Controls: Sort & View switcher */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-[130px] h-8 text-xs font-semibold bg-white border-slate-200 rounded-xl">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Newest First">Newest First</SelectItem>
              <SelectItem value="Oldest First">Oldest First</SelectItem>
              <SelectItem value="Title A-Z">Title A-Z</SelectItem>
            </SelectContent>
          </Select>

          {/* View Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          {toastMessage.assetId && (
            <Link
              href={`/content/${toastMessage.assetId}`}
              className="font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 shrink-0 ml-4"
            >
              View Asset <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. KANBAN BOARD VIEW (4 COLUMNS: Idea | Planning | In Progress | Done)     */}
      {/* ========================================================================= */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {TOPIC_KANBAN_COLUMNS.map((col) => {
            const columnTopics = columnsData[col.id] || [];
            const isDropTarget = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`bg-[#F8FAFC]/90 border rounded-2xl p-4 flex flex-col gap-3 min-h-[620px] transition-colors ${
                  isDropTarget
                    ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-100'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Column Header */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderColumnIcon(col.id)}
                      <h3 className="font-bold text-slate-900 text-sm">{col.title}</h3>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeBg} ${col.badgeText}`}>
                        {columnTopics.length}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {col.description}
                  </p>

                  {/* Add Topic button inside column */}
                  <button
                    onClick={() => handleOpenAdd(col.id)}
                    className="w-full mt-3 py-1.5 rounded-lg border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Topic
                  </button>
                </div>

                {/* Column Cards Container */}
                <div className="space-y-3 flex-1 mt-1">
                  {columnTopics.map((topic) => {
                    const isDone = col.id === 'converted';
                    const isInProgress = col.id === 'in_progress';
                    const linkedAsset = topic.contentAssetId
                      ? assets.find((a) => a.id === topic.contentAssetId)
                      : assets.find((a) => a.topicId === topic.id);

                    return (
                      <div
                        key={topic.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, topic.id)}
                        onClick={() => router.push(`/topics/${topic.id}`)}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer relative group flex flex-col justify-between gap-2.5"
                      >
                        {/* Top: Title & Options Menu */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {topic.title}
                          </h4>

                          {/* 3-dots action menu */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                  title="Topic Options"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 text-xs">
                                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                  Move to Column
                                </DropdownMenuLabel>
                                {col.id !== 'idea' && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      moveTopicStatus(topic.id, 'idea');
                                      toast.success(`Moved "${topic.title}" to Idea`);
                                    }}
                                  >
                                    💡 Move to Idea
                                  </DropdownMenuItem>
                                )}
                                {col.id !== 'planning' && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      moveTopicStatus(topic.id, 'planning');
                                      toast.success(`Moved "${topic.title}" to Planning`);
                                    }}
                                  >
                                    ▷ Move to Planning
                                  </DropdownMenuItem>
                                )}
                                {col.id !== 'in_progress' && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      moveTopicStatus(topic.id, 'in_progress');
                                      toast.success(`Moved "${topic.title}" to In Progress`);
                                    }}
                                  >
                                    📹 Move to In Progress
                                  </DropdownMenuItem>
                                )}
                                {!linkedAsset ? (
                                  <DropdownMenuItem
                                    onClick={() => handleStartProduction(topic.id)}
                                    className="text-blue-700 font-bold hover:bg-blue-50"
                                  >
                                    🚀 Start Production
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/content/${linkedAsset.id}`)}
                                    className="text-blue-700 font-bold hover:bg-blue-50"
                                  >
                                    🎬 Open Content Asset
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push(`/topics/${topic.id}`)}>
                                  View Topic Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    deleteTopic(topic.id);
                                    toast.success(`Deleted topic "${topic.title}"`);
                                  }}
                                  className="text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Topic
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Content Type badge */}
                        <div>{renderContentTypeBadge(topic.type)}</div>

                        {/* Subtitle / Concept preview if present */}
                        {topic.subtitle && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {topic.subtitle}
                          </p>
                        )}

                        {/* Date Added row */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Added {topic.date}</span>
                        </div>

                        {/* Special Action Row for In Progress Column */}
                        {isInProgress && (
                          <div
                            className="pt-2 border-t border-slate-100 mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {linkedAsset ? (
                              <Link
                                href={`/content/${linkedAsset.id}`}
                                className="w-full px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-[11px] rounded-lg flex items-center justify-between transition-colors group/link"
                              >
                                <span className="flex items-center gap-1 truncate">
                                  <Rocket className="w-3.5 h-3.5 text-blue-600" />
                                  In Production · {linkedAsset.progress?.stage || 'Script'}
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform shrink-0" />
                              </Link>
                            ) : (
                              <Button
                                onClick={(e) => handleStartProduction(topic.id, e)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] h-7 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Rocket className="w-3.5 h-3.5" /> Start Production
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Special Action Row for Done (Converted) Column */}
                        {isDone && linkedAsset && (
                          <div
                            className="pt-2 border-t border-slate-100 mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              href={`/content/${linkedAsset.id}`}
                              className="w-full px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-[11px] rounded-lg flex items-center justify-between transition-colors group/link"
                            >
                              <span className="flex items-center gap-1 truncate">
                                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                Content Created
                              </span>
                              <span className="text-[10px] text-emerald-700 flex items-center gap-0.5 shrink-0 group-hover/link:translate-x-0.5 transition-transform">
                                View Asset →
                              </span>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {columnTopics.length === 0 && (
                    <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                      No topics in this column.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. LIST VIEW (Alternative view for dense inventory management)            */
        /* ========================================================================= */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Topic Title</th>
                  <th className="px-4 py-3">Content Type</th>
                  <th className="px-4 py-3">Kanban Status</th>
                  <th className="px-4 py-3">Date Added</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTopics.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500 text-xs">
                      No topics found. Click &quot;+ Add Topic&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  filteredTopics.map((topic) => {
                    const canonical = normalizeTopicStatus(topic.status);
                    const isDone = canonical === 'converted';
                    const linkedAsset = topic.contentAssetId
                      ? assets.find((a) => a.id === topic.contentAssetId)
                      : assets.find((a) => a.topicId === topic.id);

                    return (
                      <tr
                        key={topic.id}
                        onClick={() => router.push(`/topics/${topic.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5 font-bold text-slate-900 max-w-md">
                          <div className="truncate">{topic.title}</div>
                          {topic.subtitle && (
                            <div className="text-[11px] font-normal text-slate-500 truncate mt-0.5">
                              {topic.subtitle}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">{renderContentTypeBadge(topic.type)}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              canonical === 'idea'
                                ? 'bg-amber-100 text-amber-800'
                                : canonical === 'planning'
                                ? 'bg-rose-100 text-rose-800'
                                : canonical === 'in_progress'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {canonical === 'converted' ? 'Done' : canonical.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">{topic.date}</td>
                        <td
                          className="px-4 py-3.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {linkedAsset ? (
                            <Link
                              href={`/content/${linkedAsset.id}`}
                              className="inline-flex items-center gap-1 text-blue-700 font-bold hover:underline text-xs"
                            >
                              View Asset →
                            </Link>
                          ) : (
                            <Button
                              onClick={(e) => handleStartProduction(topic.id, e)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-7 px-3 rounded-lg shadow-xs"
                            >
                              Start Production
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD TOPIC DIALOG MODAL                                                    */}
      {/* ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Add New Topic
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Topic Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Best College for BCA"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (titleError) setTitleError('');
                }}
                className={`w-full border rounded-lg h-9 px-3 text-xs focus:outline-none focus:ring-2 ${
                  titleError
                    ? 'border-rose-400 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {titleError && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{titleError}</p>
              )}
            </div>

            {/* Subtitle / Concept */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Subtitle / Core Concept <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Career roadmap for students who want high-paying software jobs"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                className="w-full border border-slate-200 rounded-lg h-9 px-3 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Content Type & Initial Column */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Content Type
                </label>
                <Select
                  value={newType}
                  onValueChange={(val: any) => {
                    setNewType(val);
                    if (val === 'LinkedIn' && !newSubType) {
                      setNewSubType('Informative');
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YouTube Long">YouTube Long</SelectItem>
                    <SelectItem value="Standalone Reel">Standalone Reel</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn Post</SelectItem>
                    <SelectItem value="Carousel">Carousel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kanban Column
                </label>
                <Select
                  value={targetColumn}
                  onValueChange={(val: any) => setTargetColumn(val)}
                >
                  <SelectTrigger className="w-full h-9 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">💡 Idea (Default)</SelectItem>
                    <SelectItem value="planning">▷ Planning</SelectItem>
                    <SelectItem value="in_progress">📹 In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newType === 'LinkedIn' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  LinkedIn Category
                </label>
                <Select
                  value={newSubType || 'Informative'}
                  onValueChange={(val: any) => setNewSubType(val)}
                >
                  <SelectTrigger className="w-full h-9 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Informative">Informative</SelectItem>
                    <SelectItem value="Long Video Related">Long Video Related</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Notes & Brainstorming <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
              </label>
              <textarea
                placeholder="Key talking points, hooks, or reference resources..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="text-xs">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleCreateTopic}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4"
            >
              Add Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TopicsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-slate-500">Loading topics...</div>}>
      <TopicsContent />
    </React.Suspense>
  );
}
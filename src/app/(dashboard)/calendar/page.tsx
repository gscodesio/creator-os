"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  Play,
  Video,
  Briefcase,
  LayoutTemplate,
  Calendar as CalendarIcon,
  Plus,
  AlertCircle,
  Check,
  Info,
  Rocket,
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
import { useCreatorOS, CalendarEvent, formatDisplayDate } from '@/lib/store/creatorStore';
import { getEffectiveDate, parseDateString } from '@/lib/domain/dateUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function CalendarPage() {
  const router = useRouter();
  const { calendarEvents, scheduleContent, assets, settings, launchReadiness } = useCreatorOS();

  const [activeTab, setActiveTab] = useState<'All' | 'YouTube' | 'Instagram' | 'LinkedIn' | 'Carousel'>('All');
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Year'>('Month');

  const effectiveDate = useMemo(() => getEffectiveDate(settings), [settings]);
  const effectiveObj = useMemo(() => parseDateString(effectiveDate), [effectiveDate]);

  // Month navigation: dynamically initialize from effective date
  const [currentYear, setCurrentYear] = useState(() => effectiveObj.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(() => effectiveObj.getMonth());

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const [schedPlatform, setSchedPlatform] = useState<"youtube" | "instagram" | "linkedin" | "carousel">("youtube");
  const [schedDate, setSchedDate] = useState(() => effectiveDate);
  const [schedTime, setSchedTime] = useState("10:00 AM");
  const [schedError, setSchedError] = useState("");
  const [schedSuccess, setSchedSuccess] = useState(false);

  // Sync selected asset when assets array changes
  React.useEffect(() => {
    if ((!selectedAssetId || !assets.some((a) => a.id === selectedAssetId)) && assets.length > 0) {
      setSelectedAssetId(assets[0].id);
      const sel = assets[0];
      if (sel.type === 'YouTube Long') setSchedPlatform('youtube');
      else if (sel.type === 'LinkedIn') setSchedPlatform('linkedin');
      else if (sel.type === 'Carousel') setSchedPlatform('carousel');
      else setSchedPlatform('instagram');
    }
  }, [assets, selectedAssetId]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrev = () => {
    if (viewMode === 'Year') {
      setCurrentYear((prev) => prev - 1);
    } else {
      if (currentMonthIndex === 0) {
        setCurrentMonthIndex(11);
        setCurrentYear((prev) => prev - 1);
      } else {
        setCurrentMonthIndex((prev) => prev - 1);
      }
    }
  };

  const handleNext = () => {
    if (viewMode === 'Year') {
      setCurrentYear((prev) => prev + 1);
    } else {
      if (currentMonthIndex === 11) {
        setCurrentMonthIndex(0);
        setCurrentYear((prev) => prev + 1);
      } else {
        setCurrentMonthIndex((prev) => prev + 1);
      }
    }
  };

  const handleJumpToday = () => {
    const today = parseDateString(effectiveDate);
    setCurrentYear(today.getFullYear());
    setCurrentMonthIndex(today.getMonth());
  };

  const tabs = [
    { name: 'All', icon: null },
    { name: 'YouTube', icon: <Play className="w-4 h-4 text-red-500 fill-red-500" /> },
    { name: 'Instagram', icon: <Video className="w-4 h-4 text-pink-500" /> },
    { name: 'LinkedIn', icon: <Briefcase className="w-4 h-4 text-blue-600 fill-blue-600" /> },
    { name: 'Carousel', icon: <LayoutTemplate className="w-4 h-4 text-orange-500" /> },
  ];

  // Filtered events
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter((ev) => {
      if (activeTab === 'YouTube') return ev.type === 'youtube';
      if (activeTab === 'Instagram') return ev.type === 'instagram';
      if (activeTab === 'LinkedIn') return ev.type === 'linkedin';
      if (activeTab === 'Carousel') return ev.type === 'carousel';
      return true;
    });
  }, [calendarEvents, activeTab]);

  // Compute calendar grid for the current month
  const calendarGrid = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonthIndex, 0).getDate();

    const cells: Array<{
      date: number;
      monthIndex: number;
      isCurrentMonth: boolean;
      today?: boolean;
      events: CalendarEvent[];
    }> = [];

    // Prev month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      cells.push({
        date: dayNum,
        monthIndex: currentMonthIndex - 1,
        isCurrentMonth: false,
        events: [],
      });
    }

    // Current month days
    const todayObj = parseDateString(effectiveDate);
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const isToday =
        currentYear === todayObj.getFullYear() &&
        currentMonthIndex === todayObj.getMonth() &&
        day === todayObj.getDate();
      const dayEvents = filteredEvents.filter((ev) => {
        // match year/month
        if (ev.fullDateStr) {
          const parts = ev.fullDateStr.split('-');
          return (
            parseInt(parts[0], 10) === currentYear &&
            parseInt(parts[1], 10) === currentMonthIndex + 1 &&
            parseInt(parts[2], 10) === day
          );
        }
        return ev.date === day && ev.month.toLowerCase().includes(monthNames[currentMonthIndex].toLowerCase());
      });

      cells.push({
        date: day,
        monthIndex: currentMonthIndex,
        isCurrentMonth: true,
        today: isToday,
        events: dayEvents,
      });
    }

    // Next month padding to fill 35 or 42 cells
    const remaining = 35 - cells.length > 0 ? 35 - cells.length : 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: i,
        monthIndex: currentMonthIndex + 1,
        isCurrentMonth: false,
        events: [],
      });
    }

    return cells;
  }, [currentYear, currentMonthIndex, filteredEvents, monthNames]);

  const handleScheduleSubmit = async () => {
    setSchedError('');
    if (!selectedAssetId) {
      setSchedError('Please select a content asset.');
      return;
    }

    const res = await scheduleContent({
      contentId: selectedAssetId,
      platform: schedPlatform,
      date: schedDate,
      time: schedTime,
    });

    if (!res.success) {
      setSchedError(res.error || 'Failed to schedule content.');
    } else {
      setSchedSuccess(true);
      setTimeout(() => {
        setSchedSuccess(false);
        setIsScheduleOpen(false);
      }, 1400);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto min-h-screen">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
          <p className="text-slate-500 mt-1">See your publishing schedule across every platform.</p>
        </div>

        {settings.isConfigured === false ? (
          <div className="w-full lg:w-auto flex-1 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-medium">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>First-Time Setup:</strong> Configure your launch date and publishing rules in Settings to activate automated calendar scheduling.
              </span>
            </div>
            <Link
              href="/settings"
              className="text-blue-800 hover:text-blue-950 font-bold underline shrink-0 text-[11px]"
            >
              Configure Settings →
            </Link>
          </div>
        ) : launchReadiness.isPreLaunch ? (
          <div className="w-full lg:w-auto flex-1 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <Rocket className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Pre-Launch Mode:</strong> Publishing begins <strong>{formatDisplayDate(launchReadiness.overallStartDate)}</strong>. Dates before launch are buffer preparation days.
              </span>
            </div>
            <Link
              href="/settings/buffer"
              className="text-amber-800 hover:text-amber-950 font-bold underline shrink-0 text-[11px]"
            >
              Launch Plan →
            </Link>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {/* View Modes */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-1">
            {(['Month', 'Week', 'Year'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={handleJumpToday}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="px-4 py-2 flex items-center gap-2 border border-slate-200 rounded-lg bg-white shadow-sm text-sm font-semibold text-slate-700 min-w-[150px] justify-center">
              {viewMode === 'Year'
                ? currentYear
                : `${monthNames[currentMonthIndex]} ${currentYear}`}
            </div>
            <button
              onClick={handleNext}
              className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 shadow-sm cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
                activeTab === tab.name
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 h-10 shadow-sm rounded-lg flex items-center gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Schedule Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Schedule Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              {assets.length === 0 ? (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                  <p className="font-bold mb-0.5">No Content Assets Available</p>
                  You haven&apos;t created any content assets yet. Create a topic and click &ldquo;Start Production&rdquo; to produce assets before scheduling.
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Content Asset</label>
                  <Select
                    value={selectedAssetId}
                    onValueChange={(id) => {
                      setSelectedAssetId(id);
                      const sel = assets.find((a) => a.id === id);
                      if (sel) {
                        if (sel.type === 'YouTube Long') setSchedPlatform('youtube');
                        else if (sel.type === 'LinkedIn') setSchedPlatform('linkedin');
                        else if (sel.type === 'Carousel') setSchedPlatform('carousel');
                        else setSchedPlatform('instagram');
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-10 bg-white border-slate-200 text-sm">
                      <SelectValue placeholder="Select an asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          [{asset.type}] {asset.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Platform</label>
                <Select
                  value={schedPlatform}
                  onValueChange={(val: any) => setSchedPlatform(val)}
                >
                  <SelectTrigger className="w-full h-10 bg-white border-slate-200 text-sm">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube (Long / Shorts)</SelectItem>
                    <SelectItem value="instagram">Instagram Reel</SelectItem>
                    <SelectItem value="linkedin">LinkedIn Post</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Time</label>
                  <input
                    type="text"
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full border border-slate-200 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-blue-800 leading-normal">
                <p className="font-semibold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  Product Rules Enforced:
                </p>
                <p className="mt-0.5 text-blue-700">
                  Cross-platform gap of 2 to 5 days between Instagram and YouTube Shorts. Same-day release is blocked.
                </p>
              </div>

              {schedError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{schedError}</span>
                </div>
              )}

              {schedSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Content scheduled and reflected across Calendar!</span>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleScheduleSubmit}
                disabled={assets.length === 0}
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main View Display */}
      {viewMode === 'Month' && (
        <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-3 text-center text-[13px] font-medium text-slate-500 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Dates Grid */}
          <div className="flex-1 grid grid-cols-7 bg-slate-200 gap-px">
            {calendarGrid.map((day, idx) => (
              <div
                key={idx}
                className={`bg-white min-h-[130px] p-2 relative flex flex-col ${
                  day.today ? 'ring-2 ring-inset ring-blue-600 z-10' : ''
                } ${!day.isCurrentMonth ? 'bg-slate-50/50' : ''}`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className={`text-sm font-semibold ${!day.isCurrentMonth ? 'text-slate-400' : 'text-slate-900'}`}>
                    {day.date}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {day.today && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                    {day.isCurrentMonth && `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}` === launchReadiness.overallStartDate && (
                      <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                        <Rocket className="w-2.5 h-2.5" /> Launch
                      </span>
                    )}
                    {day.isCurrentMonth && launchReadiness.isPreLaunch && `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}` < launchReadiness.overallStartDate && (
                      <span className="text-amber-700 text-[8px] font-bold bg-amber-50 border border-amber-200/60 px-1 py-0.2 rounded">
                        Prep
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[140px]">
                  {day.events.map((item, i) => {
                    let bg = 'bg-slate-50';
                    let text = 'text-slate-900';
                    let timeText = 'text-slate-600';
                    let icon = <CalendarIcon className="w-3 h-3 text-slate-500" />;

                    if (item.type === 'youtube') {
                      bg = 'bg-red-50 hover:bg-red-100/80';
                      timeText = 'text-red-600';
                      icon = <Play className="w-3 h-3 text-red-600 fill-current" />;
                    } else if (item.type === 'instagram') {
                      bg = 'bg-purple-50 hover:bg-purple-100/80';
                      timeText = 'text-purple-600';
                      icon = <Video className="w-3 h-3 text-purple-600" />;
                    } else if (item.type === 'linkedin') {
                      bg = 'bg-blue-50 hover:bg-blue-100/80';
                      timeText = 'text-blue-600';
                      icon = <Briefcase className="w-3 h-3 text-blue-600 fill-current" />;
                    } else {
                      bg = 'bg-orange-50 hover:bg-orange-100/80';
                      timeText = 'text-orange-600';
                      icon = <LayoutTemplate className="w-3 h-3 text-orange-600" />;
                    }

                    return (
                      <div
                        key={i}
                        onClick={() => router.push(`/content/${item.contentId}`)}
                        className={`p-1.5 rounded-lg ${bg} flex flex-col gap-0.5 transition-colors cursor-pointer border border-transparent hover:border-slate-300`}
                        title={item.title}
                      >
                        <div className="flex justify-between items-center">
                          {icon}
                          <span className={`text-[10px] font-bold ${timeText}`}>{item.time}</span>
                        </div>
                        <div className={`text-[11px] font-semibold leading-tight line-clamp-2 ${text}`}>
                          {item.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'Week' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-lg">
              Week of {monthNames[currentMonthIndex]} 4 – 10, {currentYear}
            </h3>
            <span className="text-xs text-slate-500 font-medium">7-Day Production Focus</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {['Sun 4', 'Mon 5', 'Tue 6', 'Wed 7', 'Thu 8', 'Fri 9', 'Sat 10'].map((dayStr, dIdx) => {
              const dayNum = 4 + dIdx;
              const isToday = dayNum === 7;
              const dayEvents = filteredEvents.filter((e) => e.date === dayNum);

              return (
                <div
                  key={dayStr}
                  className={`border rounded-xl p-3 flex flex-col min-h-[220px] ${
                    isToday ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-700">{dayStr}</span>
                    {isToday && (
                      <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mt-1 flex-1">
                    {dayEvents.map((ev, eIdx) => (
                      <div
                        key={eIdx}
                        onClick={() => router.push(`/content/${ev.contentId}`)}
                        className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                          <span className="capitalize">{ev.type}</span>
                          <span>{ev.time}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 line-clamp-2">{ev.title}</p>
                      </div>
                    ))}
                    {dayEvents.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic text-center py-6">No scheduled posts</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'Year' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-lg">Annual Overview &mdash; {currentYear}</h3>
            <span className="text-xs text-slate-500 font-medium">12-Month Content Distribution</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {monthNames.map((mName, mIdx) => {
              const isSelected = mIdx === currentMonthIndex;
              const countInMonth = filteredEvents.filter((e) =>
                e.month.toLowerCase().includes(mName.toLowerCase())
              ).length;

              return (
                <div
                  key={mName}
                  onClick={() => {
                    setCurrentMonthIndex(mIdx);
                    setViewMode('Month');
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{mName}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        countInMonth > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {countInMonth} posts
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {countInMonth > 0
                      ? `${countInMonth} scheduled publication dates.`
                      : 'No releases planned yet.'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
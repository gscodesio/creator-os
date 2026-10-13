"use client";

import React from "react";
import {
  CheckSquare,
  Layers,
  Calendar,
  Search,
  FileText,
  Video,
  Palette,
  MoreHorizontal,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  BarChart3,
  Settings,
  Clock,
  Play,
  ArrowRight,
} from "lucide-react";

export function LaptopPreview() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Laptop Screen Bezel */}
      <div className="bg-slate-900 rounded-t-2xl sm:rounded-t-3xl p-2 sm:p-3 pb-0 shadow-2xl border border-slate-700/80 relative">
        {/* Camera Dot */}
        <div className="flex justify-center mb-1.5 sm:mb-2">
          <div className="w-2 h-2 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center">
            <div className="w-0.5 h-0.5 rounded-full bg-slate-950" />
          </div>
        </div>

        {/* Inner Screen Display */}
        <div className="bg-white rounded-t-lg sm:rounded-t-xl overflow-hidden border border-slate-200/90 text-slate-800 shadow-inner flex h-[480px] sm:h-[540px]">
          {/* Left Mini Sidebar */}
          <aside className="w-48 sm:w-56 bg-slate-50/90 border-r border-slate-200/80 p-3.5 flex flex-col justify-between shrink-0 select-none">
            <div className="space-y-4">
              {/* Brand Logo */}
              <div className="flex items-center gap-2 px-1">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                </div>
                <div>
                  <span className="font-extrabold text-xs tracking-wider text-slate-900 block leading-tight">
                    CREATOR OS
                  </span>
                  <span className="text-[8px] font-semibold text-slate-400 tracking-widest uppercase block">
                    WORKSPACE
                  </span>
                </div>
              </div>

              {/* Search Mockup */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  readOnly
                  placeholder="Search ideas, tasks..."
                  className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-600 placeholder:text-slate-400 outline-none"
                />
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1 text-[11px] font-medium text-slate-600">
                <div className="bg-blue-50 text-blue-600 font-semibold rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </div>
                <div className="hover:bg-slate-100 rounded-lg px-2.5 py-1.5 flex items-center gap-2 cursor-pointer transition-colors">
                  <Lightbulb className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ideas</span>
                </div>
                <div className="hover:bg-slate-100 rounded-lg px-2.5 py-1.5 flex items-center gap-2 cursor-pointer transition-colors">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Content</span>
                </div>
                <div className="hover:bg-slate-100 rounded-lg px-2.5 py-1.5 flex items-center gap-2 cursor-pointer transition-colors">
                  <ListTodo className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tasks</span>
                </div>
                <div className="hover:bg-slate-100 rounded-lg px-2.5 py-1.5 flex items-center gap-2 cursor-pointer transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Calendar</span>
                </div>
                <div className="hover:bg-slate-100 rounded-lg px-2.5 py-1.5 flex items-center gap-2 cursor-pointer transition-colors">
                  <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Analytics</span>
                </div>
                <div className="hover:bg-slate-100 rounded-lg px-2.5 py-1.5 flex items-center gap-2 cursor-pointer transition-colors">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Settings</span>
                </div>
              </nav>
            </div>

            {/* User Profile Pill at Bottom of Sidebar */}
            <div className="border-t border-slate-200/80 pt-3 flex items-center gap-2.5 px-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                G
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight">
                  Gopal Mishra
                </p>
                <p className="text-[9px] text-slate-400 truncate">
                  Creator Workspace
                </p>
              </div>
            </div>
          </aside>

          {/* Main Dashboard Area */}
          <main className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col bg-slate-50/40">
            {/* Top Greeting Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  Good morning, Gopal <span className="inline-block animate-pulse">👋</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Here&apos;s what&apos;s on for today
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Fri, 10 Oct 2026</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-700">
                  GM
                </div>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-3 my-4">
              {/* Card 1: Today's Tasks */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    Today&apos;s tasks
                  </span>
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  5 pending
                </div>
              </div>

              {/* Card 2: Content in-progress */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    Content in-progress
                  </span>
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  8 active
                </div>
              </div>

              {/* Card 3: Publishing this week */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    Publishing this week
                  </span>
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  4 scheduled
                </div>
              </div>
            </div>

            {/* Today's Tasks List Section */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Today&apos;s tasks
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                      5 tasks • 3 hours est.
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
                    View all <ArrowRight className="w-3 h-3" />
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Task 1 */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-4 h-4 rounded border border-slate-300 bg-white flex items-center justify-center shrink-0 cursor-pointer" />
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          Final script edit — Why most projects fail
                        </p>
                        <p className="text-[10px] text-slate-400">Long Video</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/60">
                        High
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" /> 1.5 hrs
                      </span>
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Task 2 */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-4 h-4 rounded border border-slate-300 bg-white flex items-center justify-center shrink-0 cursor-pointer" />
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Video className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          Edit Short — 3 lessons from my first job
                        </p>
                        <p className="text-[10px] text-slate-400">YouTube Short</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200/60">
                        Medium
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" /> 1.2 hrs
                      </span>
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Task 3 */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-4 h-4 rounded border border-slate-300 bg-white flex items-center justify-center shrink-0 cursor-pointer" />
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Palette className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          Design thumbnail
                        </p>
                        <p className="text-[10px] text-slate-400">Long Video</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-200/60">
                        Low
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" /> 30 min
                      </span>
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Laptop Base Bottom Bezel */}
      <div className="relative mx-auto max-w-[94%] h-3 sm:h-4 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded-b-xl shadow-xl flex justify-center items-start">
        <div className="w-16 sm:w-20 h-1 bg-slate-600/60 rounded-b-sm" />
      </div>
    </div>
  );
}

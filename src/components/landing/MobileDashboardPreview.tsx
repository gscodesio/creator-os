"use client";

import React from "react";
import {
  Bell,
  Home,
  Calendar as CalendarIcon,
  Plus,
  BarChart3,
  MoreHorizontal,
  FileText,
  Video,
  Palette,
  Play,
  ArrowRight,
} from "lucide-react";

export function MobileDashboardPreview() {
  return (
    <div className="w-full max-w-[350px] mx-auto">
      {/* Mobile App Screen Shell */}
      <div className="bg-white rounded-[2.2rem] border-[6px] border-slate-900 shadow-2xl overflow-hidden relative">
        {/* Phone Speaker Notch */}
        <div className="w-24 h-4 bg-slate-900 mx-auto rounded-b-xl flex items-center justify-center -mt-0.5">
          <div className="w-8 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Top App Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Play className="w-3 h-3 fill-white ml-0.5" />
            </div>
            <span className="font-extrabold text-xs tracking-wider text-slate-900">
              Creator OS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative text-slate-500">
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute top-0 right-0" />
            </div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
              G
            </div>
          </div>
        </div>

        {/* App Content Body */}
        <div className="p-4 bg-slate-50/60 min-h-[380px] flex flex-col justify-between">
          <div>
            {/* Today's Tasks Section Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-xs font-bold text-slate-900">
                Today&apos;s tasks
              </h4>
              <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-0.5">
                View all <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            {/* Task Cards */}
            <div className="space-y-2.5">
              {/* Task 1 */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-4 h-4 rounded border border-slate-300 bg-white flex items-center justify-center shrink-0 cursor-pointer" />
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      Write script
                    </p>
                    <p className="text-[10px] text-slate-400">Long Video</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center">
                    G
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/50">
                    High
                  </span>
                  <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* Task 2 */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-4 h-4 rounded border border-slate-300 bg-white flex items-center justify-center shrink-0 cursor-pointer" />
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      Edit short
                    </p>
                    <p className="text-[10px] text-slate-400">YouTube Short</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold flex items-center justify-center">
                    G
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200/50">
                    Medium
                  </span>
                  <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* Task 3 */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
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
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold flex items-center justify-center">
                    G
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-200/50">
                    Low
                  </span>
                  <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Native Mobile Bottom Navigation Bar */}
        <div className="bg-white border-t border-slate-200/80 px-4 py-2 flex items-center justify-between relative shadow-lg">
          {/* Home */}
          <div className="flex flex-col items-center text-blue-600 text-[9px] font-semibold">
            <Home className="w-4 h-4 mb-0.5" />
            <span>Home</span>
          </div>

          {/* Calendar */}
          <div className="flex flex-col items-center text-slate-400 hover:text-slate-600 text-[9px] font-medium">
            <CalendarIcon className="w-4 h-4 mb-0.5" />
            <span>Calendar</span>
          </div>

          {/* Central Plus Button (Elevated) */}
          <div className="-mt-6 flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 flex items-center justify-center cursor-pointer transform hover:scale-105 active:scale-95 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
          </div>

          {/* Analytics */}
          <div className="flex flex-col items-center text-slate-400 hover:text-slate-600 text-[9px] font-medium">
            <BarChart3 className="w-4 h-4 mb-0.5" />
            <span>Analytics</span>
          </div>

          {/* More */}
          <div className="flex flex-col items-center text-slate-400 hover:text-slate-600 text-[9px] font-medium">
            <MoreHorizontal className="w-4 h-4 mb-0.5" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

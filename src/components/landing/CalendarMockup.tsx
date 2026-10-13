"use client";

import React from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

export function CalendarMockup() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl p-5 sm:p-6 text-slate-800 relative">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-none">
              Calendar
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">
              Scheduled pipeline
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700">
            <button className="p-0.5 hover:text-blue-600">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px]">October 2026</span>
            <button className="p-0.5 hover:text-blue-600">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg shadow-2xs">
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Week Grid Header */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 my-4 text-center">
        {/* Mon 6 */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
            Mon
          </span>
          <span className="text-xs font-bold text-slate-700">6</span>
        </div>
        {/* Tue 7 */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
            Tue
          </span>
          <span className="text-xs font-bold text-slate-700">7</span>
        </div>
        {/* Wed 8 */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
            Wed
          </span>
          <span className="text-xs font-bold text-slate-700">8</span>
        </div>
        {/* Thu 9 */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
            Thu
          </span>
          <span className="text-xs font-bold text-slate-700">9</span>
        </div>
        {/* Fri 10 (Highlighted Active Day) */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-blue-600 uppercase block mb-1">
            Fri
          </span>
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            10
          </span>
        </div>
        {/* Sat 11 */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
            Sat
          </span>
          <span className="text-xs font-bold text-slate-700">11</span>
        </div>
        {/* Sun 12 */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
            Sun
          </span>
          <span className="text-xs font-bold text-slate-700">12</span>
        </div>
      </div>

      {/* Scheduled Content Pills Container */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 min-h-[120px] bg-slate-50/60 p-2 sm:p-2.5 rounded-2xl border border-slate-100">
        {/* Mon 6 */}
        <div className="p-0.5" />

        {/* Tue 7 */}
        <div className="p-0.5 space-y-1">
          <div className="bg-blue-100/80 text-blue-700 border border-blue-200/90 rounded-md p-1 text-[9px] sm:text-[10px] font-bold truncate leading-tight shadow-2xs">
            Long Video
          </div>
        </div>

        {/* Wed 8 */}
        <div className="p-0.5 space-y-1">
          <div className="bg-amber-100/80 text-amber-700 border border-amber-200/90 rounded-md p-1 text-[9px] sm:text-[10px] font-bold truncate leading-tight shadow-2xs">
            Short 1
          </div>
          <div className="bg-rose-100/80 text-rose-700 border border-rose-200/90 rounded-md p-1 text-[9px] sm:text-[10px] font-bold truncate leading-tight shadow-2xs">
            Thumbnail
          </div>
        </div>

        {/* Thu 9 */}
        <div className="p-0.5 space-y-1">
          <div className="bg-purple-100/80 text-purple-700 border border-purple-200/90 rounded-md p-1 text-[9px] sm:text-[10px] font-bold truncate leading-tight shadow-2xs">
            Reel 1
          </div>
        </div>

        {/* Fri 10 */}
        <div className="p-0.5 space-y-1">
          <div className="bg-emerald-100/80 text-emerald-700 border border-emerald-200/90 rounded-md p-1 text-[9px] sm:text-[10px] font-bold truncate leading-tight shadow-2xs">
            Short 2
          </div>
        </div>

        {/* Sat 11 */}
        <div className="p-0.5" />

        {/* Sun 12 */}
        <div className="p-0.5 space-y-1">
          <div className="bg-indigo-100/80 text-indigo-700 border border-indigo-200/90 rounded-md p-1 text-[9px] sm:text-[10px] font-bold truncate leading-tight shadow-2xs">
            Carousel
          </div>
        </div>
      </div>
    </div>
  );
}

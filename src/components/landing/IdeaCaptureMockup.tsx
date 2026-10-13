"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mic,
  Image as ImageIcon,
  Type,
  Video,
  Layers,
  Sparkles,
} from "lucide-react";

function YoutubeIcon({ className = "w-3.5 h-3.5 text-red-600" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function InstagramIcon({ className = "w-3.5 h-3.5 text-pink-600" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

export function IdeaCaptureMockup() {
  const [activeTab, setActiveTab] = useState<"text" | "voice" | "photo">("text");

  return (
    <div className="relative w-full max-w-md mx-auto flex items-center justify-center py-4">
      {/* Soft Ambient Glow */}
      <div className="absolute inset-0 bg-blue-100/60 blur-3xl rounded-full -z-10" />

      {/* Floating Card Left (Visible on desktop) */}
      <div className="hidden sm:block absolute -left-8 top-6 z-20 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xl w-52 transform -rotate-2 hover:rotate-0 transition-transform">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-900">New Idea</span>
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="flex gap-1 mb-2 bg-slate-100 p-0.5 rounded-lg text-[9px] font-semibold text-slate-600">
          <span className="flex-1 text-center py-1 bg-white rounded shadow-2xs text-blue-600">
            Text
          </span>
          <span className="flex-1 text-center py-1">Voice</span>
          <span className="flex-1 text-center py-1">Photo</span>
        </div>
        <div className="w-full h-10 border border-slate-200 rounded-lg p-1.5 text-[10px] text-slate-400 mb-2">
          Share your idea...
        </div>
        <button className="w-full py-1.5 bg-blue-600 text-white font-semibold text-[10px] rounded-lg shadow-xs">
          Save Idea
        </button>
      </div>

      {/* Floating Pills (Visible on desktop) */}
      <div className="hidden sm:flex flex-col gap-2 absolute -left-6 bottom-8 z-20">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-md text-[11px] font-semibold text-slate-700">
          <YoutubeIcon className="w-3.5 h-3.5 text-red-600" />
          <span>YouTube Long Video</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-md text-[11px] font-semibold text-slate-700">
          <Video className="w-3.5 h-3.5 text-rose-500" />
          <span>YouTube Short</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-md text-[11px] font-semibold text-slate-700">
          <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
          <span>Instagram Reel</span>
        </div>
      </div>

      {/* Main Smartphone Mockup */}
      <div className="w-[270px] sm:w-[290px] bg-slate-900 rounded-[2.5rem] p-2.5 shadow-2xl border border-slate-800 relative z-10">
        {/* Dynamic Island Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
        </div>

        {/* Smartphone Screen */}
        <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 pt-7 pb-4 px-4 flex flex-col justify-between min-h-[460px]">
          <div>
            {/* Screen Header */}
            <div className="flex items-center justify-between mb-4">
              <button className="p-1 rounded-full hover:bg-slate-100 text-slate-600">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h4 className="text-xs font-bold text-slate-900">Add idea</h4>
              <div className="w-4" />
            </div>

            {/* Input Format Tabs */}
            <div className="flex gap-1 bg-slate-100/90 p-1 rounded-xl text-[10px] font-semibold mb-3">
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === "text"
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Type className="w-3 h-3" />
                <span>Text</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("voice")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === "voice"
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Mic className="w-3 h-3" />
                <span>Voice</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("photo")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === "photo"
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Photo</span>
              </button>
            </div>

            {/* Input Box */}
            <div className="w-full h-16 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 bg-slate-50/50 mb-3">
              <span className="text-slate-400">Share your idea...</span>
            </div>

            {/* Content Type Selector Section */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Content Type
              </p>
              <div className="space-y-1.5">
                {/* Type 1 */}
                <div className="flex items-center justify-between p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-red-50 text-red-600 flex items-center justify-center">
                      <YoutubeIcon className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800">
                      Long Video
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Type 2 */}
                <div className="flex items-center justify-between p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center">
                      <Video className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800">
                      Short
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Type 3 */}
                <div className="flex items-center justify-between p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-pink-50 text-pink-600 flex items-center justify-center">
                      <InstagramIcon className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800">
                      Reel
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Type 4 */}
                <div className="flex items-center justify-between p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800">
                      Carousel
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all">
            Save Idea
          </button>
        </div>
      </div>
    </div>
  );
}

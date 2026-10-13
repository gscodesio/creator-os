"use client";

import React from "react";
import {
  Lightbulb,
  FileText,
  Video,
  Scissors,
  Palette,
  Send,
} from "lucide-react";

interface WorkflowStep {
  step: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 1,
    title: "Topic",
    description: "Choose a topic and plan your content.",
    icon: Lightbulb,
    color: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
      badge: "bg-blue-600 text-white",
    },
  },
  {
    step: 2,
    title: "Scripting",
    description: "Write and organize your script.",
    icon: FileText,
    color: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-100",
      badge: "bg-purple-600 text-white",
    },
  },
  {
    step: 3,
    title: "Shooting",
    description: "Record your video.",
    icon: Video,
    color: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      border: "border-rose-100",
      badge: "bg-rose-500 text-white",
    },
  },
  {
    step: 4,
    title: "Editing",
    description: "Edit and polish your content.",
    icon: Scissors,
    color: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      badge: "bg-emerald-600 text-white",
    },
  },
  {
    step: 5,
    title: "Thumbnail",
    description: "Design your cover or thumbnail.",
    icon: Palette,
    color: {
      bg: "bg-teal-50",
      text: "text-teal-600",
      border: "border-teal-100",
      badge: "bg-teal-600 text-white",
    },
  },
  {
    step: 6,
    title: "Publishing",
    description: "Schedule and publish.",
    icon: Send,
    color: {
      bg: "bg-sky-50",
      text: "text-sky-600",
      border: "border-sky-100",
      badge: "bg-sky-600 text-white",
    },
  },
];

export function WorkflowSteps() {
  return (
    <div className="w-full">
      {/* Desktop Horizontal Connected Timeline (Hidden on small screens) */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* Subtle horizontal connecting guide line */}
          <div className="absolute top-9 left-12 right-12 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-sky-200 -z-0" />

          <div className="grid grid-cols-6 gap-4 relative z-10">
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  data-workflow-step={step.title}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col items-center text-center group"
                >
                  {/* Step Number Circle */}
                  <div
                    className={`w-7 h-7 rounded-full ${step.color.badge} text-xs font-bold flex items-center justify-center mb-3 shadow-xs group-hover:scale-110 transition-transform`}
                  >
                    {step.step}
                  </div>

                  {/* Icon Circle */}
                  <div
                    className={`w-12 h-12 rounded-xl ${step.color.bg} ${step.color.text} border ${step.color.border} flex items-center justify-center mb-3 group-hover:rotate-3 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Vertical Timeline (Visible on screens < lg) */}
      <div className="block lg:hidden max-w-md mx-auto px-4">
        <div className="relative pl-6 space-y-6">
          {/* Vertical continuous guide line */}
          <div className="absolute top-4 bottom-6 left-[2.45rem] w-0.5 bg-gradient-to-b from-blue-300 via-purple-200 to-sky-300" />

          {WORKFLOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                data-workflow-step-mobile={step.title}
                className="flex items-start gap-4 relative"
              >
                {/* Step Number Badge */}
                <div
                  className={`w-7 h-7 rounded-full ${step.color.badge} text-xs font-bold flex items-center justify-center shrink-0 shadow-xs z-10 mt-1`}
                >
                  {step.step}
                </div>

                {/* Step Card */}
                <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl ${step.color.bg} ${step.color.text} border ${step.color.border} flex items-center justify-center shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {step.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

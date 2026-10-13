"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "free",
    question: "Is Creator OS free?",
    answer:
      "Yes, Creator OS is currently free during its beta phase. No payment or credit card is required.",
  },
  {
    id: "paid-plan",
    question: "Will there be a paid plan later?",
    answer:
      "We're focused on building the best experience right now. If we introduce paid plans in the future, we'll communicate it in advance.",
  },
  {
    id: "target-audience",
    question: "Who is Creator OS for?",
    answer:
      "Creator OS is built for YouTubers, Instagram creators, students, freelancers, and anyone who wants to plan and manage their content in a better way.",
  },
  {
    id: "mobile-access",
    question: "Can I access it on mobile?",
    answer:
      "Yes. You can use Creator OS on your phone browser and it's optimized for mobile. We're also working on an even better mobile experience.",
  },
];

export function FaqAccordion() {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    free: true, // First one open by default for immediate preview
  });

  const toggle = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
      {FAQ_ITEMS.map((item) => {
        const isOpen = Boolean(openIds[item.id]);
        return (
          <div
            key={item.id}
            className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs hover:border-slate-300 transition-colors"
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 font-bold text-sm sm:text-base text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <span>{item.question}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4.5 pt-0 text-xs sm:text-sm text-slate-500 leading-relaxed font-normal border-t border-slate-100/80">
                <p className="pt-2">{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

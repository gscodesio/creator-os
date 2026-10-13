"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Lightbulb,
  Video,
  CalendarDays,
  CheckSquare,
  BarChart2,
  Settings,
  Layers,
  Clock,
  Link2,
  SlidersHorizontal,
  ArrowLeft,
  ChevronRight,
  Play,
  Camera,
  LayoutTemplate,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const isSettingsRoute = pathname.startsWith("/settings");

  // Track whether the nested settings submenu is actively displayed in the sidebar
  const [showSettingsSubmenu, setShowSettingsSubmenu] = useState(isSettingsRoute);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.authenticated && d?.user) {
          setCurrentUser({
            name: d.user.name,
            email: d.user.email,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Synchronize submenu visibility with current route
  useEffect(() => {
    setShowSettingsSubmenu(pathname.startsWith("/settings"));
  }, [pathname]);

  const mainNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home, exact: true },
    { href: "/topics", label: "Topics", icon: Lightbulb },
    { href: "/content", label: "Content", icon: Video },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/settings/general", label: "Settings", icon: Settings },
  ];

  const settingsSubmenuItems = [
    {
      href: "/settings/general",
      title: "General",
      subtitle: "Basic workspace settings",
      icon: Settings,
      isActive: pathname === "/settings" || pathname === "/settings/general",
    },
    {
      href: "/settings/frequency",
      title: "Publishing Frequency",
      subtitle: "Set your content frequency",
      icon: CalendarDays,
      isActive: pathname === "/settings/frequency",
    },
    {
      href: "/settings/buffer",
      title: "Advance Buffer",
      subtitle: "Plan content ahead",
      icon: Layers,
      isActive: pathname === "/settings/buffer",
    },
    {
      href: "/settings/rules",
      title: "Scheduling Rules",
      subtitle: "Control publishing behavior",
      icon: Clock,
      isActive: pathname === "/settings/rules",
    },
    {
      href: "/settings/platforms",
      title: "Connected Platforms",
      subtitle: "Manage your social accounts",
      icon: Link2,
      isActive: pathname === "/settings/platforms",
    },
    {
      href: "/settings/tasks",
      title: "Task Preferences",
      subtitle: "Configure task generation",
      icon: SlidersHorizontal,
      isActive: pathname === "/settings/tasks",
    },
  ];

  return (
    <aside className="w-64 bg-white text-slate-700 h-screen flex-shrink-0 flex flex-col border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-18 flex items-center px-6 border-b border-slate-100 gap-3 shrink-0">
        <div className="bg-blue-600 rounded-xl w-9 h-9 flex items-center justify-center flex-shrink-0 shadow-xs">
          <Play className="h-4.5 w-4.5 text-white fill-white ml-0.5" />
        </div>
        <h1 className="font-extrabold text-[17px] text-slate-900 tracking-wide uppercase">
          CREATOR OS
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {showSettingsSubmenu ? (
          /* ========================================================= */
          /* STATE 2: SETTINGS NAVIGATION                             */
          /* ========================================================= */
          <div className="flex flex-col gap-2">
            {/* Back to Main Menu Button */}
            <button
              type="button"
              onClick={() => setShowSettingsSubmenu(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors w-full text-left group cursor-pointer mb-1"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Main Menu</span>
            </button>

            {/* Submenu Section Title */}
            <div className="px-3 pt-1 pb-1">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                SETTINGS
              </h2>
            </div>

            {/* 6 Settings Submenu Items */}
            <div className="space-y-1">
              {settingsSubmenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-start gap-3 py-2.5 px-3 rounded-xl transition-all relative border-l-4 ${
                      item.isActive
                        ? "bg-blue-50/80 border-blue-600 text-blue-600 shadow-2xs"
                        : "border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 mt-0.5 ${
                        item.isActive ? "text-blue-600" : "text-slate-600"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-semibold leading-tight ${
                          item.isActive ? "text-blue-600" : "text-slate-900"
                        }`}
                      >
                        {item.title}
                      </div>
                      <div
                        className={`text-xs mt-1 leading-tight ${
                          item.isActive ? "text-blue-500" : "text-slate-400"
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* STATE 1: MAIN NAVIGATION                                 */
          /* ========================================================= */
          <>
            <div>
              <h2 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                MAIN MENU
              </h2>
              <div className="space-y-1">
                {mainNavItems.map((item) => {
                  const isSettings = item.label === "Settings";
                  const isActive = item.exact
                    ? pathname === item.href
                    : isSettings
                    ? pathname.startsWith("/settings")
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (isSettings) {
                          setShowSettingsSubmenu(true);
                        }
                      }}
                      className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white font-semibold shadow-xs"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 shrink-0 ${
                          isActive ? "text-white" : "text-slate-500"
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Platforms Section */}
            <div className="pt-2">
              <h2 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                PLATFORMS
              </h2>
              <div className="space-y-1">
                <Link
                  href="#"
                  className="flex items-center gap-3 px-3.5 py-2 text-sm font-medium rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <div className="w-5 h-5 rounded-md bg-red-600 flex items-center justify-center shrink-0">
                    <Play className="w-2.5 h-2.5 fill-white text-white ml-0.5" />
                  </div>
                  <span>YouTube</span>
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-3 px-3.5 py-2 text-sm font-medium rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-500 via-pink-500 to-rose-600 flex items-center justify-center text-white shrink-0">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                  <span>Instagram</span>
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-3 px-3.5 py-2 text-sm font-medium rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <div className="w-5 h-5 rounded-md bg-[#0A66C2] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    in
                  </div>
                  <span>LinkedIn</span>
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-3 px-3.5 py-2 text-sm font-medium rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <div className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center text-white shrink-0">
                    <LayoutTemplate className="w-3 h-3 text-white" />
                  </div>
                  <span>Carousel</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Creator Profile Section Anchored at Bottom in Both States */}
      <div className="p-3 border-t border-slate-100 shrink-0 mt-auto">
        <Link
          href="/settings/general"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
              alt={currentUser?.name || "Creator Profile"}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {currentUser?.name || "Gopal Shukla"}
            </p>
            <p className="text-xs text-slate-400 truncate">Creator</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 ml-auto flex-shrink-0" />
        </Link>
      </div>
    </aside>
  );
}

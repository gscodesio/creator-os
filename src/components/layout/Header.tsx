"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, CalendarDays, Bell, Loader2, ArrowRight, Lightbulb, Film, CheckSquare, User, LogOut, Settings as SettingsIcon } from "lucide-react";
import { useCreatorOS, getEffectiveDate, formatHeaderDate } from "@/lib/store/creatorStore";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  category: "topic" | "content" | "task";
  status: string;
  url: string;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useCreatorOS();
  const isDashboard = pathname === "/dashboard";
  const isTopics = pathname.startsWith("/topics");
  const isContent = pathname.startsWith("/content");

  const effectiveDate = getEffectiveDate(settings?.launchPlan, settings?.profile?.timezone);
  const formattedDate = formatHeaderDate(effectiveDate);

  const placeholder = isTopics
    ? "Search topics (Ctrl+K)..."
    : isContent
    ? "Search content (Ctrl+K)..."
    : "Search topics, content, tasks (Ctrl+K)...";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; workspaceName?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Load current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.authenticated && d?.user) {
          setCurrentUser({
            name: d.user.name,
            email: d.user.email,
            workspaceName: d.workspace?.name,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectResult = (url: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(url);
  };

  const topicResults = results.filter((r) => r.category === "topic");
  const contentResults = results.filter((r) => r.category === "content");
  const taskResults = results.filter((r) => r.category === "task");

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 relative z-30">
      {/* Search Input Bar */}
      <div className="flex-1 max-w-xl relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim() && results.length > 0) setIsOpen(true);
            }}
            className="w-full bg-slate-100/80 border border-transparent rounded-lg pl-10 pr-9 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 transition-all"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
          )}
        </div>

        {/* Search Results Dropdown Overlay */}
        {isOpen && query.trim().length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 max-h-96 overflow-y-auto text-xs"
          >
            {results.length === 0 && !isLoading ? (
              <div className="py-6 text-center text-slate-400">
                No matching results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <div className="space-y-3">
                {topicResults.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3 text-amber-500" /> Topics ({topicResults.length})
                    </div>
                    {topicResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-blue-600">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-slate-400 truncate max-w-sm">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full capitalize">
                          {item.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {contentResults.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Film className="w-3 h-3 text-purple-500" /> Content ({contentResults.length})
                    </div>
                    {contentResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-blue-600">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.type}</div>
                        </div>
                        <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full capitalize">
                          {item.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {taskResults.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CheckSquare className="w-3 h-3 text-emerald-500" /> Tasks ({taskResults.length})
                    </div>
                    {taskResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-blue-600">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-slate-400">{item.subtitle}</div>
                          )}
                        </div>
                        <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full capitalize">
                          {item.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Utility Controls */}
      <div className="flex items-center gap-4 ml-4">
        {/* Date Badge (Shown on Dashboard) */}
        {isDashboard && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-sm font-medium text-slate-600">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        )}

        {/* Notifications */}
        <button
          onClick={() => router.push("/tasks")}
          title="Open Tasks"
          className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white"></span>
          <span className="sr-only">Notifications</span>
        </button>

        {/* Profile Circle & Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            title="User Account & Workspace"
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-white" />}
            </div>
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="font-bold text-sm text-slate-800 truncate">
                  {currentUser?.name || "Creator OS User"}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {currentUser?.email || ""}
                </div>
                {currentUser?.workspaceName && (
                  <div className="mt-1.5 inline-block text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                    {currentUser.workspaceName}
                  </div>
                )}
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push("/settings");
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Workspace Settings</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={async () => {
                    setProfileMenuOpen(false);
                    try {
                      await fetch("/api/auth/logout", { method: "POST" });
                    } finally {
                      window.location.href = "/login";
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

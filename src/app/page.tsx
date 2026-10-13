"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import "./landing.css";

// SVG Icon Helper
function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z",
  list: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  cal: "M3.5 10h17M8 3v4M16 3v4M3.5 8a3 3 0 013-3h11a3 3 0 013 3v11a3 3 0 01-3 3h-11a3 3 0 01-3-3V8z",
  doc: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
  cam: "M3 9a3 3 0 013-3h7a3 3 0 013 3v6a3 3 0 01-3 3H6a3 3 0 01-3-3V9zM16 10l5-3v10l-5-3",
  cut: "M6 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM8.5 7.5L20 18M8.5 16.5L20 6",
  img: "M12 4v11M7 11l5 5 5-5M4 19h16",
  up: "M12 16V4M7 9l5-5 5 5M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3",
  home: "M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z",
  chart: "M5 20V11M12 20V4M19 20v-6",
  plus: "M12 5v14M5 12h14",
  gear: "M12 9a3 3 0 100 6 3 3 0 000-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1",
};

// Platforms metadata
const PLATFORMS: Record<string, { label: string; var: string }> = {
  yt: { label: "YouTube Long", var: "--yt" },
  ig: { label: "Reels", var: "--ig" },
  li: { label: "LinkedIn", var: "--li" },
  ca: { label: "Carousel", var: "--ca" },
};

// Workflow definition
const WORKFLOW_NAMES = [
  "Topic",
  "Script",
  "Shoot",
  "Edit",
  "Export",
  "Schedule",
  "Publish",
];
const WORKFLOW_MSGS = [
  "Pick an idea from your Topics board and plan the content.",
  "Write and organize your script before you shoot.",
  "Proceed through the Shoot phase to keep your advance buffer on schedule.",
  "Cut and polish the footage.",
  "Render the final file.",
  "Pick the publishing slot that fits your cadence.",
  "Go live on your platform.",
];
const WORKFLOW_COLORS = [
  "var(--violet)",
  "var(--purple)",
  "var(--pink)",
  "var(--amber)",
  "var(--green)",
  "var(--cyan)",
  "var(--orange)",
];
const WORKFLOW_ICONS = ["bulb", "doc", "cam", "cut", "img", "cal", "up"] as const;

// Topics kanban columns
const KANBAN_COLS: Array<[string, string, Array<[string, "yt" | "ig" | "li" | "ca"]>]> = [
  [
    "Idea",
    "Topics saved for future content.",
    [
      ["Behind the scenes: my editing setup", "yt"],
      ["5 tips for first-time creators", "ca"],
    ],
  ],
  [
    "Planning",
    "Topics selected to create soon.",
    [["3 hook formulas that work", "ig"]],
  ],
  [
    "In progress",
    "Currently creating this content.",
    [["Weekly vlog", "yt"]],
  ],
  [
    "Done",
    "Content created from this topic.",
    [["Lessons from my first 10 videos", "li"]],
  ],
];

// Desktop Calendar Events
const MONTH_EVENTS: Record<number, Array<["yt" | "ig" | "li" | "ca", string]>> = {
  2: [["yt", "Vlog: desk setup"]],
  6: [["ig", "Reel: 3 hooks"]],
  7: [["li", "Post: lessons"]],
  9: [["yt", "Short: quick tip"]],
  11: [["ig", "Reel: behind the scenes"]],
  13: [["ca", "Carousel: 5 tips"]],
  14: [["yt", "Weekly vlog"]],
  16: [["li", "Post: workflow"]],
  18: [["ig", "Reel: edit trick"]],
  20: [["yt", "Short: hook idea"]],
  21: [["ca", "Carousel: checklist"]],
  23: [["yt", "Weekly vlog"]],
  25: [["li", "Post: recap"]],
  27: [["ig", "Reel: Q&A"]],
  28: [["yt", "Short"]],
  30: [["ca", "Carousel: tools"]],
};

// Mobile Calendar Days
const MOBILE_DAYS: Array<[string, number, Array<[string, string, string]>]> = [
  ["Mon", 5, []],
  ["Tue", 6, [["Reel: 3 hooks", "Instagram", "--ig"]]],
  ["Wed", 7, [["Short: quick tip", "YouTube", "--yt"], ["Post: lessons", "LinkedIn", "--li"]]],
  ["Thu", 8, []],
  ["Fri", 9, [["Weekly vlog", "YouTube Long", "--yt"], ["Carousel: 5 tips", "Carousel", "--ca"]]],
  ["Sat", 10, []],
  ["Sun", 11, [["Reel: behind the scenes", "Instagram", "--ig"]]],
];

export default function LandingPage() {
  // Mobile Nav Drawer
  const [menuOpen, setMenuOpen] = useState(false);

  // Hero Mobile Phone Tasks
  const [tasksDone, setTasksDone] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    // Check reduced motion preference
    if (typeof window !== "undefined") {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        setTasksDone([true, false, false]);
      } else {
        const t1 = setTimeout(() => setTasksDone([true, false, false]), 1300);
        const t2 = setTimeout(() => setTasksDone([true, true, false]), 2200);
        const t3 = setTimeout(() => setTasksDone([true, true, true]), 3100);
        const t4 = setTimeout(() => setTasksDone([true, false, false]), 5200);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
        };
      }
    }
  }, []);

  const toggleTask = (index: number) => {
    setTasksDone((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const doneCount = tasksDone.filter(Boolean).length;

  // Desktop App Replica Scale Handler
  const fitRef = useRef<HTMLDivElement>(null);
  const fitInRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!fitRef.current || !fitInRef.current) return;
      const w = 1000;
      const h = 600;
      const clientW = fitRef.current.clientWidth;
      if (clientW > 0) {
        const scale = clientW / w;
        fitInRef.current.style.width = `${w}px`;
        fitInRef.current.style.transform = `scale(${scale})`;
        fitRef.current.style.height = `${h * scale}px`;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Workflow Step State (defaults to 2: Shoot)
  const [currentStep, setCurrentStep] = useState(2);
  const flowRef = useRef<HTMLDivElement>(null);
  const [railHeight, setRailHeight] = useState("0%");

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined" || !flowRef.current) return;
      if (window.innerWidth >= 1024) return; // Desktop uses lit/done based on currentStep

      const r = flowRef.current.getBoundingClientRect();
      const mark = window.innerHeight * 0.62;
      const progress = Math.min(1, Math.max(0, (mark - r.top) / r.height));
      setRailHeight(`${progress * 100}%`);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const advanceWorkflow = () => {
    setCurrentStep((prev) => (prev === 6 ? 0 : prev + 1));
  };

  // Idea Capture State
  const [ideaTab, setIdeaTab] = useState<"text" | "voice" | "photo">("text");
  const [selectedChip, setSelectedChip] = useState<"yt" | "ig" | "li" | "ca">("yt");
  const [saveButtonText, setSaveButtonText] = useState("Save idea");

  const handleSaveIdea = () => {
    setSaveButtonText("Saved");
    setTimeout(() => {
      setSaveButtonText("Save idea");
    }, 1400);
  };

  // Mobile Calendar State
  const [mobileFilter, setMobileFilter] = useState<string>("all");
  const [selectedMobileDay, setSelectedMobileDay] = useState(4); // Index 4 -> Fri 9

  // Desktop Calendar State
  const [desktopFilter, setDesktopFilter] = useState<string>("all");

  // Rhythm Settings State
  const [bufDays, setBufDays] = useState(14);
  const [dailyCap, setDailyCap] = useState("Auto");
  const [autoTasks, setAutoTasks] = useState(true);
  const [platformTargets, setPlatformTargets] = useState<Array<{ name: string; var: string; count: number }>>([
    { name: "YouTube", var: "--yt", count: 2 },
    { name: "Instagram", var: "--ig", count: 5 },
    { name: "LinkedIn", var: "--li", count: 3 },
    { name: "Carousel", var: "--ca", count: 2 },
  ]);

  const updateTargetCount = (index: number, delta: number) => {
    setPlatformTargets((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        count: Math.max(0, Math.min(14, next[index].count + delta)),
      };
      return next;
    });
  };

  const totalWeeklyPieces = platformTargets.reduce((acc, t) => acc + t.count, 0);
  const plannedBufferPieces = Math.round((totalWeeklyPieces * bufDays) / 7);

  // Render Month Grid Cells
  const renderMonthCells = () => {
    const cells: Array<{ day: number; isOtherMonth: boolean }> = [];
    for (let d = 27; d <= 30; d++) cells.push({ day: d, isOtherMonth: true });
    for (let d = 1; d <= 31; d++) cells.push({ day: d, isOtherMonth: false });

    return cells.map(({ day, isOtherMonth }, idx) => {
      const events = !isOtherMonth
        ? (MONTH_EVENTS[day] || []).filter(
            (e) => desktopFilter === "all" || e[0] === desktopFilter
          )
        : [];
      const isToday = !isOtherMonth && day === 11;

      return (
        <div
          key={idx}
          className={`mday ${isOtherMonth ? "o" : ""} ${isToday ? "today" : ""}`}
        >
          {day}
          {isToday && <span className="tg">Today</span>}
          {events.map((e, eIdx) => (
            <span
              key={eIdx}
              className="me"
              style={{ ["--c" as any]: `var(${PLATFORMS[e[0]].var})` }}
            >
              {e[1]}
            </span>
          ))}
        </div>
      );
    });
  };

  // Render Mobile Agenda for selected day
  const currentDayEvents = MOBILE_DAYS[selectedMobileDay][2].filter(
    (e) => mobileFilter === "all" || e[2] === `--${mobileFilter}`
  );

  return (
    <div className="landing-body">
      {/* HEADER */}
      <header>
        <div className="wrap">
          <div className="bar">
            <a className="logo" href="#top" aria-label="Creator OS home">
              <i>
                <svg viewBox="0 0 24 24">
                  <path d="M7 4.5v15l13-7.5z" />
                </svg>
              </i>
              Creator OS
            </a>

            <nav className="dnav d-only" aria-label="Main">
              <a href="#workflow">How it works</a>
              <a href="#capture">Topics</a>
              <a href="#calendar">Calendar</a>
              <a href="#faq">FAQ</a>
            </nav>

            <div className="bar-r">
              <Link className="btn btn-sm" href="/login">
                Log in
              </Link>
              <Link
                className="btn btn-primary d-only"
                href="/signup"
                style={{ minHeight: "44px" }}
              >
                Start free in beta
              </Link>
              <button
                className="menu-btn m-only"
                id="menuBtn"
                aria-expanded={menuOpen}
                aria-controls="menu"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path
                    id="mi"
                    d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M4 8h16M4 16h16"}
                  />
                </svg>
              </button>
            </div>
          </div>

          <div id="menu" className="m-only" data-open={menuOpen ? "true" : "false"}>
            <div>
              <nav>
                <a href="#workflow" onClick={() => setMenuOpen(false)}>
                  How it works
                </a>
                <a href="#capture" onClick={() => setMenuOpen(false)}>
                  Idea capture
                </a>
                <a href="#calendar" onClick={() => setMenuOpen(false)}>
                  Calendar
                </a>
                <a href="#faq" onClick={() => setMenuOpen(false)}>
                  FAQ
                </a>
                <Link
                  className="btn btn-primary"
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                >
                  Start free in beta
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main id="top">
        <div className="wrap">
          {/* HERO */}
          <div className="hero">
            <div className="hero-grid">
              <div>
                <span className="pill">
                  <b></b>Free while we&apos;re in public beta
                </span>
                <h1>
                  <span className="in">Ideas in.</span>
                  <span className="out">
                    Videos out.
                    <svg viewBox="0 0 200 12" preserveAspectRatio="none">
                      <path d="M3 8 C 40 1, 80 11, 120 5 S 180 3, 197 7" />
                    </svg>
                  </span>
                </h1>
                <p className="sub">
                  One workspace for your topics, scripts, tasks and publishing
                  plan, so you always know what to make next.
                </p>
                <div className="cta-row">
                  <Link className="btn btn-primary" href="/signup">
                    Start free in beta
                  </Link>
                  <a className="btn btn-ghost" href="#workflow">
                    See the workflow
                  </a>
                </div>
                <ul className="trust">
                  <li>
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                    No credit card
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                    For YouTubers &amp; Reels creators
                  </li>
                </ul>
              </div>

              <div className="hv">
                {/* Desktop Browser App Replica */}
                <div className="browser d-only">
                  <div className="chrome">
                    <i></i>
                    <i></i>
                    <i></i>
                  </div>
                  <div className="fit" ref={fitRef} data-w="1000" data-h="600">
                    <div className="fit-in" ref={fitInRef}>
                      <div className="app">
                        <aside className="a-side">
                          <div className="a-logo">
                            <i>
                              <svg viewBox="0 0 24 24">
                                <path d="M7 4.5v15l13-7.5z" />
                              </svg>
                            </i>
                            CREATOR OS
                          </div>
                          <div className="a-lab">MAIN MENU</div>
                          <div className="a-i on">
                            <Icon d={ICONS.home} />
                            Dashboard
                          </div>
                          <div className="a-i">
                            <Icon d={ICONS.bulb} />
                            Topics
                          </div>
                          <div className="a-i">
                            <Icon d={ICONS.cam} />
                            Content
                          </div>
                          <div className="a-i">
                            <Icon d={ICONS.cal} />
                            Calendar
                          </div>
                          <div className="a-i">
                            <Icon d={ICONS.list} />
                            Tasks
                          </div>
                          <div className="a-i">
                            <Icon d={ICONS.chart} />
                            Analytics
                          </div>
                          <div className="a-i">
                            <Icon d={ICONS.gear} />
                            Settings
                          </div>
                          <div className="a-lab">PLATFORMS</div>
                          <div className="a-i">
                            <span
                              className="a-sq"
                              style={{ background: "var(--yt)" }}
                            ></span>
                            YouTube
                          </div>
                          <div className="a-i">
                            <span
                              className="a-sq"
                              style={{ background: "var(--ig)" }}
                            ></span>
                            Instagram
                          </div>
                          <div className="a-i">
                            <span
                              className="a-sq"
                              style={{ background: "var(--li)" }}
                            ></span>
                            LinkedIn
                          </div>
                          <div className="a-i">
                            <span
                              className="a-sq"
                              style={{ background: "var(--ca)" }}
                            ></span>
                            Carousel
                          </div>
                        </aside>

                        <div className="a-main">
                          <div className="a-top">
                            <div className="a-search">
                              Search topics, content, tasks (Ctrl+K)…
                            </div>
                            <div className="a-date">Sun, 11 Oct 2026</div>
                            <div className="ava a-ava">A</div>
                          </div>
                          <div className="a-hello">
                            <div>
                              <h4>Good morning!</h4>
                              <p>
                                Here&apos;s your content overview and today&apos;s tasks.
                              </p>
                            </div>
                            <div className="a-bufs">
                              <div className="a-buf">
                                <small>Advance Buffer</small>
                                <b>7 days</b>
                              </div>
                              <div className="a-buf g">
                                <small>Buffer Status</small>
                                <b>
                                  <span
                                    className="dot"
                                    style={{
                                      background: "var(--green)",
                                      borderRadius: "50%",
                                    }}
                                  ></span>
                                  On track
                                </b>
                              </div>
                            </div>
                          </div>

                          <div className="a-plat">
                            <div className="a-card">
                              <h5>
                                <span
                                  className="a-sq"
                                  style={{
                                    background: "var(--yt)",
                                    width: "14px",
                                    height: "14px",
                                  }}
                                ></span>
                                YouTube
                              </h5>
                              <div className="a-row">
                                <span>Long videos</span>
                                <b>3/4</b>
                              </div>
                              <div className="a-bar">
                                <i
                                  style={{
                                    width: "75%",
                                    background: "var(--yt)",
                                  }}
                                ></i>
                              </div>
                              <div className="a-row">
                                <span>Shorts</span>
                                <b>6/8</b>
                              </div>
                              <div className="a-bar">
                                <i
                                  style={{
                                    width: "75%",
                                    background: "var(--yt)",
                                  }}
                                ></i>
                              </div>
                            </div>

                            <div className="a-card">
                              <h5>
                                <span
                                  className="a-sq"
                                  style={{
                                    background: "var(--ig)",
                                    width: "14px",
                                    height: "14px",
                                  }}
                                ></span>
                                Instagram
                              </h5>
                              <div className="a-row">
                                <span>Reels</span>
                                <b>5/6</b>
                              </div>
                              <div className="a-bar">
                                <i
                                  style={{
                                    width: "83%",
                                    background: "var(--ig)",
                                  }}
                                ></i>
                              </div>
                              <div className="a-row">
                                <span>From long videos</span>
                                <b>3/3</b>
                              </div>
                              <div className="a-bar">
                                <i
                                  style={{
                                    width: "100%",
                                    background: "var(--ig)",
                                  }}
                                ></i>
                              </div>
                            </div>

                            <div className="a-card">
                              <h5>
                                <span
                                  className="a-sq"
                                  style={{
                                    background: "var(--li)",
                                    width: "14px",
                                    height: "14px",
                                  }}
                                ></span>
                                LinkedIn
                              </h5>
                              <div className="a-row">
                                <span>Posts</span>
                                <b>3/4</b>
                              </div>
                              <div className="a-bar">
                                <i
                                  style={{
                                    width: "75%",
                                    background: "var(--li)",
                                  }}
                                ></i>
                              </div>
                              <div className="a-row">
                                <span>Video related</span>
                                <b>1/2</b>
                              </div>
                              <div className="a-bar">
                                <i
                                  style={{
                                    width: "50%",
                                    background: "var(--li)",
                                  }}
                                ></i>
                              </div>
                            </div>

                            <div className="a-card">
                              <h5>
                                <span
                                  className="a-sq"
                                  style={{
                                    background: "var(--ca)",
                                    width: "14px",
                                    height: "14px",
                                  }}
                                ></span>
                                Carousel
                              </h5>
                              <div className="a-row">
                                <span>Carousels</span>
                                <b>2/4</b>
                              </div>
                              <div className="a-bar">
                                <i
                                  style={{
                                    width: "50%",
                                    background: "var(--ca)",
                                  }}
                                ></i>
                              </div>
                              <div className="a-row">
                                <span>Monthly target</span>
                                <b>2/4</b>
                              </div>
                            </div>
                          </div>

                          <div className="a-panels">
                            <div className="a-panel">
                              <h5>
                                Today&apos;s tasks <span>View all</span>
                              </h5>
                              <div className="a-li">
                                <span
                                  className="dot"
                                  style={{ background: "var(--pink)" }}
                                ></span>
                                <b>Shoot weekly vlog</b>
                                <small>High</small>
                              </div>
                              <div className="a-li">
                                <span
                                  className="dot"
                                  style={{ background: "var(--amber)" }}
                                ></span>
                                <b>Edit Short</b>
                                <small>Medium</small>
                              </div>
                              <div className="a-li">
                                <span
                                  className="dot"
                                  style={{ background: "var(--green)" }}
                                ></span>
                                <b>Export final cut</b>
                                <small>Low</small>
                              </div>
                            </div>

                            <div className="a-panel">
                              <h5>
                                Upcoming schedule <span>View calendar</span>
                              </h5>
                              <div className="a-li">
                                <span
                                  className="dot"
                                  style={{ background: "var(--yt)" }}
                                ></span>
                                <b>Weekly vlog</b>
                                <small>Tue 13</small>
                              </div>
                              <div className="a-li">
                                <span
                                  className="dot"
                                  style={{ background: "var(--ig)" }}
                                ></span>
                                <b>Reel: 3 hooks</b>
                                <small>Wed 14</small>
                              </div>
                              <div className="a-li">
                                <span
                                  className="dot"
                                  style={{ background: "var(--li)" }}
                                ></span>
                                <b>Post: lessons</b>
                                <small>Fri 16</small>
                              </div>
                            </div>

                            <div className="a-panel">
                              <h5>October 2026</h5>
                              <div className="a-mini">
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sat</span>
                                <span>Sun</span>
                                <span className="d">5</span>
                                <span className="d">6</span>
                                <span className="d">7</span>
                                <span className="d">8</span>
                                <span className="d">9</span>
                                <span className="d">10</span>
                                <span className="d">
                                  <span className="t">11</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sample d-only">
                  <span
                    className="dot"
                    style={{ background: "var(--green)", borderRadius: "50%" }}
                  ></span>
                  Sample data
                </div>

                {/* Mobile Phone Mockup */}
                <div className="stage">
                  <div className="float a">
                    <span
                      className="dot"
                      style={{ background: "var(--green)" }}
                    ></span>
                    Sample data
                  </div>
                  <div className="phone tilt" aria-label="Creator OS mobile app preview">
                    <div className="app-top">
                      <div>
                        <small>Today</small>
                        <strong>Your tasks</strong>
                      </div>
                      <div className="ava">A</div>
                    </div>
                    <div className="prog">
                      <span
                        id="pbar"
                        style={{ width: `${(doneCount / 3) * 100}%` }}
                      ></span>
                    </div>
                    <div className="prog-l">
                      <span id="pcount">{doneCount} of 3 done</span>
                      <span>Next: Shoot</span>
                    </div>

                    <div className="tasks" id="tasks">
                      <div
                        className={`task ${tasksDone[0] ? "done" : ""}`}
                        onClick={() => toggleTask(0)}
                      >
                        <span className="chk">
                          <svg viewBox="0 0 24 24">
                            <path d="M5 12.5l4.5 4.5L19 7" />
                          </svg>
                        </span>
                        <span
                          className="dot"
                          style={{ background: "var(--pink)" }}
                        ></span>
                        <div className="t">
                          <b>Shoot weekly vlog</b>
                          <span>YouTube Long</span>
                        </div>
                        <span className="tag hi">High</span>
                      </div>

                      <div
                        className={`task ${tasksDone[1] ? "done" : ""}`}
                        onClick={() => toggleTask(1)}
                      >
                        <span className="chk">
                          <svg viewBox="0 0 24 24">
                            <path d="M5 12.5l4.5 4.5L19 7" />
                          </svg>
                        </span>
                        <span
                          className="dot"
                          style={{ background: "var(--amber)" }}
                        ></span>
                        <div className="t">
                          <b>Edit short</b>
                          <span>YouTube Short</span>
                        </div>
                        <span className="tag md">Medium</span>
                      </div>

                      <div
                        className={`task ${tasksDone[2] ? "done" : ""}`}
                        onClick={() => toggleTask(2)}
                      >
                        <span className="chk">
                          <svg viewBox="0 0 24 24">
                            <path d="M5 12.5l4.5 4.5L19 7" />
                          </svg>
                        </span>
                        <span
                          className="dot"
                          style={{ background: "var(--green)" }}
                        ></span>
                        <div className="t">
                          <b>Export final cut</b>
                          <span>YouTube Long</span>
                        </div>
                        <span className="tag lo">Low</span>
                      </div>
                    </div>

                    <div className="tabs">
                      <div className="on">
                        <Icon d={ICONS.home} />
                        Home
                      </div>
                      <div>
                        <Icon d={ICONS.cal} />
                        Calendar
                      </div>
                      <div>
                        <span className="plus">
                          <Icon d={ICONS.plus} />
                        </span>
                      </div>
                      <div>
                        <Icon d={ICONS.chart} />
                        Analytics
                      </div>
                      <div>
                        <Icon d={ICONS.gear} />
                        More
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BENEFITS */}
          <section>
            <h2>
              Less juggling.
              <br />
              More publishing.
            </h2>
            <div className="ben">
              <div>
                <span
                  className="ico"
                  style={{ background: "#F1EEFF", color: "var(--violet)" }}
                >
                  <Icon d={ICONS.bulb} />
                </span>
                <div>
                  <h3>Keep every idea</h3>
                  <p>
                    Topics live in one place, not in notes apps and chat threads.
                  </p>
                </div>
              </div>

              <div>
                <span
                  className="ico"
                  style={{
                    background: "rgba(47,140,255,.14)",
                    color: "var(--purple)",
                  }}
                >
                  <Icon d={ICONS.list} />
                </span>
                <div>
                  <h3>Know your next move</h3>
                  <p>
                    A short daily task list, and a clear next action on every
                    piece of content.
                  </p>
                </div>
              </div>

              <div>
                <span
                  className="ico"
                  style={{
                    background: "rgba(18,168,102,.14)",
                    color: "var(--green)",
                  }}
                >
                  <Icon d={ICONS.cal} />
                </span>
                <div>
                  <h3>Plan what goes live</h3>
                  <p>
                    Set your buffer and see publishing days across every platform.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* WORKFLOW */}
          <section id="workflow">
            <h2>
              Seven steps from
              <br />
              topic to published.
            </h2>
            <p className="lead">
              Every piece of content moves through the same path, so nothing
              gets stuck halfway.
              <span className="d-only"> Tap a step to see it.</span>
            </p>

            <div className="flow" id="flow" ref={flowRef}>
              <div className="rail">
                <i id="railFill" style={{ height: railHeight }}></i>
              </div>

              {WORKFLOW_NAMES.map((name, i) => {
                const isLit = i <= currentStep;
                const isDone = i < currentStep;
                const isCur = i === currentStep;
                const color = WORKFLOW_COLORS[i];
                const iconKey = WORKFLOW_ICONS[i];

                return (
                  <div
                    key={name}
                    className={`step ${isLit ? "lit" : ""} ${isDone ? "done" : ""} ${isCur ? "cur" : ""}`}
                    style={{ ["--c" as any]: color }}
                    onClick={() => {
                      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                        setCurrentStep(i);
                      }
                    }}
                  >
                    <span className="node">
                      <Icon d={ICONS[iconKey]} />
                    </span>
                    <div className="body">
                      <small>Step {i + 1}</small>
                      <h3>{name}</h3>
                      <p>{WORKFLOW_MSGS[i]}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="detail">
              <div className="dcard">
                <div className="dhead">
                  <span className="yt">
                    <svg viewBox="0 0 24 24">
                      <path d="M7 4.5v15l13-7.5z" />
                    </svg>
                  </span>
                  <div>
                    <h4>Weekly vlog (sample)</h4>
                    <span>
                      YouTube Long{" "}
                      <span className="badge" id="dbadge">
                        {WORKFLOW_NAMES[currentStep]}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="nra">
                  <small>NEXT REQUIRED ACTION</small>
                  <h4 id="dh">
                    {currentStep === 6
                      ? "Publish"
                      : "Complete " + WORKFLOW_NAMES[currentStep]}
                  </h4>
                  <p id="dp">{WORKFLOW_MSGS[currentStep]}</p>
                  <button
                    className="btn"
                    id="dbtn"
                    type="button"
                    onClick={advanceWorkflow}
                  >
                    {currentStep === 6
                      ? "Start over"
                      : "Mark " + WORKFLOW_NAMES[currentStep] + " complete"}
                  </button>
                </div>
              </div>

              <div className="dcard ml" id="ml">
                <h4>Production milestones</h4>
                {WORKFLOW_NAMES.map((n, i) => (
                  <div
                    key={n}
                    className={`mi ${
                      i < currentStep ? "d" : i === currentStep ? "c" : ""
                    }`}
                  >
                    <i></i>
                    {i < currentStep
                      ? `${n} completed`
                      : i === currentStep
                      ? `${n} in progress`
                      : n}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CAPTURE / TOPICS */}
          <section id="capture">
            <h2>
              Never lose a<br />
              good idea.
            </h2>
            <p className="lead">
              Save it in seconds, tag the kind of content it could become, and
              move it from Idea to Done on your Topics board.
            </p>

            <div className="cap">
              <div className="addidea">
                <div className="seg" role="tablist" aria-label="Idea type">
                  <button
                    role="tab"
                    aria-selected={ideaTab === "text"}
                    onClick={() => setIdeaTab("text")}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M5 6h14M12 6v13" />
                    </svg>
                    Text
                  </button>
                  <button
                    role="tab"
                    aria-selected={ideaTab === "voice"}
                    onClick={() => setIdeaTab("voice")}
                  >
                    <svg viewBox="0 0 24 24">
                      <rect x="9" y="3" width="6" height="12" rx="3" />
                      <path d="M5 11a7 7 0 0014 0M12 18v3" />
                    </svg>
                    Voice
                  </button>
                  <button
                    role="tab"
                    aria-selected={ideaTab === "photo"}
                    onClick={() => setIdeaTab("photo")}
                  >
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="14" rx="3" />
                      <circle cx="12" cy="12" r="3.5" />
                    </svg>
                    Photo
                  </button>
                </div>

                <div className="pane" id="pane">
                  {ideaTab === "text" && (
                    <>
                      <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                        What if my next video is…
                      </span>
                      <span>Tap to type your idea</span>
                    </>
                  )}
                  {ideaTab === "voice" && (
                    <>
                      <div className="wave">
                        {Array.from({ length: 22 }, (_, i) => (
                          <i
                            key={i}
                            style={{
                              height: `${10 + Math.abs(Math.sin(i * 1.3)) * 24}px`,
                              animationDelay: `${i * 0.07}s`,
                            }}
                          ></i>
                        ))}
                      </div>
                      <span>Hold to record a quick voice note</span>
                    </>
                  )}
                  {ideaTab === "photo" && (
                    <>
                      <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                        Add a photo or screenshot
                      </span>
                      <span>Save inspiration with your idea</span>
                    </>
                  )}
                </div>

                <div className="chips" id="chips">
                  <span
                    className={`chip ${selectedChip === "yt" ? "sel" : ""}`}
                    style={{ ["--c" as any]: "var(--yt)" }}
                    tabIndex={0}
                    role="button"
                    onClick={() => setSelectedChip("yt")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedChip("yt");
                      }
                    }}
                  >
                    YouTube Long
                  </span>
                  <span
                    className={`chip ${selectedChip === "ig" ? "sel" : ""}`}
                    style={{ ["--c" as any]: "var(--ig)" }}
                    tabIndex={0}
                    role="button"
                    onClick={() => setSelectedChip("ig")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedChip("ig");
                      }
                    }}
                  >
                    Reel
                  </span>
                  <span
                    className={`chip ${selectedChip === "li" ? "sel" : ""}`}
                    style={{ ["--c" as any]: "var(--li)" }}
                    tabIndex={0}
                    role="button"
                    onClick={() => setSelectedChip("li")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedChip("li");
                      }
                    }}
                  >
                    LinkedIn
                  </span>
                  <span
                    className={`chip ${selectedChip === "ca" ? "sel" : ""}`}
                    style={{ ["--c" as any]: "var(--ca)" }}
                    tabIndex={0}
                    role="button"
                    onClick={() => setSelectedChip("ca")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedChip("ca");
                      }
                    }}
                  >
                    Carousel
                  </span>
                </div>

                <button
                  className="btn btn-primary"
                  id="saveIdea"
                  type="button"
                  onClick={handleSaveIdea}
                >
                  {saveButtonText}
                </button>
              </div>

              <div
                className="kanban"
                id="kanban"
                aria-label="Topics board preview (sample data)"
              >
                {KANBAN_COLS.map(([colName, colSub, cards]) => (
                  <div key={colName} className="kcol">
                    <div className="kh">
                      {colName}
                      <em>{cards.length}</em>
                    </div>
                    <div className="ks">{colSub}</div>
                    {cards.map(([title, platKey], cIdx) => (
                      <div key={cIdx} className="kcard">
                        <b>{title}</b>
                        <span
                          className="kt"
                          style={{
                            ["--c" as any]: `var(${PLATFORMS[platKey].var})`,
                          }}
                        >
                          {PLATFORMS[platKey].label}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CALENDAR */}
          <section id="calendar">
            <h2>
              Your week,
              <br className="m-only" />
              readable at a glance.
            </h2>
            <p className="lead">
              See your publishing schedule across every platform.{" "}
              <span className="m-only">Tap a day to see what&apos;s planned.</span>
              <span className="d-only">Filter by platform.</span> Example schedule shown.
            </p>

            {/* Mobile Calendar */}
            <div className="cal m-only">
              <div className="cal-h">
                <b>October 2026</b>
                <span>Sample week</span>
              </div>
              <div className="mf" id="mf">
                <button
                  aria-pressed={mobileFilter === "all"}
                  onClick={() => setMobileFilter("all")}
                >
                  All
                </button>
                <button
                  aria-pressed={mobileFilter === "yt"}
                  style={{ ["--c" as any]: "var(--yt)" }}
                  onClick={() => setMobileFilter("yt")}
                >
                  <i></i>YouTube
                </button>
                <button
                  aria-pressed={mobileFilter === "ig"}
                  style={{ ["--c" as any]: "var(--ig)" }}
                  onClick={() => setMobileFilter("ig")}
                >
                  <i></i>Instagram
                </button>
                <button
                  aria-pressed={mobileFilter === "li"}
                  style={{ ["--c" as any]: "var(--li)" }}
                  onClick={() => setMobileFilter("li")}
                >
                  <i></i>LinkedIn
                </button>
                <button
                  aria-pressed={mobileFilter === "ca"}
                  style={{ ["--c" as any]: "var(--ca)" }}
                  onClick={() => setMobileFilter("ca")}
                >
                  <i></i>Carousel
                </button>
              </div>

              <div className="week" role="tablist" id="week">
                {MOBILE_DAYS.map(([dayName, dayNum], idx) => (
                  <button
                    key={idx}
                    role="tab"
                    aria-selected={selectedMobileDay === idx}
                    onClick={() => setSelectedMobileDay(idx)}
                  >
                    {dayName}
                    <strong>{dayNum}</strong>
                  </button>
                ))}
              </div>

              <div className="agenda" id="agenda">
                {currentDayEvents.length > 0 ? (
                  currentDayEvents.map(([title, platName, colorVar], idx) => (
                    <div
                      key={idx}
                      className="ev"
                      style={{ ["--c" as any]: `var(${colorVar})` }}
                    >
                      <div>
                        <b>{title}</b>
                        <span>{platName}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    Nothing planned. A good day to capture ideas.
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Month Calendar */}
            <div className="mcal d-only">
              <div className="mc-top">
                <div className="mc-f" id="mcf">
                  <button
                    aria-pressed={desktopFilter === "all"}
                    onClick={() => setDesktopFilter("all")}
                  >
                    All
                  </button>
                  <button
                    aria-pressed={desktopFilter === "yt"}
                    style={{ ["--c" as any]: "var(--yt)" }}
                    onClick={() => setDesktopFilter("yt")}
                  >
                    <i></i>YouTube
                  </button>
                  <button
                    aria-pressed={desktopFilter === "ig"}
                    style={{ ["--c" as any]: "var(--ig)" }}
                    onClick={() => setDesktopFilter("ig")}
                  >
                    <i></i>Instagram
                  </button>
                  <button
                    aria-pressed={desktopFilter === "li"}
                    style={{ ["--c" as any]: "var(--li)" }}
                    onClick={() => setDesktopFilter("li")}
                  >
                    <i></i>LinkedIn
                  </button>
                  <button
                    aria-pressed={desktopFilter === "ca"}
                    style={{ ["--c" as any]: "var(--ca)" }}
                    onClick={() => setDesktopFilter("ca")}
                  >
                    <i></i>Carousel
                  </button>
                </div>
                <div className="mc-r">
                  <span className="m">Month</span>
                  <span className="o">October 2026</span>
                </div>
              </div>

              <div className="mgrid" id="mgrid">
                <div className="h">SUN</div>
                <div className="h">MON</div>
                <div className="h">TUE</div>
                <div className="h">WED</div>
                <div className="h">THU</div>
                <div className="h">FRI</div>
                <div className="h">SAT</div>
                {renderMonthCells()}
              </div>
            </div>
          </section>

          {/* RHYTHM */}
          <section id="rhythm">
            <div className="rwrap">
              <div>
                <h2>
                  Set your rhythm
                  <br />
                  once.
                </h2>
                <p className="lead">
                  Tell Creator OS how much you want to publish each week on each
                  platform. It works out the content, the schedule and your daily
                  tasks.
                </p>
                <ul className="rl">
                  <li>
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                    Weekly targets for every platform
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                    Platform order: Instagram first, YouTube first or balanced
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                    Rules that keep the same Reel off two platforms on one day
                  </li>
                </ul>
              </div>

              <div className="rcard" aria-label="Settings preview">
                <div className="rrow">
                  <div className="rh">
                    <b>Weekly targets</b>
                    <span>How much you publish, per platform</span>
                  </div>
                  <div className="tgt" id="tgt">
                    {platformTargets.map((t, idx) => (
                      <div
                        key={t.name}
                        className="tr"
                        style={{ ["--c" as any]: `var(${t.var})` }}
                      >
                        <i></i>
                        <span>{t.name}</span>
                        <div className="st">
                          <button
                            type="button"
                            onClick={() => updateTargetCount(idx, -1)}
                            aria-label={`Fewer ${t.name} per week`}
                          >
                            −
                          </button>
                          <output>{t.count}</output>
                          <button
                            type="button"
                            onClick={() => updateTargetCount(idx, 1)}
                            aria-label={`More ${t.name} per week`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rrow">
                  <div className="rh">
                    <b>Plan ahead</b>
                    <span>Advance buffer</span>
                  </div>
                  <div className="opts" id="bufOpts">
                    {[7, 10, 14, 21, 30].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className="opt"
                        aria-pressed={bufDays === num}
                        onClick={() => setBufDays(num)}
                      >
                        {num} days
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rrow">
                  <div className="rh">
                    <b>Daily workload</b>
                    <span>Tasks per day</span>
                  </div>
                  <div className="opts" id="capOpts">
                    {["Auto", "3", "5", "7", "10"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className="opt"
                        aria-pressed={dailyCap === opt}
                        onClick={() => setDailyCap(opt)}
                      >
                        {opt === "Auto" ? "Auto" : `${opt} tasks`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rrow tg">
                  <div className="rh">
                    <b>Generate tasks automatically</b>
                    <span>The next task is created from your progress</span>
                  </div>
                  <button
                    className="sw"
                    id="autoSw"
                    type="button"
                    aria-pressed={autoTasks}
                    aria-label="Generate tasks automatically"
                    onClick={() => setAutoTasks(!autoTasks)}
                  ></button>
                </div>

                <div className="rout" id="rout">
                  <b>{totalWeeklyPieces} pieces a week.</b> Creator OS plans
                  about {plannedBufferPieces} pieces for the next {bufDays} days
                  {autoTasks
                    ? dailyCap === "Auto"
                      ? " and creates the tasks for you."
                      : ` and creates tasks, up to ${dailyCap} a day.`
                    : "."}
                </div>
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <div className="final">
            <h2>Make consistency easier.</h2>
            <p>
              Bring your ideas, tasks and publishing plan into one workspace.
            </p>
            <Link className="btn" href="/signup">
              Start free in beta
            </Link>
            <small>Free during beta. No credit card required.</small>
          </div>

          {/* FAQ */}
          <section id="faq">
            <h2>Questions, answered.</h2>
            <div className="faq">
              <details>
                <summary>
                  Is Creator OS free?
                  <svg viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p>
                  Yes, it&apos;s free to use while we&apos;re in public beta. No
                  credit card needed.
                </p>
              </details>
              <details>
                <summary>
                  Will there be a paid plan later?
                  <svg viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p>
                  Possibly. Pricing isn&apos;t decided yet, and we&apos;ll tell you
                  before anything changes.
                </p>
              </details>
              <details>
                <summary>
                  Who is it for?
                  <svg viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p>
                  YouTubers, Instagram creators, solo creators and small creator
                  teams who want a steady publishing rhythm.
                </p>
              </details>
              <details>
                <summary>
                  Can I use it on my phone?
                  <svg viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p>
                  Yes. Creator OS works in your mobile browser, so you can
                  capture ideas and check tasks anywhere.
                </p>
              </details>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="f-top">
            <div>
              <a className="logo" href="#top">
                <i>
                  <svg viewBox="0 0 24 24">
                    <path d="M7 4.5v15l13-7.5z" />
                  </svg>
                </i>
                Creator OS
              </a>
              <p>A content workspace for modern creators.</p>
            </div>
            <nav className="f-links" aria-label="Footer">
              <a href="#workflow">How it works</a>
              <a href="#faq">FAQ</a>
              <Link href="/login">Log in</Link>
              <Link href="/signup">Sign up</Link>
            </nav>
          </div>
          <div className="copy">© 2026 Creator OS. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

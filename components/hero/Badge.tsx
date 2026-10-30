"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import { nowData } from "@/data/now";
import { useLiveStats } from "@/context/LiveStatsContext";
import {
  ArrowUpRight,
  RotateCcw,
  FileText,
  Briefcase,
  User,
  Mail,
  Flame,
} from "lucide-react";

interface BadgeProps {
  isFlipped: boolean;
  onToggleFlip: (targetState?: boolean) => void;
  isDark: boolean;
  isDragging: boolean;
  isFlipping: boolean;
  setIsFlipping: (flipping: boolean) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
}

interface GitHubDay {
  count: number;
  level: number;
  date: string;
}

// Generate sensible 26-week fallback data to eliminate skeleton flash or layout shift
function generateFallbackWeeks(): { days: GitHubDay[] }[] {
  const weeks: { days: GitHubDay[] }[] = [];
  const now = new Date(2026, 9, 30); // Consistent anchor date

  for (let w = 25; w >= 0; w--) {
    const days: GitHubDay[] = [];
    for (let d = 0; d < 7; d++) {
      const dateObj = new Date(now.getTime() - (w * 7 + (6 - d)) * 86400000);
      const dateStr = dateObj.toISOString().split("T")[0];
      // Seed realistic distribution: mostly 1-3, occasional 4 or 0
      const pseudoRandom = ((w * 13 + d * 7 + 11) % 17) / 17;
      let level = 1;
      let count = 2;
      if (pseudoRandom > 0.85) {
        level = 4;
        count = 6;
      } else if (pseudoRandom > 0.6) {
        level = 3;
        count = 4;
      } else if (pseudoRandom > 0.3) {
        level = 2;
        count = 3;
      } else if (pseudoRandom < 0.12) {
        level = 0;
        count = 0;
      }
      days.push({ count, level, date: dateStr });
    }
    weeks.push({ days });
  }
  return weeks;
}

export function Badge({
  isFlipped,
  onToggleFlip,
  isDark,
  isDragging,
  isFlipping,
  setIsFlipping,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: BadgeProps) {
  const badgeCardRef = useRef<HTMLDivElement | null>(null);
  const flipElRef = useRef<HTMLDivElement | null>(null);

  // Hover and fine pointer detection
  const [isHovered, setIsHovered] = useState(false);

  // Parallax sheen and photo tilt (spring-smoothed, up to 8 degrees while hovering)
  const [sheenPos, setSheenPos] = useState({ x: 50, y: 50 });
  const [photoTilt, setPhotoTilt] = useState({ rx: 0, ry: 0 });

  // Live real-time stats (synced every 60s & on focus) with zero layout shift fallback
  const fallbackWeeks = useMemo(() => generateFallbackWeeks(), []);
  const { github: liveGitHub, leetcode: liveLeetCode, isSyncing } = useLiveStats();
  const githubData = useMemo(() => {
    return {
      totalContributions: liveGitHub.totalContributions,
      currentStreak: liveGitHub.currentStreak,
      weeks: liveGitHub.weeks && liveGitHub.weeks.length > 0 ? liveGitHub.weeks : fallbackWeeks,
    };
  }, [liveGitHub, fallbackWeeks]);

  // LED Grid wave animation: starts only AFTER flip completes
  const [showBackAnimation, setShowBackAnimation] = useState(false);

  // Keyboard accessibility: Enter or Space flips, Esc flips back
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggleFlip();
      } else if (e.key === "Escape" && isFlipped) {
        e.preventDefault();
        onToggleFlip(false);
      }
    },
    [isFlipped, onToggleFlip]
  );

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!badgeCardRef.current) return;
    const rect = badgeCardRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const relY = ((e.clientY - rect.top) / rect.height) * 100;
    setSheenPos({ x: relX, y: relY });

    // Spring-smoothed parallax tilt towards pointer (max 8 degrees as requested)
    const normX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const normY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    const maxTilt = 8;
    setPhotoTilt({
      rx: Math.max(-maxTilt, Math.min(maxTilt, -normY * maxTilt)),
      ry: Math.max(-maxTilt, Math.min(maxTilt, normX * maxTilt)),
    });
  };

  const handleCardMouseLeave = () => {
    setPhotoTilt({ rx: 0, ry: 0 });
    setSheenPos({ x: 50, y: 50 });
    setIsHovered(false);
  };

  // Flip transition end callback
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target === flipElRef.current && e.propertyName === "transform") {
      if (process.env.NODE_ENV !== "production") {
        try {
          console.timeEnd("badge-flip");
        } catch {
          // ignore
        }
      }
      setIsFlipping(false);
      if (isFlipped) {
        setShowBackAnimation(true);
      } else {
        setShowBackAnimation(false);
      }
    }
  };

  const isBackAnimationActive = isFlipped && showBackAnimation;
  const visibleWeeks = githubData?.weeks?.slice(-26) || fallbackWeeks;
  const yearRange = "2025–2026";

  return (
    // CENTERING & SCALE LAYER (Order: Physics -> Centering/Scale -> Flip -> Faces)
    <div
      style={{
        transform: "translate(-50%, 0)",
        transformOrigin: "50% 0%",
      }}
      className="relative select-none"
    >
      {/* SCALE LAYER (Hover: 1.03, Grab: 1.04, Flip: pulse 1 -> 1.08 -> 1) */}
      <div
        style={{
          transformOrigin: "50% 0%",
          transform: !isFlipping
            ? `scale(${isDragging ? 1.04 : isHovered ? 1.03 : 1})`
            : undefined,
          willChange: "transform",
        }}
        className={`transition-transform duration-200 ease-out rounded-[18px] ${
          isFlipping
            ? isHovered
              ? "animate-flip-pulse-hover"
              : "animate-flip-pulse"
            : ""
        } ${
          isDragging
            ? "shadow-[0_24px_50px_rgba(0,0,0,0.45)]"
            : "shadow-2xl shadow-black/35"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleCardMouseLeave}
      >
        {/* DEDICATED FLIP LAYER (Animates only rotateY from 0 to 180deg) */}
        <div
          ref={flipElRef}
          role="button"
          tabIndex={0}
          aria-label="Interactive ID badge, click or press Enter to flip"
          onKeyDown={handleKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={(e) => {
            onPointerMove(e);
            handleCardMouseMove(e as unknown as React.MouseEvent<HTMLDivElement>);
          }}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onTransitionEnd={handleTransitionEnd}
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
            transition: "transform 550ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
          className="relative w-[92vw] sm:w-[84vw] md:w-[70vw] lg:w-[clamp(560px,52vw,840px)] aspect-[1.47/1] min-h-[380px] sm:min-h-[440px] md:min-h-[460px] lg:min-h-[480px] rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
        >
          {/* =============================================================== */}
          {/* BADGE FRONT SIDE                                                */}
          {/* =============================================================== */}
          <div
            ref={badgeCardRef}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(0deg) translateZ(1px)",
              pointerEvents: isFlipped ? "none" : "auto",
            }}
            className={`absolute inset-0 rounded-[18px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden transition-colors ${
              isDark
                ? "bg-[#141416] text-[#ededed] border border-[rgba(255,255,255,0.12)] shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_24px_rgba(255,255,255,0.03)]"
                : "bg-[#141416] text-[#ededed] border border-neutral-900/40 shadow-2xl shadow-black/25"
            }`}
          >
            {/* Top Slot Hole Cutout for Lanyard Clip */}
            <div
              className="absolute top-2.5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-neutral-900 border border-neutral-800"
            />

            {/* Dynamic Light Sheen Gradients */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[18px] opacity-35 mix-blend-overlay"
              style={{
                background: `linear-gradient(125deg, transparent 20%, rgba(255,255,255,0.12) ${sheenPos.x}%, transparent 80%)`,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 rounded-[18px] opacity-20"
              style={{
                background: `radial-gradient(600px circle at ${sheenPos.x}% ${sheenPos.y}%, rgba(255,255,255,0.08), transparent 60%)`,
              }}
            />

            {/* FRONT TOP ROW */}
            <div className="flex items-start justify-between gap-4 z-10 pt-2">
              <div>
                <div className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-200">
                  {siteConfig.name}
                </div>
                <div className="font-mono text-[10px] sm:text-xs text-neutral-400">
                  {siteConfig.degree} · DSA + Web
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full status-dot-pulse animate-pulse" />
                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                  student // active
                </span>
              </div>
            </div>

            {/* FRONT MIDDLE: HEADING, BIO, AND CUTOUT PHOTO */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center z-10 my-auto">
              {/* Left Content (8 cols on desktop) */}
              <div className="md:col-span-8 flex flex-col gap-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-[1.12]">
                  Hi, I&apos;m Karan.
                  <br />
                  <span>I&apos;m learning to build </span>
                  <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-sky-300 bg-clip-text text-transparent font-extrabold animate-gradient-shift">
                    things that work.
                  </span>
                </h1>

                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-lg line-clamp-3 sm:line-clamp-none">
                  3rd-semester CSE student at VIT-AP. I solve DSA in C++, build web apps, and
                  tinker with computer vision and IoT. Currently building AGRIFLOW, a smart
                  irrigation system.
                </p>
              </div>

              {/* Right Photo Cutout with Glow & Cursor Parallax (4 cols on desktop) */}
              <div className="md:col-span-4 flex justify-center md:justify-end relative">
                {/* Ambient Glow */}
                <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-pink-600/30 via-purple-600/25 to-sky-500/20 blur-2xl pointer-events-none" />

                {/* Photo Card with Spring-smoothed Parallax Tilt */}
                <div
                  style={{
                    transform: `rotateX(${photoTilt.rx}deg) rotateY(${photoTilt.ry}deg)`,
                    transition: "transform 180ms cubic-bezier(0.2, 0, 0.2, 1)",
                  }}
                  className="relative w-28 h-32 sm:w-36 sm:h-40 md:w-40 md:h-44 rounded-2xl overflow-hidden border border-neutral-700/80 bg-neutral-900 shadow-xl"
                >
                  <Image
                    src="/karan-color.png"
                    alt="Karan Kumar Pradhan"
                    width={160}
                    height={176}
                    sizes="(max-width: 768px) 144px, 160px"
                    className="w-full h-full object-cover object-top"
                    priority
                  />

                  {/* Subtle Glass Sweep on Photo */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>

            {/* FRONT BOTTOM ROW: CHIPS & FLIP HINT */}
            <div className="flex items-center justify-between gap-3 z-10 pt-2 border-t border-neutral-800/80 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-1 rounded-full border border-neutral-700 bg-neutral-900/80 text-neutral-300 text-[10px] sm:text-xs">
                  C++ · DSA ({liveLeetCode.totalSolved} solved)
                </span>
                <span className="px-2.5 py-1 rounded-full border border-neutral-700 bg-neutral-900/80 text-neutral-300 text-[10px] sm:text-xs">
                  Web dev
                </span>
                {siteConfig.showStudentIdChip && (
                  <span className="px-2.5 py-1 rounded-full border border-neutral-700 bg-neutral-900/80 text-neutral-400 text-[10px] sm:text-xs">
                    ID {siteConfig.studentId}
                  </span>
                )}
              </div>

              {/* Flip Hint with Subtle Pulse on load */}
              <div className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors text-[11px] sm:text-xs font-medium animate-pulse-once">
                <span>psst, flip me</span>
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* BADGE BACK SIDE (AFTER FLIP)                                    */}
          {/* =============================================================== */}
          <div
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg) translateZ(1px)",
              pointerEvents: isFlipped ? "auto" : "none",
            }}
            className={`absolute inset-0 rounded-[18px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden transition-colors ${
              isDark
                ? "bg-[#141416] text-[#ededed] border border-[rgba(255,255,255,0.12)] shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_24px_rgba(255,255,255,0.03)]"
                : "bg-[#141416] text-[#ededed] border border-neutral-900/40 shadow-2xl shadow-black/25"
            }`}
          >
            {/* Top Slot Hole Cutout */}
            <div
              className="absolute top-2.5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-neutral-900 border border-neutral-800"
            />

            {/* BACK TOP ROW */}
            <div className="flex items-center justify-between gap-3 z-10 pt-1 border-b border-neutral-800 pb-2.5">
              <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-100 flex items-center gap-2">
                <span>FIND ME // CONNECT</span>
                <span className="inline-flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded status-pill-badge border">
                  <span className={`w-1.5 h-1.5 rounded-full status-dot-indicator ${isSyncing ? "animate-ping" : "animate-pulse"}`} />
                  LIVE SYNC
                </span>
              </span>

              <span className="font-mono text-xs text-neutral-300">
                GITHUB · {githubData.totalContributions} CONTRIBUTIONS ({yearRange})
              </span>
            </div>

            {/* BACK MIDDLE SECTION: LED DOT HEATMAP GRID & ACTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center z-10 my-auto">
              {/* Left 8 cols: LED Dot Grid */}
              <div className="lg:col-span-8 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-300 mb-0.5">
                  <span className="uppercase tracking-wider">ACTIVITY LED MATRIX (26 WEEKS)</span>
                  <span className="flex items-center gap-1 font-semibold text-neutral-200">
                    <span>streak: {githubData.currentStreak}d</span>
                    <Flame className="w-3.5 h-3.5 text-pink-400" />
                  </span>
                </div>

                {/* 7 rows x 26 columns LED Dot Heatmap */}
                <div className="overflow-x-auto pb-1 scrollbar-none">
                  <div className="flex gap-[4px] min-w-max">
                    {visibleWeeks.map((week, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-[4px]">
                        {week.days.map((day, rowIdx) => {
                          const ledColors = [
                            "bg-[#1c1c1f]", // 0 empty
                            "bg-cyan-400/90 shadow-[0_0_5px_rgba(34,211,238,0.6)]", // 1
                            "bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.7)]", // 2
                            "bg-purple-400 shadow-[0_0_7px_rgba(168,85,247,0.8)]", // 3
                            "bg-pink-400 shadow-[0_0_9px_rgba(244,63,94,0.9)]", // 4
                          ];

                          const colorClass = ledColors[day.level] || ledColors[0];

                          return (
                            <div
                              key={rowIdx}
                              title={`${day.date}: ${day.count} contributions`}
                              style={{
                                animationDelay: isBackAnimationActive
                                  ? `${colIdx * 15}ms`
                                  : undefined,
                              }}
                              className={`w-[11px] h-[11px] sm:w-[12px] sm:h-[12px] md:w-[13px] md:h-[13px] rounded-[2.5px] transition-transform duration-200 hover:scale-125 ${colorClass} ${
                                isBackAnimationActive ? "animate-led-wave" : ""
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row of Social Pill Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                  {Object.values(siteConfig.socials).map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-700 bg-neutral-900/90 text-neutral-200 hover:text-white hover:border-neutral-400 font-mono text-xs font-medium transition-colors"
                    >
                      <span>{s.name}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-70" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Right 4 cols: Vertical Link List & "Now" Card */}
              <div className="lg:col-span-4 flex flex-col justify-between gap-3">
                {/* Vertical Links */}
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <Link
                    href="/resume"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 p-2 rounded-lg border border-neutral-800 bg-neutral-900/80 text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    <span>resume</span>
                  </Link>
                  <Link
                    href="/work"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 p-2 rounded-lg border border-neutral-800 bg-neutral-900/80 text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                    <span>work</span>
                  </Link>
                  <Link
                    href="/about"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 p-2 rounded-lg border border-neutral-800 bg-neutral-900/80 text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span>about</span>
                  </Link>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 p-2 rounded-lg border border-neutral-800 bg-neutral-900/80 text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>email me</span>
                  </a>
                </div>

                {/* "Now Building" Card */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/90 flex flex-col gap-1.5 font-mono"
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-pink-400">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                      {nowData.buildingLabel}
                    </span>
                    <span className="text-neutral-400">VIT-AP</span>
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm">
                    {nowData.buildingTitle}
                  </div>
                  <div className="text-xs text-neutral-300 line-clamp-1">
                    {nowData.buildingSubtitle}
                  </div>
                  <div className="text-[11px] text-neutral-300 pt-1.5 border-t border-neutral-800 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-semibold">
                        LEETCODE: {liveLeetCode.totalSolved} SOLVED
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {liveLeetCode.easySolved}E · {liveLeetCode.mediumSolved}M · {liveLeetCode.hardSolved}H
                      </span>
                    </div>
                    {liveLeetCode.recentSubmissions && liveLeetCode.recentSubmissions.length > 0 ? (
                      <div className="text-[10px] text-neutral-400 truncate">
                        latest: {liveLeetCode.recentSubmissions[0].title} ({liveLeetCode.recentSubmissions[0].lang})
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-400 truncate">
                        {nowData.solvingLabel} · {nowData.solvingTitle}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BACK BOTTOM ROW: SIGNATURE & FLIP BACK */}
            <div className="flex items-center justify-between gap-3 z-10 pt-2 border-t border-neutral-800 text-xs font-mono">
              <span className="text-neutral-400">
                Karan Kumar Pradhan · VIT-AP CSE
              </span>

              {/* Clickable flip back button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFlip(false);
                }}
                className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <span>flip back</span>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

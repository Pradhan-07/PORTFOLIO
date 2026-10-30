"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import { nowData } from "@/data/now";
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
  x: number;
  y: number;
  angleDeg: number;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  isFlipped: boolean;
  onToggleFlip: () => void;
  isDark: boolean;
}

interface GitHubData {
  totalContributions: number;
  currentStreak: number;
  weeks: { days: { count: number; level: number; date: string }[] }[];
}

export function Badge({
  x,
  y,
  angleDeg,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  isFlipped,
  onToggleFlip,
  isDark,
}: BadgeProps) {
  const badgeRef = useRef<HTMLDivElement | null>(null);

  // Mouse tilt / sheen coordinates relative to badge card
  const [sheenPos, setSheenPos] = useState({ x: 50, y: 50 });
  const [photoTilt, setPhotoTilt] = useState({ rx: 0, ry: 0 });

  // GitHub Live Data
  const [githubData, setGithubData] = useState<GitHubData | null>(null);

  useEffect(() => {
    async function loadGitHub() {
      try {
        const res = await fetch("/api/github");
        if (res.ok) {
          const json = await res.json();
          setGithubData(json);
        }
      } catch {
        // Fallback handled gracefully
      }
    }
    loadGitHub();
  }, []);

  // Keyboard accessibility: Enter or Space flips, Esc flips back
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggleFlip();
    } else if (e.key === "Escape" && isFlipped) {
      e.preventDefault();
      onToggleFlip();
    }
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const relY = ((e.clientY - rect.top) / rect.height) * 100;
    setSheenPos({ x: relX, y: relY });

    // Parallax photo tilt towards pointer (max ~8 degrees)
    const normX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const normY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setPhotoTilt({
      rx: -normY * 8,
      ry: normX * 8,
    });
  };

  const handleCardMouseLeave = () => {
    setPhotoTilt({ rx: 0, ry: 0 });
    setSheenPos({ x: 50, y: 50 });
  };

  // 26 weeks for back heatmap LED grid
  const visibleWeeks = githubData?.weeks?.slice(-26) || [];
  const currentYear = new Date().getFullYear();
  const yearRange = `${currentYear - 1}–${currentYear}`;

  return (
    <div
      ref={badgeRef}
      role="button"
      tabIndex={0}
      aria-label="Flip interactive ID badge"
      onKeyDown={handleKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => {
        onPointerMove(e);
        handleCardMouseMove(e as unknown as React.MouseEvent<HTMLDivElement>);
      }}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onMouseLeave={handleCardMouseLeave}
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        // Anchor badge pivot at top-center (x: 50%, y: 0)
        transformOrigin: "50% 0%",
        transform: `translate(-50%, 0px) rotate(${angleDeg}deg)`,
        perspective: "1200px",
        willChange: "transform",
      }}
      className={`z-30 select-none outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 rounded-[18px] ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* 3D FLIP ROTATION CONTAINER */}
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
          transition: "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="relative w-[92vw] sm:w-[84vw] md:w-[72vw] lg:w-[680px] xl:w-[740px] aspect-[1.47/1] min-h-[380px] sm:min-h-[440px] md:min-h-[460px] rounded-[18px] shadow-2xl transition-shadow"
      >
        {/* ================================================================= */}
        {/* BADGE FRONT SIDE                                                  */}
        {/* ================================================================= */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
          className={`absolute inset-0 rounded-[18px] bg-[#0b0b0c] text-[#ededed] p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl border ${
            isDark ? "border-neutral-800" : "border-neutral-900/40 shadow-black/25"
          }`}
        >
          {/* Top Slot Hole Cutout for Lanyard Clip */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-neutral-900 border border-neutral-800" />

          {/* Dynamic Light Sheen Gradients */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[18px] opacity-40 mix-blend-overlay"
            style={{
              background: `linear-gradient(${120 + angleDeg * 2}deg, transparent 20%, rgba(255,255,255,0.12) ${sheenPos.x}%, transparent 80%)`,
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-[18px] opacity-25"
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
                <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-sky-300 bg-clip-text text-transparent font-extrabold">
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
              {/* Pink/Violet Ambient Glow */}
              <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-pink-600/30 via-purple-600/25 to-sky-500/20 blur-2xl pointer-events-none" />

              {/* Photo Card with Parallax Tilt */}
              <div
                style={{
                  transform: `perspective(600px) rotateX(${photoTilt.rx}deg) rotateY(${photoTilt.ry}deg)`,
                  transition: "transform 150ms ease-out",
                }}
                className="relative w-28 h-32 sm:w-36 sm:h-40 md:w-40 md:h-44 rounded-2xl overflow-hidden border border-neutral-700/80 bg-neutral-900 shadow-xl"
              >
                <Image
                  src="/karan-color.png"
                  alt="Karan Kumar Pradhan"
                  fill
                  sizes="(max-width: 768px) 144px, 160px"
                  className="object-cover object-top"
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
                C++ · DSA
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

            {/* Flip Hint */}
            <div className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors text-[11px] sm:text-xs font-medium">
              <span>psst, flip me</span>
              <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BADGE BACK SIDE (AFTER FLIP)                                      */}
        {/* ================================================================= */}
        <div
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
          className="absolute inset-0 rounded-[18px] bg-[#0c0c0e] text-[#ededed] border border-neutral-800 p-5 sm:p-7 flex flex-col justify-between overflow-hidden shadow-2xl"
        >
          {/* Top Slot Hole Cutout */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-neutral-900 border border-neutral-800" />

          {/* BACK TOP ROW */}
          <div className="flex items-center justify-between gap-2 z-10 pt-2 border-b border-neutral-800/80 pb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-300">
              FIND ME // CONNECT
            </span>

            <span className="font-mono text-[10px] sm:text-xs text-neutral-400">
              GITHUB · {githubData?.totalContributions || 142} CONTRIBUTIONS ({yearRange})
            </span>
          </div>

          {/* BACK MIDDLE SECTION: LED DOT HEATMAP GRID & ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center z-10 my-auto">
            {/* Left 8 cols: LED Dot Grid */}
            <div className="lg:col-span-8 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mb-1">
                <span>ACTIVITY LED MATRIX (26 WEEKS)</span>
                <span className="flex items-center gap-1">
                  <span>streak: {githubData?.currentStreak || 21}d</span>
                  <Flame className="w-3 h-3 text-pink-400" />
                </span>
              </div>

              {/* 7 rows x 26 columns LED Dot Heatmap */}
              <div className="overflow-x-auto pb-1 scrollbar-none">
                <div className="flex gap-[3.5px] min-w-max">
                  {visibleWeeks.map((week, colIdx) => (
                    <div key={colIdx} className="flex flex-col gap-[3.5px]">
                      {week.days.map((day, rowIdx) => {
                        // Cyan to Violet to Pink gradient intensity
                        const ledColors = [
                          "bg-[#1c1c1f]", // 0 empty
                          "bg-cyan-400/80 shadow-[0_0_4px_rgba(34,211,238,0.5)]", // 1
                          "bg-indigo-400 shadow-[0_0_5px_rgba(129,140,248,0.6)]", // 2
                          "bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.7)]", // 3
                          "bg-pink-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]", // 4
                        ];

                        const colorClass = ledColors[day.level] || ledColors[0];

                        return (
                          <div
                            key={rowIdx}
                            title={`${day.date}: ${day.count} contributions`}
                            style={{
                              transitionDelay: isFlipped ? `${colIdx * 12}ms` : "0ms",
                            }}
                            className={`w-[9px] h-[9px] sm:w-[10px] sm:h-[10px] rounded-[2px] transition-all duration-300 hover:scale-125 ${colorClass}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row of Social Pill Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {Object.values(siteConfig.socials).map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-neutral-700 bg-neutral-900/90 text-neutral-300 hover:text-white hover:border-neutral-500 font-mono text-[10px] sm:text-xs transition-colors"
                  >
                    <span>{s.name}</span>
                    <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
                  </a>
                ))}
              </div>
            </div>

            {/* Right 4 cols: Vertical Link List & "Now" Card */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-3">
              {/* Vertical Links */}
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                <Link
                  href="/resume"
                  className="flex items-center gap-1.5 p-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <FileText className="w-3 h-3 text-neutral-400" />
                  <span>resume</span>
                </Link>
                <Link
                  href="/work"
                  className="flex items-center gap-1.5 p-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <Briefcase className="w-3 h-3 text-neutral-400" />
                  <span>work</span>
                </Link>
                <Link
                  href="/about"
                  className="flex items-center gap-1.5 p-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <User className="w-3 h-3 text-neutral-400" />
                  <span>about</span>
                </Link>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <Mail className="w-3 h-3 text-neutral-400" />
                  <span>email me</span>
                </a>
              </div>

              {/* "Now Building" Card */}
              <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/90 flex flex-col gap-1 font-mono text-[11px]">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-pink-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                    {nowData.buildingLabel}
                  </span>
                  <span className="text-neutral-500">VIT-AP</span>
                </div>
                <div className="font-bold text-neutral-100 text-xs">
                  {nowData.buildingTitle}
                </div>
                <div className="text-[10px] text-neutral-400 line-clamp-1">
                  {nowData.buildingSubtitle}
                </div>
                <div className="text-[9px] text-neutral-500 pt-1 border-t border-neutral-800">
                  {nowData.solvingLabel} · {nowData.solvingTitle}
                </div>
              </div>
            </div>
          </div>

          {/* BACK BOTTOM ROW: FAINT SIGNATURE & FLIP FRONT */}
          <div className="flex items-center justify-between gap-3 z-10 pt-2 border-t border-neutral-800/80 text-[10px] font-mono">
            <span className="text-neutral-600">
              Karan Kumar Pradhan · VIT-AP CSE
            </span>

            <div className="inline-flex items-center gap-1 text-neutral-400 hover:text-white transition-colors">
              <span>● flip to front ●</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

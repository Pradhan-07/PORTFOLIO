"use client";

import React from "react";
import { stats } from "@/data/stats";
import { CountUp } from "@/components/CountUp";
import { useLiveStats } from "@/context/LiveStatsContext";

export function HomeStatsTiles() {
  const { leetcode, github, isSyncing } = useLiveStats();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
      {/* 1. Academics */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-neutral-50/50 dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
        <span className="font-mono text-[10px] uppercase text-neutral-400 block mb-1">
          ACADEMICS // CGPA
        </span>
        <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--foreground)]">
          <CountUp end={8.1} decimals={2} duration={1100} />{" "}
          <span className="text-sm font-normal text-neutral-500">
            / {stats.cgpaScale}
          </span>
        </div>
        <span className="font-mono text-[10px] text-neutral-500 mt-1 block">
          VIT-AP University · 3rd Sem
        </span>
      </div>

      {/* 2. Live LeetCode */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-neutral-50/50 dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors relative overflow-hidden group">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[10px] uppercase text-neutral-400">
            LEETCODE SOLVED
          </span>
          <span
            className="inline-flex items-center gap-1 font-mono text-[9px] text-emerald-500 dark:text-emerald-400"
            title="Real-time live sync every 60 seconds and on tab focus"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 ${
                isSyncing ? "animate-ping" : "animate-pulse"
              }`}
            />
            LIVE
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--foreground)]">
          <CountUp end={leetcode.totalSolved} duration={1200} />
        </div>
        <span className="font-mono text-[10px] text-neutral-500 mt-1 block">
          E: {leetcode.easySolved} · M: {leetcode.mediumSolved} · H: {leetcode.hardSolved}
        </span>
      </div>

      {/* 3. GitHub & DSA Repository */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-neutral-50/50 dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[10px] uppercase text-neutral-400">
            GITHUB CONTRIBUTIONS
          </span>
          <span
            className="inline-flex items-center gap-1 font-mono text-[9px] text-emerald-500 dark:text-emerald-400"
            title="Real-time live sync from GitHub API"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 ${
                isSyncing ? "animate-ping" : "animate-pulse"
              }`}
            />
            {github.currentStreak}d streak
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--foreground)]">
          <CountUp end={github.totalContributions} duration={1300} />
        </div>
        <span className="font-mono text-[10px] text-neutral-500 mt-1 block">
          69+ DSA C++ · github.com/{github.username}
        </span>
      </div>
    </div>
  );
}

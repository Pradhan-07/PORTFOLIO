"use client";

import React from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import { stats } from "@/data/stats";

export function OpenToWorkCTA() {
  return (
    <div className="w-full my-12 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#121212]/50 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 font-mono text-xs text-neutral-800 dark:text-neutral-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">open to internships and collaborations</span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-lg">
          Currently seeking summer 2027 software engineering internships, open-source projects, and systems/web collaborations.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
        <a
          href="mailto:pradhankaran058@gmail.com"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-white transition-colors shadow-sm"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Say hi</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>

        <a
          href={`https://github.com/${stats.githubUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
        >
          <span>GitHub</span>
          <ArrowUpRight className="w-3 h-3 opacity-60" />
        </a>

        <a
          href={`https://leetcode.com/u/${stats.leetcodeUsername}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
        >
          <span>LeetCode</span>
          <ArrowUpRight className="w-3 h-3 opacity-60" />
        </a>
      </div>
    </div>
  );
}

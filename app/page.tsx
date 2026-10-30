import React from "react";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { LetsTalk } from "@/components/LetsTalk";
import { stats } from "@/data/stats";
import { resumeData } from "@/data/resume";
import { ArrowRight, Download, FileText } from "lucide-react";
import { CountUp } from "@/components/CountUp";
import { TypewriterText } from "@/components/TypewriterText";

// Centralized consecutive section numbering to guarantee layout order
const SECTION_LABELS = {
  resume: "[ 01 // RESUME ]",
  talk: "[ 02 // LET'S TALK ]",
} as const;

export default function HomePage() {
  return (
    <div className="w-full">
      {/* HERO BADGE EXPERIENCE */}
      <Hero />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* =============================================================== */}
        {/* 1. RESUME TEASER SECTION                                        */}
        {/* =============================================================== */}
        <section
          id="resume"
          className="w-full mt-6 sm:mt-10 mb-16 sm:mb-20 p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xs scroll-mt-24 sm:scroll-mt-28"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-[var(--border)]">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                <TypewriterText text={SECTION_LABELS.resume} duration={400} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1">
                Resume &amp; Academic Overview
              </h2>
            </div>
            <span className="font-mono text-[11px] text-neutral-400">
              as of {stats.asOf}
            </span>
          </div>

          {/* 3 Mono Stat Tiles with Animated Count-Up */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
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

            <div className="p-4 rounded-xl border border-[var(--border)] bg-neutral-50/50 dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
              <span className="font-mono text-[10px] uppercase text-neutral-400 block mb-1">
                LEETCODE SOLVED
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--foreground)]">
                <CountUp end={stats.leetcodeSolved} duration={1200} />
              </div>
              <span className="font-mono text-[10px] text-neutral-500 mt-1 block">
                E: {stats.leetcodeBreakdown.easy} · M: {stats.leetcodeBreakdown.medium} · H: {stats.leetcodeBreakdown.hard}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-neutral-50/50 dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
              <span className="font-mono text-[10px] uppercase text-neutral-400 block mb-1">
                C++ DSA PROGRAMS
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--foreground)]">
                <CountUp end={69} duration={1300} suffix="+" />
              </div>
              <span className="font-mono text-[10px] text-neutral-500 mt-1 block">
                DSA_CPP repository
              </span>
            </div>
          </div>

          {/* Summary Paragraph */}
          <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6 max-w-3xl">
            {resumeData.summary}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <Link
              href="/resume"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-medium hover:bg-neutral-800 dark:hover:bg-white active:scale-[0.98] transition-all shadow-xs group cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View resume</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href={resumeData.pdfUrl}
              download="Karan-Kumar-Pradhan-Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white active:scale-[0.98] transition-all group cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
              <span>Download PDF</span>
              <span className="group-hover:translate-y-0.5 transition-transform">↓</span>
            </a>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 2. LET'S TALK SECTION                                           */}
        {/* =============================================================== */}
        <LetsTalk sectionLabel={SECTION_LABELS.talk} />
      </div>
    </div>
  );
}

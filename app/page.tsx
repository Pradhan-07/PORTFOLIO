import React from "react";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { LetsTalk } from "@/components/LetsTalk";
import { stats } from "@/data/stats";
import { resumeData } from "@/data/resume";
import { ArrowRight, Download, FileText } from "lucide-react";
import { HomeStatsTiles } from "@/components/HomeStatsTiles";
import { TypewriterText } from "@/components/TypewriterText";
import { ResumeTeaserGrid } from "@/components/backgrounds/ResumeTeaserGrid";

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
          className="relative w-full mt-6 sm:mt-10 mb-16 sm:mb-20 p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xs scroll-mt-24 sm:scroll-mt-28 overflow-hidden"
        >
          {/* Hairline 64px Grid Background */}
          <ResumeTeaserGrid />

          <div className="relative z-10">
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

            {/* 3 Mono Stat Tiles with Animated Count-Up & Real-Time Sync */}
            <HomeStatsTiles />

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
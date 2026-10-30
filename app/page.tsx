import React from "react";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { ProjectCard } from "@/components/ProjectCard";
import { Timeline } from "@/components/Timeline";
import { QuickTakes } from "@/components/QuickTakes";
import { LetsTalk } from "@/components/LetsTalk";
import { getSortedProjects } from "@/data/projects";
import { getAllPosts } from "@/lib/posts";
import { stats } from "@/data/stats";
import { resumeData } from "@/data/resume";
import { ArrowRight, ArrowUpRight, Download, FileText } from "lucide-react";

export default function HomePage() {
  const allProjects = getSortedProjects();
  const featuredProjects = allProjects.slice(0, 4); // Top 4 projects on index
  const posts = getAllPosts().slice(0, 3); // 3 blog posts

  return (
    <div className="w-full">
      {/* 1. HERO SECTION */}
      <Hero />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* 2. THINGS I'VE BUILT SECTION */}
        <section id="work" className="w-full my-16 sm:my-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                [ FEATURED // SELECTED WORK ]
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-neutral-100 mt-2">
                Things I&apos;ve built
              </h2>
            </div>

            <Link
              href="/work"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors group"
            >
              <span>view all projects</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Grid of Top 4 Project Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-mono text-xs text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-700 hover:text-black dark:hover:text-white transition-all shadow-sm group"
            >
              <span>see all {allProjects.length} projects & experiments</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* RESUME TEASER SECTION */}
        <section id="resume" className="w-full my-16 sm:my-24 p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-[var(--border)]">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                [ DOSSIER // RESUME ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1">
                Resume &amp; Academic Overview
              </h2>
            </div>
            <span className="font-mono text-[11px] text-neutral-400">
              as of {stats.asOf}
            </span>
          </div>

          {/* 3 Mono Stat Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="p-4 rounded-xl border border-[var(--border)] bg-neutral-50/50 dark:bg-neutral-900/40">
              <span className="font-mono text-[10px] uppercase text-neutral-400 block mb-1">
                ACADEMICS // CGPA
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--foreground)]">
                {stats.cgpa} <span className="text-sm font-normal text-neutral-500">/ {stats.cgpaScale}</span>
              </div>
              <span className="font-mono text-[10px] text-neutral-500 mt-1 block">
                VIT-AP University · 3rd Sem
              </span>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-neutral-50/50 dark:bg-neutral-900/40">
              <span className="font-mono text-[10px] uppercase text-neutral-400 block mb-1">
                LEETCODE SOLVED
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--foreground)]">
                {stats.leetcodeSolved}
              </div>
              <span className="font-mono text-[10px] text-neutral-500 mt-1 block">
                E: {stats.leetcodeBreakdown.easy} · M: {stats.leetcodeBreakdown.medium} · H: {stats.leetcodeBreakdown.hard}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-neutral-50/50 dark:bg-neutral-900/40">
              <span className="font-mono text-[10px] uppercase text-neutral-400 block mb-1">
                C++ DSA PROGRAMS
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--foreground)]">
                {stats.dsaPrograms}
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
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-medium hover:bg-neutral-800 dark:hover:bg-white transition-all shadow-xs group"
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
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
              <span>↓</span>
            </a>
          </div>
        </section>

        {/* 3. WRITING SECTION */}
        <section id="writing" className="w-full my-16 sm:my-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                [ ESSAYS // DEV NOTES ]
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-neutral-100 mt-2">
                Writing
              </h2>
            </div>

            <Link
              href="/writing"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors group"
            >
              <span>view all posts</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* List of Blog Posts */}
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/writing/${post.slug}`}
                className="group py-6 block transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 px-3 -mx-3 rounded-xl"
              >
                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-2 font-mono text-xs text-neutral-400 dark:text-neutral-500">
                  <div className="flex items-center gap-2">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-neutral-600 dark:text-neutral-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                    {post.title}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                  {post.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. MILESTONES (LATEST 3) */}
        <Timeline limit={3} />

        {/* 5. QUICK TAKES SECTION */}
        <QuickTakes />

        {/* 6. LET'S TALK SECTION */}
        <LetsTalk />
      </div>
    </div>
  );
}

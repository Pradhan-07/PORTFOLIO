"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  resumeData,
  getResumeProjects,
  SkillCategory,
  CertificationData,
} from "@/data/resume";
import { Project } from "@/data/projects";
import {
  Download,
  Copy,
  Check,
  Code2,
  Plus,
  Minus,
  GraduationCap,
  Award,
  Printer,
  AlertCircle,
} from "lucide-react";

const sections = [
  { id: "summary", name: "Summary" },
  { id: "education", name: "Education" },
  { id: "projects", name: "Projects" },
  { id: "certifications", name: "Certifications" },
  { id: "skills", name: "Technical Skills" },
  { id: "activity", name: "Activity & Streaks" },
];

export function ResumeClient() {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState("summary");
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [liveStreak, setLiveStreak] = useState<number>(21);

  const projects = getResumeProjects();

  // Copy email helper
  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(resumeData.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
    }
  };

  // Toggle project expand
  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Fetch live GitHub streak
  useEffect(() => {
    async function fetchStreak() {
      try {
        const res = await fetch("/api/github");
        if (res.ok) {
          const json = await res.json();
          if (json?.currentStreak) {
            setLiveStreak(json.currentStreak);
          }
        }
      } catch {
        // Fallback remains 21
      }
    }
    fetchStreak();
  }, []);

  // IntersectionObserver for Table of Contents
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-90px 0px -60% 0px",
        threshold: 0.1,
      }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-24 resume-page-root">
      {/* 1. Header & Actions (hidden in print) */}
      <div className="mb-10 sm:mb-12 pb-8 border-b border-[var(--border)] print:hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {resumeData.headerLabel}
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--foreground)] mt-2 mb-2">
              {resumeData.title}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-mono">
              {resumeData.subtitle}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            {/* Download PDF button */}
            <a
              href={resumeData.pdfUrl}
              download="Karan-Kumar-Pradhan-Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-medium hover:bg-neutral-800 dark:hover:bg-white transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
              <span>↓</span>
            </a>

            {/* Copy Email button */}
            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">copied ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy email</span>
                </>
              )}
            </button>

            {/* Print button */}
            <button
              onClick={() => window.print()}
              aria-label="Print resume"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
              title="Print preview (optimized for 1-page)"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Scroll TOC under Navbar */}
        <div className="lg:hidden mt-6 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 flex items-center gap-1.5">
          {sections.map(({ id, name }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                activeSection === id
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-medium"
                  : "bg-[var(--card)] border border-[var(--border)] text-neutral-500 hover:text-black dark:hover:text-white"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Desktop sticky TOC + Content cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Sticky Desktop TOC (Left 3 columns) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 print:hidden">
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] font-mono text-xs">
            <span className="text-[10px] tracking-wider uppercase text-neutral-400 dark:text-neutral-500 block mb-3">
              CONTENTS // SECTIONS
            </span>
            <nav className="flex flex-col gap-1.5" aria-label="Resume Table of Contents">
              {sections.map(({ id, name }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`text-left px-2.5 py-1.5 rounded-md transition-colors ${
                    activeSection === id
                      ? "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-950 dark:text-white font-medium border-l-2 border-neutral-900 dark:border-white"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                  }`}
                >
                  {name}
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-[var(--border)] text-[10px] text-neutral-400 flex flex-col gap-1">
              <span>● Format: A4 / 1-Page Friendly</span>
              <span>● Press Ctrl+P to print</span>
            </div>
          </div>
        </aside>

        {/* Content Column (Right 9 columns) */}
        <div className="lg:col-span-9 space-y-8 sm:space-y-10 print:col-span-12 print:space-y-6">
          
          {/* Printable Header (Visible only when printed) */}
          <div className="hidden print:block pb-4 mb-4 border-b border-black">
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Karan Kumar Pradhan
            </h1>
            <p className="text-xs font-mono text-neutral-700 mt-1">
              B.Tech Computer Science Engineering · VIT-AP University · {resumeData.email}
            </p>
            <p className="text-xs font-mono text-neutral-700">
              GitHub: github.com/Pradhan-07 · LinkedIn · LeetCode · Portfolio: karan-pradhan.vercel.app
            </p>
          </div>

          {/* SECTION A: SUMMARY */}
          <motion.section
            id="summary"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xs print:border-none print:p-0"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)] print:border-black">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 print:text-black">
                [ 01 // SUMMARY ]
              </span>
              <span className="font-mono text-[10px] text-neutral-400 print:hidden">overview</span>
            </div>
            <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed print:text-black">
              {resumeData.summary}
            </p>
          </motion.section>

          {/* SECTION B: EDUCATION */}
          <motion.section
            id="education"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xs print:border-none print:p-0"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)] print:border-black">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 print:text-black">
                [ 02 // EDUCATION ]
              </span>
              <span className="font-mono text-[10px] text-neutral-400 print:hidden">academics</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
              <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] print:text-black flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-neutral-500 print:hidden" />
                <span>{resumeData.education.institution}</span>
                <span className="font-normal text-xs text-neutral-500">
                  ({resumeData.education.location})
                </span>
              </h3>
              <span className="font-mono text-xs text-neutral-500 print:text-black">
                {resumeData.education.period}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs mb-3 text-neutral-600 dark:text-neutral-400 print:text-black">
              <span className="font-semibold text-[var(--foreground)] print:text-black">
                {resumeData.education.degree}
              </span>
              <span>·</span>
              <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-[var(--border)] font-bold text-neutral-900 dark:text-neutral-100 print:border-black print:bg-white print:text-black">
                CGPA: {resumeData.education.cgpa}
              </span>
              <span>·</span>
              <span>{resumeData.education.semester}</span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed print:text-black">
              {resumeData.education.coursework}
            </p>
          </motion.section>

          {/* SECTION C: PROJECTS */}
          <motion.section
            id="projects"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xs print:border-none print:p-0"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)] print:border-black">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 print:text-black">
                [ 03 // PROJECTS ]
              </span>
              <span className="font-mono text-[10px] text-neutral-400 print:hidden">
                selected engineering work
              </span>
            </div>

            <div className="divide-y divide-[var(--border)] print:divide-neutral-300">
              {projects.map((project: Project) => {
                const isExpanded = !!expandedProjects[project.id];

                return (
                  <div key={project.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-[var(--foreground)] print:text-black">
                          {project.title}
                        </h4>
                        {project.status === "in progress" && (
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 print:hidden">
                            In progress
                          </span>
                        )}
                      </div>

                      <span className="font-mono text-xs text-neutral-400 print:text-black">
                        {project.year}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-2.5 print:text-black">
                      {project.shortDescription}
                    </p>

                    {/* Tech Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[10px] px-2 py-0.5 rounded border border-[var(--border)] bg-neutral-100/60 dark:bg-neutral-900/60 text-neutral-600 dark:text-neutral-400 print:border-neutral-400 print:text-black print:bg-white"
                        >
                          {tag}
                        </span>
                      ))}

                      {/* Code Link */}
                      {project.codeUrl && (
                        <a
                          href={project.codeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 ml-2 font-mono text-[10px] text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white underline underline-offset-2 print:text-black print:no-underline"
                        >
                          <Code2 className="w-3 h-3 print:hidden" />
                          <span>Code ↗</span>
                        </a>
                      )}

                      {/* Expand Toggle */}
                      {project.expanded?.highlights && (
                        <button
                          onClick={() => toggleExpand(project.id)}
                          className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-neutral-500 hover:text-black dark:hover:text-white print:hidden"
                        >
                          {isExpanded ? (
                            <>
                              <span>less</span>
                              <Minus className="w-2.5 h-2.5" />
                            </>
                          ) : (
                            <>
                              <span>expand +</span>
                              <Plus className="w-2.5 h-2.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Expanded Bullets */}
                    <AnimatePresence>
                      {isExpanded && project.expanded?.highlights && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2.5 pl-4 space-y-1 list-disc text-xs text-neutral-600 dark:text-neutral-400 overflow-hidden print:block print:opacity-100 print:text-black"
                        >
                          {project.expanded.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* SECTION D: CERTIFICATIONS */}
          <motion.section
            id="certifications"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xs print:border-none print:p-0"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)] print:border-black">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 print:text-black">
                [ 04 // CERTIFICATIONS ]
              </span>
              <span className="font-mono text-[10px] text-neutral-400 print:hidden">credentials</span>
            </div>

            <div className="space-y-3">
              {resumeData.certifications.map((cert: CertificationData) => (
                <div
                  key={cert.title}
                  className="p-3.5 rounded-lg border border-[var(--border)] bg-neutral-50/50 dark:bg-neutral-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:border-none print:p-0"
                >
                  <div className="flex items-start gap-2.5">
                    <Award className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0 mt-0.5 print:hidden" />
                    <div>
                      <h4 className="text-sm font-bold text-[var(--foreground)] print:text-black">
                        {cert.title}
                      </h4>
                      <p className="text-xs font-mono text-neutral-500 print:text-black">
                        {cert.issuer} · {cert.date}
                      </p>
                    </div>
                  </div>

                  {cert.todoNote && (
                    <div className="font-mono text-[10px] text-neutral-400 flex items-center gap-1 print:hidden">
                      <AlertCircle className="w-3 h-3 text-neutral-400" />
                      <span>{cert.todoNote}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>

          {/* SECTION E: TECHNICAL SKILLS */}
          <motion.section
            id="skills"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.32 }}
            className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xs print:border-none print:p-0"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)] print:border-black">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 print:text-black">
                [ 05 // TECHNICAL SKILLS ]
              </span>
              <span className="font-mono text-[10px] text-neutral-400 print:hidden">toolkit</span>
            </div>

            <div className="space-y-3.5">
              {resumeData.skills.map((group: SkillCategory) => (
                <div key={group.category} className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <div className="sm:w-28 shrink-0 font-mono text-xs font-semibold text-neutral-500 dark:text-neutral-400 print:text-black">
                    {group.category}:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.skills.map((skill) => (
                      <span
                        key={skill}
                        className="font-mono text-[11px] px-2 py-0.5 rounded border border-[var(--border)] bg-neutral-100/70 dark:bg-neutral-900/60 text-neutral-800 dark:text-neutral-200 print:border-neutral-400 print:bg-white print:text-black"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* SECTION F: ACTIVITY & STREAKS */}
          <motion.section
            id="activity"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xs print:border-none print:p-0"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)] print:border-black">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 print:text-black">
                [ 06 // ACTIVITY & METRICS ]
              </span>
              <span className="font-mono text-[10px] text-neutral-400 print:hidden">live telemetry</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 print:text-black">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                <span>
                  <strong>GitHub Contribution Record:</strong> {resumeData.activity.githubStreakRecord}. Total September 2026: {resumeData.activity.totalSeptContributions} contributions.
                </span>
              </div>

              {/* Live GitHub streak from API */}
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  <strong>Current Live Streak:</strong>{" "}
                  <span className="font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-[var(--border)] font-bold">
                    {liveStreak} days
                  </span>{" "}
                  (pulled dynamically from GitHub API).
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                <span>
                  <strong>LeetCode:</strong> Started competitive problem solving in {resumeData.activity.leetcodeStartDate} (29 solved: 12 Easy, 15 Medium, 2 Hard).
                </span>
              </div>
            </div>
          </motion.section>

        </div>
      </div>
    </div>
  );
}

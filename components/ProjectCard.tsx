"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/data/projects";
import { ArrowUpRight, Plus, Minus, Code2, Globe, Users, Clock, AlertCircle } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  priority?: boolean;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: -1000, y: -1000 });
  };

  return (
    <motion.div
      layout
      transition={{ duration: 0.25, ease: "easeOut" }}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-5 sm:p-6 transition-all duration-300 hover:border-neutral-400 dark:hover:border-neutral-600 shadow-sm overflow-hidden"
    >
      {/* Cursor-aware subtle monochrome spotlight glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(160,160,160,0.12), transparent 80%)`,
        }}
      />

      {/* Top Meta Row */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-medium tracking-wider text-neutral-400 dark:text-neutral-500">
              {project.number} {"//"} PROJECT
            </span>

            {/* In Progress badge */}
            {project.status === "in progress" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                In progress
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
              {project.year}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-neutral-100 mb-2 group-hover:text-black dark:group-hover:text-white transition-colors">
          {project.title}
        </h3>

        {/* Short Description or Subtle Pending State */}
        {project.isDescriptionPending ? (
          <div className="py-2.5 px-3 mb-4 rounded-md border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
            <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 italic flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 opacity-70" />
              <span>description coming soon</span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
            {project.shortDescription}
          </p>
        )}

        {/* Tech tags inside card only as small mono chips */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-mono px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/60 text-neutral-600 dark:text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Action Row: Code, Live, Expand Toggle */}
      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          {/* Code Link */}
          {project.codeUrl ? (
            <a
              href={project.codeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </a>
          ) : (
            <span
              title="Repository link will be added once public"
              className="inline-flex items-center gap-1 text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code (TODO)</span>
            </span>
          )}

          {/* Live Link */}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Live</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </a>
          )}

          {/* Profile Link (e.g. LeetCode) */}
          {project.profileUrl && (
            <a
              href={project.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
            >
              <span>Profile</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </a>
          )}
        </div>

        {/* EXPAND Toggle Button */}
        {project.expanded && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            {isExpanded ? (
              <>
                <span>COLLAPSE</span>
                <Minus className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>EXPAND</span>
                <Plus className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded Details Section with Framer Motion Height Animation */}
      <AnimatePresence>
        {isExpanded && project.expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-3 text-xs">
              
              {/* Role & Team badge if present */}
              {(project.expanded.role || project.expanded.teamSize) && (
                <div className="flex flex-wrap items-center gap-2 p-2.5 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-[11px]">
                  {project.expanded.teamSize && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-neutral-500" />
                      Team size: {project.expanded.teamSize} members
                    </span>
                  )}
                  {project.expanded.role && (
                    <span>· Role: {project.expanded.role}</span>
                  )}
                </div>
              )}

              {/* Overview */}
              {project.expanded.overview && (
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {project.expanded.overview}
                </p>
              )}

              {/* Highlights */}
              {project.expanded.highlights && project.expanded.highlights.length > 0 && (
                <ul className="space-y-1.5 pl-4 list-disc text-neutral-600 dark:text-neutral-400">
                  {project.expanded.highlights.map((highlight, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}

              {/* Status Details */}
              {project.expanded.statusDetails && (
                <p className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                  Status: {project.expanded.statusDetails}
                </p>
              )}

              {/* Visible TODO Comment Placeholder */}
              {project.expanded.todoNotes && (
                <div className="p-2.5 rounded bg-neutral-100 dark:bg-neutral-900/80 border border-dashed border-neutral-400 dark:border-neutral-700 text-neutral-800 dark:text-neutral-300 font-mono text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-neutral-500 shrink-0" />
                  <div>
                    <span className="font-bold">[TODO]: </span>
                    {project.expanded.todoNotes}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
"use client";

import React, { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { timelineItems, TimelineItem } from "@/data/timeline";
import { AlertCircle } from "lucide-react";

interface TimelineProps {
  limit?: number;
  showHeading?: boolean;
}

export function Timeline({ limit, showHeading = true }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemsToRender: TimelineItem[] = limit ? timelineItems.slice(0, limit) : timelineItems;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 60%"],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <section ref={containerRef} className="w-full my-16 sm:my-24">
      {/* Section Header */}
      {showHeading && (
        <div className="mb-12">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            [ TIMELINE // EXPERIENCE ]
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-neutral-100 mt-2">
            Experience & Milestones
          </h2>
        </div>
      )}

      {/* Timeline Layout */}
      <div className="relative">
        {/* Continuous 1px Vertical Connecting Line */}
        <div className="absolute left-[7px] md:left-[190px] top-3 bottom-3 w-px bg-neutral-200 dark:bg-neutral-800" />
        <motion.div
          style={{ scaleY }}
          className="absolute left-[7px] md:left-[190px] top-3 bottom-3 w-px bg-neutral-900 dark:bg-neutral-100 origin-top"
        />

        {/* Timeline Items */}
        <div className="space-y-8 sm:space-y-10">
          {itemsToRender.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.45,
                delay: index * 0.08, // 80ms stagger
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative flex flex-col md:flex-row items-start md:items-baseline gap-4 md:gap-12 pl-7 md:pl-0"
            >
              {/* Timeline Dot (Node) */}
              <div className="absolute left-0 md:left-[184px] top-1.5 md:top-2 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-neutral-950 bg-neutral-900 dark:bg-neutral-100 shadow-sm z-10 flex items-center justify-center">
                {item.isNow && (
                  <span className="absolute -inset-1 rounded-full bg-emerald-500/50 animate-ping" />
                )}
              </div>

              {/* Date Column: left on desktop, top on mobile */}
              <div className="md:w-[160px] md:text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-tight text-neutral-500 dark:text-neutral-400">
                  {item.isNow && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {item.date}
                </span>
              </div>

              {/* Content Card Column */}
              <div className="flex-1 w-full p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-neutral-100">
                    {item.title}
                  </h3>

                  {item.tag && (
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
                      {item.tag}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {item.description}
                </p>

                {/* Visible TODO note if present */}
                {item.todoNote && (
                  <div className="mt-3 p-2 rounded bg-neutral-100 dark:bg-neutral-900/80 border border-dashed border-neutral-400 dark:border-neutral-700 text-neutral-800 dark:text-neutral-300 font-mono text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>{item.todoNote}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


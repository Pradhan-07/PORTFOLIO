"use client";

import React from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

interface ResumeProgressRailProps {
  sections: Array<{ id: string; name: string }>;
  activeSection: string;
  onSectionClick?: (id: string) => void;
}

export function ResumeProgressRail({
  sections,
  activeSection,
  onSectionClick,
}: ResumeProgressRailProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <div
      data-resume-progress-rail
      aria-hidden="true"
      className="hidden lg:flex fixed left-6 top-1/3 -translate-y-1/2 flex-col items-center z-20 pointer-events-auto select-none"
    >
      {/* Background Track Line */}
      <div className="relative w-[2px] h-48 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
        {/* Animated Fill Gradient */}
        <motion.div
          style={{
            scaleY: prefersReducedMotion ? scrollYProgress : scaleY,
            transformOrigin: "top",
          }}
          className="absolute inset-0 w-full bg-gradient-to-b from-pink-500 via-purple-500 to-sky-400"
        />
      </div>

      {/* Section Node Ticks */}
      <div className="absolute top-0 bottom-0 flex flex-col justify-between items-center py-1">
        {sections.map(({ id, name }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => onSectionClick?.(id)}
              title={name}
              className="group relative flex items-center justify-center p-1 focus:outline-none cursor-pointer"
            >
              {/* Tick Dot */}
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-purple-500 scale-125 ring-2 ring-purple-400/40"
                    : "bg-neutral-400/60 dark:bg-neutral-600 hover:scale-110 hover:bg-neutral-300"
                }`}
              />

              {/* Tooltip on Hover */}
              <span className="absolute left-6 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


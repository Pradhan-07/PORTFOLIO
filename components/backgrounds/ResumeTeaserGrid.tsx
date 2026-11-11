"use client";

import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function ResumeTeaserGrid() {
  const uniqueId = useId().replace(/:/g, "");
  const maskId = `resumeGridMask_${uniqueId}`;
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
    >
      <motion.svg
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial mask that fades out away from stat tiles (centered near top) */}
          <radialGradient id={maskId} cx="50%" cy="20%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="80%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <mask id={`maskElement_${uniqueId}`}>
            <rect width="100%" height="100%" fill={`url(#${maskId})`} />
          </mask>

          {/* 64px Hairline Grid Pattern */}
          <pattern
            id={`pattern_${uniqueId}`}
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 64 0 L 0 0 0 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-black/8 dark:text-white/10"
            />
          </pattern>
        </defs>

        {/* Once-only animated drawing path that stays still */}
        <motion.rect
          width="100%"
          height="100%"
          fill={`url(#pattern_${uniqueId})`}
          mask={`url(#maskElement_${uniqueId})`}
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.svg>
    </div>
  );
}


"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export function WorkContourLines() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Gentle vertical scroll parallax (0.1x)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
      }}
    >
      <motion.div
        style={{ y: prefersReducedMotion ? 0 : parallaxY }}
        className="w-full h-full min-h-[1200px] flex items-center justify-center opacity-40 dark:opacity-50"
      >
        <svg
          viewBox="0 0 1200 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto min-w-[900px] max-w-[1400px] stroke-neutral-400/25 dark:stroke-white/10"
          strokeWidth="1"
          strokeDasharray="4 6"
        >
          {/* Topographic Contour Rings */}
          <path d="M 150 450 C 150 200, 450 120, 600 120 C 750 120, 1050 200, 1050 450 C 1050 700, 750 780, 600 780 C 450 780, 150 700, 150 450 Z" />
          <path d="M 220 450 C 220 250, 480 180, 600 180 C 720 180, 980 250, 980 450 C 980 650, 720 720, 600 720 C 480 720, 220 650, 220 450 Z" />
          <path d="M 290 450 C 290 300, 510 240, 600 240 C 690 240, 910 300, 910 450 C 910 600, 690 660, 600 660 C 510 660, 290 600, 290 450 Z" />
          <path d="M 360 450 C 360 340, 530 300, 600 300 C 670 300, 840 340, 840 450 C 840 560, 670 600, 600 600 C 530 600, 360 560, 360 450 Z" />
          <path d="M 430 450 C 430 380, 550 360, 600 360 C 650 360, 770 380, 770 450 C 770 520, 650 540, 600 540 C 550 540, 430 520, 430 450 Z" />
          <path d="M 500 450 C 500 420, 560 410, 600 410 C 640 410, 700 420, 700 450 C 700 480, 640 490, 600 490 C 560 490, 500 480, 500 450 Z" />
          
          {/* Asymmetric secondary ridge lines */}
          <path d="M 50 150 C 250 180, 350 350, 550 380 C 750 410, 900 220, 1150 250" />
          <path d="M 50 750 C 250 720, 380 580, 620 560 C 860 540, 950 720, 1150 680" />
        </svg>
      </motion.div>
    </div>
  );
}


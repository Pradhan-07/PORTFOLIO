"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export function LetsTalkMesh() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Scroll parallax (0.15x)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [-24, 24]);

  // Cursor spotlight state (local to section only)
  const [spotlight, setSpotlight] = useState({ x: -500, y: -500, visible: false });

  useEffect(() => {
    const parentSection = containerRef.current?.parentElement;
    if (!parentSection) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = parentSection.getBoundingClientRect();
      setSpotlight({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true,
      });
    };

    const handlePointerLeave = () => {
      setSpotlight((prev) => ({ ...prev, visible: false }));
    };

    parentSection.addEventListener("pointermove", handlePointerMove, { passive: true });
    parentSection.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      parentSection.removeEventListener("pointermove", handlePointerMove);
      parentSection.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
    >
      {/* 1. Large Soft Gradient Mesh: 3 static blurred blobs (~10% opacity) with 0.15x scroll parallax */}
      <motion.div
        style={{ y: prefersReducedMotion ? 0 : parallaxY }}
        className="absolute inset-0"
      >
        {/* Blob 1: Top-Left (Purple) */}
        <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-purple-500/10 dark:bg-purple-500/12 blur-3xl" />

        {/* Blob 2: Center-Right (Sky Blue) */}
        <div className="absolute top-1/4 -right-16 w-96 h-96 rounded-full bg-sky-500/10 dark:bg-sky-500/12 blur-3xl" />

        {/* Blob 3: Bottom-Center (Pink) */}
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-pink-500/10 dark:bg-pink-500/12 blur-3xl" />
      </motion.div>

      {/* 2. Soft Cursor Spotlight (radius 300px, ~6% opacity, only visible inside section) */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: spotlight.visible ? 1 : 0,
          background: `radial-gradient(300px circle at ${spotlight.x}px ${spotlight.y}px, var(--spotlight-color, rgba(255,255,255,0.06)) 0%, transparent 75%)`,
        }}
      />
    </div>
  );
}


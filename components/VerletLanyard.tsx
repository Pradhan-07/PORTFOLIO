"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "./ThemeProvider";

/**
 * ============================================================================
 * INTERACTIVE VERLET INTEGRATION LANYARD & ID BADGE (Canvas 2D)
 * ============================================================================
 * 
 * PHYSICS EXPLANATION:
 * - Verlet Integration stores only positions (current & old), giving implicit
 *   velocity: v = (pos - oldPos) * damping.
 * - Distance constraints keep rope segments at an exact length L by projecting
 *   errors along the segment vector across 6 relaxation iterations.
 * - FIXED TIMESTEP ACCUMULATOR: Advances physics in deterministic 1/60s slices
 *   regardless of monitor refresh rate (60Hz, 120Hz, 144Hz), eliminating jitter.
 * ============================================================================
 */

interface Point {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  isPinned: boolean;
}

interface Stick {
  p0: Point;
  p1: Point;
  length: number;
}

export function VerletLanyard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();

  // Card Flip State
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAngleRef = useRef(0);
  const targetFlipAngleRef = useRef(0);

  // Physics Points & Sticks
  const pointsRef = useRef<Point[]>([]);
  const sticksRef = useRef<Stick[]>([]);

  // Drag State
  const isDraggingRef = useRef(false);
  const dragPointIndexRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const startDragTimeRef = useRef(0);
  const startDragPosRef = useRef({ x: 0, y: 0 });

  // Loaded Images
  const colorImgRef = useRef<HTMLImageElement | null>(null);
  const bwImgRef = useRef<HTMLImageElement | null>(null);

  // Card dimensions
  const cardWidth = 176;
  const cardHeight = 260;

  // Preload photos
  useEffect(() => {
    const colorImg = new Image();
    colorImg.src = "/karan-color.png";
    colorImg.onload = () => {
      colorImgRef.current = colorImg;
    };

    const bwImg = new Image();
    bwImg.src = "/karan-bw.png";
    bwImg.onload = () => {
      bwImgRef.current = bwImg;
    };
  }, []);

  // Initialize rope physics
  const initPhysics = useCallback((width: number) => {
    // Anchor top point slightly to the right of center
    const anchorX = Math.min(width - 110, Math.max(140, width * 0.72));
    const anchorY = 0;

    const segmentCount = 10; // ~10 points as requested
    const segmentLength = 18;

    const points: Point[] = [];
    const sticks: Stick[] = [];

    for (let i = 0; i <= segmentCount; i++) {
      points.push({
        x: anchorX + Math.sin(i * 0.3) * 6,
        y: anchorY + i * segmentLength,
        oldX: anchorX,
        oldY: anchorY + i * segmentLength,
        isPinned: i === 0,
      });
    }

    for (let i = 0; i < points.length - 1; i++) {
      sticks.push({
        p0: points[i],
        p1: points[i + 1],
        length: segmentLength,
      });
    }

    pointsRef.current = points;
    sticksRef.current = sticks;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let dpr = window.devicePixelRatio || 1;
    let isVisible = true;

    // Handle Resize & Retina DPI
    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      initPhysics(rect.width);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Pause animation when hero is off-screen or tab is hidden
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // =========================================================================
    // FIXED TIMESTEP ACCUMULATOR
    // =========================================================================
    const fixedDt = 1 / 60; // Exact 60fps simulation step
    let accumulator = 0;
    let lastTime = performance.now();

    const gravity = 0.52;
    const friction = 0.988;
    const constraintIterations = 7;

    const physicsStep = () => {
      const points = pointsRef.current;
      const sticks = sticksRef.current;

      // 1. Position update
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.isPinned) continue;

        if (isDraggingRef.current && dragPointIndexRef.current === i) {
          p.x = mouseRef.current.x;
          p.y = mouseRef.current.y;
          p.oldX = mouseRef.current.x;
          p.oldY = mouseRef.current.y;
          continue;
        }

        const vx = (p.x - p.oldX) * friction;
        const vy = (p.y - p.oldY) * friction + gravity;

        p.oldX = p.x;
        p.oldY = p.y;
        p.x += vx;
        p.y += vy;
      }

      // 2. Distance constraint relaxation
      for (let iter = 0; iter < constraintIterations; iter++) {
        for (let i = 0; i < sticks.length; i++) {
          const stick = sticks[i];
          const dx = stick.p1.x - stick.p0.x;
          const dy = stick.p1.y - stick.p0.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const diff = (stick.length - dist) / dist;

          const offsetX = dx * diff * 0.5;
          const offsetY = dy * diff * 0.5;

          if (!stick.p0.isPinned) {
            stick.p0.x -= offsetX;
            stick.p0.y -= offsetY;
          }
          if (!stick.p1.isPinned) {
            stick.p1.x += offsetX;
            stick.p1.y += offsetY;
          }
        }
      }
    };

    // Render loop
    const render = (time: number) => {
      if (!isVisible) {
        lastTime = time;
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      let delta = (time - lastTime) / 1000;
      lastTime = time;
      if (delta > 0.1) delta = 0.1; // clamp to prevent physics explosion

      accumulator += delta;
      while (accumulator >= fixedDt) {
        physicsStep();
        accumulator -= fixedDt;
      }

      // Smooth 3D rotateY flip angle interpolation
      targetFlipAngleRef.current = isFlipped ? Math.PI : 0;
      flipAngleRef.current += (targetFlipAngleRef.current - flipAngleRef.current) * 0.14;

      // Draw canvas
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const isDark = document.documentElement.classList.contains("dark");
      const points = pointsRef.current;

      if (points.length >= 2) {
        // DRAW LANYARD STRAP
        ctx.beginPath();
        ctx.moveTo(points[0].x - 3, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x - 2.5, points[i].y);
        }
        for (let i = points.length - 1; i >= 0; i--) {
          ctx.lineTo(points[i].x + 2.5, points[i].y);
        }
        ctx.closePath();

        const strapGrad = ctx.createLinearGradient(
          points[0].x,
          points[0].y,
          points[points.length - 1].x,
          points[points.length - 1].y
        );
        if (isDark) {
          strapGrad.addColorStop(0, "#2a2a2a");
          strapGrad.addColorStop(0.5, "#444444");
          strapGrad.addColorStop(1, "#1c1c1c");
        } else {
          strapGrad.addColorStop(0, "#d8d8d8");
          strapGrad.addColorStop(0.5, "#aaaaaa");
          strapGrad.addColorStop(1, "#888888");
        }
        ctx.fillStyle = strapGrad;
        ctx.fill();

        ctx.strokeStyle = isDark ? "#555555" : "#999999";
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // BADGE MOUNT & SWIVEL CLASP
        const lastP = points[points.length - 1];
        const prevP = points[points.length - 2];
        const angle = Math.atan2(lastP.y - prevP.y, lastP.x - prevP.x) - Math.PI / 2;

        ctx.save();
        ctx.translate(lastP.x, lastP.y);
        ctx.rotate(angle);

        // Clasp Ring
        ctx.fillStyle = isDark ? "#888888" : "#444444";
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Metal Hook
        ctx.fillStyle = isDark ? "#383838" : "#cccccc";
        ctx.fillRect(-3, 2, 6, 8);
        ctx.strokeStyle = isDark ? "#666666" : "#888888";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-3, 2, 6, 8);

        // DRAW 3D ROTATING BADGE CARD
        const scaleX = Math.cos(flipAngleRef.current);
        const isBackFacing = Math.abs(flipAngleRef.current) > Math.PI / 2;

        ctx.translate(0, 14);
        ctx.scale(scaleX, 1);

        // Card Shadow
        ctx.shadowColor = isDark ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.18)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 10;

        const x = -cardWidth / 2;
        const y = 0;
        const radius = 10;

        ctx.beginPath();
        ctx.roundRect(x, y, cardWidth, cardHeight, radius);
        ctx.fillStyle = isDark ? "#121212" : "#ffffff";
        ctx.fill();

        ctx.shadowColor = "transparent";

        // Card Border
        ctx.strokeStyle = isDark ? "#282828" : "#e0e0e0";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Lanyard Cutout Slot
        ctx.fillStyle = isDark ? "#0a0a0a" : "#fafafa";
        ctx.beginPath();
        ctx.roundRect(-14, 6, 28, 5, 2.5);
        ctx.fill();
        ctx.strokeStyle = isDark ? "#333333" : "#d0d0d0";
        ctx.stroke();

        if (!isBackFacing) {
          // ================= FRONT SIDE =================
          // Header Ribbon
          ctx.fillStyle = isDark ? "#1a1a1a" : "#f4f4f4";
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 16, cardWidth - 2, 32, [0, 0, 0, 0]);
          ctx.fill();

          ctx.font = "700 8.5px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#a3a3a3" : "#444444";
          ctx.textAlign = "center";
          ctx.fillText("VIT-AP UNIVERSITY", 0, y + 29);

          ctx.font = "500 7px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#737373" : "#777777";
          ctx.fillText("SCHOOL OF COMPUTER SCIENCE", 0, y + 40);

          // Photo Box
          const photoY = y + 54;
          const photoW = 72;
          const photoH = 80;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(-photoW / 2, photoY, photoW, photoH, 6);
          ctx.clip();

          if (colorImgRef.current && colorImgRef.current.complete) {
            ctx.drawImage(colorImgRef.current, -photoW / 2, photoY, photoW, photoH);
          } else {
            ctx.fillStyle = isDark ? "#222" : "#eee";
            ctx.fillRect(-photoW / 2, photoY, photoW, photoH);
            ctx.font = "700 18px var(--font-geist-sans)";
            ctx.fillStyle = isDark ? "#fff" : "#000";
            ctx.fillText("KP", 0, photoY + 45);
          }
          ctx.restore();

          // Photo Box Border
          ctx.strokeStyle = isDark ? "#333333" : "#e0e0e0";
          ctx.lineWidth = 1;
          ctx.strokeRect(-photoW / 2, photoY, photoW, photoH);

          // Name
          ctx.font = "700 11px var(--font-geist-sans), sans-serif";
          ctx.fillStyle = isDark ? "#ffffff" : "#0a0a0a";
          ctx.fillText("KARAN KUMAR PRADHAN", 0, y + 152);

          // Program Subtitle
          ctx.font = "600 8px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#a3a3a3" : "#555555";
          ctx.fillText("CSE · VIT-AP", 0, y + 166);

          // Student ID
          ctx.font = "500 7.5px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#888888" : "#777777";
          ctx.fillText("ID 25BCE7526", 0, y + 179);

          // Barcode Lines
          const barcodeY = y + 196;
          ctx.fillStyle = isDark ? "#e0e0e0" : "#222222";
          const barWidths = [2, 1, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2];
          let barX = -cardWidth / 2 + 25;
          for (let b = 0; b < barWidths.length; b++) {
            const bw = barWidths[b];
            ctx.fillRect(barX, barcodeY, bw, 20);
            barX += bw + 3.5;
          }

          ctx.font = "500 6.5px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#666666" : "#999999";
          ctx.fillText("25BCE7526 // VERIFIED", 0, y + 226);

          // Hint to flip
          ctx.font = "italics 6.5px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#555555" : "#999999";
          ctx.fillText("psst, flip me ↓", 0, y + 246);
        } else {
          // ================= BACK SIDE =================
          // Magnetic Strip
          ctx.fillStyle = isDark ? "#222222" : "#1a1a1a";
          ctx.fillRect(x + 1, y + 18, cardWidth - 2, 24);

          // Grayscale / Halftone Portrait Box
          const bwY = y + 54;
          const bwW = 66;
          const bwH = 74;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(-bwW / 2, bwY, bwW, bwH, 6);
          ctx.clip();

          if (bwImgRef.current && bwImgRef.current.complete) {
            ctx.drawImage(bwImgRef.current, -bwW / 2, bwY, bwW, bwH);
          } else {
            ctx.fillStyle = isDark ? "#181818" : "#f0f0f0";
            ctx.fillRect(-bwW / 2, bwY, bwW, bwH);
          }
          ctx.restore();

          // Border around BW photo
          ctx.strokeStyle = isDark ? "#333333" : "#dddddd";
          ctx.strokeRect(-bwW / 2, bwY, bwW, bwH);

          // GitHub Handle
          ctx.font = "700 9px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#ededed" : "#0a0a0a";
          ctx.textAlign = "center";
          ctx.fillText("@Pradhan-07", 0, y + 148);

          // Email
          ctx.font = "500 7px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#a3a3a3" : "#555555";
          ctx.fillText("pradhankaran058@gmail.com", 0, y + 162);

          // Verified Badge Box
          ctx.fillStyle = isDark ? "#181818" : "#f4f4f4";
          ctx.beginPath();
          ctx.roundRect(-65, y + 178, 130, 26, 4);
          ctx.fill();
          ctx.strokeStyle = isDark ? "#2a2a2a" : "#e0e0e0";
          ctx.stroke();

          ctx.font = "600 7.5px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#cccccc" : "#333333";
          ctx.fillText("STUDENT IDENTITY // CSE", 0, y + 190);
          ctx.font = "500 6.5px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#888888" : "#666666";
          ctx.fillText("ID: 25BCE7526 · VIT-AP", 0, y + 200);

          // Barcode mini
          ctx.fillStyle = isDark ? "#999999" : "#444444";
          ctx.fillRect(-45, y + 214, 90, 8);

          ctx.font = "italics 6.5px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#555555" : "#999999";
          ctx.fillText("● click to flip front ●", 0, y + 246);
        }

        ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [initPhysics, isFlipped, theme]);

  // Pointer & Drag Coordinates
  const getCoordinates = (e: React.PointerEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const coords = getCoordinates(e);
    mouseRef.current = coords;
    startDragPosRef.current = coords;
    startDragTimeRef.current = Date.now();

    const points = pointsRef.current;
    if (points.length === 0) return;

    const badgePoint = points[points.length - 1];
    const dist = Math.hypot(coords.x - badgePoint.x, coords.y - (badgePoint.y + 110));

    if (dist < 140) {
      isDraggingRef.current = true;
      dragPointIndexRef.current = points.length - 1;
      // Set touch-action none ONLY while dragging so page scrolling works on mobile
      if (canvasRef.current) {
        canvasRef.current.style.touchAction = "none";
      }
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    mouseRef.current = getCoordinates(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      const elapsed = Date.now() - startDragTimeRef.current;
      const movedDist = Math.hypot(
        mouseRef.current.x - startDragPosRef.current.x,
        mouseRef.current.y - startDragPosRef.current.y
      );

      // Short tap/click flips the badge
      if (elapsed < 280 && movedDist < 12) {
        setIsFlipped((prev) => !prev);
      }
    }
    isDraggingRef.current = false;
    dragPointIndexRef.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.touchAction = "auto";
    }
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already released
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400px] sm:h-[460px] md:h-[500px] flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        title="Interactive ID badge with Verlet rope physics. Click to flip, drag to swing!"
      />

      <div className="absolute top-2 right-4 pointer-events-none hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full liquid-glass text-[10px] font-mono text-neutral-600 dark:text-neutral-400">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse" />
        <span>verlet rope · drag &amp; flip</span>
      </div>
    </div>
  );
}

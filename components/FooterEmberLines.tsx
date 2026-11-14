"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * CONFIGURATION FOR THE GIANT "PRADHAN" VERTICAL GRADIENT LINES WORD
 */
export interface FooterLinesConfig {
  word: string;
  fontFamily: string;
  fontWeight: string;
  pitchDivisor: number; // width / 250 => pitch in px (approx 3.5 to 4.5px)
  lineWidthRatio: number; // ~44% of pitch
  colorTop: string; // near-transparent dark brown-red
  colorBottom: string; // hot orange-red (#ff4a2a)
  heatRadius: number; // in CSS px (e.g. 120px)
  heatDecayMs: number; // 600ms ease back after pointer leaves
  lineHeat: boolean; // config flag to toggle subtle brightness boost on hover
  entranceDuration: number; // staggered entrance duration in ms (1200ms)
}

export const FOOTER_LINES_CONFIG: FooterLinesConfig = {
  word: "PRADHAN",
  fontFamily: "Montserrat, 'Inter Black', 'Arial Black', Impact, sans-serif",
  fontWeight: "900",
  pitchDivisor: 240,
  lineWidthRatio: 0.44,
  colorTop: "rgba(140, 20, 10, 0.15)",
  colorBottom: "#ff4a2a",
  heatRadius: 120,
  heatDecayMs: 600,
  lineHeat: true,
  entranceDuration: 1200,
};

// Backwards-compatible alias for any external references
export const FOOTER_EMBER_CONFIG = FOOTER_LINES_CONFIG;
export type EmberConfig = FooterLinesConfig;

interface LineRun {
  x: number;
  startY: number;
  endY: number;
  length: number;
}

export function FooterEmberLines({
  config = FOOTER_LINES_CONFIG,
}: {
  config?: FooterLinesConfig;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFontReady, setIsFontReady] = useState(false);

  // Ensure fonts are ready before measurement
  useEffect(() => {
    let cancelled = false;

    async function loadFont() {
      try {
        if (typeof document !== "undefined" && document.fonts) {
          await document.fonts.ready;
        }
      } catch {
        // Fallback if document.fonts is unsupported
      }
      if (!cancelled) {
        setIsFontReady(true);
      }
    }

    loadFont();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isFontReady) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const activeCanvas = canvas;
    const activeCtx = ctx;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Offscreen canvas for pre-rendered full static vertical lines
    const staticCanvas = document.createElement("canvas");
    const staticCtx = staticCanvas.getContext("2d");

    let animationId: number | null = null;
    let width = 0;
    let height = 0;
    let dpr = 1;

    let lineRuns: LineRun[] = [];
    let minX = 0;
    let maxX = 1;
    let minY = 0;
    let maxY = 1;
    let lineWidth = 1.5;

    // Entrance state
    let hasStartedEntrance = false;
    let isEntranceDone = prefersReducedMotion;
    let entranceStartTime = 0;

    const pointer = {
      x: -9999,
      y: -9999,
      isOver: false,
      isTouch: false,
      leaveTime: 0,
    };

    let isVisible = false;
    let isLoopRunning = false;

    // Build text mask & vertical line runs
    function buildWordMask() {
      const rect = container?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;

      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 3);

      activeCanvas.width = Math.floor(width * dpr);
      activeCanvas.height = Math.floor(height * dpr);
      activeCanvas.style.width = `${width}px`;
      activeCanvas.style.height = `${height}px`;

      staticCanvas.width = activeCanvas.width;
      staticCanvas.height = activeCanvas.height;

      // 1. Offscreen canvas for text rasterization
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = activeCanvas.width;
      maskCanvas.height = activeCanvas.height;
      const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!maskCtx) return;

      // Span about 80% of width (max 1100px)
      const targetWidth = Math.min(activeCanvas.width * 0.80, 1100 * dpr);
      const testSize = 100 * dpr;
      maskCtx.font = `${config.fontWeight} ${testSize}px ${config.fontFamily}`;
      const measured = maskCtx.measureText(config.word).width;
      const scale = targetWidth / Math.max(1, measured);
      const finalFontSize = Math.min(activeCanvas.height * 0.86, testSize * scale);

      maskCtx.fillStyle = "#000000";
      maskCtx.fillRect(0, 0, activeCanvas.width, activeCanvas.height);
      maskCtx.fillStyle = "#ffffff";
      maskCtx.font = `${config.fontWeight} ${finalFontSize}px ${config.fontFamily}`;
      maskCtx.textAlign = "center";
      maskCtx.textBaseline = "middle";
      maskCtx.fillText(config.word, activeCanvas.width / 2, activeCanvas.height / 2);

      // 2. Read pixel mask and detect vertical line segments
      const imgData = maskCtx.getImageData(
        0,
        0,
        activeCanvas.width,
        activeCanvas.height
      ).data;

      // Pitch: about width / 250 in CSS pixels, scaled to device pixels
      const basePitchCss = Math.max(3.5, width / config.pitchDivisor);
      const pitch = Math.max(Math.round(3 * dpr), Math.round(basePitchCss * dpr));
      lineWidth = Math.max(1, Math.round(pitch * config.lineWidthRatio));

      lineRuns = [];
      minY = activeCanvas.height;
      maxY = 0;
      minX = activeCanvas.width;
      maxX = 0;

      for (let x = Math.floor(pitch / 2); x < activeCanvas.width; x += pitch) {
        let inside = false;
        let startY = 0;

        for (let y = 0; y < activeCanvas.height; y++) {
          const index = (y * activeCanvas.width + x) * 4;
          const isLetter = imgData[index] > 110;

          if (isLetter && !inside) {
            inside = true;
            startY = y;
          } else if (!isLetter && inside) {
            inside = false;
            const endY = y;
            if (endY - startY >= 2 * dpr) {
              const len = endY - startY;
              lineRuns.push({ x, startY, endY, length: len });
              if (startY < minY) minY = startY;
              if (endY > maxY) maxY = endY;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
            }
          }
        }

        if (inside) {
          const endY = activeCanvas.height;
          if (endY - startY >= 2 * dpr) {
            const len = endY - startY;
            lineRuns.push({ x, startY, endY, length: len });
            if (startY < minY) minY = startY;
            if (endY > maxY) maxY = endY;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }
      }

      if (minY >= maxY) {
        minY = activeCanvas.height * 0.15;
        maxY = activeCanvas.height * 0.85;
      }
      if (minX >= maxX) {
        minX = 0;
        maxX = activeCanvas.width;
      }

      // 3. Pre-render full static vertical lines with crisp subpixel alignment
      if (staticCtx) {
        staticCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
        const grad = staticCtx.createLinearGradient(0, minY, 0, maxY);
        grad.addColorStop(0, config.colorTop);
        grad.addColorStop(1, config.colorBottom);

        staticCtx.strokeStyle = grad;
        staticCtx.lineWidth = lineWidth;
        staticCtx.lineCap = "butt";

        const strokeOffset = lineWidth % 2 === 1 ? 0.5 : 0.0;
        for (let i = 0; i < lineRuns.length; i++) {
          const run = lineRuns[i];
          const drawX = Math.floor(run.x) + strokeOffset;
          staticCtx.beginPath();
          staticCtx.moveTo(drawX, run.startY);
          staticCtx.lineTo(drawX, run.endY);
          staticCtx.stroke();
        }
      }

      // If reduced motion or entrance already finished, draw full lines immediately
      if (isEntranceDone || prefersReducedMotion) {
        activeCtx.imageSmoothingEnabled = false;
        activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
        activeCtx.drawImage(staticCanvas, 0, 0);
      }
    }

    buildWordMask();

    // RENDER FUNCTION
    function render(currentTime: number) {
      if (!isVisible) {
        isLoopRunning = false;
        animationId = null;
        return;
      }

      // Calculate entrance progress
      let entranceProgress = 1.0;
      if (!isEntranceDone && !prefersReducedMotion) {
        if (!hasStartedEntrance) {
          hasStartedEntrance = true;
          entranceStartTime = currentTime;
        }

        const elapsed = currentTime - entranceStartTime;
        entranceProgress = Math.min(1.0, elapsed / config.entranceDuration);
        if (entranceProgress >= 1.0) {
          isEntranceDone = true;
        }
      }

      // Calculate line heat decay factor
      let heatFactor = 0;
      if (config.lineHeat && !pointer.isTouch) {
        if (pointer.isOver) {
          heatFactor = 1.0;
        } else if (pointer.leaveTime > 0) {
          const timeSinceLeave = currentTime - pointer.leaveTime;
          if (timeSinceLeave < config.heatDecayMs) {
            const decay = 1.0 - timeSinceLeave / config.heatDecayMs;
            heatFactor = decay * decay; // smooth quadratic falloff
          }
        }
      }

      // Clear active canvas
      activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);

      if (isEntranceDone) {
        // Draw pre-rendered static vertical lines
        activeCtx.drawImage(staticCanvas, 0, 0);
      } else {
        // Render staggered bottom-up entrance
        const grad = activeCtx.createLinearGradient(0, minY, 0, maxY);
        grad.addColorStop(0, config.colorTop);
        grad.addColorStop(1, config.colorBottom);

        activeCtx.strokeStyle = grad;
        activeCtx.lineWidth = lineWidth;
        activeCtx.lineCap = "butt";

        const strokeOffset = lineWidth % 2 === 1 ? 0.5 : 0.0;
        const totalDuration = config.entranceDuration;
        const staggerWindow = totalDuration * 0.5; // Stagger across first 600ms
        const lineDuration = totalDuration * 0.5; // Each line takes 600ms to grow
        const elapsed = currentTime - entranceStartTime;
        const spanX = Math.max(1, maxX - minX);

        for (let i = 0; i < lineRuns.length; i++) {
          const run = lineRuns[i];
          const normX = Math.max(0, Math.min(1, (run.x - minX) / spanX));
          const lineDelay = normX * staggerWindow;
          const lineElapsed = elapsed - lineDelay;

          if (lineElapsed <= 0) continue; // not yet started

          const rawProgress = Math.min(1.0, lineElapsed / lineDuration);
          // Ease-out cubic: 1 - (1 - t)^3
          const p = 1 - Math.pow(1 - rawProgress, 3);

          // Grow from the bottom up
          const currentStartY = run.endY - run.length * p;
          const drawX = Math.floor(run.x) + strokeOffset;

          activeCtx.beginPath();
          activeCtx.moveTo(drawX, currentStartY);
          activeCtx.lineTo(drawX, run.endY);
          activeCtx.stroke();
        }
      }

      // Apply subtle line heat boost within 120px of pointer
      if (config.lineHeat && heatFactor > 0.005 && lineRuns.length > 0) {
        const px = pointer.x * dpr;
        const py = pointer.y * dpr;
        const radius = config.heatRadius * dpr;

        activeCtx.save();
        activeCtx.globalCompositeOperation = "lighter";

        const strokeOffset = lineWidth % 2 === 1 ? 0.5 : 0.0;

        for (let i = 0; i < lineRuns.length; i++) {
          const run = lineRuns[i];
          const dx = Math.abs(run.x - px);
          if (dx < radius) {
            const dy = Math.max(0, Math.max(run.startY - py, py - run.endY));
            const dist = Math.hypot(dx, dy);
            if (dist < radius) {
              const boost = (1 - dist / radius) * heatFactor * 0.75;
              activeCtx.strokeStyle = `rgba(255, 110, 42, ${boost.toFixed(3)})`;
              activeCtx.lineWidth = lineWidth * (1 + boost * 0.35);
              const drawX = Math.floor(run.x) + strokeOffset;

              activeCtx.beginPath();
              activeCtx.moveTo(drawX, run.startY);
              activeCtx.lineTo(drawX, run.endY);
              activeCtx.stroke();
            }
          }
        }

        activeCtx.restore();
      }

      // Check if we need to continue running the loop
      const needsNextFrame =
        (!isEntranceDone && !prefersReducedMotion) ||
        (config.lineHeat && heatFactor > 0.005);

      if (needsNextFrame && isVisible) {
        animationId = requestAnimationFrame(render);
      } else {
        isLoopRunning = false;
        animationId = null;
      }
    }

    function wakeLoop() {
      if (!isLoopRunning && isVisible) {
        isLoopRunning = true;
        animationId = requestAnimationFrame(render);
      }
    }

    // Pointer event listeners on container (zero global listener overhead)
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.isOver = true;
      pointer.isTouch = e.pointerType === "touch";

      if (config.lineHeat && !pointer.isTouch) {
        wakeLoop();
      }
    };

    const handlePointerLeave = () => {
      pointer.isOver = false;
      pointer.leaveTime = performance.now();
      if (config.lineHeat) {
        wakeLoop();
      }
    };

    container.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    // IntersectionObserver: trigger entrance when scrolled into view & pause when off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry.isIntersecting;
        if (entry.isIntersecting) {
          wakeLoop();
        } else {
          if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }
          isLoopRunning = false;
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        isVisible = false;
        if (animationId !== null) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        isLoopRunning = false;
      } else {
        const rect = container.getBoundingClientRect();
        isVisible =
          rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0;
        if (isVisible) {
          wakeLoop();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    let resizeTimer: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildWordMask();
        wakeLoop();
      }, 100);
    });
    resizeObserver.observe(container);

    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
      resizeObserver.disconnect();
      clearTimeout(resizeTimer);
    };
  }, [isFontReady, config]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[1100px] h-[160px] sm:h-[200px] md:h-[240px] mx-auto relative flex items-center justify-center select-none"
    >
      <h2 className="sr-only">PRADHAN</h2>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="w-full h-full block"
      />
    </div>
  );
}

// Backwards-compatible export
export const FooterLines = FooterEmberLines;

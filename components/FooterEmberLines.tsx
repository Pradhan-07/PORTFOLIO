"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * CONFIGURATION FOR THE GIANT "PRADHAN" EMBER-LINES WORD
 */
export interface EmberConfig {
  word: string;
  fontFamily: string;
  fontWeight: string;
  pitchDivisor: number; // width / 250 => pitch in px (approx 3 to 4.5px)
  lineWidthRatio: number; // 45% of pitch
  colorTop: string; // top: almost transparent dark brown-red
  colorBottom: string; // bottom: hot orange-red (#ff4a2a)
  heatRadius: number; // in CSS px (e.g. 120px)
  heatDecayMs: number; // 600ms to ease back to normal after pointer leaves
  ambientEmberCount: number; // 140 to 180 particles
  maxSpawnPerFrame: number; // cap at 6 per frame during pointer movement
  emberSizeMin: number; // 1.0px
  emberSizeMax: number; // 2.2px
  emberLifeMin: number; // 0.8s
  emberLifeMax: number; // 1.6s
  emberDriftSpeedY: number; // upward drift speed
  emberColors: string[]; // white to hot orange-red
  entranceDuration: number; // entrance animation
}

export const FOOTER_EMBER_CONFIG: EmberConfig = {
  word: "PRADHAN",
  // Standard robust font stack so Canvas 2D can measure and rasterize immediately without CSS variable syntax errors
  fontFamily: "Montserrat, 'Inter Black', 'Arial Black', Impact, sans-serif",
  fontWeight: "900",
  pitchDivisor: 250,
  lineWidthRatio: 0.45,
  colorTop: "rgba(120, 24, 16, 0.22)",
  colorBottom: "#ff4a2a",
  heatRadius: 120,
  heatDecayMs: 600,
  ambientEmberCount: 160,
  maxSpawnPerFrame: 6,
  emberSizeMin: 1.0,
  emberSizeMax: 2.2,
  emberLifeMin: 0.8,
  emberLifeMax: 1.6,
  emberDriftSpeedY: -22,
  emberColors: ["#ffffff", "#fffae0", "#ffba42", "#ff6b2b", "#ff3a1a"],
  entranceDuration: 1.0,
};

interface LineRun {
  x: number;
  startY: number;
  endY: number;
  length: number;
}

interface EmberParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  phase: number;
  twinkleSpeed: number;
}

export function FooterEmberLines({
  config = FOOTER_EMBER_CONFIG,
}: {
  config?: EmberConfig;
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
        // Fallback
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

    // Offscreen canvas for pre-rendered static vertical lines
    const staticCanvas = document.createElement("canvas");
    const staticCtx = staticCanvas.getContext("2d");

    let animationId: number = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    let lineRuns: LineRun[] = [];
    let totalLineLength = 0;
    let lineWidth = 1.5;

    // Particle pool
    const POOL_SIZE = 240;
    const embers: EmberParticle[] = Array.from({ length: POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 1.5,
      color: "#ffffff",
      life: 0,
      maxLife: 1.2,
      phase: 0,
      twinkleSpeed: 4,
    }));

    const pointer = {
      x: -9999,
      y: -9999,
      isOver: false,
      isTouch: false,
      leaveTime: 0,
    };

    let isVisible = true;
    let lastFrameTime = performance.now();

    // Helper: spawn one ember from pool
    function spawnEmber(
      fixedX?: number,
      fixedY?: number,
      fixedVx?: number,
      fixedVy?: number
    ) {
      if (lineRuns.length === 0) return;

      const ember = embers.find((p) => !p.active);
      if (!ember) return;

      const pos = { x: 0, y: 0 };
      if (typeof fixedX === "number" && typeof fixedY === "number") {
        pos.x = fixedX;
        pos.y = fixedY;
      } else {
        // Pick random line segment weighted by length
        let target = Math.random() * totalLineLength;
        for (let i = 0; i < lineRuns.length; i++) {
          const run = lineRuns[i];
          if (target <= run.length) {
            pos.x = run.x + (Math.random() - 0.5) * lineWidth;
            pos.y = run.startY + Math.random() * run.length;
            break;
          }
          target -= run.length;
        }
      }

      ember.active = true;
      ember.x = pos.x;
      ember.y = pos.y;
      ember.vx =
        typeof fixedVx === "number"
          ? fixedVx
          : (Math.random() - 0.5) * 8 * dpr;
      ember.vy =
        typeof fixedVy === "number"
          ? fixedVy
          : (config.emberDriftSpeedY + (Math.random() - 0.5) * 12) * dpr;
      ember.size =
        (config.emberSizeMin +
          Math.random() * (config.emberSizeMax - config.emberSizeMin)) *
        dpr;
      ember.color =
        config.emberColors[
          Math.floor(Math.random() * config.emberColors.length)
        ];
      ember.maxLife =
        config.emberLifeMin +
        Math.random() * (config.emberLifeMax - config.emberLifeMin);
      ember.life = 0;
      ember.phase = Math.random() * Math.PI * 2;
      ember.twinkleSpeed = 3 + Math.random() * 4;
    }

    // Build text mask & vertical line runs
    function buildWordMask() {
      const rect = container?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;

      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);

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

      const pitch = Math.max(
        3,
        Math.round(activeCanvas.width / config.pitchDivisor)
      );
      lineWidth = Math.max(1.2 * dpr, pitch * config.lineWidthRatio);

      lineRuns = [];
      totalLineLength = 0;
      let minY = activeCanvas.height;
      let maxY = 0;

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
              totalLineLength += len;
              if (startY < minY) minY = startY;
              if (endY > maxY) maxY = endY;
            }
          }
        }

        if (inside) {
          const endY = activeCanvas.height;
          if (endY - startY >= 2 * dpr) {
            const len = endY - startY;
            lineRuns.push({ x, startY, endY, length: len });
            totalLineLength += len;
            if (startY < minY) minY = startY;
            if (endY > maxY) maxY = endY;
          }
        }
      }

      if (minY >= maxY) {
        minY = activeCanvas.height * 0.15;
        maxY = activeCanvas.height * 0.85;
      }

      // 3. Pre-render static vertical lines to staticCanvas
      if (staticCtx) {
        staticCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
        const grad = staticCtx.createLinearGradient(0, minY, 0, maxY);
        grad.addColorStop(0, config.colorTop);
        grad.addColorStop(1, config.colorBottom);

        staticCtx.strokeStyle = grad;
        staticCtx.lineWidth = lineWidth;
        staticCtx.lineCap = "butt";

        for (let i = 0; i < lineRuns.length; i++) {
          const run = lineRuns[i];
          staticCtx.beginPath();
          staticCtx.moveTo(run.x, run.startY);
          staticCtx.lineTo(run.x, run.endY);
          staticCtx.stroke();
        }
      }

      // Draw immediately so there is never a blank frame
      activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
      activeCtx.drawImage(staticCanvas, 0, 0);
    }

    buildWordMask();

    if (prefersReducedMotion) return;

    // Pointer event listeners
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      if (
        currentX >= 0 &&
        currentX <= rect.width &&
        currentY >= 0 &&
        currentY <= rect.height
      ) {
        pointer.x = currentX;
        pointer.y = currentY;
        pointer.isOver = true;
        pointer.isTouch = e.pointerType === "touch";

        // Spawn friction embers along pointer path inside letters
        if (lineRuns.length > 0 && Math.random() < 0.6) {
          const px = currentX * dpr;
          const py = currentY * dpr;
          for (let s = 0; s < 2; s++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
            const spd = (10 + Math.random() * 25) * dpr;
            spawnEmber(
              px + (Math.random() - 0.5) * 16 * dpr,
              py + (Math.random() - 0.5) * 16 * dpr,
              Math.cos(angle) * spd,
              Math.sin(angle) * spd
            );
          }
        }
      } else if (pointer.isOver) {
        pointer.isOver = false;
        pointer.leaveTime = performance.now();
      }
    };

    const handlePointerLeave = () => {
      if (pointer.isOver) {
        pointer.isOver = false;
        pointer.leaveTime = performance.now();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    // IntersectionObserver: pause RAF when offscreen
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        isVisible = false;
      } else {
        isVisible = true;
        lastFrameTime = performance.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    let resizeTimer: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildWordMask();
      }, 100);
    });
    resizeObserver.observe(container);

    // Initial ambient embers
    for (let i = 0; i < config.ambientEmberCount * 0.7; i++) {
      spawnEmber();
      const p = embers[i];
      if (p.active) {
        p.life = Math.random() * p.maxLife * 0.8;
      }
    }

    // MAIN ANIMATION LOOP
    function render(currentTime: number) {
      animationId = requestAnimationFrame(render);

      if (!isVisible) {
        lastFrameTime = currentTime;
        return;
      }

      let dt = (currentTime - lastFrameTime) / 1000;
      lastFrameTime = currentTime;
      if (dt > 0.08) dt = 0.08;

      activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);

      // 1. Draw base pre-rendered vertical striped lines
      activeCtx.drawImage(staticCanvas, 0, 0);

      // 2. Heat Boost Layer when pointer is nearby inside footer
      let heatFactor = 0;
      if (!pointer.isTouch) {
        if (pointer.isOver) {
          heatFactor = 1.0;
        } else if (pointer.leaveTime > 0) {
          const timeSinceLeave = currentTime - pointer.leaveTime;
          if (timeSinceLeave < config.heatDecayMs) {
            heatFactor = 1.0 - timeSinceLeave / config.heatDecayMs;
            heatFactor = Math.pow(heatFactor, 2);
          }
        }
      }

      if (heatFactor > 0.01 && lineRuns.length > 0) {
        const px = pointer.x * dpr;
        const py = pointer.y * dpr;
        const radius = config.heatRadius * dpr;

        activeCtx.save();
        activeCtx.globalCompositeOperation = "lighter";

        for (let i = 0; i < lineRuns.length; i++) {
          const run = lineRuns[i];
          const dx = Math.abs(run.x - px);
          if (dx < radius) {
            const dy = Math.max(0, Math.max(run.startY - py, py - run.endY));
            const dist = Math.hypot(dx, dy);
            if (dist < radius) {
              const boost = (1 - dist / radius) * heatFactor * 0.75;
              activeCtx.strokeStyle = `rgba(255, 120, 50, ${boost.toFixed(3)})`;
              activeCtx.lineWidth = lineWidth * (1 + boost * 0.4);
              activeCtx.beginPath();
              activeCtx.moveTo(run.x, run.startY);
              activeCtx.lineTo(run.x, run.endY);
              activeCtx.stroke();
            }
          }
        }

        activeCtx.restore();
      }

      // 3. Ambient & pointer embers
      if (lineRuns.length > 0) {
        let activeCount = 0;
        for (let i = 0; i < POOL_SIZE; i++) {
          if (embers[i].active) activeCount++;
        }

        const targetEmbers = pointer.isOver
          ? config.ambientEmberCount + 30
          : config.ambientEmberCount;

        if (activeCount < targetEmbers) {
          const toSpawn = Math.min(
            config.maxSpawnPerFrame,
            targetEmbers - activeCount
          );
          for (let s = 0; s < toSpawn; s++) {
            spawnEmber();
          }
        }

        const px = pointer.x * dpr;
        const py = pointer.y * dpr;
        const radius = config.heatRadius * dpr;

        for (let i = 0; i < POOL_SIZE; i++) {
          const ember = embers[i];
          if (!ember.active) continue;

          let brightnessBoost = 1.0;
          if (pointer.isOver && !pointer.isTouch) {
            const edx = ember.x - px;
            const edy = ember.y - py;
            const dist = Math.hypot(edx, edy);
            if (dist < radius && dist > 2) {
              const repel = (1 - dist / radius) * 35 * dpr * dt;
              ember.vx += (edx / dist) * repel;
              ember.vy += (edy / dist) * repel;
              brightnessBoost = 1.0 + (1 - dist / radius) * 1.5;
            }
          }

          ember.x +=
            ember.vx * dt + Math.sin(ember.phase + ember.life * 2.5) * 0.3 * dpr;
          ember.y += ember.vy * dt;
          ember.life += dt;

          if (ember.life >= ember.maxLife) {
            ember.active = false;
            continue;
          }

          const lifeRatio = ember.life / ember.maxLife;
          const envelope = Math.sin(Math.PI * lifeRatio);
          const twinkle =
            0.75 +
            0.25 * Math.sin(ember.phase + ember.life * ember.twinkleSpeed);
          const alpha = Math.min(1, envelope * twinkle * brightnessBoost);

          activeCtx.save();
          activeCtx.globalAlpha = alpha;
          activeCtx.fillStyle = ember.color;
          activeCtx.beginPath();
          activeCtx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
          activeCtx.fill();
          activeCtx.restore();
        }
      }
    }

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
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

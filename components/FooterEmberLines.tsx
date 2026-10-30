"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * CONFIGURATION FOR THE GIANT "PRADHAN" EMBER-LINES WORD
 * Expose all parameters in one place for easy tweaking.
 */
export interface EmberConfig {
  word: string;
  fontFamily: string;
  fontWeight: string;
  pitchDivisor: number; // width / 250 => pitch in px (approx 3 to 4.5px)
  lineWidthRatio: number; // 45% of pitch
  // Colors for vertical gradient
  colorTop: string; // top: almost transparent dark brown-red
  colorBottom: string; // bottom: hot orange-red
  // Heat boost settings (when pointer moves within radius)
  heatRadius: number; // in CSS px (e.g. 120px)
  heatDecayMs: number; // 600ms to ease back to normal after pointer leaves
  // Ember particle settings
  ambientEmberCount: number; // 120 to 200 particles
  maxSpawnPerFrame: number; // cap at 6 per frame during pointer movement
  emberSizeMin: number; // 1.0px
  emberSizeMax: number; // 2.2px
  emberLifeMin: number; // 0.8s
  emberLifeMax: number; // 1.6s
  emberDriftSpeedY: number; // upward drift speed
  emberColors: string[]; // white to orange
  entranceDuration: number; // 1.2s entrance animation
}

export const FOOTER_EMBER_CONFIG: EmberConfig = {
  word: "PRADHAN",
  fontFamily: "var(--font-montserrat), Montserrat, -apple-system, sans-serif",
  fontWeight: "900",
  pitchDivisor: 250,
  lineWidthRatio: 0.45,
  colorTop: "rgba(120, 30, 20, 0.25)",
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
  entranceDuration: 1.2,
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

  // Wait for font to load before initial render
  useEffect(() => {
    let cancelled = false;

    async function loadFont() {
      try {
        if (typeof document !== "undefined" && document.fonts) {
          // Attempt to load Montserrat 900
          await document.fonts.load("900 120px Montserrat");
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

    // Check prefers-reduced-motion
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

    // Data extracted from the letter mask
    let lineRuns: LineRun[] = [];
    let totalLineLength = 0;
    let lineWidth = 1.5;

    // Particle pool (fixed size, no per-frame allocation)
    const POOL_SIZE = 260;
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

    // State tracking in refs (zero React re-renders in rAF loop)
    const pointer = {
      x: -9999,
      y: -9999,
      prevX: -9999,
      prevY: -9999,
      speed: 0,
      isOver: false,
      lastMoveTime: 0,
      leaveTime: 0,
      isTouch: false,
    };

    let isVisible = true;
    let hasEntered = false;
    let entranceStartTime = 0;
    let lastFrameTime = performance.now();

    // Helper: sample uniform random point strictly inside letter mask
    function getRandomPointInsideMask(): { x: number; y: number } {
      if (lineRuns.length === 0 || totalLineLength <= 0) {
        return { x: width * dpr * 0.5, y: height * dpr * 0.5 };
      }
      let target = Math.random() * totalLineLength;
      for (let i = 0; i < lineRuns.length; i++) {
        const run = lineRuns[i];
        if (target <= run.length) {
          return {
            x: run.x,
            y: run.startY + target,
          };
        }
        target -= run.length;
      }
      const last = lineRuns[lineRuns.length - 1];
      return { x: last.x, y: (last.startY + last.endY) / 2 };
    }

    // Helper: spawn one ember from pool
    function spawnEmber(
      px?: number,
      py?: number,
      initialVx?: number,
      initialVy?: number
    ) {
      const ember = embers.find((p) => !p.active);
      if (!ember) return;

      const pos =
        px !== undefined && py !== undefined
          ? { x: px, y: py }
          : getRandomPointInsideMask();

      ember.active = true;
      ember.x = pos.x;
      ember.y = pos.y;
      ember.vx =
        initialVx !== undefined
          ? initialVx
          : (Math.random() - 0.5) * 14 * dpr;
      ember.vy =
        initialVy !== undefined
          ? initialVy
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

    // Rebuild text mask, line runs and static lines on mount or resize
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

      // Calculate fitted font size
      const targetWidth = activeCanvas.width * 0.94;
      const testSize = 100 * dpr;
      maskCtx.font = `${config.fontWeight} ${testSize}px ${config.fontFamily}`;
      const measured = maskCtx.measureText(config.word).width;
      const scale = targetWidth / Math.max(1, measured);
      const finalFontSize = Math.min(activeCanvas.height * 0.85, testSize * scale);

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
          const isLetter = imgData[index] > 120; // white pixel

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
        minY = activeCanvas.height * 0.2;
        maxY = activeCanvas.height * 0.8;
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

      // If prefers-reduced-motion, draw static lines once and halt loop
      if (prefersReducedMotion) {
        activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
        activeCtx.drawImage(staticCanvas, 0, 0);
      }
    }

    buildWordMask();

    // If reduced motion is requested, stop here (static lines already drawn)
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
        pointer.isOver = true;
        pointer.isTouch = e.pointerType === "touch";

        if (pointer.prevX !== -9999) {
          const dx = currentX - pointer.prevX;
          const dy = currentY - pointer.prevY;
          const dt = Math.max(1, performance.now() - pointer.lastMoveTime);
          pointer.speed = (Math.hypot(dx, dy) / dt) * 1000; // px/sec

          // Spawn extra friction embers along pointer path
          if (!pointer.isTouch && lineRuns.length > 0) {
            const count = Math.min(
              config.maxSpawnPerFrame,
              Math.max(1, Math.floor(pointer.speed / 120))
            );
            const targetX = currentX * dpr;
            const targetY = currentY * dpr;

            // Find line runs close to pointer
            const nearby = lineRuns.filter(
              (r) => Math.abs(r.x - targetX) < 40 * dpr
            );
            if (nearby.length > 0) {
              for (let i = 0; i < count; i++) {
                const chosen =
                  nearby[Math.floor(Math.random() * nearby.length)];
                const py = Math.max(
                  chosen.startY,
                  Math.min(
                    chosen.endY,
                    targetY + (Math.random() - 0.5) * 30 * dpr
                  )
                );
                const burstVx = (Math.random() - 0.5) * 24 * dpr;
                const burstVy = (-14 - Math.random() * 20) * dpr;
                spawnEmber(chosen.x, py, burstVx, burstVy);
              }
            }
          }
        }

        pointer.prevX = currentX;
        pointer.prevY = currentY;
        pointer.x = currentX;
        pointer.y = currentY;
        pointer.lastMoveTime = performance.now();
      } else {
        if (pointer.isOver) {
          pointer.leaveTime = performance.now();
        }
        pointer.isOver = false;
        pointer.prevX = -9999;
        pointer.prevY = -9999;
      }
    };

    const handlePointerLeave = () => {
      if (pointer.isOver) {
        pointer.leaveTime = performance.now();
      }
      pointer.isOver = false;
      pointer.prevX = -9999;
      pointer.prevY = -9999;
    };

    // Tap on touch device: spawn burst of embers at tap position
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || pointer.isTouch) {
        const rect = canvas.getBoundingClientRect();
        const tx = (e.clientX - rect.left) * dpr;
        const ty = (e.clientY - rect.top) * dpr;

        const nearby = lineRuns.filter(
          (r) => Math.abs(r.x - tx) < 60 * dpr
        );
        const spawnCount = 14;

        for (let i = 0; i < spawnCount; i++) {
          let sx = tx;
          let sy = ty;
          if (nearby.length > 0) {
            const chosen = nearby[Math.floor(Math.random() * nearby.length)];
            sx = chosen.x;
            sy = Math.max(
              chosen.startY,
              Math.min(chosen.endY, ty + (Math.random() - 0.5) * 40 * dpr)
            );
          }
          const angle = Math.random() * Math.PI * 2;
          const spd = (15 + Math.random() * 35) * dpr;
          spawnEmber(sx, sy, Math.cos(angle) * spd, Math.sin(angle) * spd - 12 * dpr);
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    canvas.addEventListener("pointerdown", handlePointerDown, { passive: true });

    // IntersectionObserver: entrance trigger and pause offscreen
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry.isIntersecting;
        if (entry.isIntersecting && !hasEntered) {
          hasEntered = true;
          entranceStartTime = performance.now();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    // Tab visibility handling
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        isVisible = false;
      } else {
        isVisible = true;
        lastFrameTime = performance.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Debounced ResizeObserver
    let resizeTimer: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildWordMask();
      }, 100);
    });
    resizeObserver.observe(container);

    // Pre-populate some initial ambient embers
    for (let i = 0; i < config.ambientEmberCount * 0.7; i++) {
      spawnEmber();
      const p = embers[i];
      if (p.active) {
        p.life = Math.random() * p.maxLife * 0.8;
      }
    }

    // MAIN ANIMATION LOOP (Single rAF, fixed timestep, particle pool)
    function render(currentTime: number) {
      animationId = requestAnimationFrame(render);

      if (!isVisible) {
        lastFrameTime = currentTime;
        return;
      }

      let dt = (currentTime - lastFrameTime) / 1000;
      lastFrameTime = currentTime;
      if (dt > 0.08) dt = 0.08; // Clamp on tab focus

      activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);

      const elapsedSinceEntrance = hasEntered
        ? (currentTime - entranceStartTime) / 1000
        : 0;
      const isEntranceDone = elapsedSinceEntrance >= config.entranceDuration;

      // 1. DRAW BASE VERTICAL LINES
      if (isEntranceDone) {
        // Fast static draw call once entrance is finished
        activeCtx.drawImage(staticCanvas, 0, 0);
      } else if (hasEntered && lineRuns.length > 0) {
        // Grow from bottom-up, staggered left-to-right over 1.2s
        const totalW = activeCanvas.width;
        const grad = activeCtx.createLinearGradient(0, 0, 0, activeCanvas.height);
        grad.addColorStop(0, config.colorTop);
        grad.addColorStop(1, config.colorBottom);
        activeCtx.strokeStyle = grad;
        activeCtx.lineWidth = lineWidth;
        activeCtx.lineCap = "butt";

        for (let i = 0; i < lineRuns.length; i++) {
          const run = lineRuns[i];
          const stagger = (run.x / totalW) * 0.65;
          const progress = Math.max(
            0,
            Math.min(1, (elapsedSinceEntrance - stagger) / 0.55)
          );
          if (progress > 0) {
            // Ease-out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const curStartY = run.endY - ease * (run.endY - run.startY);
            activeCtx.beginPath();
            activeCtx.moveTo(run.x, run.endY);
            activeCtx.lineTo(run.x, curStartY);
            activeCtx.stroke();
          }
        }
      }

      // 2. HEAT BOOST LAYER (Additive 'lighter' blending within 120px)
      let heatFactor = 0;
      if (!pointer.isTouch) {
        if (pointer.isOver) {
          heatFactor = 1.0;
        } else if (pointer.leaveTime > 0) {
          const timeSinceLeave = currentTime - pointer.leaveTime;
          if (timeSinceLeave < config.heatDecayMs) {
            heatFactor = 1.0 - timeSinceLeave / config.heatDecayMs;
            heatFactor = Math.pow(heatFactor, 2); // smooth ease
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
            const falloffX = 1 - dx / radius;
            const runCenterY = (run.startY + run.endY) / 2;
            const dy = Math.abs(runCenterY - py);
            const falloffY = Math.max(0, 1 - dy / (radius * 1.2));
            const intensity = falloffX * falloffY * heatFactor;

            if (intensity > 0.02) {
              activeCtx.strokeStyle = `rgba(255, 122, 48, ${intensity * 0.7})`;
              activeCtx.lineWidth = lineWidth * (1.1 + intensity * 0.35);
              activeCtx.beginPath();
              activeCtx.moveTo(run.x, Math.max(run.startY, py - radius * 0.8));
              activeCtx.lineTo(run.x, Math.min(run.endY, py + radius * 0.8));
              activeCtx.stroke();
            }
          }
        }
        activeCtx.restore();
      }

      // 3. EMBERS UPDATE & RENDERING
      // Entrance ember fade-in multiplier
      const emberEntranceAlpha = hasEntered
        ? Math.max(0, Math.min(1, (elapsedSinceEntrance - 0.7) / 0.5))
        : 0;

      if (emberEntranceAlpha > 0.01) {
        // Maintain ambient count
        let activeCount = 0;
        for (let i = 0; i < POOL_SIZE; i++) {
          if (embers[i].active) activeCount++;
        }

        if (activeCount < config.ambientEmberCount) {
          spawnEmber();
        }

        const px = pointer.x * dpr;
        const py = pointer.y * dpr;
        const radius = config.heatRadius * dpr;

        for (let i = 0; i < POOL_SIZE; i++) {
          const ember = embers[i];
          if (!ember.active) continue;

          // Pointer repulsion when active and nearby
          let brightnessBoost = 1.0;
          if (pointer.isOver && !pointer.isTouch) {
            const edx = ember.x - px;
            const edy = ember.y - py;
            const dist = Math.hypot(edx, edy);
            if (dist < radius && dist > 2) {
              const repel = (1 - dist / radius) * 45 * dpr * dt;
              ember.vx += (edx / dist) * repel;
              ember.vy += (edy / dist) * repel;
              brightnessBoost = 1.0 + (1 - dist / radius) * 1.5;
            }
          }

          // Drift physics
          ember.x +=
            ember.vx * dt + Math.sin(ember.phase + ember.life * 2.5) * 0.3 * dpr;
          ember.y += ember.vy * dt;
          ember.life += dt;

          if (ember.life >= ember.maxLife) {
            ember.active = false;
            continue;
          }

          // Twinkle & alpha envelope
          const lifeRatio = ember.life / ember.maxLife;
          const envelope = Math.sin(Math.PI * lifeRatio);
          const twinkle =
            0.75 +
            0.25 *
              Math.sin(ember.phase + ember.life * ember.twinkleSpeed);
          const alpha = Math.min(
            1,
            envelope * twinkle * brightnessBoost * emberEntranceAlpha
          );

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
      canvas.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
      resizeObserver.disconnect();
      clearTimeout(resizeTimer);
    };
  }, [isFontReady, config]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[1100px] h-[160px] sm:h-[210px] md:h-[260px] mx-auto relative flex items-center justify-center select-none"
      data-cursor="ember"
    >
      {/* Accessible visually hidden heading for screen readers */}
      <h2 className="sr-only">Pradhan</h2>

      {/* Canvas for glowing vertical lines and embers */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="w-full h-full block cursor-default"
      />
    </div>
  );
}

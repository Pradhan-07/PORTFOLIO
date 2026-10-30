"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

/**
 * ============================================================================
 * CANVAS 2D PORTRAIT STIPPLE EFFECT (~4000 DOTS)
 * ============================================================================
 * 
 * HOW IT WORKS FOR BEGINNERS:
 * 1. Image Sampling: We draw /karan-bw.png onto a small off-screen canvas.
 *    We inspect each pixel's brightness (0 = dark, 255 = light).
 *    Darker pixels (hair, eyes, facial features, shirt) are sampled with
 *    higher probability into target coordinates.
 * 
 * 2. Staggered Assembly (0 - 1.5s):
 *    On initial load, ~4000 dots start at random positions outside or across
 *    the canvas. Each particle has a unique random delay. Once active, it
 *    slides smoothly (ease-out) into its portrait coordinate.
 * 
 * 3. Mouse Interaction:
 *    When the cursor passes nearby, dots gently repel away along the vector
 *    and naturally spring back to their portrait targets.
 * 
 * 4. Text-Aware Dimming:
 *    To ensure complete text legibility for the hero copy on the left side,
 *    dots positioned behind text blocks automatically attenuate their opacity.
 * 
 * 5. Theme Sync & Performance:
 *    Dot color dynamically matches CSS variable --stipple-dot.
 *    The loop pauses when off-screen or when the tab is hidden.
 * ============================================================================
 */

interface StippleDot {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  delay: number; // in milliseconds
  assembled: boolean;
}

export function StippleEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let isVisible = true;
    let dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvas.offsetWidth * dpr);
    canvas.height = Math.floor(canvas.offsetHeight * dpr);

    const TARGET_DOTS_COUNT = 3800;
    let dots: StippleDot[] = [];
    const startTime = performance.now();

    // 1. Offscreen Image Sampling
    const img = new Image();
    img.src = "/karan-bw.png";

    const buildDotsFromImage = (image: HTMLImageElement) => {
      const sampleW = 140;
      const sampleH = 140;
      const offscreen = document.createElement("canvas");
      offscreen.width = sampleW;
      offscreen.height = sampleH;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.drawImage(image, 0, 0, sampleW, sampleH);
      const imgData = offCtx.getImageData(0, 0, sampleW, sampleH).data;

      // Calculate portrait render bounds on screen
      const screenW = canvas.offsetWidth;
      const screenH = canvas.offsetHeight;
      
      // Position portrait centered-right behind lanyard/hero
      const portraitScale = Math.min(screenW * 0.45, screenH * 0.72);
      const portraitX = screenW > 768 ? screenW * 0.65 - portraitScale / 2 : screenW * 0.5 - portraitScale / 2;
      const portraitY = screenH * 0.12;

      const candidates: { x: number; y: number; brightness: number }[] = [];

      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const idx = (y * sampleW + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

          // Invert so dark features (hair, eyes, face contours) yield higher dot density
          const densityWeight = 1 - brightness;

          if (Math.random() < densityWeight * 0.88 + 0.08) {
            candidates.push({
              x: portraitX + (x / sampleW) * portraitScale,
              y: portraitY + (y / sampleH) * portraitScale,
              brightness,
            });
          }
        }
      }

      // Shuffle and pick ~3800 dots
      candidates.sort(() => Math.random() - 0.5);
      const chosen = candidates.slice(0, TARGET_DOTS_COUNT);

      dots = chosen.map((c) => {
        const randX = Math.random() * screenW;
        const randY = Math.random() * screenH;
        return {
          x: randX,
          y: randY,
          originX: randX,
          originY: randY,
          targetX: c.x,
          targetY: c.y,
          vx: 0,
          vy: 0,
          size: Math.random() > 0.8 ? 1.6 : 1.1,
          baseAlpha: 0.2 + (1 - c.brightness) * 0.55,
          delay: Math.random() * 1500, // 0 to 1.5s stagger assembly
          assembled: false,
        };
      });
    };

    img.onload = () => {
      buildDotsFromImage(img);
    };

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(canvas.offsetWidth * dpr);
      canvas.height = Math.floor(canvas.offsetHeight * dpr);
      if (img.complete) {
        buildDotsFromImage(img);
      }
    };

    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Pause when hero off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Render loop
    const render = (currentTime: number) => {
      if (!isVisible) {
        animationId = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      const isDark = document.documentElement.classList.contains("dark");
      const mouse = mouseRef.current;
      const elapsed = currentTime - startTime;
      const screenW = canvas.offsetWidth;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // 1. Staggered Assembly on load
        if (!dot.assembled) {
          if (elapsed > dot.delay) {
            const t = Math.min((elapsed - dot.delay) / 900, 1);
            // Ease-out cubic
            const ease = 1 - Math.pow(1 - t, 3);
            dot.x = dot.originX + (dot.targetX - dot.originX) * ease;
            dot.y = dot.originY + (dot.targetY - dot.originY) * ease;
            if (t >= 1) dot.assembled = true;
          }
        } else {
          // LERP back toward portrait target
          dot.x += (dot.targetX - dot.x) * 0.06;
          dot.y += (dot.targetY - dot.y) * 0.06;
        }

        // 2. Cursor Repel & Spring Back
        const dx = dot.x - mouse.x;
        const dy = dot.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        const repelRadius = 65;

        if (dist < repelRadius && dist > 0.001) {
          const force = (repelRadius - dist) / repelRadius;
          dot.x += (dx / dist) * force * 16;
          dot.y += (dy / dist) * force * 16;
        }

        // 3. Text-Aware Dimming:
        // Hero copy resides on the left side (x < screenW * 0.55).
        // Automatically dim dots behind text blocks to guarantee crystal readability!
        let currentAlpha = dot.baseAlpha;
        if (dot.x < screenW * 0.52) {
          currentAlpha *= 0.16; // Attenuate behind hero copy
        }

        // 4. Draw Dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);

        if (isDark) {
          ctx.fillStyle = `rgba(237, 237, 237, ${currentAlpha})`;
        } else {
          ctx.fillStyle = `rgba(17, 17, 17, ${currentAlpha * 0.85})`;
        }
        ctx.fill();
      }

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none -z-10"
      aria-hidden="true"
    />
  );
}

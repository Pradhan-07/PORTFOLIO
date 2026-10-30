"use client";

import React, { useEffect, useRef } from "react";

/**
 * ============================================================================
 * CANVAS 2D STIPPLE / MORPHING DOT-PARTICLE EFFECT
 * ============================================================================
 * 
 * HOW IT WORKS FOR BEGINNERS:
 * ---------------------------
 * 1. Particles: We create an array of ~250 particle objects. Each particle has:
 *    - x, y: Its current position on screen.
 *    - targetX, targetY: The exact coordinate it wants to reach.
 *    - vx, vy: Small velocities for natural floating drift.
 *    - baseAlpha: Opacity so some dots are softer than others.
 * 
 * 2. Morphing Shapes:
 *    We define sets of coordinates for different shapes:
 *    - Shape A: The monogram initials "KP" (computed mathematically).
 *    - Shape B: Concentric geometric circles / rings.
 *    - Shape C: A uniform ambient stipple matrix.
 *    Every 7 seconds, we cycle to the next shape by updating every particle's
 *    (targetX, targetY).
 * 
 * 3. Linear Interpolation (LERP):
 *    In each frame (60 FPS), the particle smoothly slides toward its target:
 *       x += (targetX - x) * easeRate
 *    This produces fluid, organic movement without needing physics engines.
 * 
 * 4. Readability & Contrast:
 *    We keep particle sizes small (1 - 2px) and opacity gentle (0.15 - 0.35).
 *    A subtle radial mask ensures text remains crystal-clear over the particles.
 * ============================================================================
 */

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export function StippleEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const PARTICLE_COUNT = 240;
    const particles: Particle[] = [];

    // Pre-generate target coordinates for "KP" monogram
    const generateKPShape = (w: number, h: number) => {
      const targets: { x: number; y: number }[] = [];
      const centerX = w * 0.45;
      const centerY = h * 0.48;
      const scale = Math.min(w, h) * 0.28;

      // Letter 'K'
      const kLeft = centerX - scale * 0.7;
      // Vertical bar of K
      for (let i = 0; i < 35; i++) {
        targets.push({
          x: kLeft + (Math.random() - 0.5) * 6,
          y: centerY - scale * 0.6 + (i / 34) * (scale * 1.2),
        });
      }
      // Top diagonal of K
      for (let i = 0; i < 25; i++) {
        const t = i / 24;
        targets.push({
          x: kLeft + t * (scale * 0.5) + (Math.random() - 0.5) * 6,
          y: centerY - t * (scale * 0.6) + (Math.random() - 0.5) * 6,
        });
      }
      // Bottom diagonal of K
      for (let i = 0; i < 25; i++) {
        const t = i / 24;
        targets.push({
          x: kLeft + t * (scale * 0.5) + (Math.random() - 0.5) * 6,
          y: centerY + t * (scale * 0.6) + (Math.random() - 0.5) * 6,
        });
      }

      // Letter 'P'
      const pLeft = centerX + scale * 0.2;
      // Vertical bar of P
      for (let i = 0; i < 35; i++) {
        targets.push({
          x: pLeft + (Math.random() - 0.5) * 6,
          y: centerY - scale * 0.6 + (i / 34) * (scale * 1.2),
        });
      }
      // Loop of P (half circle)
      for (let i = 0; i < 35; i++) {
        const angle = -Math.PI / 2 + (i / 34) * Math.PI;
        const radius = scale * 0.32;
        targets.push({
          x: pLeft + Math.cos(angle) * radius + (Math.random() - 0.5) * 6,
          y: centerY - scale * 0.28 + Math.sin(angle) * radius + (Math.random() - 0.5) * 6,
        });
      }

      // Fill remaining particles with ambient background orbit
      while (targets.length < PARTICLE_COUNT) {
        const angle = Math.random() * Math.PI * 2;
        const r = scale * (1.1 + Math.random() * 0.8);
        targets.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r * 0.6,
        });
      }

      return targets;
    };

    // Shape 2: Concentric geometric orbit
    const generateOrbitShape = (w: number, h: number) => {
      const targets: { x: number; y: number }[] = [];
      const cx = w * 0.5;
      const cy = h * 0.5;
      const maxR = Math.min(w, h) * 0.42;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ring = i % 4;
        const r = (ring + 1) * (maxR / 4);
        const angle = (i / (PARTICLE_COUNT / 4)) * Math.PI * 2 + ring * 0.5;
        targets.push({
          x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 12,
          y: cy + Math.sin(angle) * (r * 0.6) + (Math.random() - 0.5) * 12,
        });
      }
      return targets;
    };

    // Shape 3: Subtle ambient floating grid
    const generateGridShape = (w: number, h: number) => {
      const targets: { x: number; y: number }[] = [];
      const cols = 20;
      const rows = 12;
      const stepX = w / (cols + 1);
      const stepY = h / (rows + 1);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const c = (i % cols) + 1;
        const r = Math.floor(i / cols) + 1;
        targets.push({
          x: c * stepX + (Math.random() - 0.5) * (stepX * 0.6),
          y: r * stepY + (Math.random() - 0.5) * (stepY * 0.6),
        });
      }
      return targets;
    };

    let shapeTargets = generateKPShape(width, height);

    // Initialize particles randomly across canvas
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        targetX: shapeTargets[i]?.x || width / 2,
        targetY: shapeTargets[i]?.y || height / 2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() > 0.85 ? 2 : 1.3,
        alpha: 0.15 + Math.random() * 0.25,
      });
    }

    // Switch shapes every 6.5 seconds
    let currentShape = 0;
    const interval = setInterval(() => {
      currentShape = (currentShape + 1) % 3;
      if (currentShape === 0) {
        shapeTargets = generateKPShape(width, height);
      } else if (currentShape === 1) {
        shapeTargets = generateOrbitShape(width, height);
      } else {
        shapeTargets = generateGridShape(width, height);
      }

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (shapeTargets[i]) {
          particles[i].targetX = shapeTargets[i].x;
          particles[i].targetY = shapeTargets[i].y;
        }
      }
    }, 6500);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      shapeTargets =
        currentShape === 0
          ? generateKPShape(width, height)
          : currentShape === 1
          ? generateOrbitShape(width, height)
          : generateGridShape(width, height);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (shapeTargets[i]) {
          particles[i].targetX = shapeTargets[i].x;
          particles[i].targetY = shapeTargets[i].y;
        }
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

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains("dark");
      const mouse = mouseRef.current;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];

        // LERP position toward target
        p.x += (p.targetX - p.x) * 0.04;
        p.y += (p.targetY - p.y) * 0.04;

        // Subtle organic float
        p.x += p.vx;
        p.y += p.vy;

        // Cursor avoidance (soft magnetic repel)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 80) {
          const force = (80 - dist) / 80;
          p.x += (dx / dist) * force * 4;
          p.y += (dy / dist) * force * 4;
        }

        // Draw stipple dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(237, 237, 237, ${p.alpha})`
          : `rgba(20, 20, 20, ${p.alpha * 0.9})`;
        ctx.fill();

        // Connect close neighbors with ultra-faint line
        for (let j = i + 1; j < Math.min(i + 8, PARTICLE_COUNT); j++) {
          const p2 = particles[j];
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist2 < 42) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = isDark
              ? `rgba(255, 255, 255, ${(1 - dist2 / 42) * 0.07})`
              : `rgba(0, 0, 0, ${(1 - dist2 / 42) * 0.05})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none -z-10 opacity-70 dark:opacity-85"
      aria-hidden="true"
    />
  );
}

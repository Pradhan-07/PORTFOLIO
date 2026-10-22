import React, { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface RadialEclipseTransitionProps {
  onComplete: () => void;
  themeAccent?: string;
}

export const RadialEclipseTransition: React.FC<RadialEclipseTransitionProps> = ({
  onComplete,
  themeAccent = '#ebe6db',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // Reduced motion (G9): skip the 1.85s canvas sequence entirely and
    // hand over to the portfolio almost immediately.
    if (reducedMotion) {
      const t = window.setTimeout(() => onComplete(), 60);
      return () => window.clearTimeout(t);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;

    const DURATION = 1850; // Total transition time in ms (~1.85s)
    const startTime = performance.now();

    // Procedural radial streaks (280 rays of varying length, angle, and thickness)
    const RAY_COUNT = 320;
    const rays = Array.from({ length: RAY_COUNT }, (_, i) => {
      const angle = (i / RAY_COUNT) * Math.PI * 2;
      const lengthMult = 0.5 + Math.random() * 0.9;
      const alphaMult = 0.3 + Math.random() * 0.7;
      const widthMult = 0.6 + Math.random() * 1.2;
      return { angle, lengthMult, alphaMult, widthMult };
    });

    // Orbiting particles in core
    const PARTICLE_COUNT = 60;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 20 + Math.random() * 50,
      speed: (Math.random() - 0.5) * 0.05,
      size: 1 + Math.random() * 2,
    }));

    let animId: number;

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / DURATION);

      ctx.clearRect(0, 0, width, height);

      // Phase calculation
      // 0.0 -> 0.25: Core convergence
      // 0.25 -> 0.60: Ring formation & particle swirl
      // 0.60 -> 0.90: Eclipse burst expansion
      // 0.90 -> 1.00: Fullscreen takeover & resolve

      if (progress < 0.25) {
        // Phase 1: Small particle cluster convergence
        const p1 = progress / 0.25;
        ctx.fillStyle = `color-mix(in srgb, ${themeAccent} ${p1 * 70}%, transparent)`;
        particles.forEach((pt) => {
          const currentDist = pt.dist * (1 - p1 * 0.5);
          const x = cx + Math.cos(pt.angle) * currentDist;
          const y = cy + Math.sin(pt.angle) * currentDist;
          ctx.beginPath();
          ctx.arc(x, y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Small center core
        ctx.strokeStyle = `color-mix(in srgb, ${themeAccent} ${p1 * 80}%, transparent)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 14 * p1, 0, Math.PI * 2);
        ctx.stroke();

      } else if (progress < 0.60) {
        // Phase 2: Ring formation & micro-rays
        const p2 = (progress - 0.25) / 0.35;
        const ringRadius = 24 + p2 * 70;

        // Draw radial streaks emerging from ring perimeter
        rays.forEach((ray) => {
          const rInner = ringRadius;
          const rOuter = ringRadius + ray.lengthMult * 60 * p2;

          ctx.strokeStyle = `color-mix(in srgb, ${themeAccent} ${(ray.alphaMult * p2 * 85).toFixed(1)}%, transparent)`;
          ctx.lineWidth = ray.widthMult;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ray.angle) * rInner, cy + Math.sin(ray.angle) * rInner);
          ctx.lineTo(cx + Math.cos(ray.angle) * rOuter, cy + Math.sin(ray.angle) * rOuter);
          ctx.stroke();
        });

        // Luminous perimeter
        ctx.strokeStyle = themeAccent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Dark circular center
        ctx.fillStyle = '#050505';
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius - 1, 0, Math.PI * 2);
        ctx.fill();

        // Technical coordinates text
        ctx.font = '9px "IBM Plex Mono", monospace';
        ctx.fillStyle = `color-mix(in srgb, ${themeAccent} 50%, transparent)`;
        ctx.textAlign = 'center';
        ctx.fillText(`PORTAL // 0x${Math.round(p2 * 255).toString(16).toUpperCase()}`, cx, cy + 3);

      } else {
        // Phase 3 & 4: Full-screen radial expansion & eclipse takeover
        const p3 = (progress - 0.60) / 0.40;
        const maxDiagonal = Math.hypot(width, height) * 1.1;
        const ringRadius = 94 + p3 * maxDiagonal;

        // Massive radial burst
        rays.forEach((ray) => {
          const rInner = ringRadius;
          const rOuter = ringRadius + ray.lengthMult * 180 * (1 - p3 * 0.4);

          ctx.strokeStyle = `color-mix(in srgb, ${themeAccent} ${(ray.alphaMult * (1 - p3 * 0.6) * 90).toFixed(1)}%, transparent)`;
          ctx.lineWidth = ray.widthMult * 1.5;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ray.angle) * rInner, cy + Math.sin(ray.angle) * rInner);
          ctx.lineTo(cx + Math.cos(ray.angle) * rOuter, cy + Math.sin(ray.angle) * rOuter);
          ctx.stroke();
        });

        // Expanding dark circular center that consumes the screen
        ctx.fillStyle = '#050505';
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.fill();

        // Luminous ring leading the charge
        if (p3 < 0.95) {
          ctx.strokeStyle = themeAccent;
          ctx.lineWidth = 2 * (1 - p3);
          ctx.beginPath();
          ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      if (progress < 1.0) {
        animId = requestAnimationFrame(render);
      } else {
        onComplete();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [onComplete, themeAccent, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="radial-eclipse-canvas"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
};

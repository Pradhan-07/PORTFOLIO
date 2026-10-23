import React, { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface RadialEclipseTransitionProps {
  onComplete: () => void;
  /** Cancel the gate (Escape): return to the landing, editor never mounts. */
  onCancel: () => void;
  themeAccent?: string;
}

const DURATION = 3600; // Total transition time in ms (~3.6s, §2.2)
/** Hard ceiling: completion is guaranteed by this timer even if rAF stalls. */
const FALLBACK_MS = DURATION + 600;

/**
 * Staged, eye-centred enter transition (DESIGN-SPEC §2.2):
 *   A (0–0.8s)   the landing dims (LandingScreen's isLeaving styles);
 *                here, particles drift toward the eye point.
 *   B (0.8–1.8s) a small dense dot-eye condenses at right-of-centre
 *                (0.68w × 0.42h) with a dark pupil centre.
 *   C (1.8–3.2s) warp — radial streaks + an expanding black circle
 *                centred on the eye point, radius covering the screen;
 *                the dot-eye stays visible at the centre while it grows.
 *   D (3.2–3.6s) hold black, then hand over to the main view.
 * A second Enter/click mid-transition is handled at App level (skip to
 * completion); Escape cancels here.
 */
export const RadialEclipseTransition: React.FC<RadialEclipseTransitionProps> = ({
  onComplete,
  onCancel,
  themeAccent = '#ebe6db',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Callbacks live in refs so the animation effect below runs exactly
  // once per mount. Depending on the callbacks directly let a parent
  // re-render restart the effect mid-flight (fresh startTime, fresh
  // canvas) — a remount loop in which onComplete could starve forever.
  const completeRef = useRef(onComplete);
  const cancelRef = useRef(onCancel);
  const accentRef = useRef(themeAccent);
  useEffect(() => {
    completeRef.current = onComplete;
    cancelRef.current = onCancel;
    accentRef.current = themeAccent;
  }, [onComplete, onCancel, themeAccent]);

  useEffect(() => {
    // Single-shot guard: whichever path finishes first (rAF reaching
    // progress 1, or the fallback timer) wins; the other becomes a no-op.
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      completeRef.current();
    };
    const cancel = () => {
      if (settled) return;
      settled = true;
      cancelRef.current();
    };

    // Escape cancels the gate at any point (Comparison Round 1, S1).
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    };
    window.addEventListener('keydown', handleKey);

    // Reduced motion (G9): skip the canvas sequence entirely and hand
    // over to the portfolio almost immediately.
    if (reducedMotion) {
      const t = window.setTimeout(finish, 60);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener('keydown', handleKey);
      };
    }

    // Timer-based completion fallback, independent of animation frames:
    // if rAF is throttled, starved, or the tab loses focus mid-gate, the
    // editor still mounts. The animation is decoration; the handover is
    // guaranteed by the clock, not by the frame loop.
    const fallback = window.setTimeout(finish, FALLBACK_MS);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      // No canvas — the fallback timer alone carries the handover.
      return () => {
        window.clearTimeout(fallback);
        window.removeEventListener('keydown', handleKey);
      };
    }

    const themeAccent = accentRef.current;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // The eye point: right of centre (§2.2-B). The warp is centred here.
    const cx = width * 0.68;
    const cy = height * 0.42;
    // Radius that covers the whole screen from the eye point.
    const maxRadius = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy)) + 40;

    const startTime = performance.now();

    // Procedural radial streaks (rays of varying length, angle, thickness)
    const RAY_COUNT = 320;
    const rays = Array.from({ length: RAY_COUNT }, (_, i) => {
      const angle = (i / RAY_COUNT) * Math.PI * 2;
      const lengthMult = 0.5 + Math.random() * 0.9;
      const alphaMult = 0.3 + Math.random() * 0.7;
      const widthMult = 0.6 + Math.random() * 1.2;
      return { angle, lengthMult, alphaMult, widthMult };
    });

    // Orbiting particles that converge during phase A
    const PARTICLE_COUNT = 60;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 20 + Math.random() * 50,
      speed: (Math.random() - 0.5) * 0.05,
      size: 1 + Math.random() * 2,
    }));

    // Phase B/C dot-eye: dots on a grid inside r≈26px, dark pupil centre.
    const EYE_R = 26;
    const eyeDots: { x: number; y: number }[] = [];
    for (let gy = -EYE_R; gy <= EYE_R; gy += 4) {
      for (let gx = -EYE_R; gx <= EYE_R; gx += 4) {
        if (gx * gx + gy * gy <= EYE_R * EYE_R) eyeDots.push({ x: gx, y: gy });
      }
    }
    const drawEye = (alpha: number, scale: number) => {
      ctx.fillStyle = `color-mix(in srgb, ${themeAccent} ${(alpha * 90).toFixed(1)}%, transparent)`;
      eyeDots.forEach((d) => {
        ctx.fillRect(cx + d.x * scale - 1, cy + d.y * scale - 1, 2, 2);
      });
      // Dark pupil void at the exact centre.
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.arc(cx, cy, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
    };

    let animId = 0;

    const render = (now: number) => {
      if (settled) return;
      const elapsed = now - startTime;

      ctx.clearRect(0, 0, width, height);

      if (elapsed < 800) {
        // Phase A (0–0.8s): particles drift toward the eye point while
        // the landing itself dims (LandingScreen isLeaving styles).
        const pA = elapsed / 800;
        ctx.fillStyle = `color-mix(in srgb, ${themeAccent} ${(pA * 55).toFixed(1)}%, transparent)`;
        particles.forEach((pt) => {
          const currentDist = pt.dist * (1 - pA * 0.55);
          const x = cx + Math.cos(pt.angle) * currentDist;
          const y = cy + Math.sin(pt.angle) * currentDist;
          ctx.beginPath();
          ctx.arc(x, y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (elapsed < 1800) {
        // Phase B (0.8–1.8s): the dot-eye condenses at the eye point.
        const pB = (elapsed - 800) / 1000;
        drawEye(pB, 1.3 - 0.3 * pB);
        ctx.strokeStyle = `color-mix(in srgb, ${themeAccent} ${(pB * 70).toFixed(1)}%, transparent)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, EYE_R * (1.3 - 0.3 * pB) + 3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (elapsed < 3200) {
        // Phase C (1.8–3.2s): warp — streaks + expanding black circle
        // centred on the eye point; the eye stays visible at its centre.
        const pC = (elapsed - 1800) / 1400;
        const eased = pC * pC;
        const radius = EYE_R + eased * (maxRadius - EYE_R);

        rays.forEach((ray) => {
          const rInner = radius;
          const rOuter = radius + ray.lengthMult * 180 * (1 - pC * 0.4);
          ctx.strokeStyle = `color-mix(in srgb, ${themeAccent} ${(ray.alphaMult * (1 - pC * 0.6) * 90).toFixed(1)}%, transparent)`;
          ctx.lineWidth = ray.widthMult * 1.5;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ray.angle) * rInner, cy + Math.sin(ray.angle) * rInner);
          ctx.lineTo(cx + Math.cos(ray.angle) * rOuter, cy + Math.sin(ray.angle) * rOuter);
          ctx.stroke();
        });

        ctx.fillStyle = '#050505';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        if (pC < 0.95) {
          ctx.strokeStyle = themeAccent;
          ctx.lineWidth = 2 * (1 - pC);
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (pC < 0.8) drawEye(1 - pC / 0.8, 1);
      } else {
        // Phase D (3.2–3.6s): hold black, then finish.
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);
      }

      if (elapsed < DURATION) {
        animId = requestAnimationFrame(render);
      } else {
        finish();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.clearTimeout(fallback);
      window.removeEventListener('keydown', handleKey);
    };
    // Mount-once by design: callbacks and accent are read through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

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

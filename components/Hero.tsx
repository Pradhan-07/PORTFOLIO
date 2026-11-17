"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { VerletRope } from "@/lib/verlet";
import { Lanyard, LanyardHandle } from "./hero/Lanyard";
import { Badge } from "./hero/Badge";
import { BadgeDebugOverlay } from "./hero/BadgeDebugOverlay";
import { useTheme } from "../components/ThemeProvider";
import { ChevronDown } from "lucide-react";

/** Straps pin at (centre ± 30, TOP_Y). TOP_Y sits just below the navbar
 *  so the full strap — including the printed name — is visible instead
 *  of disappearing behind the nav pill. */
const TOP_Y = 64;

/** Badge-stick length by container width (the badge hangs on this long,
 *  mostly hidden stick — that is what makes pulls feel elastic). */
function badgeStickForWidth(w: number): number {
  if (w < 640) return 290;
  if (w < 1024) return 350;
  return 400;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export function Hero() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lanyardRef = useRef<LanyardHandle | null>(null);
  const badgePhysicsRef = useRef<HTMLDivElement | null>(null);
  const badgeFlipRef = useRef<HTMLDivElement | null>(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  // Physics rope (beebombshell-style double-strap verlet model)
  const ropeRef = useRef<VerletRope>(new VerletRope());
  const anchorRef = useRef({ x: 0, y: TOP_Y });
  const lastWidthRef = useRef(0);
  const lastHeightRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const isVisibleRef = useRef(true);
  const reducedMotionRef = useRef(false);

  // Smoothed badge pose (reference-site factors: position 0.85 / 0.65
  // while dragging, angle 0.75 / 0.45, tilt from x-velocity)
  const poseRef = useRef({
    x: 0,
    y: 0,
    angleRad: 0,
    prevX: 0,
    tiltVel: 0,
    tiltDeg: 0,
    initialized: false,
  });

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragTargetRef = useRef({ x: 0, y: 0 });
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const pointerDownTime = useRef(0);
  const hasMovedPastThreshold = useRef(false);

  // Flip state: target lives in state (for Badge faces), the animated
  // angle lives in refs and is eased in the render loop (0.12/frame,
  // reference-site factor) so the strap twist stays in sync.
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const flipCurRef = useRef(0);
  const flipTargetRef = useRef(0);
  const isFlippingRef = useRef(false);

  const toggleFlip = useCallback((targetState?: boolean) => {
    const next =
      typeof targetState === "boolean" ? targetState : flipTargetRef.current === 0;
    flipTargetRef.current = next ? 180 : 0;
    if (reducedMotionRef.current) {
      flipCurRef.current = flipTargetRef.current;
    } else {
      isFlippingRef.current = true;
      setIsFlipping(true);
    }
    setIsFlipped(next);
    ropeRef.current.wakeUp();
  }, []);

  const setupLayout = useCallback((width: number, height: number) => {
    const cx = width / 2;
    anchorRef.current = { x: cx, y: TOP_Y };
    const heightChanged =
      hasInitializedRef.current && Math.abs(height - lastHeightRef.current) > 4;

    if (!hasInitializedRef.current || heightChanged) {
      hasInitializedRef.current = true;
      ropeRef.current.init(cx, TOP_Y, badgeStickForWidth(width));
      poseRef.current.initialized = false;
    } else if (Math.abs(width - lastWidthRef.current) > 3) {
      ropeRef.current.setAnchor(cx, TOP_Y);
    }
    lastWidthRef.current = width;
    lastHeightRef.current = height;
  }, []);

  // One full pose + draw computation (shared by the RAF loop and by
  // one-shot draws for reduced motion / re-entry).
  const drawFrame = useCallback((time: number) => {
    const rope = ropeRef.current;
    const t = rope.getBadgeTransform();
    const pose = poseRef.current;
    const dragging = isDraggingRef.current;

    if (!pose.initialized) {
      pose.x = t.x;
      pose.y = t.y;
      pose.angleRad = t.angleRad;
      pose.prevX = t.x;
      pose.initialized = true;
    }

    const kp = dragging ? 0.65 : 0.85;
    pose.x += (t.x - pose.x) * kp;
    pose.y += (t.y - pose.y) * kp;

    const rawAngle = clamp(t.angleRad, -0.42, 0.42);
    const ka = dragging ? 0.45 : 0.75;
    pose.angleRad += (rawAngle - pose.angleRad) * ka;

    const vx = pose.x - pose.prevX;
    pose.prevX = pose.x;
    pose.tiltVel += (vx - pose.tiltVel) * 0.15;
    pose.tiltDeg = clamp(1.8 * pose.tiltVel, -14, 14);

    // Flip easing + settle detection
    if (isFlippingRef.current) {
      flipCurRef.current += (flipTargetRef.current - flipCurRef.current) * 0.12;
      if (Math.abs(flipTargetRef.current - flipCurRef.current) < 0.4) {
        flipCurRef.current = flipTargetRef.current;
        isFlippingRef.current = false;
        setIsFlipping(false);
      }
    }

    if (badgePhysicsRef.current) {
      badgePhysicsRef.current.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${(
        (pose.angleRad * 180) /
        Math.PI
      ).toFixed(3)}deg)`;
    }
    if (badgeFlipRef.current) {
      badgeFlipRef.current.style.transform = `rotateY(${(
        flipCurRef.current + pose.tiltDeg
      ).toFixed(3)}deg)`;
    }
    if (lanyardRef.current) {
      lanyardRef.current.update(rope.points, {
        flipRad: (flipCurRef.current * Math.PI) / 180,
        baseTwist: 2.2 * pose.angleRad + 0.1 * pose.tiltVel,
        isDark: isDarkRef.current,
        time,
      });
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;
    let animationId = 0;

    reducedMotionRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typeof window !== "undefined") {
      (window as unknown as { __LANYARD_ROPE__?: VerletRope }).__LANYARD_ROPE__ =
        ropeRef.current;
    }

    const rect = container.getBoundingClientRect();
    if (rect.width > 0) {
      setupLayout(rect.width, rect.height);
      drawFrame(performance.now());
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (!isMounted) return;
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && Math.abs(w - lastWidthRef.current) > 3) {
          setupLayout(w, h);
          drawFrame(performance.now());
        }
      }
    });
    resizeObserver.observe(container);

    const render = (time: number) => {
      if (!isMounted || !isVisibleRef.current) return;
      ropeRef.current.update(
        time,
        isDraggingRef.current,
        dragTargetRef.current
      );
      drawFrame(time);
      animationId = requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (!animationId && isVisibleRef.current && isMounted && !reducedMotionRef.current) {
        animationId = requestAnimationFrame(render);
      }
    };

    const stopLoop = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = 0;
      }
    };

    // Pause the physics loop when the hero is offscreen (300px margin).
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0].isIntersecting;
        if (isIntersecting && !isVisibleRef.current) {
          isVisibleRef.current = true;
          ropeRef.current.lastTime = performance.now();
          ropeRef.current.wakeUp();
          drawFrame(performance.now());
          startLoop();
        } else if (!isIntersecting && isVisibleRef.current) {
          isVisibleRef.current = false;
          stopLoop();
        }
      },
      { rootMargin: "300px" }
    );
    intersectionObserver.observe(container);

    const handleVisibility = () => {
      if (!document.hidden) {
        ropeRef.current.lastTime = performance.now();
        ropeRef.current.wakeUp();
        drawFrame(performance.now());
        startLoop();
      } else {
        stopLoop();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    startLoop();

    return () => {
      isMounted = false;
      stopLoop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [setupLayout, drawFrame]);

  // Pointer handlers: < 6px of movement on release = flip click
  // (reference-site threshold); beyond that it is a drag, and the
  // badge point is pinned to the pointer by the solver.
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    pointerDownTime.current = performance.now();
    hasMovedPastThreshold.current = false;
    ropeRef.current.wakeUp();

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dragTargetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerDownTime.current) return;

    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    const dist = Math.hypot(dx, dy);

    if (!hasMovedPastThreshold.current && dist >= 6) {
      hasMovedPastThreshold.current = true;
      isDraggingRef.current = true;
      setIsDragging(true);

      if (containerRef.current) {
        containerRef.current.style.touchAction = "none";
      }
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }

    if (hasMovedPastThreshold.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dragTargetRef.current = {
        x: clamp(e.clientX - rect.left, -80, rect.width + 80),
        y: clamp(e.clientY - rect.top, TOP_Y + 60, rect.height + 260),
      };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    const dist = Math.hypot(dx, dy);

    if (!hasMovedPastThreshold.current && dist < 6) {
      toggleFlip();
    }

    if (hasMovedPastThreshold.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      hasMovedPastThreshold.current = false;

      if (containerRef.current) {
        containerRef.current.style.touchAction = "auto";
      }
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }

    pointerDownTime.current = 0;
  };

  return (
    <section
      id="hero"
      className="relative w-full pt-0 pb-4 flex flex-col justify-start overflow-x-hidden select-none scroll-mt-24"
    >
      {/* Hero Radial Glow (static — a breathing background felt unstable) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[46%] w-[680px] sm:w-[840px] h-[440px] sm:h-[540px] rounded-full -z-10 blur-3xl"
        style={{
          transform: "translate(-50%, -50%)",
          opacity: 0.1,
          background: isDark
            ? "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.7) 0%, rgba(236, 72, 153, 0.45) 45%, transparent 72%)"
            : "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.45) 0%, rgba(236, 72, 153, 0.3) 45%, transparent 72%)",
        }}
      />

      {/* Physics stage: canvas straps + badge, one relative container */}
      <div
        ref={containerRef}
        data-hero-lanyard="true"
        className="relative w-full min-h-[580px] sm:min-h-[650px] md:min-h-[690px] lg:min-h-[740px] h-[580px] sm:h-[650px] md:h-[690px] lg:h-[740px] flex items-center justify-center overflow-visible pointer-events-none"
      >
        {/* Dev Telemetry & Physics Debug Overlay (Dev only, toggle with 'D' key) */}
        {process.env.NODE_ENV !== "production" && (
          <BadgeDebugOverlay ropeRef={ropeRef} anchorRef={anchorRef} />
        )}

        {/* Canvas lanyard: twin straps, clasp, ring (twisting ribbons) */}
        <Lanyard ref={lanyardRef} isDark={isDark} />

        {/* Badge pose layer: translated to the badge centre and rotated
            about it (transform-origin 0 0 = the translated point). */}
        <div
          ref={badgePhysicsRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
          className="badge-initial-pose z-30 pointer-events-auto"
        >
          <Badge
            isFlipped={isFlipped}
            onToggleFlip={toggleFlip}
            isDark={isDark}
            isDragging={isDragging}
            isFlipping={isFlipping}
            flipRef={badgeFlipRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>
      </div>

      {/* Hero Bottom Hint */}
      <div className="relative z-20 w-full text-center mt-2 sm:mt-3 pb-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-center">
        <a
          href="#resume"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors pointer-events-auto cursor-pointer"
        >
          <span>scroll. the badge will survive.</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
        </a>
      </div>
    </section>
  );
}

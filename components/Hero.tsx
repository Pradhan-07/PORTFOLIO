"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { VerletRope, DEFAULT_PHYSICS_CONFIG } from "@/lib/verlet";
import { Lanyard, LanyardHandle } from "./hero/Lanyard";
import { Badge } from "./hero/Badge";
import { BadgeDebugOverlay } from "./hero/BadgeDebugOverlay";
import { useTheme } from "../components/ThemeProvider";
import { ChevronDown } from "lucide-react";

export function Hero() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lanyardRef = useRef<LanyardHandle | null>(null);
  const badgePhysicsRef = useRef<HTMLDivElement | null>(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Physics Rope Instance
  const ropeRef = useRef<VerletRope>(new VerletRope(DEFAULT_PHYSICS_CONFIG));

  // Anchor point in refs to avoid state re-renders
  const anchorRef = useRef({ x: 0, y: 44 });
  const lastWidthRef = useRef(0);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragTargetRef = useRef({ x: 0, y: 0 });
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const pointerDownTime = useRef(0);
  const hasMovedPastThreshold = useRef(false);

  // 3D Flip state
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // Toggle flip with state-safe dispatch
  const toggleFlip = useCallback((targetState?: boolean) => {
    setIsFlipping(true);
    setIsFlipped((prev) => {
      const next = typeof targetState === "boolean" ? targetState : !prev;
      return next;
    });
  }, []);

  // Anchor is strictly container-local: top-center of the container, behind the fixed notch overlay
  const getContainerAnchor = useCallback((width: number) => {
    return {
      x: width / 2,
      y: 10, // Sits under the 40px notch navbar overlay
    };
  }, []);

  const hasInitializedRef = useRef(false);
  const isVisibleRef = useRef(true);

  // Initialize and handle resize (guarded against micro-resizes)
  const setupRope = useCallback((width: number, isInitial: boolean = false) => {
    const { x: anchorX, y: anchorY } = getContainerAnchor(width);
    anchorRef.current = { x: anchorX, y: anchorY };

    if (isInitial || !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      lastWidthRef.current = width;
      // Start rope slightly offset on initial mount so it settles smoothly
      ropeRef.current.init(anchorX, anchorY, isInitial ? 40 : 0);
    } else if (Math.abs(width - lastWidthRef.current) > 3) {
      lastWidthRef.current = width;
      ropeRef.current.setAnchor(anchorX, anchorY);
    } else {
      ropeRef.current.setAnchor(anchorX, anchorY);
    }

    const transform = ropeRef.current.getBadgeTransform();
    if (badgePhysicsRef.current) {
      badgePhysicsRef.current.style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${transform.angleDeg}deg)`;
    }
    if (lanyardRef.current) {
      lanyardRef.current.update(
        ropeRef.current.points,
        anchorX,
        anchorY,
        transform.stretchRatio,
        transform.angleDeg
      );
    }
  }, [getContainerAnchor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;
    let animationId = 0;

    if (typeof window !== "undefined") {
      (window as unknown as { __LANYARD_ROPE__?: VerletRope }).__LANYARD_ROPE__ = ropeRef.current;
    }

    const rect = container.getBoundingClientRect();
    if (rect.width > 0) {
      setupRope(rect.width, true);
    }

    // Direct synchronous draw of one frame (used for initial pose & re-entry)
    const drawFrame = () => {
      const points = ropeRef.current.points;
      const transform = ropeRef.current.getBadgeTransform();

      // 1. Direct transform write to the physics container
      if (badgePhysicsRef.current) {
        badgePhysicsRef.current.style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${transform.angleDeg}deg)`;
      }

      // 2. Direct SVG attribute write to lanyard straps & clasp
      if (lanyardRef.current) {
        lanyardRef.current.update(
          points,
          anchorRef.current.x,
          anchorRef.current.y,
          transform.stretchRatio,
          transform.angleDeg
        );
      }
    };

    // ResizeObserver cleanly updates anchor on actual container width changes
    const resizeObserver = new ResizeObserver((entries) => {
      if (!isMounted) return;
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0 && Math.abs(w - lastWidthRef.current) > 3) {
          setupRope(w, false);
        }
      }
    });
    resizeObserver.observe(container);

    // Main 60fps/120fps direct compositor render loop
    const render = (time: number) => {
      if (!isMounted || !isVisibleRef.current) return;

      // Update Verlet physics with soft spring grab and fixed 1/60s accumulator
      ropeRef.current.update(
        time,
        isDraggingRef.current,
        dragTargetRef.current
      );

      drawFrame();

      animationId = requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (!animationId && isVisibleRef.current && isMounted) {
        animationId = requestAnimationFrame(render);
      }
    };

    const stopLoop = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = 0;
      }
    };

    // Pause physics loop when offscreen with generous 300px rootMargin (saves CPU & battery).
    // KEEPS physics state; when re-entering, draws one frame immediately BEFORE becoming visible.
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0].isIntersecting;
        if (isIntersecting && !isVisibleRef.current) {
          isVisibleRef.current = true;
          // Synchronize lastTime and draw immediately to guarantee zero ghosting or pop-in
          ropeRef.current.lastTime = performance.now();
          ropeRef.current.wakeUp();
          drawFrame();
          startLoop();
        } else if (!isIntersecting && isVisibleRef.current) {
          isVisibleRef.current = false;
          stopLoop();
        }
      },
      { rootMargin: "300px" }
    );
    intersectionObserver.observe(container);

    // Passive scroll listener: tracking scroll velocity for subtle clamped sway impulse (no DOM reads)
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let lastScrollTime = performance.now();

    const handleScroll = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastScrollTime);
      const currentY = window.scrollY;
      const dy = currentY - lastScrollY;
      const velocity = dy / dt; // px/ms
      lastScrollY = currentY;
      lastScrollTime = now;

      if (isVisibleRef.current && Math.abs(velocity) > 0.08) {
        ropeRef.current.applyScrollSway(velocity);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current) {
        ropeRef.current.lastTime = performance.now();
        ropeRef.current.wakeUp();
        drawFrame();
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
      window.removeEventListener("scroll", handleScroll);
    };
  }, [setupRope]);

  // Pointer event handlers with 3px deadzone and soft spring grab
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    pointerDownTime.current = performance.now();
    hasMovedPastThreshold.current = false;

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

    // Deadzone: ignore pointer movements under 3px at press time
    if (dist < 3) return;

    // Engage drag mode only once movement exceeds 5px threshold
    if (!hasMovedPastThreshold.current && dist >= 5) {
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
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const elapsed = performance.now() - pointerDownTime.current;
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    const dist = Math.hypot(dx, dy);

    // If moved < 5px and released under 300ms: IT IS AN IMMEDIATE FLIP CLICK!
    if (!hasMovedPastThreshold.current && dist < 5 && elapsed < 300) {
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
      className="relative w-full min-h-[96dvh] sm:min-h-[100dvh] pt-0 pb-8 flex flex-col justify-between overflow-x-hidden select-none scroll-mt-24"
    >

      {/* 1. Hero Breathing Radial Glow (Violet to Pink, ~10% opacity, 14s breathe) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[46%] w-[680px] sm:w-[840px] h-[440px] sm:h-[540px] rounded-full -z-10 blur-3xl animate-hero-glow"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.7) 0%, rgba(236, 72, 153, 0.45) 45%, transparent 72%)"
            : "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.45) 0%, rgba(236, 72, 153, 0.3) 45%, transparent 72%)",
        }}
      />

      {/* Physics Canvas & Lanyard Container: Single relative container in document flow holding strap & badge */}
      <div
        ref={containerRef}
        data-hero-lanyard="true"
        className="relative w-full min-h-[660px] sm:min-h-[740px] md:min-h-[800px] lg:min-h-[820px] h-[660px] sm:h-[740px] md:h-[800px] lg:h-[820px] flex items-center justify-center overflow-visible pointer-events-none"
      >
        {/* Dev Telemetry & Physics Debug Overlay (Dev only, toggle with 'D' key) */}
        {process.env.NODE_ENV !== "production" && (
          <BadgeDebugOverlay ropeRef={ropeRef} anchorRef={anchorRef} />
        )}

        {/* Lanyard Fabric Strap with repeated text & silver clasp */}
        <Lanyard ref={lanyardRef} isDark={isDark} />

        {/* Outer Physics & Sway Layer (Direct compositor transform from RAF) */}
        <div
          ref={badgePhysicsRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "50% 0%",
            willChange: "transform",
          }}
          className="z-30 pointer-events-auto"
        >
          {/* The Landscape ID Badge with scale & flip layers */}
          <Badge
            isFlipped={isFlipped}
            onToggleFlip={toggleFlip}
            isDark={isDark}
            isDragging={isDragging}
            isFlipping={isFlipping}
            setIsFlipping={setIsFlipping}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>
      </div>

      {/* Hero Bottom Hint - Positioned safely below the resting badge card */}
      <div className="relative z-20 w-full text-center mt-6 sm:mt-10 pb-6 text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-center">
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
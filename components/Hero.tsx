"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { VerletRope, DEFAULT_PHYSICS_CONFIG } from "@/lib/verlet";
import { Lanyard, LanyardHandle } from "./hero/Lanyard";
import { Badge } from "./hero/Badge";
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

  // Toggle flip with dev-only timer
  const toggleFlip = useCallback((targetState?: boolean) => {
    setIsFlipped((prev) => {
      const next = typeof targetState === "boolean" ? targetState : !prev;
      if (next === prev) return prev;
      if (process.env.NODE_ENV !== "production") {
        try {
          console.time("badge-flip");
        } catch {
          // ignore
        }
      }
      setIsFlipping(true);
      return next;
    });
  }, []);

  // Initialize and handle resize
  const setupRope = useCallback((width: number) => {
    const anchorX = width / 2;
    const anchorY = 44; // Bottom of the top tab notch
    anchorRef.current = { x: anchorX, y: anchorY };

    // Intro drop-in: start rope compressed upwards by ~100px so it drops in with gravity
    ropeRef.current.init(anchorX, anchorY, 100);

    const transform = ropeRef.current.getBadgeTransform();
    if (badgePhysicsRef.current) {
      badgePhysicsRef.current.style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${transform.angleDeg}deg)`;
    }
    if (lanyardRef.current) {
      lanyardRef.current.update(
        ropeRef.current.points,
        anchorX,
        anchorY,
        transform.stretchRatio
      );
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setupRope(rect.width);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    let animationId: number;
    let isVisible = true;

    // Pause physics loop when offscreen or tab hidden
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Main 60fps/120fps direct compositor render loop
    // NO React state updates are dispatched inside render()
    const render = (time: number) => {
      if (!isVisible) {
        animationId = requestAnimationFrame(render);
        return;
      }

      // Update Verlet physics with fixed timestep accumulator (1/60s)
      ropeRef.current.update(
        time,
        isDraggingRef.current,
        dragTargetRef.current,
        true // allow stretching during drag
      );

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
          transform.stretchRatio
        );
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [setupRope]);

  // Pointer event handlers with clean drag-vs-click separation (<5px and <300ms = click)
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
      className="relative w-full min-h-[92dvh] sm:min-h-[96dvh] pt-12 pb-16 flex flex-col justify-between overflow-x-hidden select-none"
    >
      {/* Background Speckles / Subtle Grain */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage: isDark
            ? `radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)`
            : `radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Physics Canvas & Lanyard Container with PERSPECTIVE on the parent wrapper */}
      <div
        ref={containerRef}
        style={{ perspective: "1200px" }}
        className="relative w-full h-[620px] sm:h-[660px] md:h-[700px] flex items-center justify-center overflow-visible"
      >
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

      {/* Hero Bottom Hint */}
      <div className="w-full text-center pt-4 pb-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1.5 pointer-events-none">
        <span>scroll. the badge will survive.</span>
        <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
      </div>
    </section>
  );
}

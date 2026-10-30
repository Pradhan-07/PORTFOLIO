"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { VerletRope, DEFAULT_PHYSICS_CONFIG, VerletPoint } from "@/lib/verlet";
import { Lanyard } from "./hero/Lanyard";
import { Badge } from "./hero/Badge";
import { useTheme } from "../components/ThemeProvider";
import { ChevronDown } from "lucide-react";

export function Hero() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Physics Rope Instance
  const ropeRef = useRef<VerletRope>(new VerletRope(DEFAULT_PHYSICS_CONFIG));

  // Visual state driven by animation loop
  const [ropePoints, setRopePoints] = useState<VerletPoint[]>([]);
  const [badgeState, setBadgeState] = useState({
    x: 0,
    y: 0,
    angleDeg: 0,
    stretchRatio: 1,
  });

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragTargetRef = useRef({ x: 0, y: 0 });
  const startPointerPos = useRef({ x: 0, y: 0 });
  const startPointerTime = useRef(0);

  // 3D Flip state
  const [isFlipped, setIsFlipped] = useState(false);

  // Anchor point (bottom-center of the notch navbar)
  const [anchor, setAnchor] = useState({ x: 0, y: 44 });

  // Initialize and handle resize
  const setupRope = useCallback((width: number) => {
    const anchorX = width / 2;
    const anchorY = 44; // Bottom of the top tab notch
    setAnchor({ x: anchorX, y: anchorY });

    // Intro drop-in: start rope compressed upwards by ~140px so it drops in with gravity
    ropeRef.current.init(anchorX, anchorY, 140);
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

    // Main 60fps render loop
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

      // Extract points and badge transform
      const points = ropeRef.current.points;
      const transform = ropeRef.current.getBadgeTransform();

      setRopePoints([...points]);
      setBadgeState({
        x: transform.x,
        y: transform.y,
        angleDeg: transform.angleDeg,
        stretchRatio: transform.stretchRatio,
      });

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

  // Pointer event handlers for Badge drag & click-to-flip
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    startPointerPos.current = { x: e.clientX, y: e.clientY };
    startPointerTime.current = Date.now();

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dragTargetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      // touch-action none applied only while dragging so page scrolling works on mobile
      containerRef.current.style.touchAction = "none";
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragTargetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      const elapsed = Date.now() - startPointerTime.current;
      const dist = Math.hypot(
        e.clientX - startPointerPos.current.x,
        e.clientY - startPointerPos.current.y
      );

      // Distinguish click from drag: if moved < 6px and released under 320ms, toggle flip!
      if (dist < 6 && elapsed < 320) {
        setIsFlipped((prev) => !prev);
      }
    }

    isDraggingRef.current = false;
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.touchAction = "auto";
    }

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
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

      {/* Physics Canvas & Lanyard Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[580px] sm:h-[620px] md:h-[660px] flex items-center justify-center overflow-visible"
      >
        {/* Lanyard Fabric Strap with repeated text & silver clasp */}
        <Lanyard
          points={ropePoints}
          anchorX={anchor.x}
          anchorY={anchor.y}
          stretchRatio={badgeState.stretchRatio}
          isDark={isDark}
        />

        {/* The Landscape ID Badge (Front & Back) */}
        {badgeState.x > 0 && (
          <Badge
            x={badgeState.x}
            y={badgeState.y}
            angleDeg={badgeState.angleDeg}
            isDragging={isDragging}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            isFlipped={isFlipped}
            onToggleFlip={() => setIsFlipped((prev) => !prev)}
            isDark={isDark}
          />
        )}
      </div>

      {/* Hero Bottom Hint */}
      <div className="w-full text-center pt-4 pb-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1.5 pointer-events-none">
        <span>scroll. the badge will survive.</span>
        <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
      </div>
    </section>
  );
}

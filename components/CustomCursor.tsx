"use client";

import React, { useEffect, useRef, useSyncExternalStore } from "react";

function subscribePointer(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getPointerSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function getPointerServerSnapshot() {
  return false;
}

/**
 * REBUILT CUSTOM CURSOR
 * 1. Single 8px dot element directly translated on pointermove via translate3d (no lerp, no spring, zero lag).
 * 2. mix-blend-mode: difference with white dot for perfect monochrome contrast across both themes.
 * 3. Expands to 28px translucent circle over links, buttons, and theme toggle.
 * 4. Scales down slightly on pointerdown.
 * 5. Disables custom cursor over text inputs to let native text caret show.
 * 6. Zero text labels, zero sparks, zero green accents.
 */
export function CustomCursor() {
  const isFinePointer = useSyncExternalStore(
    subscribePointer,
    getPointerSnapshot,
    getPointerServerSnapshot
  );

  const cursorPosRef = useRef({ x: -100, y: -100 });
  const isVisibleRef = useRef(false);
  const isHoveringInteractiveRef = useRef(false);
  const isPressedRef = useRef(false);
  const isTextTargetRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const visualRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFinePointer) return;

    document.body.classList.add("has-custom-cursor");

    const container = containerRef.current;
    const visual = visualRef.current;
    if (!container || !visual) return;

    // Direct rAF-coalesced render
    const updateCursorPosition = () => {
      rafIdRef.current = null;
      if (!container) return;
      const { x, y } = cursorPosRef.current;
      container.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const schedulePositionUpdate = () => {
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(updateCursorPosition);
      }
    };

    const updateVisualState = () => {
      if (!visual || !container) return;

      if (!isVisibleRef.current || isTextTargetRef.current) {
        container.style.opacity = "0";
        return;
      }

      container.style.opacity = "1";

      const isInteractive = isHoveringInteractiveRef.current;
      const isPressed = isPressedRef.current;

      if (isInteractive) {
        // Expanded 28px state with translucent fill and 1px border
        visual.style.width = "28px";
        visual.style.height = "28px";
        visual.style.backgroundColor = "rgba(255, 255, 255, 0.18)";
        visual.style.border = "1px solid rgba(255, 255, 255, 0.9)";
        visual.style.transform = isPressed
          ? "translate(-50%, -50%) scale(0.88)"
          : "translate(-50%, -50%) scale(1)";
      } else {
        // Default 8px solid white dot
        visual.style.width = "8px";
        visual.style.height = "8px";
        visual.style.backgroundColor = "#ffffff";
        visual.style.border = "none";
        visual.style.transform = isPressed
          ? "translate(-50%, -50%) scale(0.75)"
          : "translate(-50%, -50%) scale(1)";
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      cursorPosRef.current.x = e.clientX;
      cursorPosRef.current.y = e.clientY;

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        // Position immediately before showing to eliminate 0,0 jump
        container.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      schedulePositionUpdate();

      // Check hovered element
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput = Boolean(
        target.closest("input, textarea, select, [contenteditable='true']")
      );
      const isInteractive = Boolean(
        target.closest(
          "a, button, [role='button'], summary, input[type='submit'], [data-cursor='link'], [data-cursor='nav']"
        )
      );

      let changed = false;
      if (isTextTargetRef.current !== isInput) {
        isTextTargetRef.current = isInput;
        changed = true;
      }
      if (isHoveringInteractiveRef.current !== isInteractive) {
        isHoveringInteractiveRef.current = isInteractive;
        changed = true;
      }

      if (changed) {
        updateVisualState();
      }
    };

    const handlePointerDown = () => {
      isPressedRef.current = true;
      updateVisualState();
    };

    const handlePointerUp = () => {
      isPressedRef.current = false;
      updateVisualState();
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      updateVisualState();
    };

    const handleMouseEnter = () => {
      isVisibleRef.current = true;
      updateVisualState();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.body.classList.remove("has-custom-cursor");
    };
  }, [isFinePointer]);

  if (!isFinePointer) return null;

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform mix-blend-difference"
      style={{
        opacity: 0,
        transform: "translate3d(-100px, -100px, 0)",
        transition: "opacity 180ms ease-out",
      }}
      aria-hidden="true"
    >
      <div
        ref={visualRef}
        className="rounded-full pointer-events-none transition-[width,height,transform,background-color,border-color] duration-200 ease-out"
        style={{
          width: "8px",
          height: "8px",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#ffffff",
        }}
      />
    </div>
  );
}
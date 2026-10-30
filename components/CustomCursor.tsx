"use client";

import React, { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * CONFIG FLAG:
 * Set CURSOR_ACCENT = true to make neon lime (#b6ff00) the default accent cursor everywhere.
 * By default (false), the cursor uses monochrome (black on light theme, white on dark theme),
 * and switches to neon lime #b6ff00 over the footer ember section.
 */
export const CURSOR_ACCENT = false;

type CursorMode =
  | "default"
  | "link"
  | "drag"
  | "flip"
  | "nav"
  | "ember"
  | "text";

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

export function CustomCursor() {
  const isFinePointer = useSyncExternalStore(
    subscribePointer,
    getPointerSnapshot,
    getPointerServerSnapshot
  );

  // Position and state stored in refs for zero React re-renders in rAF loop
  const targetPos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const isVisible = useRef(false);
  const isPressed = useRef(false);
  const hasMoved = useRef(false);
  const currentMode = useRef<CursorMode>("default");

  // DOM element refs
  const cursorRootRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringWrapperRef = useRef<HTMLDivElement | null>(null);
  const ringVisualRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const sparksRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isFinePointer) return;

    document.body.classList.add("has-custom-cursor");

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Detect target interactive state via event delegation
    function evaluateTarget(el: HTMLElement | null) {
      if (!el) {
        currentMode.current = "default";
        updateVisualState();
        return;
      }

      // Check text inputs first
      if (
        el.closest(
          "input, textarea, select, [contenteditable='true']"
        )
      ) {
        currentMode.current = "text";
        updateVisualState();
        return;
      }

      // Explicit data-cursor attributes
      const cursorAttrEl = el.closest("[data-cursor]");
      if (cursorAttrEl) {
        const attr = cursorAttrEl.getAttribute("data-cursor") as CursorMode;
        if (
          ["drag", "flip", "nav", "ember", "link", "text"].includes(attr)
        ) {
          currentMode.current = attr;
          updateVisualState();
          return;
        }
      }

      // Inside footer
      if (el.closest("#footer")) {
        currentMode.current = "ember";
        updateVisualState();
        return;
      }

      // Links and buttons
      if (el.closest("a, button, [role='button']")) {
        currentMode.current = "link";
        updateVisualState();
        return;
      }

      currentMode.current = "default";
      updateVisualState();
    }

    // Update CSS classes / styles based on mode and pressed state
    function updateVisualState() {
      const mode = currentMode.current;
      const pressed = isPressed.current;
      const ringVisual = ringVisualRef.current;
      const label = labelRef.current;
      const dot = dotRef.current;

      if (!ringVisual || !label || !dot) return;

      // Handle text input mode: hide custom cursor to show native text cursor
      if (mode === "text") {
        if (cursorRootRef.current) cursorRootRef.current.style.opacity = "0";
        return;
      } else if (isVisible.current) {
        if (cursorRootRef.current) cursorRootRef.current.style.opacity = "1";
      }

      // Base color logic
      const isEmber = mode === "ember" || CURSOR_ACCENT;
      const isDark = document.documentElement.classList.contains("dark");

      let mainColor = isDark ? "#ffffff" : "#000000";
      let borderColor = isDark
        ? "rgba(255, 255, 255, 0.45)"
        : "rgba(0, 0, 0, 0.45)";
      let fillColor = "transparent";
      let glow = "none";

      if (isEmber) {
        mainColor = "#b6ff00";
        borderColor = "#b6ff00";
        fillColor = "rgba(182, 255, 0, 0.1)";
        glow = "0 0 12px rgba(182, 255, 0, 0.45)";
      }

      // Dot styling
      dot.style.backgroundColor = mainColor;
      dot.style.boxShadow = isEmber ? "0 0 8px rgba(182, 255, 0, 0.8)" : "none";

      // Scale & label calculations
      let ringScale = 1.0;
      let dotScale = 1.0;
      let labelText = "";
      let showLabel = false;

      switch (mode) {
        case "link":
          ringScale = pressed ? 1.3 : 1.6;
          dotScale = 0.65;
          fillColor = isEmber
            ? "rgba(182, 255, 0, 0.18)"
            : isDark
            ? "rgba(255, 255, 255, 0.12)"
            : "rgba(0, 0, 0, 0.12)";
          break;

        case "nav":
          ringScale = pressed ? 1.15 : 1.4;
          dotScale = 0.8;
          fillColor = isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.08)";
          break;

        case "drag":
          if (pressed) {
            ringScale = 0.85;
            labelText = "RELEASE";
          } else {
            ringScale = 1.88; // 64px ring
            labelText = "DRAG";
          }
          showLabel = true;
          dotScale = 0; // Hide dot so label is completely clear
          fillColor = isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.08)";
          break;

        case "flip":
          if (pressed) {
            ringScale = 0.85;
            labelText = "RELEASE";
          } else {
            ringScale = 1.88; // 64px ring
            labelText = "FLIP";
          }
          showLabel = true;
          dotScale = 0; // Hide dot so label is completely clear
          fillColor = isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.08)";
          break;

        case "ember":
          ringScale = pressed ? 1.0 : 1.25;
          dotScale = 1.25;
          break;

        case "default":
        default:
          ringScale = pressed ? 0.8 : 1.0;
          dotScale = 1.0;
          break;
      }

      // Apply styles
      ringVisual.style.borderColor = borderColor;
      ringVisual.style.backgroundColor = fillColor;
      ringVisual.style.boxShadow = glow;
      ringVisual.style.transform = `scale(${ringScale})`;

      dot.style.transform = `scale(${dotScale})`;

      label.textContent = labelText;
      label.style.color = mainColor;
      label.style.opacity = showLabel ? "1" : "0";
    }

    // Click sparks emitter (5 to 6 spark dots burst outward and fade)
    function emitSparks(clickX: number, clickY: number) {
      if (prefersReducedMotion) return;

      const isEmber = currentMode.current === "ember" || CURSOR_ACCENT;
      const isDark = document.documentElement.classList.contains("dark");
      const sparkColor = isEmber ? "#b6ff00" : isDark ? "#ffffff" : "#000000";

      sparksRef.current.forEach((sparkEl, index) => {
        if (!sparkEl) return;
        const angle = (index / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const dist = 18 + Math.random() * 16;
        const endX = Math.cos(angle) * dist;
        const endY = Math.sin(angle) * dist;

        sparkEl.style.backgroundColor = sparkColor;
        sparkEl.style.left = `${clickX - 1.5}px`;
        sparkEl.style.top = `${clickY - 1.5}px`;

        sparkEl.animate(
          [
            {
              transform: "translate3d(0, 0, 0) scale(1)",
              opacity: 0.9,
            },
            {
              transform: `translate3d(${endX}px, ${endY}px, 0) scale(0.2)`,
              opacity: 0,
            },
          ],
          {
            duration: 300,
            easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
            fill: "forwards",
          }
        );
      });
    }

    // Pointer move listener
    const handlePointerMove = (e: PointerEvent) => {
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;

      if (!hasMoved.current) {
        hasMoved.current = true;
        ringPos.current.x = e.clientX;
        ringPos.current.y = e.clientY;
      }

      if (!isVisible.current) {
        isVisible.current = true;
        if (cursorRootRef.current) cursorRootRef.current.style.opacity = "1";
      }

      evaluateTarget(e.target as HTMLElement);
    };

    // Pointer down listener
    const handlePointerDown = (e: PointerEvent) => {
      isPressed.current = true;
      updateVisualState();

      if (currentMode.current !== "text") {
        emitSparks(e.clientX, e.clientY);
      }
    };

    // Pointer up listener
    const handlePointerUp = () => {
      isPressed.current = false;
      updateVisualState();
    };

    // Window blur & mouseleave listeners
    const handleMouseLeave = () => {
      isVisible.current = false;
      if (cursorRootRef.current) cursorRootRef.current.style.opacity = "0";
    };

    const handleMouseEnter = () => {
      isVisible.current = true;
      if (cursorRootRef.current && currentMode.current !== "text") {
        cursorRootRef.current.style.opacity = "1";
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Continuous rAF Loop for ring trailing physics (lerp: 0.15)
    let animationId: number;

    const loop = () => {
      animationId = requestAnimationFrame(loop);

      if (!hasMoved.current) return;

      const tx = targetPos.current.x;
      const ty = targetPos.current.y;

      // Dot follows pointer exactly (0 lag)
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${tx - 4}px, ${ty - 4}px, 0)`;
      }

      // Ring follows with smooth lag (lerp: 0.15) or instantly on reduced motion
      if (prefersReducedMotion) {
        ringPos.current.x = tx;
        ringPos.current.y = ty;
      } else {
        ringPos.current.x += (tx - ringPos.current.x) * 0.15;
        ringPos.current.y += (ty - ringPos.current.y) * 0.15;
      }

      if (ringWrapperRef.current) {
        ringWrapperRef.current.style.transform = `translate3d(${ringPos.current.x - 17}px, ${ringPos.current.y - 17}px, 0)`;
      }
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
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
      ref={cursorRootRef}
      className="fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-200"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      {/* 1. Exactly-following 8px Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none will-change-transform transition-[background-color,box-shadow,transform] duration-150"
      />

      {/* 2. Smooth-lagging 34px Ring */}
      <div
        ref={ringWrapperRef}
        className="fixed top-0 left-0 w-[34px] h-[34px] pointer-events-none will-change-transform flex items-center justify-center"
      >
        <div
          ref={ringVisualRef}
          className="w-full h-full rounded-full border border-neutral-400 flex items-center justify-center transition-all duration-200 ease-out"
        >
          {/* Label inside ring for drag / flip states */}
          <span
            ref={labelRef}
            className="font-mono text-[8px] font-bold tracking-widest uppercase transition-opacity duration-150 select-none pointer-events-none"
          />
        </div>
      </div>

      {/* 3. Click spark dot pool (6 items) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            sparksRef.current[i] = el;
          }}
          className="fixed w-[3px] h-[3px] rounded-full pointer-events-none opacity-0"
        />
      ))}
    </div>
  );
}

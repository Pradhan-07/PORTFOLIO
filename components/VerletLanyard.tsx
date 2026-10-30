"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * ============================================================================
 * VERLET INTEGRATION ROPE & ID BADGE SIMULATION (Canvas 2D)
 * ============================================================================
 * 
 * HOW VERLET INTEGRATION WORKS FOR BEGINNERS:
 * -------------------------------------------
 * Standard Newtonian physics uses velocity: position = position + velocity * dt.
 * In Verlet integration, we don't store velocity as a separate variable!
 * Instead, velocity is implicitly calculated from the difference between the
 * CURRENT position and the PREVIOUS position:
 * 
 *    velocity = current_position - previous_position
 *    new_position = current_position + velocity * friction + acceleration (gravity)
 *    previous_position = current_position
 * 
 * Why use Verlet for ropes/cloth?
 * Because it makes "distance constraints" trivial and physically stable!
 * If point A and point B are connected by a rope segment of length L, we simply
 * calculate the distance between them, and push both points toward each other so
 * the distance equals L. Repeating this constraint check a few times creates a
 * stiff, realistic rope that never blows up or stretches out of control.
 * ============================================================================
 */

interface Point {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  isPinned: boolean;
}

interface Stick {
  p0: Point;
  p1: Point;
  length: number;
}

export function VerletLanyard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Card flip state (0 = front, 1 = back)
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAngleRef = useRef(0); // in radians
  const targetFlipAngleRef = useRef(0);

  // Physics points and sticks
  const pointsRef = useRef<Point[]>([]);
  const sticksRef = useRef<Stick[]>([]);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const dragPointIndexRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Badge dimensions
  const cardWidth = 170;
  const cardHeight = 250;

  // Initialize rope physics
  const initPhysics = useCallback((width: number) => {
    // Anchor the lanyard near top center-right
    const anchorX = Math.min(width - 120, Math.max(160, width * 0.72));
    const anchorY = 0; // top edge

    const segmentCount = 6;
    const segmentLength = 26;

    const points: Point[] = [];
    const sticks: Stick[] = [];

    // Create rope points hanging vertically
    for (let i = 0; i <= segmentCount; i++) {
      const p: Point = {
        x: anchorX + (Math.sin(i * 0.4) * 8),
        y: anchorY + i * segmentLength,
        oldX: anchorX,
        oldY: anchorY + i * segmentLength,
        isPinned: i === 0, // Pin the top to the ceiling
      };
      points.push(p);
    }

    // Connect adjacent points with sticks of fixed rest length
    for (let i = 0; i < points.length - 1; i++) {
      sticks.push({
        p0: points[i],
        p1: points[i + 1],
        length: segmentLength,
      });
    }

    pointsRef.current = points;
    sticksRef.current = sticks;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let dpr = window.devicePixelRatio || 1;

    // Handle high-DPI retina displays
    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      initPhysics(rect.width);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Physics constants
    const gravity = 0.48; // Gravity pulling downward
    const friction = 0.985; // Air drag/damping to eventually settle
    const constraintIterations = 7; // Number of relaxation passes

    // Main render and physics loop
    const render = () => {
      const points = pointsRef.current;
      const sticks = sticksRef.current;

      // 1. UPDATE VERLET POINTS (Physics Step)
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.isPinned) continue;

        // If currently dragging this point with mouse/touch, clamp to cursor
        if (isDraggingRef.current && dragPointIndexRef.current === i) {
          p.x = mouseRef.current.x;
          p.y = mouseRef.current.y;
          p.oldX = mouseRef.current.x;
          p.oldY = mouseRef.current.y;
          continue;
        }

        // Implicit velocity from Verlet integration
        const vx = (p.x - p.oldX) * friction;
        const vy = (p.y - p.oldY) * friction + gravity;

        p.oldX = p.x;
        p.oldY = p.y;

        p.x += vx;
        p.y += vy;
      }

      // 2. ENFORCE DISTANCE CONSTRAINTS (Relaxation loop)
      for (let iter = 0; iter < constraintIterations; iter++) {
        for (let i = 0; i < sticks.length; i++) {
          const stick = sticks[i];
          const dx = stick.p1.x - stick.p0.x;
          const dy = stick.p1.y - stick.p0.y;
          const distance = Math.hypot(dx, dy) || 0.0001;
          const difference = (stick.length - distance) / distance;

          // Push both points towards each other by half the error
          const offsetX = dx * difference * 0.5;
          const offsetY = dy * difference * 0.5;

          if (!stick.p0.isPinned) {
            stick.p0.x -= offsetX;
            stick.p0.y -= offsetY;
          }
          if (!stick.p1.isPinned) {
            stick.p1.x += offsetX;
            stick.p1.y += offsetY;
          }
        }
      }

      // 3. SMOOTH FLIP ANGLE INTERPOLATION
      targetFlipAngleRef.current = isFlipped ? Math.PI : 0;
      flipAngleRef.current += (targetFlipAngleRef.current - flipAngleRef.current) * 0.12;

      // 4. DRAWING ON CANVAS 2D
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      // Check current theme from html element
      const isDark = document.documentElement.classList.contains("dark");

      if (points.length >= 2) {
        // DRAW LANYARD RIBBON (Double strap)
        ctx.beginPath();
        ctx.moveTo(points[0].x - 3, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x - 2, points[i].y);
        }
        for (let i = points.length - 1; i >= 0; i--) {
          ctx.lineTo(points[i].x + 2, points[i].y);
        }
        ctx.closePath();

        // Monochromatic lanyard ribbon gradient
        const ribbonGrad = ctx.createLinearGradient(
          points[0].x,
          points[0].y,
          points[points.length - 1].x,
          points[points.length - 1].y
        );
        if (isDark) {
          ribbonGrad.addColorStop(0, "#262626");
          ribbonGrad.addColorStop(0.5, "#404040");
          ribbonGrad.addColorStop(1, "#171717");
        } else {
          ribbonGrad.addColorStop(0, "#d4d4d4");
          ribbonGrad.addColorStop(0.5, "#a3a3a3");
          ribbonGrad.addColorStop(1, "#737373");
        }
        ctx.fillStyle = ribbonGrad;
        ctx.fill();

        ctx.strokeStyle = isDark ? "#525252" : "#999999";
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // DRAW BADGE CLIP & CLASP
        const lastP = points[points.length - 1];
        const prevP = points[points.length - 2];
        const angle = Math.atan2(lastP.y - prevP.y, lastP.x - prevP.x) - Math.PI / 2;

        ctx.save();
        ctx.translate(lastP.x, lastP.y);
        ctx.rotate(angle);

        // Metal clasp ring
        ctx.fillStyle = isDark ? "#888888" : "#444444";
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Metal swivel connector
        ctx.fillStyle = isDark ? "#333333" : "#cccccc";
        ctx.fillRect(-3, 2, 6, 9);
        ctx.strokeStyle = isDark ? "#666666" : "#888888";
        ctx.lineWidth = 1;
        ctx.strokeRect(-3, 2, 6, 9);

        // 5. DRAW ID BADGE CARD (Supports 3D Card Flip on X-axis via scaleX)
        const scaleX = Math.cos(flipAngleRef.current);
        const isBackFacing = Math.abs(flipAngleRef.current) > Math.PI / 2;

        ctx.translate(0, 14);
        ctx.scale(scaleX, 1);

        // Outer badge drop shadow
        ctx.shadowColor = isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.18)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 10;

        // Card body rounded rectangle
        const x = -cardWidth / 2;
        const y = 0;
        const radius = 10;

        ctx.beginPath();
        ctx.roundRect(x, y, cardWidth, cardHeight, radius);

        // Card background
        if (isDark) {
          ctx.fillStyle = "#121212";
        } else {
          ctx.fillStyle = "#ffffff";
        }
        ctx.fill();

        // Reset shadow for crisp inner elements
        ctx.shadowColor = "transparent";

        // Card border (crisp 1px monochrome)
        ctx.strokeStyle = isDark ? "#2a2a2a" : "#e0e0e0";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Clip slot cutout at top of card
        ctx.fillStyle = isDark ? "#0a0a0a" : "#f0f0f0";
        ctx.beginPath();
        ctx.roundRect(-14, 6, 28, 5, 2.5);
        ctx.fill();
        ctx.strokeStyle = isDark ? "#333333" : "#d0d0d0";
        ctx.stroke();

        if (!isBackFacing) {
          // ================= FRONT SIDE =================
          // Subtle top header banner
          ctx.fillStyle = isDark ? "#1a1a1a" : "#f5f5f5";
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 16, cardWidth - 2, 34, [0, 0, 0, 0]);
          ctx.fill();

          // Header Text: University
          ctx.font = "600 8.5px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#a3a3a3" : "#525252";
          ctx.textAlign = "center";
          ctx.fillText("VIT-AP UNIVERSITY", 0, y + 29);

          ctx.font = "500 7px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#737373" : "#737373";
          ctx.fillText("SCHOOL OF COMPUTER SCIENCE", 0, y + 41);

          // Student Photo Box / Monogram Badge
          const photoY = y + 58;
          ctx.fillStyle = isDark ? "#0c0c0c" : "#fafafa";
          ctx.beginPath();
          ctx.roundRect(-30, photoY, 60, 68, 6);
          ctx.fill();
          ctx.strokeStyle = isDark ? "#282828" : "#e5e5e5";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Monogram inside photo box
          ctx.font = "700 20px var(--font-geist-sans), sans-serif";
          ctx.fillStyle = isDark ? "#ededed" : "#171717";
          ctx.textAlign = "center";
          ctx.fillText("KP", 0, photoY + 38);

          // Mini status tag under photo
          ctx.font = "600 6.5px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#888888" : "#666666";
          ctx.fillText("STUDENT // 2ND YR", 0, photoY + 54);

          // Student Name
          ctx.font = "700 11px var(--font-geist-sans), sans-serif";
          ctx.fillStyle = isDark ? "#ffffff" : "#0a0a0a";
          ctx.fillText("KARAN KUMAR PRADHAN", 0, y + 144);

          // Program Subtitle
          ctx.font = "500 8px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#999999" : "#666666";
          ctx.fillText("B.Tech CSE · 2025–29", 0, y + 158);

          // Focus fields
          ctx.font = "400 7px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#777777" : "#888888";
          ctx.fillText("DSA (C++) · WEB · IOT", 0, y + 172);

          // Barcode Graphic at bottom
          const barcodeY = y + 188;
          ctx.fillStyle = isDark ? "#e0e0e0" : "#222222";
          const barWidths = [2, 1, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2];
          let barX = -cardWidth / 2 + 22;
          for (let b = 0; b < barWidths.length; b++) {
            const bw = barWidths[b];
            ctx.fillRect(barX, barcodeY, bw, 20);
            barX += bw + 3.5;
          }

          // ID string below barcode
          ctx.font = "500 6.5px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#666666" : "#999999";
          ctx.fillText("ID: 25BCE-VITAP // VERIFIED", 0, y + 219);

          // Subtle hint to flip
          ctx.font = "italics 6.5px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#555555" : "#aaaaaa";
          ctx.fillText("● click / tap to flip ●", 0, y + 236);
        } else {
          // ================= BACK SIDE =================
          // Top magnetic strip
          ctx.fillStyle = isDark ? "#222222" : "#1a1a1a";
          ctx.fillRect(x + 1, y + 18, cardWidth - 2, 24);

          // QR Code Graphic in center
          const qrY = y + 54;
          const qrSize = 72;
          ctx.fillStyle = isDark ? "#181818" : "#f4f4f4";
          ctx.beginPath();
          ctx.roundRect(-qrSize / 2, qrY, qrSize, qrSize, 6);
          ctx.fill();
          ctx.strokeStyle = isDark ? "#333333" : "#dddddd";
          ctx.stroke();

          // Draw QR pattern modules (monochrome pixel grid)
          ctx.fillStyle = isDark ? "#e5e5e5" : "#171717";
          const gridSize = 7;
          const cellSize = qrSize / gridSize;
          const qrMatrix = [
            [1, 1, 1, 0, 1, 1, 1],
            [1, 0, 1, 0, 1, 0, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [0, 1, 0, 1, 0, 1, 0],
            [1, 1, 1, 0, 1, 0, 1],
            [1, 0, 0, 1, 0, 1, 1],
            [1, 1, 1, 0, 1, 1, 1],
          ];
          for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
              if (qrMatrix[r][c] === 1) {
                ctx.fillRect(
                  -qrSize / 2 + c * cellSize + 1.5,
                  qrY + r * cellSize + 1.5,
                  cellSize - 3,
                  cellSize - 3
                );
              }
            }
          }

          // Handles metadata
          ctx.font = "600 8px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#ededed" : "#0a0a0a";
          ctx.textAlign = "center";
          ctx.fillText("github.com/Pradhan-07", 0, y + 144);

          ctx.font = "500 7px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#888888" : "#666666";
          ctx.fillText("leetcode.com/u/pradhan_07", 0, y + 158);
          ctx.fillText("linkedin / in / karan-kumar-pradhan", 0, y + 170);

          // Verification Stamp
          ctx.fillStyle = isDark ? "#161616" : "#f0f0f0";
          ctx.beginPath();
          ctx.roundRect(-55, y + 184, 110, 22, 4);
          ctx.fill();
          ctx.strokeStyle = isDark ? "#282828" : "#e0e0e0";
          ctx.stroke();

          ctx.font = "600 7px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#aaaaaa" : "#444444";
          ctx.fillText("AUTHENTIC BADGE · VIT-AP", 0, y + 198);

          // Hint to flip back
          ctx.font = "italics 6.5px var(--font-geist-mono), monospace";
          ctx.fillStyle = isDark ? "#555555" : "#aaaaaa";
          ctx.fillText("● click to flip back ●", 0, y + 234);
        }

        ctx.restore(); // restore badge translate & rotate
      }

      ctx.restore(); // restore dpr scale

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [initPhysics, isFlipped]);

  // Pointer & Touch Events for Dragging and Clicking
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    if ("touches" in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ("clientX" in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDragTimeRef = useRef(0);
  const startDragPosRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    mouseRef.current = coords;
    startDragPosRef.current = coords;
    startDragTimeRef.current = Date.now();

    const points = pointsRef.current;
    if (points.length === 0) return;

    // Last point holds the ID badge card
    const badgePoint = points[points.length - 1];
    // Check if pointer is near badge (radius of 140px)
    const distToBadge = Math.hypot(coords.x - badgePoint.x, coords.y - (badgePoint.y + 110));

    if (distToBadge < 130) {
      isDraggingRef.current = true;
      dragPointIndexRef.current = points.length - 1;
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const coords = getCoordinates(e);
    mouseRef.current = coords;
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      const elapsed = Date.now() - startDragTimeRef.current;
      const movedDist = Math.hypot(
        mouseRef.current.x - startDragPosRef.current.x,
        mouseRef.current.y - startDragPosRef.current.y
      );

      // If released quickly without moving much, treat as a flip click!
      if (elapsed < 280 && movedDist < 12) {
        setIsFlipped((prev) => !prev);
      }
    }
    isDraggingRef.current = false;
    dragPointIndexRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380px] sm:h-[440px] md:h-[480px] flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        title="Interactive ID badge with Verlet rope physics. Click to flip, drag to swing!"
      />

      {/* Floating subtle guide badge for the user */}
      <div className="absolute top-2 right-4 pointer-events-none hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800/60 border border-neutral-300 dark:border-neutral-700/60 backdrop-blur-sm text-[10px] font-mono text-neutral-600 dark:text-neutral-400">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse" />
        <span>verlet rope · drag & flip</span>
      </div>
    </div>
  );
}

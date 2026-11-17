"use client";

import React, { useEffect, useState, useRef } from "react";
import { VerletRope } from "@/lib/verlet";

interface BadgeDebugOverlayProps {
  ropeRef: React.RefObject<VerletRope>;
  anchorRef: React.RefObject<{ x: number; y: number }>;
}

export function BadgeDebugOverlay({ ropeRef, anchorRef }: BadgeDebugOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isProd = process.env.NODE_ENV === "production";

  // Listen for 'D' key to toggle debug overlay (ignoring inputs/textareas)
  useEffect(() => {
    if (isProd) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.key === "d" || e.key === "D") {
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProd]);

  // Render loop when open
  useEffect(() => {
    if (isProd || !isOpen) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = containerRef.current?.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth || 800;
      canvas.height = parent.clientHeight || 700;
    }

    const render = () => {
      const rope = ropeRef.current;
      const anchor = anchorRef.current;
      if (!rope || !anchor) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const points = rope.points;
      const transform = rope.getBadgeTransform();
      const segLengths = rope.getSegmentLengths();
      const isAsleep = rope.isSleeping;

      // 1. Draw the actual sticks (V-strap topology, not index order)
      ctx.strokeStyle = "rgba(0, 240, 255, 0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const stick of rope.sticks) {
        const a = points[stick.p0Index];
        const b = points[stick.p1Index];
        if (!a || !b) continue;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();

      // 2. Draw rope points
      for (let i = 0; i < points.length; i++) {
        ctx.fillStyle =
          points[i].isPinned ? "#ff3366" : i === points.length - 1 ? "#33ff66" : "#00f0ff";
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, points[i].isPinned || i === points.length - 1 ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw Anchor Marker
      ctx.strokeStyle = "#ff3366";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, 8, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Draw Clip Pivot Target
      const last = points[points.length - 1];
      if (last) {
        ctx.strokeStyle = "#33ff66";
        ctx.beginPath();
        ctx.arc(last.x, last.y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 5. Draw HUD Overlay Info Box
      const hudX = 16;
      const hudY = 16;
      const hudW = 260;
      const hudH = 155;

      ctx.fillStyle = "rgba(10, 10, 15, 0.88)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.fillRect(hudX, hudY, hudW, hudH);
      ctx.strokeRect(hudX, hudY, hudW, hudH);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px monospace";
      ctx.fillText("LANYARD VERLET TELEMETRY [D]", hudX + 12, hudY + 20);

      ctx.font = "10px monospace";
      ctx.fillStyle = "#a0a0a5";

      ctx.fillText(`FPS: ${rope.fps.toFixed(1)} (target 60)`, hudX + 12, hudY + 38);
      ctx.fillText(
        `Angle: ${transform.angleDeg.toFixed(2)}° (rope segment 9-10)`,
        hudX + 12,
        hudY + 54
      );
      ctx.fillText(`Stretch Ratio: ${transform.stretchRatio.toFixed(3)}x`, hudX + 12, hudY + 70);
      if (last) {
        ctx.fillText(
          `Clip Pivot: (${last.x.toFixed(1)}, ${last.y.toFixed(1)})`,
          hudX + 12,
          hudY + 86
        );
      }

      const minSeg = segLengths.length ? Math.min(...segLengths).toFixed(1) : "0";
      const maxSeg = segLengths.length ? Math.max(...segLengths).toFixed(1) : "0";
      ctx.fillText(`Sticks: ${segLengths.length} | Len: ${minSeg}-${maxSeg}px`, hudX + 12, hudY + 102);

      ctx.fillStyle = isAsleep ? "#22c55e" : "#eab308";
      ctx.fillText(`Solver State: ${isAsleep ? "ASLEEP (0% CPU)" : "ACTIVE / SOLVING"}`, hudX + 12, hudY + 120);

      ctx.fillStyle = "#6b7280";
      ctx.fillText(`Badge pose: midpoint of points 9-10`, hudX + 12, hudY + 138);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isProd, isOpen, ropeRef, anchorRef]);

  if (isProd || !isOpen) {
    return null;
  }

  return (
    <div ref={containerRef} className="absolute inset-0 z-50 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      <div className="absolute top-2 right-2 pointer-events-auto">
        <button
          onClick={() => setIsOpen(false)}
          className="px-2 py-1 rounded text-[10px] font-mono bg-red-950/80 text-red-300 border border-red-700 hover:bg-red-900"
        >
          CLOSE [D]
        </button>
      </div>
    </div>
  );
}

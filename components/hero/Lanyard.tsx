"use client";

import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { VerletPoint } from "@/lib/verlet";
import {
  STRAP_PALETTES,
  smoothPoints,
  drawRibbon,
  drawClasp,
  drawRingAndTab,
} from "@/lib/strapRenderer";

export interface LanyardDrawOptions {
  /** Current flip angle in radians (drives strap twist). */
  flipRad: number;
  /** Base twist rate: 2.2 × rope angle + 0.1 × badge x-velocity (reference formula). */
  baseTwist: number;
  isDark: boolean;
  /** Performance timestamp for the idle twist shimmer. */
  time: number;
}

export interface LanyardHandle {
  update: (points: VerletPoint[], opts: LanyardDrawOptions) => void;
}

interface LanyardProps {
  isDark: boolean;
}

declare global {
  interface Window {
    __LANYARD_TELEMETRY__?: {
      strapTopX: number;
      strapTopY: number;
      strapBottomX: number;
      strapBottomY: number;
    };
    __LANYARD_GLYPH_INTERVALS__?: { char: string; start: number; end: number }[];
  }
}

const PRINT_TEXT = "KARAN KUMAR PRADHAN · CSE @ VIT-AP · ";

/**
 * Canvas lanyard: two straps from the top anchors converge into a
 * clasp, then a narrow connector (ring + tab) runs to the badge.
 * Rendered as twisting ribbons, beebombshell-style — see strapRenderer.
 */
export const Lanyard = forwardRef<LanyardHandle, LanyardProps>(function Lanyard(
  _props: LanyardProps,
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useImperativeHandle(ref, () => ({
    update(points, opts) {
      const canvas = canvasRef.current;
      if (!canvas || points.length < 11) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const palette = opts.isDark ? STRAP_PALETTES.dark : STRAP_PALETTES.light;
      const t = opts.time;

      const left = smoothPoints([points[0], points[1], points[2], points[3]], 8);
      const right = smoothPoints([points[4], points[5], points[6], points[3]], 8);
      const connector = smoothPoints([points[3], points[7], points[8]], 8);

      drawRibbon(ctx, left, {
        width: 20,
        palette,
        printText: PRINT_TEXT,
        printPhase: 40,
        onPrintGlyphs: (intervals) => {
          if (typeof window !== "undefined") {
            window.__LANYARD_GLYPH_INTERVALS__ = intervals;
          }
        },
        twistAt: (u) =>
          (opts.baseTwist + 0.5 * opts.flipRad) * u + 0.3 * Math.sin(t / 900 + 4 * u),
      });
      drawRibbon(ctx, right, {
        width: 20,
        palette,
        printText: PRINT_TEXT,
        printPhase: 92,
        twistAt: (u) =>
          (opts.baseTwist + 0.5 * opts.flipRad) * u +
          0.3 * Math.sin(t / 900 + 4 * u + 2),
      });
      drawRibbon(ctx, connector, {
        width: 13,
        palette,
        twistAt: (u) => (opts.baseTwist + opts.flipRad) * u,
      });

      drawClasp(ctx, points[3], points[7]);
      drawRingAndTab(ctx, points[8], points[9], palette);

      if (typeof window !== "undefined") {
        window.__LANYARD_TELEMETRY__ = {
          strapTopX: (points[0].x + points[4].x) / 2,
          strapTopY: points[0].y,
          strapBottomX: points[9].x,
          strapBottomY: points[9].y,
        };
      }
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-lanyard-canvas="true"
      className="absolute inset-0 w-full h-full z-10 pointer-events-none"
    />
  );
});

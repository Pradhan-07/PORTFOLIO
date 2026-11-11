"use client";

import React, { useRef, useImperativeHandle, forwardRef, useId } from "react";
import { VerletPoint } from "@/lib/verlet";

export interface LanyardHandle {
  update: (
    points: VerletPoint[],
    anchorX: number,
    anchorY: number,
    stretchRatio: number,
    badgeAngleDeg: number
  ) => void;
}

interface LanyardProps {
  isDark: boolean;
}

export interface GlyphInterval {
  char: string;
  start: number;
  end: number;
}

declare global {
  interface Window {
    __LANYARD_GLYPH_INTERVALS__?: GlyphInterval[];
    __LANYARD_TELEMETRY__?: {
      strapTopX: number;
      strapTopY: number;
      strapBottomX: number;
      strapBottomY: number;
      stretchRatio: number;
      badgeAngleDeg: number;
    };
  }
}

// ---------------------------------------------------------------------------
// Strap text layout (single source of truth)
// ---------------------------------------------------------------------------
const FONT_SIZE = 10;
const CHAR_W = FONT_SIZE * 0.6; // monospace advance (Geist Mono ≈ 0.6em)
const BASE_GAP = 3; // extra spacing between glyphs at rest
const ADVANCE = CHAR_W + BASE_GAP; // px per character at rest
const TEXT_START = 16; // startOffset along the strap
const PHRASE_UNIT = "KARAN KUMAR PRADHAN · VIT-AP · B.TECH CSE · ";
const STRAP_TEXT = PHRASE_UNIT.repeat(5); // long enough to cover the whole rope

/**
 * Generates a smooth Catmull-Rom spline SVG path through an array of points.
 */
function catmullRomPath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n < 2) return "";
  if (n === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
  }

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} `;

  for (let i = 0; i < n - 1; i++) {
    const p0 =
      i > 0
        ? points[i - 1]
        : {
          x: points[0].x * 2 - points[1].x,
          y: points[0].y * 2 - points[1].y,
        };
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 =
      i < n - 2
        ? points[i + 2]
        : {
          x: p2.x * 2 - p1.x,
          y: p2.y * 2 - p1.y,
        };

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
  }

  return d;
}

/**
 * Dense sampling of Catmull-Rom spline to generate offset paths for stitching and brand stripes.
 */
function sampleSplineOffsets(
  points: { x: number; y: number }[],
  offsetDist: number
): { leftD: string; rightD: string; totalLen: number } {
  const n = points.length;
  if (n < 2) return { leftD: "", rightD: "", totalLen: 0 };

  const leftPts: { x: number; y: number }[] = [];
  const rightPts: { x: number; y: number }[] = [];
  let totalLen = 0;

  const SAMPLES = 6;
  for (let i = 0; i < n - 1; i++) {
    const p0 =
      i > 0
        ? points[i - 1]
        : {
          x: points[0].x * 2 - points[1].x,
          y: points[0].y * 2 - points[1].y,
        };
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 =
      i < n - 2
        ? points[i + 2]
        : {
          x: p2.x * 2 - p1.x,
          y: p2.y * 2 - p1.y,
        };

    const steps = i === n - 2 ? SAMPLES + 1 : SAMPLES;
    for (let s = 0; s < steps; s++) {
      const u = s / SAMPLES;
      const u2 = u * u;
      const u3 = u2 * u;

      const px =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);
      const py =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * u +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);

      const txRaw =
        0.5 *
        (-p0.x +
          p2.x +
          2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u +
          3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u2);
      const tyRaw =
        0.5 *
        (-p0.y +
          p2.y +
          2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u +
          3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u2);

      const tLen = Math.hypot(txRaw, tyRaw) || 1;
      const tx = txRaw / tLen;
      const ty = tyRaw / tLen;

      // Normal vector
      const nx = -ty;
      const ny = tx;

      leftPts.push({ x: px - nx * offsetDist, y: py - ny * offsetDist });
      rightPts.push({ x: px + nx * offsetDist, y: py + ny * offsetDist });

      if (leftPts.length > 1) {
        const prev = leftPts[leftPts.length - 2];
        totalLen += Math.hypot(px - prev.x, py - prev.y);
      }
    }
  }

  const toD = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    let str = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} `;
    for (let k = 1; k < pts.length; k++) {
      str += `L ${pts[k].x.toFixed(2)} ${pts[k].y.toFixed(2)} `;
    }
    return str;
  };

  return { leftD: toD(leftPts), rightD: toD(rightPts), totalLen };
}

export const Lanyard = forwardRef<LanyardHandle, LanyardProps>(function Lanyard(
  { isDark },
  ref
) {
  const uniqueId = useId().replace(/:/g, "");

  // SVG Element references for zero-allocation RAF updates
  const ribbonPathRef = useRef<SVGPathElement | null>(null);
  const ribbonCenterHighlightRef = useRef<SVGPathElement | null>(null);
  const ribbonWovenRef = useRef<SVGPathElement | null>(null);
  const leftBorderRef = useRef<SVGPathElement | null>(null);
  const rightBorderRef = useRef<SVGPathElement | null>(null);
  const leftStitchRef = useRef<SVGPathElement | null>(null);
  const rightStitchRef = useRef<SVGPathElement | null>(null);
  const leftBrandRef = useRef<SVGPathElement | null>(null);
  const rightBrandRef = useRef<SVGPathElement | null>(null);
  const textGuideRef = useRef<SVGPathElement | null>(null);
  const textRef = useRef<SVGTextElement | null>(null);

  const topBarGroupRef = useRef<SVGGElement | null>(null);
  const topBarRectRef = useRef<SVGRectElement | null>(null);
  const topBarSlotRef = useRef<SVGRectElement | null>(null);
  const topFoldBandRef = useRef<SVGRectElement | null>(null);
  const bottomClipRef = useRef<SVGGElement | null>(null);

  const baseStrapWidth = 30;

  useImperativeHandle(
    ref,
    () => ({
      update(points, anchorX, anchorY, stretchRatio, badgeAngleDeg) {
        if (!points || points.length < 2) return;

        // Ensure points[0] aligns strictly with anchorX, anchorY
        const ropePoints = [{ x: anchorX, y: anchorY }, ...points.slice(1)];

        const clipPoint = ropePoints[ropePoints.length - 1];

        // Dynamic ribbon narrowing on stretch (8-10% narrower at max 2.2x stretch)
        const currentWidth = Math.max(
          20,
          baseStrapWidth * (1 - Math.max(0, stretchRatio - 1.0) * 0.088)
        );
        const halfW = currentWidth / 2;
        const currentWidthStr = currentWidth.toFixed(2);

        // 1. Catmull-Rom spline path string through all rope points
        const splineD = catmullRomPath(ropePoints);

        // 2. Main Ribbon & Woven Texture
        if (ribbonPathRef.current) {
          ribbonPathRef.current.setAttribute("d", splineD);
          ribbonPathRef.current.setAttribute("stroke-width", currentWidthStr);
        }
        if (ribbonCenterHighlightRef.current) {
          ribbonCenterHighlightRef.current.setAttribute("d", splineD);
          ribbonCenterHighlightRef.current.setAttribute(
            "stroke-width",
            (currentWidth * 0.45).toFixed(2)
          );
        }
        if (ribbonWovenRef.current) {
          ribbonWovenRef.current.setAttribute("d", splineD);
          ribbonWovenRef.current.setAttribute("stroke-width", currentWidthStr);
        }
        if (textGuideRef.current) {
          textGuideRef.current.setAttribute("d", splineD);
        }

        // 3. Offset calculations for borders, stitches, and brand stripes
        const borderOffsets = sampleSplineOffsets(ropePoints, halfW);
        if (leftBorderRef.current)
          leftBorderRef.current.setAttribute("d", borderOffsets.leftD);
        if (rightBorderRef.current)
          rightBorderRef.current.setAttribute("d", borderOffsets.rightD);

        const stitchOffsets = sampleSplineOffsets(
          ropePoints,
          Math.max(1.5, halfW - 2.8)
        );
        if (leftStitchRef.current)
          leftStitchRef.current.setAttribute("d", stitchOffsets.leftD);
        if (rightStitchRef.current)
          rightStitchRef.current.setAttribute("d", stitchOffsets.rightD);

        const brandOffsets = sampleSplineOffsets(
          ropePoints,
          Math.max(2.5, halfW - 4.2)
        );
        if (leftBrandRef.current)
          leftBrandRef.current.setAttribute("d", brandOffsets.leftD);
        if (rightBrandRef.current)
          rightBrandRef.current.setAttribute("d", brandOffsets.rightD);

        // 4. Elastic text: stretch spacing between glyphs, never squeeze them
        const glyphScale = Math.min(
          1.5,
          1.0 + Math.max(0, stretchRatio - 1.0) * 0.5
        );
        const gap = BASE_GAP + (glyphScale - 1) * ADVANCE;
        if (textRef.current) {
          textRef.current.setAttribute("letter-spacing", gap.toFixed(2));
        }

        // 5. Top Brushed Silver Bar & Fold Shadow
        const topBarW = 20;
        const topBarH = 5.5;
        if (topBarRectRef.current) {
          topBarRectRef.current.setAttribute(
            "x",
            `${(anchorX - topBarW / 2).toFixed(2)}`
          );
          topBarRectRef.current.setAttribute(
            "y",
            `${(anchorY - topBarH / 2).toFixed(2)}`
          );
        }
        if (topBarSlotRef.current) {
          topBarSlotRef.current.setAttribute("x", `${(anchorX - 7).toFixed(2)}`);
          topBarSlotRef.current.setAttribute("y", `${(anchorY - 1).toFixed(2)}`);
        }
        if (topFoldBandRef.current) {
          topFoldBandRef.current.setAttribute(
            "x",
            `${(anchorX - halfW).toFixed(2)}`
          );
          topFoldBandRef.current.setAttribute("y", `${anchorY.toFixed(2)}`);
          topFoldBandRef.current.setAttribute(
            "width",
            `${currentWidth.toFixed(2)}`
          );
          topFoldBandRef.current.setAttribute("height", "14");
        }

        // 6. Bottom Lobster Clasp & Ring (Rigidly at points[last], rotates with badge angle)
        if (bottomClipRef.current) {
          bottomClipRef.current.setAttribute(
            "transform",
            `translate(${clipPoint.x.toFixed(2)}, ${clipPoint.y.toFixed(2)}) rotate(${badgeAngleDeg.toFixed(2)})`
          );
        }

        // 7. Telemetry & Glyph Interval Export for Programmatic Tests
        if (typeof window !== "undefined") {
          window.__LANYARD_TELEMETRY__ = {
            strapTopX: anchorX,
            strapTopY: anchorY,
            strapBottomX: clipPoint.x,
            strapBottomY: clipPoint.y,
            stretchRatio,
            badgeAngleDeg,
          };

          // Glyph intervals along the ribbon arc length (for overlap tests)
          const intervals: GlyphInterval[] = [];
          let curS = TEXT_START;
          for (const char of STRAP_TEXT) {
            intervals.push({ char, start: curS, end: curS + CHAR_W });
            curS += CHAR_W + gap;
          }
          window.__LANYARD_GLYPH_INTERVALS__ = intervals;
        }
      },
    }),
    [baseStrapWidth]
  );

  // Colors
  const strapFill = isDark ? "#2e2e30" : "#000000";
  const strapEdge = isDark ? "#424245" : "#222222";
  const textColor = isDark ? "#d8d8d8" : "#ffffff";
  const stitchColor = isDark
    ? "rgba(255, 255, 255, 0.28)"
    : "rgba(255, 255, 255, 0.35)";

  const metalGradId = `lanyardMetalGrad_${uniqueId}`;
  const ringGradId = `lanyardRingGrad_${uniqueId}`;
  const foldGradId = `lanyardFoldGrad_${uniqueId}`;
  const brandGradId = `lanyardBrandGrad_${uniqueId}`;
  const wovenPatternId = `lanyardWovenPattern_${uniqueId}`;
  const shadowFilterId = `lanyardShadow_${uniqueId}`;
  const textGuideId = `strapGuide_${uniqueId}`;

  return (
    <svg
      data-lanyard-svg="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <defs>
        {/* Brushed Silver Metal Gradient */}
        <linearGradient id={metalGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#d8d8da" />
          <stop offset="65%" stopColor="#828285" />
          <stop offset="100%" stopColor="#c4c4c8" />
        </linearGradient>

        <linearGradient id={ringGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#9c9ca0" />
          <stop offset="100%" stopColor="#d6d6d8" />
        </linearGradient>

        {/* Dark Fold Shadow Gradient */}
        <linearGradient id={foldGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor={isDark ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.60)"}
          />
          <stop
            offset="65%"
            stopColor={isDark ? "rgba(0,0,0,0.30)" : "rgba(0,0,0,0.22)"}
          />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>

        {/* Brand Touch Gradient: Pink to Light Blue (low saturation) */}
        <linearGradient id={brandGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.45" />
        </linearGradient>

        {/* Woven Diagonal Texture Pattern */}
        <pattern
          id={wovenPatternId}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="8" x2="8" y2="0" stroke="#ffffff" strokeWidth="1" opacity="0.35" />
          <line x1="-4" y1="4" x2="4" y2="-4" stroke="#ffffff" strokeWidth="1" opacity="0.35" />
          <line x1="4" y1="12" x2="12" y2="4" stroke="#ffffff" strokeWidth="1" opacity="0.35" />
        </pattern>

        {/* Subtle Drop Shadow Filter */}
        <filter id={shadowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="3.5"
            stdDeviation="3.5"
            floodOpacity={isDark ? "0.55" : "0.20"}
          />
        </filter>

        {/* Centerline Text Guide Path */}
        <path ref={textGuideRef} id={textGuideId} fill="none" />
      </defs>

      {/* 1. BASE RIBBON WITH SHADOW (Catmull-Rom spline, consistent width, miter joins) */}
      <path
        ref={ribbonPathRef}
        fill="none"
        stroke={strapFill}
        strokeWidth={baseStrapWidth}
        strokeLinecap="butt"
        strokeLinejoin="miter"
        filter={`url(#${shadowFilterId})`}
      />

      {/* 2. WOVEN DIAGONAL TEXTURE (6% opacity overlay) */}
      <path
        ref={ribbonWovenRef}
        fill="none"
        stroke={`url(#${wovenPatternId})`}
        strokeWidth={baseStrapWidth}
        strokeLinecap="butt"
        opacity="0.06"
      />

      {/* 3. SOFT LIGHTER CENTER HIGHLIGHT FOR 3D FEEL */}
      <path
        ref={ribbonCenterHighlightRef}
        fill="none"
        stroke={isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(255, 255, 255, 0.09)"}
        strokeWidth={baseStrapWidth * 0.45}
        strokeLinecap="butt"
      />

      {/* 4. 1px OUTER BORDER EDGE HIGHLIGHTS */}
      <path
        ref={leftBorderRef}
        fill="none"
        stroke={strapEdge}
        strokeWidth="1"
        strokeLinecap="butt"
      />
      <path
        ref={rightBorderRef}
        fill="none"
        stroke={strapEdge}
        strokeWidth="1"
        strokeLinecap="butt"
      />

      {/* 5. BRAND TOUCH: TWO THIN 2px STRIPES (Pink-to-Light-Blue Gradient) */}
      <path
        ref={leftBrandRef}
        fill="none"
        stroke={`url(#${brandGradId})`}
        strokeWidth="1.8"
        strokeLinecap="butt"
      />
      <path
        ref={rightBrandRef}
        fill="none"
        stroke={`url(#${brandGradId})`}
        strokeWidth="1.8"
        strokeLinecap="butt"
      />

      {/* 6. 1px DASHED STITCHING LINES (3px inside each edge) */}
      <path
        ref={leftStitchRef}
        fill="none"
        stroke={stitchColor}
        strokeWidth="1"
        strokeDasharray="3 3"
        strokeLinecap="butt"
      />
      <path
        ref={rightStitchRef}
        fill="none"
        stroke={stitchColor}
        strokeWidth="1"
        strokeDasharray="3 3"
        strokeLinecap="butt"
      />

      {/* 7. TOP FOLD SHADOW BAND (~14px tall darker fold shadow) */}
      <rect
        ref={topFoldBandRef}
        x="0"
        y="44"
        width={baseStrapWidth}
        height="14"
        fill={`url(#${foldGradId})`}
      />

      {/* 8. PRINTED TEXT: single layer along the strap, spacing-based stretch (no textLength) */}
      <text
        ref={textRef}
        fill={textColor}
        fontSize={FONT_SIZE}
        fontFamily="var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace"
        fontWeight="700"
        letterSpacing={BASE_GAP}
        dominantBaseline="central"
        style={{ fontKerning: "none" }}
      >
        <textPath href={`#${textGuideId}`} startOffset={TEXT_START}>
          {STRAP_TEXT}
        </textPath>
      </text>

      {/* 9. TOP BRUSHED SILVER METAL BAR (Directly under center of notch) */}
      <g ref={topBarGroupRef}>
        <rect
          ref={topBarRectRef}
          x="-10"
          y="41"
          width="20"
          height="5.5"
          rx="2"
          fill={`url(#${metalGradId})`}
          stroke="#404040"
          strokeWidth="1"
        />
        <rect
          ref={topBarSlotRef}
          x="-7"
          y="43"
          width="14"
          height="2"
          rx="1"
          fill="#1c1c1e"
        />
      </g>

      {/* 10. BOTTOM SILVER SPRING CLIP (Lobster-clasp style, 0px gap at clipPoint) */}
      <g ref={bottomClipRef}>
        {/* Lobster clasp body */}
        <rect
          x="-7"
          y="-18"
          width="14"
          height="18"
          rx="3.5"
          fill={`url(#${metalGradId})`}
          stroke="#444448"
          strokeWidth="1"
        />
        {/* Swivel line */}
        <line x1="-5.5" y1="-9" x2="5.5" y2="-9" stroke="#2e2e30" strokeWidth="1" />
        {/* Specular highlight */}
        <line x1="-4.5" y1="-16" x2="-4.5" y2="-3" stroke="rgba(255,255,255,0.75)" strokeWidth="1" />
        {/* Spring lever / trigger tab */}
        <rect x="-8.5" y="-14" width="2.5" height="6" rx="1" fill="#a8a8ac" />
        {/* Ring into Badge Slot Cutout (y = 0 down to 14) */}
        <ellipse
          cx="0"
          cy="5.5"
          rx="7.5"
          ry="8.5"
          fill="none"
          stroke={`url(#${ringGradId})`}
          strokeWidth="2.6"
        />
        <circle cx="0" cy="12" r="2.2" fill={isDark ? "#3a3a3c" : "#2a2a2c"} />
      </g>
    </svg>
  );
});
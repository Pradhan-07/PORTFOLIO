"use client";

import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { VerletPoint } from "@/lib/verlet";

export interface LanyardHandle {
  update: (
    points: VerletPoint[],
    anchorX: number,
    anchorY: number,
    stretchRatio: number
  ) => void;
}

interface LanyardProps {
  isDark: boolean;
}

export const Lanyard = forwardRef<LanyardHandle, LanyardProps>(function Lanyard(
  { isDark },
  ref
) {
  const leftPathRef = useRef<SVGPathElement | null>(null);
  const leftBorderRef = useRef<SVGPathElement | null>(null);
  const leftGuideRef = useRef<SVGPathElement | null>(null);

  const rightPathRef = useRef<SVGPathElement | null>(null);
  const rightBorderRef = useRef<SVGPathElement | null>(null);
  const rightGuideRef = useRef<SVGPathElement | null>(null);

  const leftTextPathRef = useRef<SVGTextPathElement | null>(null);
  const rightTextPathRef = useRef<SVGTextPathElement | null>(null);

  const middleClaspRef = useRef<SVGGElement | null>(null);
  const bottomClaspRef = useRef<SVGGElement | null>(null);
  const shadowFilterRef = useRef<SVGFEDropShadowElement | null>(null);

  // 2x wider strap (about 28 to 34px at desktop width)
  const baseStrapWidth = 30;
  const notchOffset = 26; // V-shape spread from notch navbar

  useImperativeHandle(
    ref,
    () => ({
      update(points, anchorX, anchorY, stretchRatio) {
        if (points.length < 2) return;

        const total = points.length - 1;
        let leftD = `M ${anchorX - notchOffset} ${anchorY} `;
        let rightD = `M ${anchorX + notchOffset} ${anchorY} `;

        for (let i = 1; i <= total; i++) {
          const p = points[i];
          const spread = notchOffset * (1 - i / total);
          leftD += `L ${p.x - spread} ${p.y} `;
          rightD += `L ${p.x + spread} ${p.y} `;
        }

        // 1. Update paths
        if (leftPathRef.current) leftPathRef.current.setAttribute("d", leftD);
        if (leftBorderRef.current) leftBorderRef.current.setAttribute("d", leftD);
        if (leftGuideRef.current) leftGuideRef.current.setAttribute("d", leftD);

        if (rightPathRef.current) rightPathRef.current.setAttribute("d", rightD);
        if (rightBorderRef.current) rightBorderRef.current.setAttribute("d", rightD);
        if (rightGuideRef.current) rightGuideRef.current.setAttribute("d", rightD);

        // 2. Strap thinning on stretch (8-10% narrower at maximum stretch)
        const currentWidth = (baseStrapWidth * (1 - (stretchRatio - 1) * 0.09)).toFixed(2);
        const borderWidth = (Number(currentWidth) + 1.2).toFixed(2);
        if (leftPathRef.current) leftPathRef.current.setAttribute("stroke-width", currentWidth);
        if (rightPathRef.current) rightPathRef.current.setAttribute("stroke-width", currentWidth);
        if (leftBorderRef.current) leftBorderRef.current.setAttribute("stroke-width", borderWidth);
        if (rightBorderRef.current) rightBorderRef.current.setAttribute("stroke-width", borderWidth);

        // 3. Dynamic text stretching along strap
        const baseLength = 195;
        const stretchedTextLen = (baseLength * stretchRatio).toFixed(1);
        if (leftTextPathRef.current) {
          leftTextPathRef.current.setAttribute("textLength", `${stretchedTextLen}`);
        }
        if (rightTextPathRef.current) {
          rightTextPathRef.current.setAttribute("textLength", `${stretchedTextLen}`);
        }

        // 4. Middle silver clasp visibility & position
        const mid = points[Math.floor(points.length / 2)];
        if (middleClaspRef.current && mid) {
          middleClaspRef.current.setAttribute(
            "transform",
            `translate(${mid.x}, ${mid.y})`
          );
          // Fades in smoothly as stretch exceeds 1.06
          const claspOpacity = Math.max(0, Math.min(1, (stretchRatio - 1.06) / 0.32));
          middleClaspRef.current.setAttribute("opacity", claspOpacity.toFixed(2));
        }

        // 5. Swivel clip at bottom badge pivot
        const clip = points[points.length - 1];
        if (bottomClaspRef.current && clip) {
          bottomClaspRef.current.setAttribute(
            "transform",
            `translate(${clip.x}, ${clip.y})`
          );
        }

        // 6. Dynamic shadow growth
        if (shadowFilterRef.current) {
          const stdDev = (2.5 + (stretchRatio - 1) * 3).toFixed(1);
          shadowFilterRef.current.setAttribute("stdDeviation", stdDev);
        }
      },
    }),
    [baseStrapWidth, notchOffset]
  );

  // Repeated micro-text along strap (legible at rest)
  const strapText =
    "KARAN KUMAR PRADHAN · VIT-AP · B.TECH CSE · KARAN KUMAR PRADHAN · VIT-AP · B.TECH CSE ·";

  // Dark theme: strap color #262626 with a 1px lighter edge highlight and brighter printed text
  // Light theme: black strap with white text
  const strapColor = isDark ? "#262626" : "#000000";
  const strapEdgeHighlight = isDark ? "#3c3c3c" : "#1a1a1a";
  const textColor = isDark ? "#f5f5f5" : "#ffffff";

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        {/* Silver metallic gradient for metal clip and clasp ring */}
        <linearGradient id="silverClipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#cccccc" />
          <stop offset="65%" stopColor="#777777" />
          <stop offset="100%" stopColor="#aaaaaa" />
        </linearGradient>

        <linearGradient id="silverRingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#999999" />
          <stop offset="100%" stopColor="#dddddd" />
        </linearGradient>

        {/* Filter for subtle strap drop-shadow with dynamic stretch response */}
        <filter id="strapShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            ref={shadowFilterRef}
            dx="0"
            dy="2"
            stdDeviation="2"
            floodOpacity={isDark ? "0.45" : "0.22"}
          />
        </filter>

        {/* Guide paths for text along the strap */}
        <path ref={leftGuideRef} id="leftTextPath" fill="none" />
        <path ref={rightGuideRef} id="rightTextPath" fill="none" />
      </defs>

      {/* 1. LEFT FABRIC STRAP WITH 1PX EDGE HIGHLIGHT */}
      <path
        ref={leftBorderRef}
        fill="none"
        stroke={strapEdgeHighlight}
        strokeWidth={baseStrapWidth + 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#strapShadow)"
      />
      <path
        ref={leftPathRef}
        fill="none"
        stroke={strapColor}
        strokeWidth={baseStrapWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. RIGHT FABRIC STRAP WITH 1PX EDGE HIGHLIGHT */}
      <path
        ref={rightBorderRef}
        fill="none"
        stroke={strapEdgeHighlight}
        strokeWidth={baseStrapWidth + 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#strapShadow)"
      />
      <path
        ref={rightPathRef}
        fill="none"
        stroke={strapColor}
        strokeWidth={baseStrapWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. REPEATED PRINTED MONO TEXT ON STRAPS (Legible 9.5px, elastic stretching enabled) */}
      <text
        fill={textColor}
        fontSize="9.5"
        fontFamily="var(--font-geist-mono), monospace"
        letterSpacing="0.12em"
        fontWeight="600"
        dominantBaseline="central"
      >
        <textPath
          ref={leftTextPathRef}
          href="#leftTextPath"
          startOffset="3%"
          lengthAdjust="spacing"
        >
          {strapText}
        </textPath>
      </text>

      <text
        fill={textColor}
        fontSize="9.5"
        fontFamily="var(--font-geist-mono), monospace"
        letterSpacing="0.12em"
        fontWeight="600"
        dominantBaseline="central"
      >
        <textPath
          ref={rightTextPathRef}
          href="#rightTextPath"
          startOffset="5%"
          lengthAdjust="spacing"
        >
          {strapText}
        </textPath>
      </text>

      {/* 4. SILVER ADJUSTMENT CLASP (Reveals when pulled & stretched) */}
      <g
        ref={middleClaspRef}
        opacity={0}
        style={{ transition: "opacity 120ms ease-out" }}
      >
        {/* Crisp silver metallic clasp buckle */}
        <rect
          x="-17"
          y="-8"
          width="34"
          height="16"
          rx="3.5"
          fill="url(#silverClipGrad)"
          stroke="#444444"
          strokeWidth="1"
        />
        <rect x="-10" y="-4" width="20" height="8" rx="2" fill={isDark ? "#1a1a1a" : "#222222"} />
        <circle cx="0" cy="0" r="2" fill="#ffffff" />
      </g>

      {/* 5. SILVER SWIVEL CLASP & RING AT BADGE PIVOT (Larger & Crisp) */}
      <g ref={bottomClaspRef}>
        {/* Metal Swivel Body */}
        <rect
          x="-7"
          y="-18"
          width="14"
          height="18"
          rx="3"
          fill="url(#silverClipGrad)"
          stroke="#444444"
          strokeWidth="1"
        />
        {/* Swivel Pivot Line */}
        <line x1="-5" y1="-9" x2="5" y2="-9" stroke="#222222" strokeWidth="1" />

        {/* Ring Connecting to Badge Cutout */}
        <ellipse
          cx="0"
          cy="5"
          rx="8"
          ry="9"
          fill="none"
          stroke="url(#silverRingGrad)"
          strokeWidth="3"
        />
        <circle cx="0" cy="14" r="2.5" fill="#444444" />
      </g>
    </svg>
  );
});

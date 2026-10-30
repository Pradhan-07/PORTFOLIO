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

  const baseStrapWidth = 14;
  const notchOffset = 18; // 36px spread at the top tab notch

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

        // 2. Strap thinning on stretch (8-10% narrower at max 2.2x stretch)
        const currentWidth = (baseStrapWidth * (1 - (stretchRatio - 1) * 0.08)).toFixed(2);
        if (leftPathRef.current) leftPathRef.current.setAttribute("stroke-width", currentWidth);
        if (rightPathRef.current) rightPathRef.current.setAttribute("stroke-width", currentWidth);

        // 3. Dynamic text stretching along strap
        const baseLength = 175;
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
          const stdDev = (2 + (stretchRatio - 1) * 3).toFixed(1);
          shadowFilterRef.current.setAttribute("stdDeviation", stdDev);
        }
      },
    }),
    [baseStrapWidth, notchOffset]
  );

  // Repeated micro-text along strap
  const strapText =
    "KARAN KUMAR PRADHAN · VIT-AP · B.TECH CSE · KARAN KUMAR PRADHAN · VIT-AP · B.TECH CSE ·";

  const strapColor = isDark ? "#18181b" : "#111111";
  const strapBorderColor = isDark ? "#27272a" : "#2a2a2a";
  const textColor = isDark ? "rgba(190, 190, 190, 0.85)" : "rgba(245, 245, 245, 0.95)";

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

      {/* 1. LEFT FABRIC STRAP */}
      <path
        ref={leftPathRef}
        fill="none"
        stroke={strapColor}
        strokeWidth={baseStrapWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#strapShadow)"
      />
      <path
        ref={leftBorderRef}
        fill="none"
        stroke={strapBorderColor}
        strokeWidth={baseStrapWidth}
        strokeDasharray="2 4"
        opacity="0.35"
      />

      {/* 2. RIGHT FABRIC STRAP */}
      <path
        ref={rightPathRef}
        fill="none"
        stroke={strapColor}
        strokeWidth={baseStrapWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#strapShadow)"
      />
      <path
        ref={rightBorderRef}
        fill="none"
        stroke={strapBorderColor}
        strokeWidth={baseStrapWidth}
        strokeDasharray="2 4"
        opacity="0.35"
      />

      {/* 3. REPEATED PRINTED MONO TEXT ON STRAPS (Elastic stretching enabled) */}
      <text
        fill={textColor}
        fontSize="6.5"
        fontFamily="var(--font-geist-mono), monospace"
        letterSpacing="1px"
        fontWeight="600"
      >
        <textPath
          ref={leftTextPathRef}
          href="#leftTextPath"
          startOffset="4%"
          lengthAdjust="spacing"
        >
          {strapText}
        </textPath>
      </text>

      <text
        fill={textColor}
        fontSize="6.5"
        fontFamily="var(--font-geist-mono), monospace"
        letterSpacing="1px"
        fontWeight="600"
      >
        <textPath
          ref={rightTextPathRef}
          href="#rightTextPath"
          startOffset="6%"
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
        {/* Silver metallic clasp buckle */}
        <rect
          x="-14"
          y="-6"
          width="28"
          height="12"
          rx="3"
          fill="url(#silverClipGrad)"
          stroke="#555"
          strokeWidth="0.8"
        />
        <rect x="-8" y="-3" width="16" height="6" rx="1.5" fill={isDark ? "#111" : "#222"} />
        <circle cx="0" cy="0" r="1.5" fill="#e5e5e5" />
      </g>

      {/* 5. SILVER SWIVEL CLASP & RING AT BADGE PIVOT */}
      <g ref={bottomClaspRef}>
        {/* Metal Swivel Body */}
        <rect
          x="-5"
          y="-14"
          width="10"
          height="14"
          rx="2.5"
          fill="url(#silverClipGrad)"
          stroke="#555555"
          strokeWidth="0.8"
        />
        {/* Swivel Pivot Line */}
        <line x1="-4" y1="-7" x2="4" y2="-7" stroke="#333333" strokeWidth="0.8" />

        {/* Ring Connecting to Badge Cutout */}
        <ellipse
          cx="0"
          cy="4"
          rx="6"
          ry="7"
          fill="none"
          stroke="url(#silverRingGrad)"
          strokeWidth="2.5"
        />
        <circle cx="0" cy="11" r="2" fill="#555555" />
      </g>
    </svg>
  );
});

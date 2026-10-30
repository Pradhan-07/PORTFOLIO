"use client";

import React from "react";
import { VerletPoint } from "@/lib/verlet";

interface LanyardProps {
  points: VerletPoint[];
  anchorX: number;
  anchorY: number;
  stretchRatio: number;
  isDark: boolean;
}

export function Lanyard({
  points,
  anchorX,
  anchorY,
  stretchRatio,
  isDark,
}: LanyardProps) {
  if (points.length < 2) return null;

  const strapWidth = 14;
  const notchOffset = 18; // 36px spread at the top notch

  // Convergence point at the end of the rope (where the clip joins the badge)
  const clipPoint = points[points.length - 1];

  // Middle point for the silver clasp ring
  const middlePoint = points[Math.floor(points.length / 2)];

  // Generate SVG path for Left Strap
  // Starts at anchorX - notchOffset and curves down to clipPoint
  const leftStrapPath = `M ${anchorX - notchOffset} ${anchorY} ` +
    points.slice(1).map((p, idx) => {
      // interpolate spread from notchOffset down to 0 at the clip
      const t = idx / (points.length - 1);
      const spread = notchOffset * (1 - t);
      return `L ${p.x - spread} ${p.y}`;
    }).join(" ");

  // Generate SVG path for Right Strap
  const rightStrapPath = `M ${anchorX + notchOffset} ${anchorY} ` +
    points.slice(1).map((p, idx) => {
      const t = idx / (points.length - 1);
      const spread = notchOffset * (1 - t);
      return `L ${p.x + spread} ${p.y}`;
    }).join(" ");

  // Silver clasp visibility: reveals when strap stretches during a long pull (> 1.15x)
  const claspOpacity = Math.max(0, Math.min(1, (stretchRatio - 1.12) / 0.28));

  // Repeated micro-text along strap
  const strapText =
    "KARAN KUMAR PRADHAN · VIT-AP · B.TECH CSE · KARAN KUMAR PRADHAN · VIT-AP · B.TECH CSE ·";

  const strapColor = isDark ? "#222222" : "#111111";
  const strapBorderColor = isDark ? "#333333" : "#333333";
  const textColor = isDark ? "rgba(160, 160, 160, 0.75)" : "rgba(220, 220, 220, 0.85)";

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        {/* Silver metallic gradient for metal clip and clasp ring */}
        <linearGradient id="silverClipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5f5f5" />
          <stop offset="35%" stopColor="#cccccc" />
          <stop offset="65%" stopColor="#777777" />
          <stop offset="100%" stopColor="#aaaaaa" />
        </linearGradient>

        <linearGradient id="silverRingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#999999" />
          <stop offset="100%" stopColor="#dddddd" />
        </linearGradient>

        {/* Filter for subtle strap drop-shadow */}
        <filter id="strapShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity={isDark ? "0.4" : "0.15"} />
        </filter>

        {/* Hidden guide paths for text along the strap */}
        <path id="leftTextPath" d={leftStrapPath} fill="none" />
        <path id="rightTextPath" d={rightStrapPath} fill="none" />
      </defs>

      {/* 1. LEFT FABRIC STRAP */}
      <path
        d={leftStrapPath}
        fill="none"
        stroke={strapColor}
        strokeWidth={strapWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#strapShadow)"
      />
      <path
        d={leftStrapPath}
        fill="none"
        stroke={strapBorderColor}
        strokeWidth={strapWidth}
        strokeDasharray="2 4"
        opacity="0.3"
      />

      {/* 2. RIGHT FABRIC STRAP */}
      <path
        d={rightStrapPath}
        fill="none"
        stroke={strapColor}
        strokeWidth={strapWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#strapShadow)"
      />
      <path
        d={rightStrapPath}
        fill="none"
        stroke={strapBorderColor}
        strokeWidth={strapWidth}
        strokeDasharray="2 4"
        opacity="0.3"
      />

      {/* 3. REPEATED PRINTED MONO TEXT ON STRAPS */}
      <text
        fill={textColor}
        fontSize="6.5"
        fontFamily="var(--font-geist-mono), monospace"
        letterSpacing="1px"
        fontWeight="600"
      >
        <textPath href="#leftTextPath" startOffset="5%">
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
        <textPath href="#rightTextPath" startOffset="8%">
          {strapText}
        </textPath>
      </text>

      {/* 4. SILVER ADJUSTMENT CLASP (Appears in the middle when pulled & stretched) */}
      {middlePoint && (
        <g
          transform={`translate(${middlePoint.x}, ${middlePoint.y})`}
          opacity={claspOpacity}
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
      )}

      {/* 5. SILVER SWIVEL CLASP & RING AT BADGE PIVOT */}
      <g transform={`translate(${clipPoint.x}, ${clipPoint.y})`}>
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
}


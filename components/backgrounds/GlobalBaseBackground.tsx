"use client";

import React from "react";

export function GlobalBaseBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-50 overflow-hidden"
    >
      {/* 1. Fine 24px dot grid with soft radial mask */}
      <div
        className="absolute inset-0 opacity-[0.045] dark:opacity-[0.045]"
        style={{
          backgroundImage:
            "radial-gradient(var(--foreground) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 45%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 45%, black 40%, transparent 100%)",
        }}
      />

      {/* 2. Very subtle static film grain (3% opacity) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03] contrast-125"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="static-film-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#static-film-grain)" />
      </svg>
    </div>
  );
}


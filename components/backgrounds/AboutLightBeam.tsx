"use client";

import React from "react";

export function AboutLightBeam() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
    >
      {/* Centered Soft Diagonal Light Beam */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[320px] origin-center animate-about-beam">
        <div
          className="w-full h-full rounded-[100%] blur-3xl opacity-40 dark:opacity-50"
          style={{
            background:
              "linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(168,85,247,0.15) 50%, rgba(56,189,248,0.12) 100%)",
          }}
        />
      </div>
    </div>
  );
}


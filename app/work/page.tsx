import React, { Suspense } from "react";
import type { Metadata } from "next";
import { WorkPageClient } from "./WorkPageClient";

export const metadata: Metadata = {
  title: "Work & Experiments — Karan Kumar Pradhan",
  description:
    "Explore projects across C++ DSA, web applications, computer vision, and IoT developed by Karan Kumar Pradhan.",
};

export default function WorkPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-36 pb-20 font-mono text-xs text-neutral-500">
          loading projects archive...
        </div>
      }
    >
      <WorkPageClient />
    </Suspense>
  );
}


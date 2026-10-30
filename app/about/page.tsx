import React from "react";
import type { Metadata } from "next";
import { stats } from "@/data/stats";
import { AboutClient } from "./AboutClient";

export const metadata: Metadata = {
  title: "About — Karan Kumar Pradhan",
  description:
    "Background, journey, timeline, and technical skills of Karan Kumar Pradhan, 2nd-year BTech CSE student at VIT-AP University.",
};

const skills = [
  { name: "C++", category: "Systems & DSA", level: "Primary Language" },
  { name: "DSA", category: "Core CS", level: `${stats.dsaProgramsCount}+ Programs & ${stats.leetcodeSolved} LeetCode` },
  { name: "TypeScript / JS", category: "Web Development", level: "Full Stack" },
  { name: "React / Next.js", category: "Web Frameworks", level: "Modern App Router" },
  { name: "Tailwind CSS", category: "Styling & UI", level: "Design Systems" },
  { name: "Python", category: "AI & Scripting", level: "OpenCV, Flask" },
  { name: "ESP32 & Arduino", category: "Hardware & IoT", level: "AGRIFLOW Project" },
  { name: "Git & GitHub", category: "Version Control", level: "Daily Streak & In Public" },
];

export default function AboutPage() {
  return <AboutClient skills={skills} />;
}

import React from "react";
import type { Metadata } from "next";
import { Timeline } from "@/components/Timeline";
import { OpenToWorkCTA } from "@/components/OpenToWorkCTA";
import { GraduationCap, MapPin, Terminal, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Karan Kumar Pradhan",
  description:
    "Background, journey, timeline, and technical skills of Karan Kumar Pradhan, 2nd-year BTech CSE student at VIT-AP University.",
};

const skills = [
  { name: "C++", category: "Systems & DSA", level: "Primary Language" },
  { name: "DSA", category: "Core CS", level: "69+ Programs & 29 LeetCode" },
  { name: "TypeScript / JS", category: "Web Development", level: "Full Stack" },
  { name: "React / Next.js", category: "Web Frameworks", level: "Modern App Router" },
  { name: "Tailwind CSS", category: "Styling & UI", level: "Design Systems" },
  { name: "Python", category: "AI & Scripting", level: "OpenCV, Flask" },
  { name: "ESP32 & Arduino", category: "Hardware & IoT", level: "AGRIFLOW Project" },
  { name: "Git & GitHub", category: "Version Control", level: "Daily Streak & In Public" },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-20">
      {/* Header */}
      <div className="mb-12 pb-8 border-b border-neutral-200 dark:border-neutral-800">
        <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          [ DOSSIER // ABOUT ME ]
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 mt-2 mb-4">
          Karan Kumar Pradhan
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <span>VIT-AP University · BTech CSE (2025–29)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <span>Andhra Pradesh, India</span>
          </div>
        </div>
      </div>

      {/* Story Sections */}
      <div className="space-y-8 text-neutral-700 dark:text-neutral-300 leading-relaxed text-base">
        <div>
          <h2 className="text-xl font-bold text-neutral-950 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-neutral-500" />
            <span>The Journey So Far</span>
          </h2>
          <p className="mb-4">
            I am currently in my 2nd year pursuing a Bachelor of Technology in Computer Science &amp;
            Engineering at VIT-AP University.
          </p>
          <p className="mb-4">
            My primary daily focus is data structures and algorithms in modern C++. I spend my time
            analyzing pointer mechanics, time and space complexity trade-offs, and solving algorithmic
            problems on LeetCode. Concurrently, I build web applications and explore embedded systems.
          </p>
          <p>
            I believe that being an honest beginner who ships working code beats a perfectionist who
            never commits to main. That is why I track my work in public on GitHub, maintain a
            rigorous contribution streak, and document the bugs that humble me along the way.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40">
          <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-neutral-500" />
            <span>Certifications &amp; Recognition</span>
          </h3>
          <p className="text-sm text-neutral-800 dark:text-neutral-200 font-medium">
            Hedera Certified Foundation (HCF) &amp; Hedera Certified Developer Associate (HCDA)
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Issued by The Hashgraph Association (June 2026) — Verified competencies in distributed ledger architectures and decentralized applications.
          </p>
        </div>

        {/* Skills Grid */}
        <div className="pt-6">
          <h2 className="text-xl font-bold text-neutral-950 dark:text-neutral-100 mb-4">
            Technical Stack &amp; Skills
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skills.map((skill) => (
              <div
                key={skill.name}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-neutral-950 dark:text-neutral-100 font-mono">
                    {skill.name}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {skill.category}
                  </div>
                </div>
                <span className="font-mono text-[10px] px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
                  {skill.level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline using the single source of truth in data/timeline.ts */}
        <div className="pt-8">
          <Timeline />
        </div>

        {/* CTA */}
        <div className="pt-6">
          <OpenToWorkCTA />
        </div>
      </div>
    </div>
  );
}

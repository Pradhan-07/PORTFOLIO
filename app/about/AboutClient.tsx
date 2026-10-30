"use client";

import React from "react";
import { motion } from "framer-motion";
import { Timeline } from "@/components/Timeline";
import { OpenToWorkCTA } from "@/components/OpenToWorkCTA";
import { GraduationCap, MapPin, Terminal, Award } from "lucide-react";
import { TypewriterText } from "@/components/TypewriterText";

interface Skill {
  name: string;
  category: string;
  level: string;
}

interface AboutClientProps {
  skills: Skill[];
}

export function AboutClient({ skills }: AboutClientProps) {
  const storyParagraphs = [
    "I am currently in my 2nd year pursuing a Bachelor of Technology in Computer Science & Engineering at VIT-AP University.",
    "My primary daily focus is data structures and algorithms in modern C++. I spend my time analyzing pointer mechanics, time and space complexity trade-offs, and solving algorithmic problems on LeetCode. Concurrently, I build web applications and explore embedded systems.",
    "I believe that being an honest beginner who ships working code beats a perfectionist who never commits to main. That is why I track my work in public on GitHub, maintain a rigorous contribution streak, and document the bugs that humble me along the way.",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-20">
      {/* Header */}
      <div className="mb-12 pb-8 border-b border-neutral-200 dark:border-neutral-800">
        <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          <TypewriterText text="[ DOSSIER // ABOUT ME ]" duration={400} />
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

      {/* Story Sections with Line-by-Line Stagger (40ms) */}
      <div className="space-y-8 text-neutral-700 dark:text-neutral-300 leading-relaxed text-base">
        <div>
          <h2 className="text-xl font-bold text-neutral-950 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-neutral-500" />
            <span>The Journey So Far</span>
          </h2>
          <div className="space-y-4">
            {storyParagraphs.map((paragraph, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.04, // 40ms stagger
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
        </div>

        {/* Certifications Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40"
        >
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
        </motion.div>

        {/* Skills Grid with Stagger */}
        <div className="pt-6">
          <h2 className="text-xl font-bold text-neutral-950 dark:text-neutral-100 mb-4">
            Technical Stack &amp; Skills
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skills.map((skill, index) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.04, // 40ms stagger
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -2 }}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] flex items-center justify-between hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors shadow-xs"
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
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline */}
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

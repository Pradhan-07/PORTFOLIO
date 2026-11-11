"use client";

import React, { useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import { TypewriterText } from "./TypewriterText";
import { LetsTalkMesh } from "./backgrounds/LetsTalkMesh";

const contactLinks = [
  { name: "GitHub", href: "https://github.com/Pradhan-07" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/karan-kumar-pradhan-510062396/" },
  { name: "LeetCode", href: "https://leetcode.com/u/pradhan_07/" },
  { name: "X", href: "https://x.com/pradhankar65796" },
  { name: "Instagram", href: "https://www.instagram.com/pradhan___07" },
];

interface LetsTalkProps {
  sectionLabel?: string;
}

export function LetsTalk({ sectionLabel = "[ 02 // LET'S TALK ]" }: LetsTalkProps) {
  // Magnetic hover state for "Say hi" button (max 6px)
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const relX = (e.clientX - centerX) * 0.18;
    const relY = (e.clientY - centerY) * 0.18;
    setMagneticOffset({
      x: Math.max(-6, Math.min(6, relX)),
      y: Math.max(-6, Math.min(6, relY)),
    });
  };

  const handleMouseLeave = () => {
    setMagneticOffset({ x: 0, y: 0 });
  };

  return (
    <section
      id="contact"
      className="relative w-full my-16 sm:my-24 p-8 sm:p-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xs scroll-mt-24 sm:scroll-mt-28 overflow-hidden"
    >
      <LetsTalkMesh />
      <div className="max-w-2xl relative z-10">
        {/* Consecutive Mono Section Label with Typewriter Reveal */}
        <div className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-4">
          <TypewriterText text={sectionLabel} duration={400} />
        </div>

        {/* Status Dot with Pulse */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-[var(--border)] bg-neutral-100/60 dark:bg-neutral-900/60 text-neutral-800 dark:text-neutral-200 mb-6">
          <span className="w-2 h-2 rounded-full status-dot-pulse animate-pulse" />
          <span>Open for chats &amp; internships</span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--foreground)] mb-4">
          Let&apos;s build something together.
        </h2>

        {/* One line of copy */}
        <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
          Got an idea, a project, an internship opportunity, or just want to debate C++ pointers vs smart pointers? My inbox is always open.
        </p>

        {/* Action Button with Magnetic Hover & Social Links */}
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="mailto:pradhankaran058@gmail.com"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `translate3d(${magneticOffset.x}px, ${magneticOffset.y}px, 0)`,
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-950 text-white dark:bg-neutral-100 dark:text-neutral-950 font-medium text-sm hover:bg-neutral-800 dark:hover:bg-white active:scale-[0.98] transition-all duration-150 shadow-sm group"
          >
            <Mail className="w-4 h-4" />
            <span>Say hi</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" />
          </a>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {contactLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-black dark:hover:decoration-white transition-colors group"
              >
                <span>{link.name}</span>
                <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

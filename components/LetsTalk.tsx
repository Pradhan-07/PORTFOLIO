"use client";

import React from "react";
import { ArrowUpRight, Mail } from "lucide-react";

const contactLinks = [
  { name: "GitHub", href: "https://github.com/Pradhan-07" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/karan-kumar-pradhan-510062396/" },
  { name: "LeetCode", href: "https://leetcode.com/u/pradhan_07/" },
  { name: "X", href: "https://x.com/pradhankar65796" },
  { name: "Instagram", href: "https://www.instagram.com/pradhan___07" },
];

export function LetsTalk() {
  return (
    <section className="w-full my-20 sm:my-28 p-8 sm:p-12 rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100/50 dark:bg-[#121212]/60 backdrop-blur-sm">
      <div className="max-w-2xl">
        {/* Status Dot */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Open for chats & internships</span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 mb-4">
          Let&apos;s build something together.
        </h2>

        {/* One line of copy */}
        <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
          Got an idea, a project, an internship opportunity, or just want to debate C++ pointers vs smart pointers? My inbox is always open.
        </p>

        {/* Action Button & Social Links */}
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="mailto:pradhankaran058@gmail.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-950 text-white dark:bg-neutral-100 dark:text-neutral-950 font-medium text-sm hover:bg-neutral-800 dark:hover:bg-white transition-all shadow-sm"
          >
            <Mail className="w-4 h-4" />
            <span>Say hi</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {contactLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-black dark:hover:decoration-white transition-colors"
              >
                <span>{link.name}</span>
                <ArrowUpRight className="w-3 h-3 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


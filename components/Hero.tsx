"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { StippleEffect } from "./StippleEffect";
import { VerletLanyard } from "./VerletLanyard";
import { GithubContributions } from "./GithubContributions";

const socialLinks = [
  { name: "GitHub", href: "https://github.com/Pradhan-07" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/karan-kumar-pradhan-510062396/" },
  { name: "LeetCode", href: "https://leetcode.com/u/pradhan_07/" },
  { name: "X", href: "https://x.com/pradhankar65796" },
  { name: "Instagram", href: "https://www.instagram.com/pradhan___07" },
];

const statChips = [
  "C++ · DSA",
  "Web dev",
  "AI / CV",
  "IoT & ESP32",
  "Building in public",
];

export function Hero() {
  return (
    <section className="relative min-h-[92vh] pt-28 sm:pt-36 pb-16 flex flex-col justify-between overflow-hidden">
      {/* Background Canvas Stipple particles */}
      <StippleEffect />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left / Main Text Column (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col gap-6 z-10">
            
            {/* Small uppercase mono label */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full text-xs font-mono border border-neutral-300 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/60 backdrop-blur-sm text-neutral-600 dark:text-neutral-400"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Karan Kumar Pradhan · BTech @ VIT-AP</span>
            </motion.div>

            {/* H1 Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 leading-[1.08]"
            >
              Hi, I&apos;m Karan.
              <br />
              <span className="text-neutral-500 dark:text-neutral-400 font-normal">
                I&apos;m learning to build things that work.
              </span>
            </motion.h1>

            {/* Short paragraph bio */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-xl"
            >
              2nd-year BTech student at VIT-AP University. Currently grinding data structures &
              algorithms in C++, exploring web development, and shipping code in public.
            </motion.p>

            {/* Mono Stat Chips */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              className="flex flex-wrap gap-2 pt-1"
            >
              {statChips.map((chip) => (
                <span
                  key={chip}
                  className="px-2.5 py-1 text-xs font-mono rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300"
                >
                  {chip}
                </span>
              ))}
            </motion.div>

            {/* Find me row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28 }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs font-mono"
            >
              <span className="text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                find me //
              </span>
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-neutral-900 dark:hover:decoration-neutral-100 transition-all"
                >
                  <span>{link.name}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              ))}
            </motion.div>

            {/* GitHub Contributions Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="pt-2 max-w-xl"
            >
              <GithubContributions />
            </motion.div>

          </div>

          {/* Right Column: Interactive Verlet Lanyard ID Badge (5 cols on lg) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 flex justify-center lg:justify-end relative"
          >
            <div className="w-full max-w-[360px]">
              <VerletLanyard />
            </div>
          </motion.div>

        </div>
      </div>

      {/* Hero Bottom Microcopy */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="w-full text-center pt-8 sm:pt-12 pb-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1.5"
      >
        <span>scroll. the badge will survive.</span>
        <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
      </motion.div>
    </section>
  );
}

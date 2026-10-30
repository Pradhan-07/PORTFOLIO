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
  { name: "X", href: "https://x.com/pradhankar65796" },
  { name: "Instagram", href: "https://www.instagram.com/pradhan___07" },
  { name: "Email", href: "mailto:pradhankaran058@gmail.com" },
];

const statChips = ["C++ · DSA", "Web dev", "Building in public"];

// Words for H1 animation with 60ms stagger
const h1Words = [
  "Hi,",
  "I'm",
  "Karan.",
  "I'm",
  "learning",
  "to",
  "build",
  "things",
  "that",
  "work.",
];

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[92dvh] pt-28 sm:pt-36 pb-14 flex flex-col justify-between overflow-hidden"
    >
      {/* Background Portrait Stipple Effect (~4000 dots with text-dimming) */}
      <StippleEffect />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Text Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6 z-10">
            {/* Small Upper Mono Label */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full text-xs font-mono border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm text-neutral-600 dark:text-neutral-400"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Karan Kumar Pradhan · CSE @ VIT-AP</span>
            </motion.div>

            {/* H1 Heading: Words fade-up with 60ms stagger */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--foreground)] leading-[1.08]">
              {h1Words.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.2 + i * 0.06, // 200-700ms sequence with 60ms stagger
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`inline-block mr-2.5 ${
                    i >= 3 ? "text-neutral-500 dark:text-neutral-400 font-normal" : ""
                  }`}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            {/* Short Paragraph Bio */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-xl"
            >
              2nd-year Computer Science Engineering student at VIT-AP University. Currently
              grinding DSA in C++, exploring modern web development, and shipping code in public.
            </motion.p>

            {/* Mono Chips */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-wrap gap-2 pt-1"
            >
              {statChips.map((chip) => (
                <span
                  key={chip}
                  className="px-2.5 py-1 text-xs font-mono rounded-md border border-[var(--border)] bg-[var(--card)]/90 text-neutral-700 dark:text-neutral-300 shadow-2xs"
                >
                  {chip}
                </span>
              ))}
            </motion.div>

            {/* "Find me" Row with ↗ Arrows */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs font-mono"
            >
              <span className="text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                find me //
              </span>
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.name === "Email" ? "_self" : "_blank"}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-black dark:hover:decoration-white transition-colors"
                >
                  <span>{link.name}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              ))}
            </motion.div>

            {/* GitHub Contributions Heatmap (52 weeks with 8ms stagger) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="pt-2 max-w-xl"
            >
              <GithubContributions />
            </motion.div>
          </div>

          {/* Right Column: Interactive Verlet Lanyard ID Badge (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6, // Badge drops from top and swings at 600ms
              ease: [0.22, 1, 0.36, 1],
            }}
            className="lg:col-span-5 flex justify-center lg:justify-end relative"
          >
            <div className="w-full max-w-[360px]">
              <VerletLanyard />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Microcopy */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="w-full text-center pt-8 pb-1 text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1.5"
      >
        <span>scroll. the badge will survive.</span>
        <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
      </motion.div>
    </section>
  );
}

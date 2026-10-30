"use client";

import React, { useEffect, useState, useRef } from "react";
import { stats } from "@/data/stats";
import { motion, useInView } from "framer-motion";
import { GitBranch, Terminal, Trophy, Flame } from "lucide-react";

interface CounterProps {
  end: number;
  suffix?: string;
  duration?: number;
}

function AnimatedCounter({ end, suffix = "", duration = 1200 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [inView, end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export function StatsStrip() {
  const [liveStreak, setLiveStreak] = useState<number>(stats.streakFallbackDays);

  // Optional live fetch for the current GitHub streak
  useEffect(() => {
    async function fetchLiveStreak() {
      try {
        const res = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${stats.githubUsername}?y=last`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.contributions && Array.isArray(data.contributions)) {
            const days = data.contributions;
            let streak = 0;
            for (let i = days.length - 1; i >= 0; i--) {
              if (days[i].count > 0) {
                streak++;
              } else if (i === days.length - 1) {
                continue;
              } else {
                break;
              }
            }
            if (streak > 0) setLiveStreak(streak);
          }
        }
      } catch {
        // Fallback remains the verified 21-day streak
      }
    }

    fetchLiveStreak();
  }, []);

  const statItems = [
    {
      label: "PUBLIC REPOSITORIES",
      number: stats.repos,
      suffix: "",
      icon: GitBranch,
      detail: "github.com/Pradhan-07",
    },
    {
      label: "C++ DSA PROGRAMS",
      number: stats.dsaProgramsCount,
      suffix: "+",
      icon: Terminal,
      detail: "arrays, pointers, recursion, OOP",
    },
    {
      label: "LEETCODE SOLVED",
      number: stats.leetcodeSolved,
      suffix: "",
      icon: Trophy,
      detail: `E: ${stats.leetcodeBreakdown.easy} · M: ${stats.leetcodeBreakdown.medium} · H: ${stats.leetcodeBreakdown.hard}`,
    },
    {
      label: "GITHUB STREAK",
      number: liveStreak,
      suffix: "d",
      icon: Flame,
      detail: "21d record (58 contributions)",
    },
  ];

  return (
    <div className="w-full my-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          [ METRICS // AS OF {stats.asOf.toUpperCase()} ]
        </span>
        <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
          continuous tracking
        </span>
      </div>

      {/* Grid of 4 Mono Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between text-neutral-400 dark:text-neutral-500 mb-2">
                <span className="font-mono text-[10px] tracking-wider uppercase">
                  {item.label}
                </span>
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="text-3xl sm:text-4xl font-mono font-bold text-neutral-950 dark:text-neutral-50 my-1">
                <AnimatedCounter end={item.number} suffix={item.suffix} />
              </div>

              <div className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 truncate pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
                {item.detail}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


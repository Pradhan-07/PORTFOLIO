"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface DayData {
  date: string;
  count: number;
  level: number;
}

interface WeekData {
  days: DayData[];
}

interface GitHubApiResponse {
  username: string;
  totalContributions: number;
  currentStreak: number;
  longestStreak: number;
  weeks: WeekData[];
  lastUpdated: string;
  isFallback: boolean;
}

export function GithubContributions() {
  const [data, setData] = useState<GitHubApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const res = await fetch("/api/github");
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setData(json);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Handled by loading fallback
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-xs relative transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            GITHUB // @{data?.username || "Pradhan-07"}
          </span>

          {/* Flame-less mono badge as requested */}
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
            streak: {data?.currentStreak || 21} days
          </span>
        </div>

        <a
          href="https://github.com/Pradhan-07"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <span>activity</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Heatmap Area with Skeleton Loading */}
      {loading ? (
        <div className="h-28 w-full flex items-center justify-center animate-pulse">
          <span className="font-mono text-xs text-neutral-400">
            fetching github contribution graph...
          </span>
        </div>
      ) : (
        <div className="relative overflow-x-auto pb-1 scrollbar-none">
          <div className="flex gap-[3px] min-w-max">
            {data?.weeks.map((week, colIdx) => (
              <motion.div
                key={colIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: colIdx * 0.008, // Column-by-column 8ms stagger
                  ease: "easeOut",
                }}
                className="flex flex-col gap-[3px]"
              >
                {week.days.map((day, rowIdx) => {
                  const levelStyles = [
                    "bg-[var(--heatmap-0)] border border-[var(--border)]/40",
                    "bg-[var(--heatmap-1)]",
                    "bg-[var(--heatmap-2)]",
                    "bg-[var(--heatmap-3)]",
                    "bg-[var(--heatmap-4)]",
                  ];

                  return (
                    <div
                      key={rowIdx}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredDay({
                          date: day.date,
                          count: day.count,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                        });
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] rounded-[2px] transition-transform hover:scale-125 cursor-pointer ${
                        levelStyles[day.level] || levelStyles[0]
                      }`}
                    />
                  );
                })}
              </motion.div>
            ))}
          </div>

          {/* Floating Tooltip */}
          {hoveredDay && (
            <div
              className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full px-2.5 py-1 rounded bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-mono text-[10px] shadow-lg whitespace-nowrap"
              style={{
                left: `${hoveredDay.x}px`,
                top: `${hoveredDay.y}px`,
              }}
            >
              {hoveredDay.count} {hoveredDay.count === 1 ? "contribution" : "contributions"} on {hoveredDay.date}
            </div>
          )}
        </div>
      )}

      {/* Heatmap Footer: Streak info + legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 border-t border-[var(--border)]/80">
        <div className="flex items-center gap-3">
          <span>{data?.totalContributions || 142} contributions in last year</span>
          <span>·</span>
          <span>longest: {data?.longestStreak || 21} days</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span>less</span>
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--heatmap-0)] border border-[var(--border)]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--heatmap-1)]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--heatmap-2)]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--heatmap-3)]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--heatmap-4)]" />
          <span>more</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import { quickTakes } from "@/data/quotes";
import { MessageSquareQuote } from "lucide-react";

export function QuickTakes() {
  const featured = quickTakes.find((t) => t.isFeatured) || quickTakes[0];
  const gridTakes = quickTakes.filter((t) => !t.isFeatured);

  return (
    <section className="w-full my-16 sm:my-24">
      {/* Header */}
      <div className="mb-8">
        <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          [ UNFILTERED // QUICK TAKES ]
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-neutral-100 mt-2">
          Notes, Gripes & Daily Insights
        </h2>
      </div>

      <div className="space-y-4">
        {/* Featured Big Quote Card */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="p-6 sm:p-8 rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100/60 dark:bg-[#141414] shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-4">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <MessageSquareQuote className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                featured take
              </span>
              <span>{featured.date}</span>
            </div>

            <p className="text-lg sm:text-2xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100 leading-snug">
              &ldquo;{featured.quote}&rdquo;
            </p>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs font-mono">
              <span className="text-neutral-500 dark:text-neutral-400">
                — {featured.context}
              </span>
              {featured.tag && (
                <span className="px-2 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  #{featured.tag}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* 2 or 3 Column Masonry/Grid of Short Takes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gridTakes.map((take, index) => (
            <motion.div
              key={take.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 dark:text-neutral-500 mb-3">
                  <span>{take.date}</span>
                  {take.tag && <span>#{take.tag}</span>}
                </div>
                <p className="text-sm font-normal text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  &ldquo;{take.quote}&rdquo;
                </p>
              </div>

              {take.context && (
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                  {"//"} {take.context}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

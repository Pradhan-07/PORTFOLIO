"use client";

import React from "react";
import { motion } from "framer-motion";
import { ALL_CATEGORIES, FilterCategory } from "@/data/projects";

interface CategoryFilterProps {
  activeCategory: FilterCategory;
  onSelectCategory: (category: FilterCategory) => void;
  counts: Record<FilterCategory, number>;
}

export function CategoryFilter({
  activeCategory,
  onSelectCategory,
  counts,
}: CategoryFilterProps) {
  return (
    <div
      role="tablist"
      data-category-filter
      aria-label="Filter projects by category"
      className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2"
    >
      {ALL_CATEGORIES.map((category) => {
        const isActive = activeCategory === category;
        const count = counts[category] || 0;

        return (
          <button
            key={category}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectCategory(category)}
            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 ${
              isActive
                ? "text-neutral-950 dark:text-neutral-900 font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100 border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60"
            }`}
          >
            {/* Active Pill Filled Background with Framer Motion layout */}
            {isActive && (
              <motion.span
                layoutId="activeFilterPill"
                className="absolute inset-0 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 -z-10 shadow-sm"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}

            <span className={isActive ? "text-white dark:text-neutral-950" : ""}>
              {category}
            </span>
            <span
              className={`text-[10px] font-mono px-1 rounded ${
                isActive
                  ? "bg-neutral-800 text-neutral-300 dark:bg-neutral-200 dark:text-neutral-700"
                  : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              ({count})
            </span>
          </button>
        );
      })}
    </div>
  );
}


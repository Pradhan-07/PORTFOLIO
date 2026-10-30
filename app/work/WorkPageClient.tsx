"use client";

import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  projects,
  FilterCategory,
  getCategoryCounts,
} from "@/data/projects";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProjectCard } from "@/components/ProjectCard";
import { StatsStrip } from "@/components/StatsStrip";
import { Timeline } from "@/components/Timeline";
import { StackStrip } from "@/components/StackStrip";
import { OpenToWorkCTA } from "@/components/OpenToWorkCTA";

// Map URL slugs to FilterCategory
function categoryToSlug(cat: FilterCategory): string {
  if (cat === "AI / CV") return "ai-cv";
  return cat.toLowerCase();
}

function slugToCategory(slug: string | null): FilterCategory {
  if (!slug) return "All";
  const s = slug.toLowerCase();
  if (s === "web") return "Web";
  if (s === "dsa") return "DSA";
  if (s === "ai-cv" || s === "ai" || s === "cv") return "AI / CV";
  if (s === "iot") return "IoT";
  return "All";
}

export function WorkPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = useMemo(() => {
    return slugToCategory(searchParams.get("category"));
  }, [searchParams]);

  const handleSelectCategory = (category: FilterCategory) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "All") {
      params.delete("category");
    } else {
      params.set("category", categoryToSlug(category));
    }
    const queryString = params.toString();
    router.replace(`/work${queryString ? `?${queryString}` : ""}`, { scroll: false });
  };

  const counts = useMemo(() => {
    return getCategoryCounts(projects);
  }, []);

  const filteredProjects = useMemo(() => {
    if (activeCategory === "All") {
      return projects;
    }
    return projects.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-20">
      {/* 1. Header Section */}
      <div className="mb-10 sm:mb-12">
        <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          [ ARCHIVE // ALL PROJECTS ]
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 mt-2 mb-3">
          Work & Experiments
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed mb-6">
          Everything I&apos;ve built across C++ DSA, web apps, computer vision and IoT. Filter by category below.
        </p>

        {/* Category Filter Pills (6 pills computed from data) */}
        <CategoryFilter
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          counts={counts}
        />
      </div>

      {/* 2. 3-Column Project Cards Grid with Framer Motion Layout Animation */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div
              layout
              key={project.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State Fallback */}
      {filteredProjects.length === 0 && (
        <div className="py-16 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
          <p className="font-mono text-xs text-neutral-500">
            No projects found in category &ldquo;{activeCategory}&rdquo;.
          </p>
        </div>
      )}

      {/* 3. Stats Strip (4 Mono Animated Tiles) */}
      <StatsStrip />

      {/* 4. Experience & Milestones Timeline */}
      <Timeline />

      {/* 5. Toolkit // Tech Stack */}
      <StackStrip />

      {/* 6. Open to Internships CTA */}
      <OpenToWorkCTA />
    </div>
  );
}

"use client";

import React from "react";
import { motion } from "framer-motion";

const stackItems = [
  "C++",
  "Python",
  "TypeScript",
  "JavaScript",
  "HTML",
  "CSS",
  "React",
  "Vite",
  "Tailwind CSS",
  "Flask",
  "Supabase",
  "Arduino",
  "Git",
  "GitHub",
  "VS Code",
  "Vercel",
];

export function StackStrip() {
  return (
    <div className="w-full my-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          [ TOOLKIT // TECH STACK ]
        </span>
        <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
          active tools & languages
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {stackItems.map((tech, index) => (
          <motion.span
            key={tech}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            className="px-3 py-1.5 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors shadow-sm"
          >
            {tech}
          </motion.span>
        ))}
      </div>
    </div>
  );
}


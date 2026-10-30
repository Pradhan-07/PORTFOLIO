"use client";

import React from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full border-t border-neutral-200 dark:border-neutral-800 py-10 mt-20 text-xs font-mono text-neutral-500 dark:text-neutral-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Copyright */}
        <div className="flex items-center gap-2">
          <span>© 2026 Karan Kumar Pradhan</span>
          <span>·</span>
          <span>VIT-AP University</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Pradhan-07"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            github
          </a>
          <a
            href="https://linkedin.com/in/karan-kumar-pradhan-510062396/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            linkedin
          </a>
          <a
            href="https://leetcode.com/u/pradhan_07/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            leetcode
          </a>
          <a
            href="https://x.com/pradhankar65796"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            x
          </a>
          <Link href="/llms.txt" className="hover:text-black dark:hover:text-white transition-colors">
            llms.txt
          </Link>
        </div>

        {/* Up we go scroll to top */}
        <button
          onClick={scrollToTop}
          className="inline-flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors group"
        >
          <span>up we go</span>
          <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </footer>
  );
}

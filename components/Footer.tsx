"use client";

import React from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { FooterEmberLines } from "@/components/FooterEmberLines";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      id="footer"
      className="w-full bg-[#000000] text-neutral-400 rounded-t-[24px] sm:rounded-t-[32px] pt-10 pb-8 px-4 sm:px-8 mt-24 relative overflow-hidden selection:bg-neutral-800 border-t border-neutral-900"
    >
      <div className="max-w-6xl mx-auto flex flex-col justify-between min-h-[380px] sm:min-h-[420px] gap-6 sm:gap-8">
        {/* Top Row: Socials & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs sm:text-[13px] border-b border-neutral-900/80 pb-6">
          {/* Socials */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a
              href="https://github.com/Pradhan-07"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              github ↗
            </a>
            <a
              href="https://x.com/pradhankar65796"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              x ↗
            </a>
            <a
              href="https://www.linkedin.com/in/karan-kumar-pradhan-510062396/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              linkedin ↗
            </a>
            <a
              href="https://www.instagram.com/pradhan___07"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              instagram ↗
            </a>
            <a
              href="mailto:pradhankaran058@gmail.com"
              className="hover:text-white transition-colors"
            >
              email ↗
            </a>
          </div>

          {/* Site Navigation */}
          <div className="flex items-center gap-4 sm:gap-6 text-neutral-500">
            <Link
              href="/resume"
              className="hover:text-white transition-colors"
            >
              resume ↗
            </Link>
            <Link
              href="/work"
              className="hover:text-white transition-colors"
            >
              work ↗
            </Link>
          </div>
        </div>

        {/* Center: Giant PRADHAN word made of vertical gradient lines with drifting embers */}
        <div className="w-full my-auto py-2 sm:py-4">
          <FooterEmberLines />
        </div>

        {/* Bottom Row: Copyright & Up We Go */}
        <div className="flex items-center justify-between font-mono text-xs text-neutral-500 pt-4 border-t border-neutral-900/60">
          <div>
            <span>© 2026 Karan Kumar Pradhan</span>
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-white transition-colors group cursor-pointer"
            aria-label="Scroll to top"
          >
            <span>up we go</span>
            <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-1 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </footer>
  );
}

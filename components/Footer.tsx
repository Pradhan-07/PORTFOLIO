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
      className="w-full bg-[#000000] text-neutral-400 rounded-t-[24px] sm:rounded-t-[32px] pt-12 mt-24 relative overflow-hidden selection:bg-neutral-800"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col justify-between pb-8 gap-8">
        {/* Top Row: Socials & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs sm:text-[13px] border-b border-neutral-900 pb-6">
          {/* Socials */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a
              href="https://github.com/Pradhan-07"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
              data-cursor="link"
            >
              github ↗
            </a>
            <a
              href="https://x.com/pradhankar65796"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
              data-cursor="link"
            >
              x ↗
            </a>
            <a
              href="https://www.linkedin.com/in/karan-kumar-pradhan-510062396/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
              data-cursor="link"
            >
              linkedin ↗
            </a>
            <a
              href="https://www.instagram.com/pradhan___07"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
              data-cursor="link"
            >
              instagram ↗
            </a>
            <a
              href="mailto:pradhankaran058@gmail.com"
              className="hover:text-white transition-colors"
              data-cursor="link"
            >
              email ↗
            </a>
          </div>

          {/* Site Navigation */}
          <div className="flex items-center gap-4 sm:gap-6 text-neutral-500">
            <Link
              href="/resume"
              className="hover:text-white transition-colors"
              data-cursor="link"
            >
              resume ↗
            </Link>
            <Link
              href="/work"
              className="hover:text-white transition-colors"
              data-cursor="link"
            >
              work ↗
            </Link>
          </div>
        </div>

        {/* Middle Row: Copyright & Up We Go */}
        <div className="flex items-center justify-between font-mono text-xs text-neutral-600 sm:text-neutral-500">
          <div>
            <span>© 2026 Karan Kumar Pradhan</span>
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-white transition-colors group cursor-pointer"
            data-cursor="link"
            aria-label="Scroll to top"
          >
            <span>up we go</span>
            <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-1 transition-transform duration-200" />
          </button>
        </div>
      </div>

      {/* Full-width Animated Typography Banner (PRADHAN) matching reference FRICTION */}
      <div className="w-full border-t border-zinc-900 bg-black">
        <FooterEmberLines text="PRADHAN" heightClamp="clamp(90px, 12vw, 175px)" />
      </div>
    </footer>
  );
}

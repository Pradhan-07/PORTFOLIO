"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sun, Moon, FileText } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface NavItem {
  name: string;
  href: string;
}

const navItems: NavItem[] = [
  { name: "index", href: "/" },
  { name: "work", href: "/work" },
  { name: "writing", href: "/writing" },
  { name: "resume", href: "/resume" },
  { name: "about", href: "/about" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [homeSection, setHomeSection] = useState<string>("index");

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const activeSection =
    pathname !== "/"
      ? pathname.startsWith("/work")
        ? "work"
        : pathname.startsWith("/writing")
        ? "writing"
        : pathname.startsWith("/resume")
        ? "resume"
        : pathname.startsWith("/about")
        ? "about"
        : "index"
      : homeSection;

  // IntersectionObserver for tracking active section on home page
  useEffect(() => {
    if (pathname !== "/") return;

    const sections = ["hero", "work", "resume", "writing", "about"]
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setHomeSection(id === "hero" ? "index" : id);
          }
        });
      },
      { threshold: 0.2, rootMargin: "-80px 0px -40% 0px" }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <>
      {/* Accessibility: Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-neutral-900 focus:text-neutral-100 focus:border focus:border-neutral-700 focus:rounded-md focus:text-xs focus:font-mono"
      >
        Skip to content →
      </a>

      {/* Notch Navbar sticking to TOP EDGE of the viewport like a tab */}
      <header
        id="notch-navbar"
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      >
        <motion.nav
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto flex items-center px-4 sm:px-6 py-2.5 gap-2.5 sm:gap-4 rounded-b-2xl rounded-t-none bg-black text-[#ededed] dark:bg-[#161616] dark:text-[#ededed] border-x border-b border-transparent dark:border-neutral-800 shadow-xl transition-all"
          aria-label="Notch Navigation"
        >
          {/* Logo Mark */}
          <Link
            href="/"
            className="font-mono text-xs font-extrabold tracking-wider px-1 text-white hover:text-neutral-300 transition-colors"
          >
            KP
          </Link>

          <div className="h-3 w-px bg-neutral-800 dark:bg-neutral-700" />

          {/* Links */}
          <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-xs lowercase">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? activeSection === "index"
                  : activeSection === item.name;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-2 sm:px-2.5 py-1 rounded-full transition-all duration-150 ${
                    isActive
                      ? "text-black dark:text-neutral-950 font-bold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="notchNavbarActiveIndicator"
                      className="absolute inset-0 rounded-full bg-white dark:bg-[#ededed] -z-10 shadow-xs"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="h-3 w-px bg-neutral-800 dark:bg-neutral-700" />

          {/* llms.txt link with tiny file icon */}
          <Link
            href="/llms.txt"
            title="Plain text site summary for LLMs"
            className="inline-flex items-center gap-1 font-mono text-[11px] text-neutral-400 hover:text-white transition-colors px-1"
          >
            <FileText className="w-3 h-3 opacity-70" />
            <span className="hidden sm:inline">llms.txt</span>
          </Link>

          <div className="h-3 w-px bg-neutral-800 dark:bg-neutral-700" />

          {/* Dark / Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors"
          >
            {mounted && theme === "light" ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5" />
            )}
          </button>
        </motion.nav>
      </header>
    </>
  );
}

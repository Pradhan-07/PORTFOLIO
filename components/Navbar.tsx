"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface NavItem {
  name: string;
  href: string;
}

const navItems: NavItem[] = [
  { name: "index", href: "/" },
  { name: "work", href: "/work" },
  { name: "writing", href: "/writing" },
  { name: "about", href: "/about" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Accessibility: Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-neutral-900 focus:text-neutral-100 focus:border focus:border-neutral-700 focus:rounded-md focus:text-xs focus:font-mono"
      >
        Skip to content →
      </a>

      {/* Floating Notch Pill Container */}
      <header className="fixed top-0 left-0 right-0 z-40 flex justify-center pt-3 sm:pt-4 px-4 pointer-events-none">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-auto flex items-center transition-all duration-300 ease-out backdrop-blur-md rounded-full border shadow-sm ${
            scrolled
              ? "py-1.5 px-3 sm:px-4 gap-2 sm:gap-4 bg-neutral-900/85 dark:bg-neutral-950/85 border-neutral-700/60 dark:border-neutral-800 text-xs shadow-black/20"
              : "py-2 px-4 sm:px-6 gap-3 sm:gap-6 bg-neutral-100/80 dark:bg-[#121212]/80 border-neutral-300 dark:border-neutral-800 text-xs sm:text-sm"
          }`}
          aria-label="Main Navigation"
        >
          {/* Logo / Monogram indicator */}
          <Link
            href="/"
            className="font-mono text-xs font-semibold tracking-wider px-2 py-0.5 rounded text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-colors"
          >
            KP<span className="opacity-40">.07</span>
          </Link>

          <div className="h-3 w-px bg-neutral-300 dark:bg-neutral-800" />

          {/* Links */}
          <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-xs lowercase">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-2.5 py-1 rounded-full transition-all duration-200 ${
                    isActive
                      ? "text-neutral-900 dark:text-white font-medium"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="notchNavbarActivePill"
                      className="absolute inset-0 rounded-full bg-neutral-200/90 dark:bg-neutral-800/90 -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="h-3 w-px bg-neutral-300 dark:bg-neutral-800" />

          {/* Dark / Light Mode Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1 rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
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

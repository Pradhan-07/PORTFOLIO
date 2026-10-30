"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface NavItem {
  name: string;
  href: string;
  sectionId?: string;
}

const navItems: NavItem[] = [
  { name: "index", href: "/", sectionId: "hero" },
  { name: "work", href: "/work", sectionId: "work" },
  { name: "writing", href: "/writing", sectionId: "writing" },
  { name: "resume", href: "/resume", sectionId: "resume" },
  { name: "about", href: "/about", sectionId: "about" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [homeSection, setHomeSection] = useState<string>("index");

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

  // IntersectionObserver for tracking active section on the home page
  useEffect(() => {
    if (pathname !== "/") return;

    const sections = ["hero", "work", "writing", "about"]
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
      { threshold: 0.25, rootMargin: "-80px 0px -40% 0px" }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <>
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-neutral-900 focus:text-neutral-100 focus:border focus:border-neutral-700 focus:rounded-md focus:text-xs focus:font-mono"
      >
        Skip to content →
      </a>

      {/* Floating Notch Navbar Centered at Top */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 sm:pt-4 px-4 pointer-events-none">
        <LayoutGroup id="notchNav">
          <motion.nav
            layout
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className={`pointer-events-auto flex items-center liquid-glass rounded-full shadow-sm transition-all duration-300 ${
              scrolled
                ? "py-1.5 px-3 sm:px-4 gap-2 sm:gap-4 shadow-black/20"
                : "py-2 px-4 sm:px-6 gap-3 sm:gap-6 shadow-black/5"
            }`}
            style={{
              WebkitBackdropFilter: "blur(16px)",
              backdropFilter: "blur(16px)",
            }}
            aria-label="Primary Navigation"
          >
            {/* Logo / Monogram */}
            <Link
              href="/"
              className="font-mono text-xs font-bold tracking-wider px-2 py-0.5 rounded text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-colors"
            >
              KP<span className="opacity-40">.07</span>
            </Link>

            <div className="h-3 w-px bg-neutral-300 dark:bg-neutral-800" />

            {/* Nav items */}
            <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-xs lowercase">
              {navItems.map((item) => {
                const isActive =
                  pathname === "/"
                    ? activeSection === item.name
                    : pathname.startsWith(item.href) && item.href !== "/";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-2.5 py-1 rounded-full transition-colors duration-200 ${
                      isActive
                        ? "text-neutral-950 dark:text-white font-medium"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeNotchPill"
                        className="absolute inset-0 rounded-full bg-neutral-200/90 dark:bg-neutral-800/90 -z-10 shadow-xs"
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 32,
                        }}
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
              aria-label="Toggle dark/light theme"
              className="p-1.5 rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
            >
              {mounted && theme === "light" ? (
                <Moon className="w-3.5 h-3.5" />
              ) : (
                <Sun className="w-3.5 h-3.5" />
              )}
            </button>
          </motion.nav>
        </LayoutGroup>
      </header>
    </>
  );
}

"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, FileText } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface NavItem {
  name: string;
  href: string;
}

const navItems: NavItem[] = [
  { name: "index", href: "/" },
  { name: "work", href: "/work" },
  { name: "resume", href: "/resume" },
  { name: "about", href: "/about" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [homeSection, setHomeSection] = useState<string>("index");
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const activeSection =
    pathname !== "/"
      ? pathname.startsWith("/work")
        ? "work"
        : pathname.startsWith("/resume")
        ? "resume"
        : pathname.startsWith("/about")
        ? "about"
        : "index"
      : homeSection;

  // Track window scroll for notch morphing animation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver for tracking active section on home page
  useEffect(() => {
    if (pathname !== "/") return;

    const sections = ["hero", "resume", "contact"]
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

  // View Transitions API circular reveal handler
  const handleThemeToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const doc = document as unknown as {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    if (
      !doc.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      toggleTheme();
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(() => {
      toggleTheme();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 400,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  const isDarkMode = mounted ? theme === "dark" : true;

  return (
    <>
      {/* Accessibility: Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-neutral-900 focus:text-neutral-100 focus:border focus:border-neutral-700 focus:rounded-md focus:text-xs focus:font-mono"
      >
        Skip to content →
      </a>

      {/* Floating Notch Navbar Header */}
      <header
        id="notch-navbar"
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-300"
      >
        <motion.nav
          layout
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-auto flex items-center transition-all duration-300 ${
            isScrolled
              ? "mt-2.5 px-3.5 sm:px-5 py-1.5 gap-2 sm:gap-3 rounded-full backdrop-blur-xl bg-black/90 text-[#ededed] dark:bg-[#161616]/90 dark:text-[#ededed] border border-neutral-800 shadow-2xl"
              : "mt-0 px-4 sm:px-6 py-2.5 gap-2.5 sm:gap-4 rounded-b-2xl rounded-t-none bg-black text-[#ededed] dark:bg-[#161616] dark:text-[#ededed] border-x border-b border-transparent dark:border-neutral-800 shadow-xl"
          }`}
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

          {/* Nav Links */}
          <div
            className="flex items-center gap-1 sm:gap-1.5 font-mono text-xs lowercase"
            onMouseLeave={() => setHoveredItem(null)}
          >
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? activeSection === "index"
                  : activeSection === item.name;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  className={`relative px-2 sm:px-2.5 py-1 rounded-full transition-colors duration-150 ${
                    isActive
                      ? "text-black dark:text-neutral-950 font-bold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {/* Sliding Active Indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="notchNavbarActiveIndicator"
                      className="absolute inset-0 rounded-full bg-white dark:bg-[#ededed] -z-10 shadow-xs"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}

                  {/* Soft Hover Pill */}
                  {!isActive && hoveredItem === item.name && (
                    <motion.span
                      layoutId="navHoverPill"
                      className="absolute inset-0 rounded-full bg-white/10 dark:bg-white/10 -z-10"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}

                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="h-3 w-px bg-neutral-800 dark:bg-neutral-700" />

          {/* llms.txt link */}
          <Link
            href="/llms.txt"
            title="Plain text site summary for LLMs"
            className="inline-flex items-center gap-1 font-mono text-[11px] text-neutral-400 hover:text-white transition-colors px-1"
          >
            <FileText className="w-3 h-3 opacity-70" />
            <span className="hidden sm:inline">llms.txt</span>
          </Link>

          <div className="h-3 w-px bg-neutral-800 dark:bg-neutral-700" />

          {/* Dark / Light Theme Toggle with 250ms Icon Morph & Circular Reveal */}
          <button
            onClick={handleThemeToggle}
            aria-label="Toggle theme"
            className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors relative cursor-pointer"
          >
            <AnimatePresence mode="wait" initial={false}>
              {!isDarkMode ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Moon className="w-3.5 h-3.5" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, scale: 0.7, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Sun className="w-3.5 h-3.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </motion.nav>
      </header>
    </>
  );
}

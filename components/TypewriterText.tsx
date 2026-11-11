"use client";

import React, { useState, useEffect, useRef } from "react";

interface TypewriterTextProps {
  text: string;
  duration?: number;
  className?: string;
}

export function TypewriterText({
  text,
  duration = 400,
  className = "",
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const ref = useRef<HTMLSpanElement | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let interval: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          // Respect reduced motion
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setDisplayed(text);
            return;
          }

          const len = text.length;
          const stepTime = Math.max(10, Math.floor(duration / len));
          let index = 0;

          interval = setInterval(() => {
            index++;
            setDisplayed(text.slice(0, index));
            if (index >= len) {
              if (interval) clearInterval(interval);
            }
          }, stepTime);

          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (interval) clearInterval(interval);
    };
  }, [text, duration]);

  return (
    <span ref={ref} className={className}>
      {displayed || text}
    </span>
  );
}

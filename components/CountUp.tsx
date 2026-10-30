"use client";

import React, { useState, useEffect, useRef } from "react";

interface CountUpProps {
  end: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export function CountUp({
  end,
  decimals = 0,
  duration = 1100,
  suffix = "",
  className = "",
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // If already animated once, keep value locked to latest exact end
    if (hasAnimatedRef.current) {
      setValue(end);
      return;
    }

    const el = ref.current;
    if (!el) return;

    let frameId: number | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          observer.disconnect();

          // Respect prefers-reduced-motion
          if (
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ) {
            setValue(end);
            return;
          }

          const startTime = performance.now();
          const startVal = 0;

          const frame = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            // Ease out cubic: f(t) = 1 - (1 - t)^3
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = startVal + easeOut * (end - startVal);
            setValue(current);

            if (progress < 1) {
              frameId = requestAnimationFrame(frame);
            } else {
              setValue(end);
            }
          };

          frameId = requestAnimationFrame(frame);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [end, duration]);

  const formatted =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <span ref={ref} className={className}>
      {formatted}
      {suffix}
    </span>
  );
}

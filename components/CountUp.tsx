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
  duration = 1200,
  suffix = "",
  className = "",
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          // Respect reduced motion
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setValue(end);
            return;
          }

          const startTime = performance.now();
          const frame = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = easeOut * end;
            setValue(current);

            if (progress < 1) {
              requestAnimationFrame(frame);
            } else {
              setValue(end);
            }
          };

          requestAnimationFrame(frame);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <span ref={ref} className={className}>
      {formatted}
      {suffix}
    </span>
  );
}

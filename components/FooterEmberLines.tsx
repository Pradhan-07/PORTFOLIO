"use client";

import React, { useEffect, useRef } from "react";

interface FrictionBannerProps {
  text?: string;
  colPitch?: number;
  glowIntensity?: number;
  heightClamp?: string;
  className?: string;
}

interface Blip {
  col: number;
  yRatio: number;
  speed: number;
  phase: number;
  warm: boolean;
}

/**
 * EXACT ANIMATED TYPOGRAPHY BANNER REPRODUCTION
 * Matches the reference FRICTION banner with the word "PRADHAN",
 * striped scanline letter construction, dark crimson-to-orange gradient,
 * floating column blips, and the glowing lime-green/yellow particle.
 */
export function FooterEmberLines({
  text = "PRADHAN",
  colPitch = 7,
  glowIntensity = 1.45,
  heightClamp = "clamp(90px, 12vw, 175px)",
  className = "",
}: FrictionBannerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Offscreen mask canvas for text glyph clipping
    const maskCanvas = document.createElement("canvas");
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationId: number | null = null;
    let isIntersecting = true;
    let blips: Blip[] = [];

    // Pointer state for interaction heat boost
    const pointer = {
      x: -9999,
      y: -9999,
      tx: -9999,
      ty: -9999,
      active: false,
    };

    // Lime-green glowing particle state (resting on the right side)
    const particle = {
      x: -9999,
      y: -9999,
      ringX: -9999,
      ringY: -9999,
      initialized: false,
    };

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Resize and rebuild mask
    function resize() {
      if (!container || !canvas || !ctx || !maskCtx) return;

      const rect = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      maskCanvas.width = width * dpr;
      maskCanvas.height = height * dpr;
      maskCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Draw word onto offscreen mask canvas
      maskCtx.clearRect(0, 0, width, height);
      maskCtx.fillStyle = "#ffffff";
      maskCtx.textBaseline = "middle";
      maskCtx.textAlign = "center";

      const fontFamily =
        "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

      if ("letterSpacing" in maskCtx) {
        (maskCtx as unknown as { letterSpacing: string }).letterSpacing = "-0.03em";
      }

      maskCtx.font = `900 100px ${fontFamily}`;
      const metrics = maskCtx.measureText(text);
      const measuredW = metrics.width || 1;
      const ascent = metrics.actualBoundingBoxAscent || 74;
      const descent = metrics.actualBoundingBoxDescent || 12;

      // Fit text to banner: 92% of width and 78% of height
      const fittedFontSize = Math.max(
        12,
        Math.floor(
          100 * Math.min((0.92 * width) / measuredW, (0.78 * height) / (ascent + descent))
        )
      );

      maskCtx.font = `900 ${fittedFontSize}px ${fontFamily}`;
      if ("letterSpacing" in maskCtx) {
        (maskCtx as unknown as { letterSpacing: string }).letterSpacing = "-0.03em";
      }
      maskCtx.textBaseline = "middle";
      maskCtx.fillText(text, 0.5 * width, 0.5 * height);

      // Generate floating blips inside columns
      const numCols = Math.ceil(width / colPitch);
      blips = [];
      for (let c = 0; c < numCols; c++) {
        for (let b = 0; b < 3; b++) {
          blips.push({
            col: c,
            yRatio: Math.random(),
            speed: 0.0012 + 0.0032 * Math.random(),
            phase: Math.random() * Math.PI * 2,
            warm: Math.random() > 0.28,
          });
        }
      }

      // Initialize resting particle position on right side
      if (!particle.initialized && width > 0) {
        particle.x = width * 0.85;
        particle.y = height * 0.5;
        particle.ringX = particle.x;
        particle.ringY = particle.y;
        particle.initialized = true;
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      pointer.tx = e.clientX - rect.left;
      pointer.ty = e.clientY - rect.top;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting;
        });
      },
      { threshold: 0.01 }
    );
    observer.observe(container);

    container.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    window.addEventListener("resize", resize);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(resize);
    }
    resize();

    // Main 60fps render loop
    function render(timestamp: number) {
      if (!ctx || !maskCtx) return;

      if (!isIntersecting) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const sTime = 0.001 * timestamp;

      // Pointer spring smoothing
      if (pointer.active) {
        if (pointer.x < -1000) {
          pointer.x = pointer.tx;
          pointer.y = pointer.ty;
        } else {
          pointer.x += (pointer.tx - pointer.x) * 0.16;
          pointer.y += (pointer.ty - pointer.y) * 0.16;
        }
      } else {
        pointer.x += (-9999 - pointer.x) * 0.05;
        pointer.y += (-9999 - pointer.y) * 0.05;
      }

      ctx.clearRect(0, 0, width, height);

      // Striped column construction
      const strokeW = Math.max(2, Math.floor(0.36 * colPitch));
      const numCols = Math.ceil(width / colPitch);
      const heatRadius = Math.max(180, 0.22 * width);

      for (let c = 0; c < numCols; c++) {
        const colX = c * colPitch;
        const distToMouse = colX - pointer.x;
        const mouseProx = pointer.active
          ? Math.max(0, 1 - Math.abs(distToMouse) / heatRadius)
          : 0;
        const colGlow =
          (1 + 0.85 * mouseProx) *
          glowIntensity *
          (prefersReducedMotion ? 1 : 0.88 + 0.12 * Math.sin(2.2 * sTime + 0.45 * c));

        // 4-stop vertical gradient from dark crimson/charcoal to hot deep-red/orange
        const grad = ctx.createLinearGradient(0, 0.05 * height, 0, height);
        const topCharcoal = Math.min(85, Math.floor(18 + 34 * mouseProx));
        const midCrimsonR = Math.min(255, Math.floor(46 * colGlow));
        const midCrimsonG = Math.min(255, Math.floor(16 * colGlow));
        const midCrimsonB = Math.min(255, Math.floor(14 * colGlow));
        const lowRedR = Math.min(255, Math.floor(175 * colGlow));
        const lowRedG = Math.min(255, Math.floor(48 * colGlow));
        const lowRedB = Math.min(255, Math.floor(20 * colGlow));
        const bottomOrangeR = Math.min(255, Math.floor(245 * colGlow));
        const bottomOrangeG = Math.min(255, Math.floor(88 * colGlow));
        const bottomOrangeB = Math.min(255, Math.floor(32 * colGlow));

        grad.addColorStop(0, `rgb(${topCharcoal}, ${topCharcoal}, ${topCharcoal + 3})`);
        grad.addColorStop(0.5, `rgb(${midCrimsonR}, ${midCrimsonG}, ${midCrimsonB})`);
        grad.addColorStop(0.8, `rgb(${lowRedR}, ${lowRedG}, ${lowRedB})`);
        grad.addColorStop(1, `rgb(${bottomOrangeR}, ${bottomOrangeG}, ${bottomOrangeB})`);

        ctx.fillStyle = grad;
        ctx.fillRect(colX, 0, strokeW, height);

        // Subtle orange scanline highlight on column edge
        ctx.fillStyle = `rgba(255, 120, 60, ${0.03 + 0.08 * mouseProx})`;
        ctx.fillRect(colX + strokeW, 0, 1, height);
      }

      // Floating blips drifting up columns
      for (let i = 0; i < blips.length; i++) {
        const blip = blips[i];
        if (!prefersReducedMotion) {
          blip.yRatio -= blip.speed;
          if (blip.yRatio < 0.04) blip.yRatio = 0.98;
        }

        const colX = blip.col * colPitch;
        const blipY = blip.yRatio * height;
        const dist = Math.hypot(colX - pointer.x, blipY - pointer.y);
        const blipMouseProx = pointer.active
          ? Math.max(0, 1 - dist / (0.95 * heatRadius))
          : 0;
        const pulse = prefersReducedMotion
          ? 0.8
          : 0.5 + 0.5 * Math.sin(6 * sTime + blip.phase);
        const alpha = Math.min(
          1,
          (0.18 + 0.52 * Math.pow(blip.yRatio, 1.4) + 0.75 * blipMouseProx) *
            pulse *
            glowIntensity
        );

        if (alpha > 0.08) {
          if (blip.warm || blipMouseProx > 0.35) {
            ctx.fillStyle = `rgba(255, ${Math.floor(170 + 75 * blipMouseProx)}, ${Math.floor(
              110 + 110 * blipMouseProx
            )}, ${alpha})`;
          } else {
            ctx.fillStyle = `rgba(195, 195, 205, ${0.65 * alpha})`;
          }
          ctx.fillRect(colX, blipY, strokeW, 2.2);
        }
      }

      // CLIPPING: destination-in clips the scanlines and blips to the exact letter glyphs
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(maskCanvas, 0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      // 5. GLOWING LIME-GREEN / YELLOW PARTICLE (#c8ff3d)
      // Resting on the right side with organic subtle motion, lerping toward pointer on interaction
      const baseRestX = width * 0.85;
      const baseRestY = height * 0.5;

      let targetX = baseRestX;
      let targetY = baseRestY;

      if (pointer.active) {
        targetX = pointer.x;
        targetY = pointer.y;
      } else if (!prefersReducedMotion) {
        // Subtle organic breathing float on the right side
        targetX = baseRestX + Math.sin(sTime * 1.2) * 10;
        targetY = baseRestY + Math.cos(sTime * 0.9) * 6;
      }

      if (particle.x < -1000) {
        particle.x = targetX;
        particle.y = targetY;
        particle.ringX = targetX;
        particle.ringY = targetY;
      } else {
        // Smooth lerp tracking
        particle.x += (targetX - particle.x) * (pointer.active ? 0.18 : 0.06);
        particle.y += (targetY - particle.y) * (pointer.active ? 0.18 : 0.06);
        // Outer ring smooth lag
        particle.ringX += (particle.x - particle.ringX) * 0.16;
        particle.ringY += (particle.y - particle.ringY) * 0.16;
      }

      // Draw thin circular outline (30px diameter)
      ctx.save();
      ctx.beginPath();
      ctx.arc(particle.ringX, particle.ringY, 15, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(200, 255, 61, 0.65)";
      ctx.lineWidth = 1;
      ctx.shadowColor = "rgba(200, 255, 61, 0.4)";
      ctx.shadowBlur = 6;
      ctx.stroke();

      // Draw bright central dot (7px diameter) with glowing halo
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#c8ff3d";
      ctx.shadowColor = "rgba(200, 255, 61, 0.9)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();

      animationId = requestAnimationFrame(render);
    }

    animationId = requestAnimationFrame(render);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      observer.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", resize);
    };
  }, [text, colPitch, glowIntensity]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black cursor-crosshair overflow-hidden select-none ${className}`}
      style={{ height: heightClamp }}
    >
      {/* Semantic label for screen readers */}
      <span className="sr-only">{text}</span>

      {/* High-DPR Canvas for striped typography and particle */}
      <canvas aria-hidden="true" ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FC } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { deskHeightForViewport } from './deskHeight';

/**
 * DeskStrip (§2.8) — a decorative band below the status bar: a text-label
 * keyboard, two original hand wireframes and a small mouse outline, with
 * live micro readouts. It replaces the Phase 8 drawn desk objects
 * (notebook / mug / sprout): §1.4's text-label rule (G04) forbids drawn
 * objects on the desk, so the keyboard here is plain lowercase mono TEXT
 * — no keycap boxes, no per-key borders, nothing ever lights up.
 *
 * Keyboard: 4 DOM text rows (10px, var(--dim)), centred-left.
 * Hands: REDRAWN in this file's canvas, not imported — the landing's
 * WireframeHandsKeyboard is monolithic (its own drawn keycap keyboard
 * and hands share one canvas), so importing it would duplicate a drawn
 * keyboard. The hands here are original procedural line art in the same
 * language (dots + connecting lines inside thin bounding boxes): 21
 * landmarks per hand generated from a wrist + five finger chains
 * (base point + three segments each, fanned by per-finger angle/length
 * specs below) joined by the standard hand topology links, plus a
 * rounded-rect mouse outline with a wheel line by the right hand.
 *
 * Readouts (DOM, 10px, var(--dim), tabular-nums):
 *   ['hand0:u'] / ['hand1:u'] — a generated drift (see driftValue),
 *     updated via refs at ~4Hz; never a typed constant.
 *   ['mouse:u'] — the REAL normalised cursor (window mousemove).
 *
 * Drop-out rule (height first, then width):
 *   bandHeight = 0            -> render nothing (existing budget rule)
 *   bandHeight < 100 (84 band)-> keyboard + readouts only: the mouse
 *     drops FIRST, then the hands (canvas draws only the desk line)
 *   width < 560               -> mouse drops (hands remain)
 *   otherwise                 -> hands shrink to the space left below
 *     the keyboard (box height capped at 100px) and the mouse shows
 *     only if it still fits right of the right hand.
 *
 * Pure decoration: aria-hidden, pointer-events: none, no handlers, no
 * focus. Colours come from the theme CSS variables (--dim, --chrome,
 * --accent, --line) read at draw time; `themeKey` forces a redraw on
 * theme change. The canvas is one static frame per draw in ALL modes
 * (the desk hands never animate, §1.7); under reduced motion the hand
 * readouts render their drift value at t=0 once with no interval,
 * while the mouse readout still updates — it is factual, not animation.
 * The legacy `steam` prop is accepted for interface compatibility and
 * ignored (there is no mug any more).
 */

export interface DeskStripProps {
  /** Changes whenever the active theme changes; forces a redraw with the new CSS variables. */
  themeKey?: string;
  /**
   * Explicit band height in px. When omitted, the viewport budget is
   * computed from the window size and kept live on resize. Pass this if the
   * integrator drives the height from the `--desk-h` CSS token instead.
   */
  height?: number;
  /** Legacy prop, kept for interface compatibility; ignored since §2.8. */
  steam?: boolean;
  style?: CSSProperties;
}

interface Palette {
  dim: string;
  chrome: string;
  accent: string;
  line: string;
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    dim: pick('--dim', '#6d6b66'),
    chrome: pick('--chrome', '#a9a49a'),
    accent: pick('--accent', '#ebe6db'),
    line: pick('--line', '#181818'),
  };
}

/* ------------------------------------------------------------------ */
/* Text-label keyboard (§2.8 rows, hard-coded as data).                */
/* ------------------------------------------------------------------ */

const KEY_ROWS: string[][] = [
  ['esc', '`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '⌫'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", '↵'],
  ['↑', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '↑'],
];

/** Keyboard block height: 4 rows at 14px, starting 6px below the band top. */
const KEYBOARD_TOP = 6;
const KEYBOARD_H = 4 * 14;

/* ------------------------------------------------------------------ */
/* Hand geometry — procedural, deterministic.                          */
/* 21 landmarks: 0 = wrist, then thumb / index / middle / ring /       */
/* pinky chains of 4 (base + 3 segments along a fanned direction).     */
/* ------------------------------------------------------------------ */

interface FingerSpec {
  base: [number, number];
  /** Fan direction, degrees from straight up; negative leans left. */
  angleDeg: number;
  lengths: [number, number, number];
}

const FINGERS: FingerSpec[] = [
  { base: [0.36, 0.76], angleDeg: -52, lengths: [0.14, 0.12, 0.1] }, // thumb
  { base: [0.37, 0.56], angleDeg: -14, lengths: [0.15, 0.13, 0.11] }, // index
  { base: [0.5, 0.53], angleDeg: 0, lengths: [0.17, 0.14, 0.12] }, // middle
  { base: [0.63, 0.56], angleDeg: 13, lengths: [0.15, 0.13, 0.11] }, // ring
  { base: [0.74, 0.63], angleDeg: 28, lengths: [0.12, 0.1, 0.09] }, // pinky
];

/** Standard hand topology: finger chains + palm links between bases. */
const HAND_LINKS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

function buildHandPoints(mirror: boolean): [number, number][] {
  const points: [number, number][] = [[0.5, 0.92]]; // wrist
  for (const finger of FINGERS) {
    let [x, y] = finger.base;
    points.push([x, y]);
    let angle = (finger.angleDeg * Math.PI) / 180;
    const bend = Math.sign(finger.angleDeg || 1) * ((2 * Math.PI) / 180);
    for (const len of finger.lengths) {
      x += Math.sin(angle) * len;
      y -= Math.cos(angle) * len;
      points.push([x, y]);
      angle += bend;
    }
  }
  return mirror ? points.map(([x, y]): [number, number] => [1 - x, y]) : points;
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  mirror: boolean,
  pal: Palette,
): void {
  // Thin bounding box — the only frame, in the hairline colour.
  ctx.lineWidth = 1;
  ctx.strokeStyle = pal.line;
  ctx.globalAlpha = 1;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w, box.h);

  const padX = 10;
  const padY = 6;
  const points = buildHandPoints(mirror).map(([u, v]) => [
    box.x + padX + u * (box.w - padX * 2),
    box.y + padY + v * (box.h - padY * 2),
  ]);

  // Connecting lines.
  ctx.strokeStyle = pal.dim;
  ctx.globalAlpha = 0.65;
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  for (const [a, b] of HAND_LINKS) {
    ctx.moveTo(points[a][0], points[a][1]);
    ctx.lineTo(points[b][0], points[b][1]);
  }
  ctx.stroke();

  // Landmark dots; fingertips get the accent.
  points.forEach(([px, py], k) => {
    const isTip = k > 0 && k % 4 === 0;
    ctx.fillStyle = isTip ? pal.accent : pal.chrome;
    ctx.globalAlpha = isTip ? 0.95 : 0.8;
    ctx.beginPath();
    ctx.arc(px, py, isTip ? 1.8 : 1.25, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawMouse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pal: Palette,
): void {
  const r = Math.min(12, w / 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = pal.dim;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.stroke();
  // Wheel line.
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 6);
  ctx.lineTo(x + w / 2, y + 15);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* Readout drift (§2.8): band ≈ 0.44–0.57, generated from real time.   */
/* ------------------------------------------------------------------ */

const HAND_PHASES = [0, 2.1];

function driftValue(t: number, phase: number): number {
  return 0.505 + 0.045 * Math.sin(t * 0.00031 + phase) + 0.02 * Math.sin(t * 0.0017 + phase * 2);
}

/* ------------------------------------------------------------------ */

const MOUSE_MIN_WIDTH = 560;
const HANDS_MIN_HEIGHT = 100;
const HAND_BOX_MAX_H = 100;

export const DeskStrip: FC<DeskStripProps> = ({ themeKey, height, style }) => {
  const reducedMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hand0Ref = useRef<HTMLSpanElement | null>(null);
  const hand1Ref = useRef<HTMLSpanElement | null>(null);
  const mouseRef = useRef<HTMLSpanElement | null>(null);

  const [autoHeight, setAutoHeight] = useState<number>(() =>
    typeof window === 'undefined' ? 0 : deskHeightForViewport(window.innerWidth, window.innerHeight),
  );

  // Live height budget (skipped when the integrator pins `height`).
  useEffect(() => {
    if (height !== undefined) return;
    const onResize = () => setAutoHeight(deskHeightForViewport(window.innerWidth, window.innerHeight));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [height]);

  const bandHeight = height ?? autoHeight;

  /* Canvas: hands + mouse. One static frame per draw (resize / theme /
   * height change) — no rAF loop in any motion mode. */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas || bandHeight <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w <= 0 || h <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const pal = readPalette();

      // Desk line — a hairline across the top edge of the band.
      ctx.lineWidth = 1;
      ctx.strokeStyle = pal.line;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0.5);
      ctx.lineTo(w, 0.5);
      ctx.stroke();

      // Drop-out: small band -> keyboard + readouts only.
      if (h < HANDS_MIN_HEIGHT) return;

      // Hands overlap the keyboard's lower edge and fill what is left.
      const handsTop = KEYBOARD_TOP + KEYBOARD_H - 14;
      const availH = h - handsTop - 8;
      if (availH < 30) return;
      const boxH = Math.min(availH, HAND_BOX_MAX_H);
      const boxY = handsTop + (availH - boxH) / 2;

      const gap = 18;
      const totalW = Math.min(w * 0.56, 480);
      const boxW = (totalW - gap) / 2;
      const startX = Math.max(8, (w - totalW) / 2 - 30);

      drawHand(ctx, { x: startX, y: boxY, w: boxW, h: boxH }, false, pal);
      drawHand(ctx, { x: startX + boxW + gap, y: boxY, w: boxW, h: boxH }, true, pal);

      // Mouse drops first: narrow widths and any overflow lose it.
      if (w >= MOUSE_MIN_WIDTH) {
        const mouseW = 30;
        const mouseH = 46;
        const mouseX = startX + totalW + 20;
        if (mouseX + mouseW <= w - 12) {
          drawMouse(ctx, mouseX, boxY + (boxH - mouseH) / 2, mouseW, mouseH, pal);
        }
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [bandHeight, themeKey]);

  /* Hand readouts: drift at ~4Hz via refs. Reduced motion renders the
   * t=0 value once (the initial JSX text) and starts no interval. */
  useEffect(() => {
    if (reducedMotion || bandHeight <= 0) return;
    const update = () => {
      const t = Date.now();
      if (hand0Ref.current) hand0Ref.current.textContent = driftValue(t, HAND_PHASES[0]).toFixed(6);
      if (hand1Ref.current) hand1Ref.current.textContent = driftValue(t, HAND_PHASES[1]).toFixed(6);
    };
    update();
    const id = window.setInterval(update, 250);
    return () => window.clearInterval(id);
  }, [reducedMotion, bandHeight]);

  /* Mouse readout: the real normalised cursor. Kept under reduced
   * motion — it is factual, not animation. */
  useEffect(() => {
    if (bandHeight <= 0) return;
    const onMove = (e: MouseEvent) => {
      if (!mouseRef.current) return;
      const x = e.clientX / Math.max(1, window.innerWidth);
      const y = e.clientY / Math.max(1, window.innerHeight);
      mouseRef.current.textContent = `${x.toFixed(3)} / ${y.toFixed(3)}`;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [bandHeight]);

  const readoutStyle: CSSProperties = {
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    fontSize: '10px',
    lineHeight: 1.5,
    color: 'var(--dim)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  };

  if (bandHeight <= 0) {
    return (
      <div
        ref={wrapRef}
        aria-hidden="true"
        style={{ position: 'relative', height: 0, pointerEvents: 'none', overflow: 'hidden', ...style }}
      />
    );
  }

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: 'relative',
        height: bandHeight,
        pointerEvents: 'none',
        overflow: 'hidden',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />

      {/* Text-label keyboard — plain DOM text, no keycap boxes. */}
      <div
        style={{
          position: 'absolute',
          top: KEYBOARD_TOP,
          left: '50%',
          transform: 'translateX(-54%)',
          textAlign: 'center',
          fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
          fontSize: '10px',
          lineHeight: '14px',
          color: 'var(--dim)',
        }}
      >
        {KEY_ROWS.map((row, r) => (
          <div key={r} style={{ whiteSpace: 'nowrap', letterSpacing: '0.08em' }}>
            {row.map((key, k) => (
              <span
                key={k}
                style={{
                  display: 'inline-block',
                  minWidth: key.length > 1 ? '22px' : '13px',
                  textAlign: 'center',
                }}
              >
                {key}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Readouts near the hands, at the strip's absolute corners. */}
      <div style={{ ...readoutStyle, position: 'absolute', left: '10px', bottom: '6px' }}>
        {"['hand0:u'] "}
        <span ref={hand0Ref}>{driftValue(0, HAND_PHASES[0]).toFixed(6)}</span>
      </div>
      <div
        style={{
          ...readoutStyle,
          position: 'absolute',
          right: '10px',
          bottom: '6px',
          textAlign: 'right',
        }}
      >
        <div>
          {"['hand1:u'] "}
          <span ref={hand1Ref}>{driftValue(0, HAND_PHASES[1]).toFixed(6)}</span>
        </div>
        <div>
          {"['mouse:u'] "}
          <span ref={mouseRef}>0.000 / 0.000</span>
        </div>
      </div>
    </div>
  );
};

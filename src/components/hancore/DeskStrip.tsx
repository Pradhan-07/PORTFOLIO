import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FC } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { deskHeightForViewport } from './deskHeight';

/**
 * DeskStrip (G6) — a decorative canvas "desk" band that forms the stage's
 * bottom grid row: the editor sits on a desk. Original line-art in the same
 * thin-stroke language as Karan's own WireframeHandsKeyboard — a notebook
 * with a linked-list doodle, a keyboard with wireframe hands, a mug, and a
 * potted sprout (a quiet AGRIFLOW nod).
 *
 * Pure decoration: aria-hidden, pointer-events: none, no handlers. It always
 * yields space to the buffer — the height budget below is the whole point:
 *
 *   width ≤ 640px (any height)  -> 0
 *   viewport height < 700px     -> 0
 *   height 700–849px            -> 84px  (6 cells)
 *   height 850–999px            -> 126px (9 cells)
 *   height ≥ 1000px, width > 640 -> 184px (cap)
 *
 * Colours come from the active theme's CSS variables on :root (--dim,
 * --chrome, --accent, --line), read at draw time; pass `themeKey` (e.g. the
 * theme name) so the strip redraws when the theme changes. The drawing is
 * static; the only motion is the mug's two-frame steam wisp, and only when
 * the user has not asked for reduced motion (G9).
 *
 * Object drop-out as width shrinks (fixed order): notebook first, then the
 * mug — keyboard + sprout are the last two standing.
 */

export interface DeskStripProps {
  /** Changes whenever the active theme changes; forces a redraw with the new CSS variables. */
  themeKey?: string;
  /**
   * Explicit band height in px. When omitted, the G6 viewport budget is
   * computed from the window size and kept live on resize. Pass this if the
   * integrator drives the height from the `--desk-h` CSS token instead.
   */
  height?: number;
  /** Draw the mug's steam wisp (two-frame, motion-gated). Default true. */
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

function readCellSize(): { cw: number; ch: number } {
  const cs = getComputedStyle(document.documentElement);
  const cw = parseFloat(cs.getPropertyValue('--cell-w'));
  const ch = parseFloat(cs.getPropertyValue('--cell-h'));
  return { cw: Number.isFinite(cw) && cw > 0 ? cw : 7.5, ch: Number.isFinite(ch) && ch > 0 ? ch : 14 };
}

/** Widths (px) below which objects drop out, in the fixed G6 order. */
const NOTEBOOK_MIN_WIDTH = 860;
const MUG_MIN_WIDTH = 560;

/* ------------------------------------------------------------------ */
/* Object drawings — all original, cell-unit geometry, single weight.  */
/* `baseline` is the shared desk baseline (~1 cell above band bottom). */
/* ------------------------------------------------------------------ */

/** A short handwriting squiggle: a deterministic sine stroke. */
function drawSquiggle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  seed: number,
): void {
  ctx.beginPath();
  const steps = Math.max(6, Math.floor(length / 2));
  for (let i = 0; i <= steps; i++) {
    const px = x + (length * i) / steps;
    const py = y + Math.sin(i * 0.9 + seed) * 0.9;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

/** One mini linked-list node (value cell + pointer cell), doodle-sized. */
function drawDoodleNode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.strokeRect(x, y, w, h);
  const divider = x + w * 0.62;
  ctx.beginPath();
  ctx.moveTo(divider, y);
  ctx.lineTo(divider, y + h);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + w * 0.8, y + h / 2, 1.1, 0, Math.PI * 2);
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.lineTo(x2 - 3, y - 2);
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 3, y + 2);
  ctx.stroke();
}

/** Object 1 — open notebook: handwriting on the left page, a linked-list doodle on the right. */
function drawNotebook(
  ctx: CanvasRenderingContext2D,
  leftPx: number,
  baseline: number,
  cw: number,
  ch: number,
  pal: Palette,
): void {
  const pageW = 5.4 * cw;
  const h = 3 * ch;
  const top = baseline - h;

  ctx.lineWidth = 1;
  ctx.strokeStyle = pal.dim;
  ctx.globalAlpha = 0.85;
  ctx.strokeRect(leftPx, top, pageW, h);
  ctx.strokeRect(leftPx + pageW + 0.2 * cw, top, pageW, h);
  // spine
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(leftPx + pageW + 0.1 * cw, top);
  ctx.lineTo(leftPx + pageW + 0.1 * cw, baseline);
  ctx.stroke();

  // handwriting — left page
  ctx.strokeStyle = pal.dim;
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 3; i++) {
    drawSquiggle(ctx, leftPx + 0.6 * cw, top + (0.75 + i * 0.7) * ch, 4 * cw, i * 1.7);
  }

  // linked-list doodle — right page: three nodes joined by arrows
  const pageX = leftPx + pageW + 0.2 * cw;
  const nodeW = 1.25 * cw;
  const nodeH = 0.85 * ch;
  const nodeY = top + 0.55 * ch;
  ctx.strokeStyle = pal.chrome;
  ctx.globalAlpha = 0.9;
  let nx = pageX + 0.35 * cw;
  for (let i = 0; i < 3; i++) {
    drawDoodleNode(ctx, nx, nodeY, nodeW, nodeH);
    if (i < 2) drawArrow(ctx, nx + nodeW + 1, nodeY + nodeH / 2, nx + nodeW + 0.42 * cw);
    nx += nodeW + 0.42 * cw;
  }
  ctx.strokeStyle = pal.dim;
  ctx.globalAlpha = 0.5;
  drawSquiggle(ctx, pageX + 0.5 * cw, top + 2.15 * ch, 3.6 * cw, 4.2);
  ctx.globalAlpha = 1;
}

/**
 * Object 2 — keyboard + wireframe hands, drawn in a 380×150 virtual box and
 * scaled to fit the band. An original, simplified schematic in the same
 * stroke language as Karan's WireframeHandsKeyboard (thin dim strokes,
 * joint dots, lettered keys) — hands hovering over the keys.
 */
function drawKeyboardAndHands(
  ctx: CanvasRenderingContext2D,
  centreX: number,
  baseline: number,
  scale: number,
  pal: Palette,
): void {
  const VW = 380;
  const VH = 150;
  ctx.save();
  ctx.translate(centreX - (VW / 2) * scale, baseline - VH * scale);
  ctx.scale(scale, scale);
  ctx.lineWidth = 1.1 / scale;

  // keys — three lettered rows
  const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  const keyW = 30;
  const keyH = 20;
  const gap = 6;
  ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  rows.forEach((row, r) => {
    const rowW = row.length * (keyW + gap) - gap;
    const startX = (VW - rowW) / 2 + r * 9;
    const y = r * (keyH + gap);
    for (let i = 0; i < row.length; i++) {
      const x = startX + i * (keyW + gap);
      ctx.strokeStyle = pal.dim;
      ctx.globalAlpha = 0.55;
      ctx.strokeRect(x, y, keyW, keyH);
      ctx.fillStyle = pal.chrome;
      ctx.globalAlpha = 0.75;
      ctx.fillText(row[i], x + keyW / 2, y + keyH / 2 + 0.5);
    }
  });

  // hands — palm outline + five 3-joint fingers each, joint dots like the original motif
  const drawHand = (hx: number) => {
    const hw = 150;
    const palmTop = 100;
    const palmBottom = 146;
    ctx.strokeStyle = pal.dim;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(hx + 10, palmBottom);
    ctx.lineTo(hx + 5, palmTop + 6);
    ctx.quadraticCurveTo(hx + hw / 2, palmTop - 8, hx + hw - 5, palmTop + 6);
    ctx.lineTo(hx + hw - 10, palmBottom);
    ctx.stroke();
    // thumb — one two-segment polyline on the inner side
    ctx.beginPath();
    ctx.moveTo(hx + 8, palmTop + 22);
    ctx.lineTo(hx - 4, palmTop + 8);
    ctx.lineTo(hx + 4, palmTop - 4);
    ctx.stroke();

    const spreads = [-11, -5, 0, 6, 11];
    const lengths = [24, 36, 40, 33, 21];
    for (let f = 0; f < 5; f++) {
      const bx = hx + 18 + f * ((hw - 36) / 4);
      const len = lengths[f];
      const spread = spreads[f];
      const jx = bx + spread * 0.35;
      const jy = palmTop - len * 0.55;
      const tx = bx + spread;
      const ty = palmTop - len;
      ctx.beginPath();
      ctx.moveTo(bx, palmTop + 2);
      ctx.lineTo(jx, jy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = pal.chrome;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(jx, jy, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tx, ty, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  drawHand(28);
  drawHand(202);
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** Object 3 — mug, with an optional two-frame steam wisp (phase 0/1). */
function drawMug(
  ctx: CanvasRenderingContext2D,
  rightPx: number,
  baseline: number,
  cw: number,
  ch: number,
  pal: Palette,
  steamPhase: 0 | 1 | null,
): void {
  const w = 3.2 * cw;
  const h = 2.4 * ch;
  const x = rightPx - w;
  const top = baseline - h;

  ctx.lineWidth = 1;
  ctx.strokeStyle = pal.chrome;
  ctx.globalAlpha = 0.9;
  // body (slightly rounded bottom corners, drawn with quadratics)
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, top + h - 3);
  ctx.quadraticCurveTo(x, baseline, x + 3, baseline);
  ctx.lineTo(x + w - 3, baseline);
  ctx.quadraticCurveTo(x + w, baseline, x + w, top + h - 3);
  ctx.lineTo(x + w, top);
  ctx.stroke();
  // rim
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + w, top);
  ctx.stroke();
  // handle
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(x + w + 0.42 * cw, top + h / 2, 0.55 * ch, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // saucer line
  ctx.strokeStyle = pal.dim;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(x - 0.4 * cw, baseline + 2.5);
  ctx.lineTo(x + w + 0.9 * cw, baseline + 2.5);
  ctx.stroke();

  // steam — two wavy wisps; the phase flips the curve direction (two-frame)
  if (steamPhase !== null) {
    ctx.strokeStyle = pal.dim;
    ctx.globalAlpha = 0.55;
    const dir = steamPhase === 0 ? 1 : -1;
    [0.9, 2.1].forEach((offsetCells, i) => {
      const sx = x + offsetCells * cw;
      const sway = dir * (i === 0 ? 2.5 : -2.5);
      ctx.beginPath();
      ctx.moveTo(sx, top - 0.35 * ch);
      ctx.quadraticCurveTo(sx + sway, top - 0.95 * ch, sx, top - 1.6 * ch);
      ctx.stroke();
    });
  }
  ctx.globalAlpha = 1;
}

/** Object 4 — potted sprout (AGRIFLOW nod). The strip's single --accent detail: the leaves. */
function drawSprout(
  ctx: CanvasRenderingContext2D,
  rightPx: number,
  baseline: number,
  cw: number,
  ch: number,
  pal: Palette,
): void {
  const cx = rightPx - 1.5 * cw;
  const potTopW = 3 * cw;
  const potBottomW = 2.1 * cw;
  const potH = 1.5 * ch;
  const potTop = baseline - potH;

  ctx.lineWidth = 1;
  ctx.strokeStyle = pal.chrome;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(cx - potTopW / 2, potTop);
  ctx.lineTo(cx + potTopW / 2, potTop);
  ctx.lineTo(cx + potBottomW / 2, baseline);
  ctx.lineTo(cx - potBottomW / 2, baseline);
  ctx.closePath();
  ctx.stroke();
  // soil line
  ctx.strokeStyle = pal.dim;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx - potTopW / 2 + 2, potTop + 3);
  ctx.lineTo(cx + potTopW / 2 - 2, potTop + 3);
  ctx.stroke();

  // stem
  const stemTop = potTop - 1.25 * ch;
  ctx.strokeStyle = pal.chrome;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(cx, potTop);
  ctx.quadraticCurveTo(cx + 1.5, potTop - 0.7 * ch, cx, stemTop);
  ctx.stroke();

  // two leaves — the desk's one accent detail
  ctx.strokeStyle = pal.accent;
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); // left leaf
  ctx.moveTo(cx, stemTop + 2);
  ctx.quadraticCurveTo(cx - 1.5 * cw, stemTop - 0.55 * ch, cx - 1.7 * cw, stemTop - 1.15 * ch);
  ctx.quadraticCurveTo(cx - 0.7 * cw, stemTop - 0.5 * ch, cx, stemTop + 2);
  ctx.stroke();
  ctx.beginPath(); // right leaf
  ctx.moveTo(cx, stemTop + 2);
  ctx.quadraticCurveTo(cx + 1.5 * cw, stemTop - 0.55 * ch, cx + 1.7 * cw, stemTop - 1.15 * ch);
  ctx.quadraticCurveTo(cx + 0.7 * cw, stemTop - 0.5 * ch, cx, stemTop + 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */

export const DeskStrip: FC<DeskStripProps> = ({ themeKey, height, steam = true, style }) => {
  const reducedMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
  const steamEnabled = steam && !reducedMotion;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas || bandHeight <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let steamPhase: 0 | 1 = 0;
    let intervalId: number | undefined;

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
      const { cw, ch } = readCellSize();
      const baseline = h - ch;

      // desk line — a hairline across the top edge of the band
      ctx.lineWidth = 1;
      ctx.strokeStyle = pal.line;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0.5);
      ctx.lineTo(w, 0.5);
      ctx.stroke();

      const showNotebook = w >= NOTEBOOK_MIN_WIDTH;
      const showMug = w >= MUG_MIN_WIDTH;

      if (showNotebook) drawNotebook(ctx, 4 * cw, baseline, cw, ch, pal);

      // keyboard + hands, centred-left (recentres when the notebook drops out)
      const heightScale = (baseline - 4) / 150;
      const widthScale = (w * 0.66) / 380;
      const scale = Math.max(0.28, Math.min(heightScale, widthScale, 1.1));
      drawKeyboardAndHands(ctx, showNotebook ? w * 0.47 : w * 0.5, baseline, scale, pal);

      if (showMug) {
        drawMug(ctx, w - 6 * cw, baseline, cw, ch, pal, steamEnabled ? steamPhase : null);
      }
      drawSprout(ctx, w - 2 * cw, baseline, cw, ch, pal);
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(wrap);

    // Two-frame steam: alternate the wisp phase on a slow tick. Skipped
    // entirely under reduced motion — the desk is then one static frame.
    if (steamEnabled) {
      intervalId = window.setInterval(() => {
        if (document.hidden) return;
        steamPhase = steamPhase === 0 ? 1 : 0;
        draw();
      }, 700);
    }

    return () => {
      observer.disconnect();
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [bandHeight, themeKey, steamEnabled]);

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
      {bandHeight > 0 && (
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        />
      )}
    </div>
  );
};

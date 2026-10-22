import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/**
 * Phase 7 — "the watching glyph": an original ASCII eye for the right
 * margin of the about.tsx buffer.
 *
 * The eye is drawn parametrically, in code, from an almond (vesica)
 * equation — no artwork, no traced shapes, no face data. Each frame is
 * a 29×13 character grid: the almond boundary is classified per cell
 * (slope-based outline characters, pointed tips), the iris is an
 * ellipse clipped to the almond, the pupil a solid block. The pupil's
 * cell offset follows the visitor's real cursor (rAF-throttled mouse
 * tracking, offsets quantised to whole cells and clamped), so the one
 * thing it claims — that it watches the cursor — is simply true.
 *
 * Placement is earned, not assumed. The glyph renders only when ALL
 * of these hold:
 *   - the viewport is at least 1150px wide;
 *   - the About pane is actually on screen (it stays mounted but
 *     hidden for other files — a zero-size pane fails the measure);
 *   - a runtime measurement finds real empty margin: the whoami
 *     paragraph's right edge (the widest text in the opener, capped at
 *     76ch in DashboardPortfolio) must leave at least EYE_W + 16px of
 *     pane width to its right. If in doubt, it hides.
 * Vertically it aligns to the whoami paragraph's top, so its band is
 * the opener's own rows — the full-width cockpit graph above and the
 * sections below are never underneath it.
 *
 * Etiquette: aria-hidden, pointer-events none, theme-var colour,
 * no layout or scroll influence (position absolute inside the pane),
 * tracking pauses while the tab is hidden, and under reduced motion
 * it renders once with a centred pupil and never tracks.
 */

const COLS = 29;
const ROWS = 13;
/** Monospace advance at the glyph's 10px size (IBM Plex Mono ≈ 0.6em). */
const CELL_W_PX = 6;
const EYE_W = COLS * CELL_W_PX; // 174px
const MIN_VIEWPORT_W = 1150;
const MIN_FREE_PX = EYE_W + 16;
const MAX_OX = 3; // pupil travel, in cells
const MAX_OY = 1;

/** Almond half-height (normalised) at normalised x ∈ [−1, 1]. */
const almondHalf = (cxN: number) => Math.pow(Math.max(0, 1 - cxN * cxN), 0.62);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Build the 13 text rows for a pupil at cell offset (ox, oy). */
function buildEye(ox: number, oy: number): string[] {
  const midX = (COLS - 1) / 2;
  const midY = (ROWS - 1) / 2;
  const irisCx = midX + ox;
  const irisCy = midY + oy;
  // Iris/pupil radii in CELL units. Cells are ~6px wide × 14px tall
  // (the buffer's --cell-h), so the radii compensate: equal visual
  // size needs ry ≈ rx · 6/14.
  const IRIS_RX = 5.0;
  const IRIS_RY = 2.2;
  const PUPIL_RX = 2.1;
  const PUPIL_RY = 1.0;

  const inside = (x: number, y: number) => {
    const cxN = (x - midX) / midX;
    const cyN = (y - midY) / midY;
    return Math.abs(cyN) <= almondHalf(cxN);
  };
  const inIris = (x: number, y: number) => {
    const dx = (x - irisCx) / IRIS_RX;
    const dy = (y - irisCy) / IRIS_RY;
    return dx * dx + dy * dy <= 1;
  };
  const inPupil = (x: number, y: number) => {
    const dx = (x - irisCx) / PUPIL_RX;
    const dy = (y - irisCy) / PUPIL_RY;
    return dx * dx + dy * dy <= 1;
  };

  const rows: string[] = [];
  for (let y = 0; y < ROWS; y++) {
    let row = '';
    for (let x = 0; x < COLS; x++) {
      if (!inside(x, y)) {
        row += ' ';
        continue;
      }
      const isBoundary =
        !inside(x, y - 1) || !inside(x, y + 1) || !inside(x - 1, y) || !inside(x + 1, y);
      if (isBoundary) {
        const cxN = (x - midX) / midX;
        if (cxN < -0.93) row += '<';
        else if (cxN > 0.93) row += '>';
        else if (!inside(x, y - 1) || !inside(x, y + 1)) {
          // Top or bottom arc: pick the glyph by the arc's local slope
          // (in rows per column) so the curve reads as a curve.
          const slope =
            (almondHalf((x + 1 - midX) / midX) - almondHalf((x - 1 - midX) / midX)) * midY * 0.5;
          const top = !inside(x, y - 1);
          if (slope > 0.45) row += top ? '\\' : '/';
          else if (slope < -0.45) row += top ? '/' : '\\';
          else row += top ? '_' : '¯';
        } else {
          row += '·'; // side wall cell (rounding of the almond edge)
        }
        continue;
      }
      if (inPupil(x, y)) {
        row += '█';
        continue;
      }
      if (inIris(x, y)) {
        const irisEdge = !inIris(x, y - 1) || !inIris(x, y + 1) || !inIris(x - 1, y) || !inIris(x + 1, y);
        row += irisEdge ? 'o' : ' ';
        continue;
      }
      // Sclera: a sparse dot texture so the surface reads as a surface.
      row += (x * 3 + y * 5) % 7 === 0 ? '·' : ' ';
    }
    rows.push(row);
  }
  return rows;
}

interface GlyphPlacement {
  top: number;
  visible: boolean;
}

export const WatchingGlyph: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [wideEnough, setWideEnough] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth >= MIN_VIEWPORT_W
  );
  const [placement, setPlacement] = useState<GlyphPlacement>({ top: 0, visible: false });
  const [staticRows] = useState<string>(() => buildEye(0, 0).join('\n'));

  // Viewport gate (≥1150px).
  useEffect(() => {
    const onResize = () => setWideEnough(window.innerWidth >= MIN_VIEWPORT_W);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Margin gate: measure the whoami paragraph against the pane. Runs
  // on mount, on pane resize (which also fires when the pane unhides),
  // and on window resize. Any doubt → hidden.
  useLayoutEffect(() => {
    // When the viewport gate closes, `show` below already hides the
    // glyph (it ANDs wideEnough in); the stale placement is simply
    // re-measured the next time the gate opens.
    if (!wideEnough) return;
    const wrap = wrapRef.current;
    const pane = wrap?.parentElement;
    if (!wrap || !pane) return;

    const measure = () => {
      const para = pane.querySelector<HTMLElement>('.whoami-block p');
      if (!para) {
        setPlacement((p) => (p.visible ? { top: p.top, visible: false } : p));
        return;
      }
      const paneRect = pane.getBoundingClientRect();
      const paraRect = para.getBoundingClientRect();
      if (paneRect.width === 0 || paraRect.width === 0) {
        setPlacement((p) => (p.visible ? { top: p.top, visible: false } : p));
        return;
      }
      const free = paneRect.right - paraRect.right;
      const top = paraRect.top - paneRect.top;
      setPlacement((prev) => {
        const next = { top, visible: free >= MIN_FREE_PX };
        return prev.top === next.top && prev.visible === next.visible ? prev : next;
      });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(pane);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [wideEnough]);

  const show = wideEnough && placement.visible;

  // Cursor tracking: mousemove feeds a dirty flag; a single rAF chain
  // (running only while shown, motion-allowed, and the tab is visible)
  // recomputes the quantised pupil offset and writes the <pre> directly
  // — no React re-render per frame. Resting state is the centred pupil
  // painted by React (staticRows).
  useEffect(() => {
    if (!show || reducedMotion) return;
    const pre = preRef.current;
    if (!pre) return;

    let rafId = 0;
    let running = false;
    let mouseX = 0;
    let mouseY = 0;
    let hasMouse = false;
    let curOx = 0;
    let curOy = 0;

    const frame = () => {
      rafId = requestAnimationFrame(frame);
      if (!hasMouse) return;
      const rect = pre.getBoundingClientRect();
      if (rect.width === 0) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const ox = clamp(Math.round((mouseX - cx) / 90), -MAX_OX, MAX_OX);
      const oy = clamp(Math.round((mouseY - cy) / 90), -MAX_OY, MAX_OY);
      if (ox === curOx && oy === curOy) return;
      curOx = ox;
      curOy = oy;
      pre.textContent = buildEye(ox, oy).join('\n');
    };
    const start = () => {
      if (running || document.hidden) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      hasMouse = true;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => {
      stop();
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      // Restore the resting (centred) pupil for the next activation.
      pre.textContent = buildEye(0, 0).join('\n');
    };
  }, [show, reducedMotion]);

  if (!show) return null;

  return (
    <div
      ref={wrapRef}
      className="watching-glyph"
      aria-hidden="true"
      style={{
        position: 'absolute',
        right: '6px',
        top: `${placement.top}px`,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 2,
      }}
    >
      <pre
        ref={preRef}
        style={{
          margin: 0,
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '10px',
          lineHeight: 'var(--cell-h)',
          color: 'var(--dim)',
          whiteSpace: 'pre',
        }}
      >
        {staticRows}
      </pre>
    </div>
  );
};

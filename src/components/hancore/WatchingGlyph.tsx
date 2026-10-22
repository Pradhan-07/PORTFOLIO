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
 * Placement is earned, not assumed — but the measuring instrument is
 * always in the DOM. The wrapper renders unconditionally (held at
 * display:none until a placement is proven) because the measurement
 * effect reaches the pane through the wrapper's ref: the first
 * version returned null until the measurement succeeded, which meant
 * the ref was never set, the measurement never ran, and the glyph
 * could never appear at any viewport. The glyph shows only when ALL
 * of these hold:
 *   - the viewport is at least 1150px wide;
 *   - the About pane is actually on screen (it stays mounted but
 *     hidden for other files — a zero-size pane fails the measure);
 *   - a runtime measurement finds real empty margin to the right of
 *     the whoami text column: at least EYE_W + 16px of pane width.
 * The column is measured against a dedicated anchor —
 * [data-watching-anchor] on the whoami paragraph in
 * DashboardPortfolio (the opener's widest text, capped at 76ch). If
 * that anchor is ever missing, a fallback derives the column from
 * the .whoami-block box plus the same 76ch cap (IBM Plex Mono's fixed
 * 0.6em advance) instead of giving up; the glyph hides only when no
 * measurement can prove the room is there.
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
/** Fallback column estimate, used only when the anchor is missing:
 *  the whoami paragraph's 76ch cap, and IBM Plex Mono's fixed advance
 *  (0.6em — corroborated by the --cell-w token: 7.5px at the block's
 *  12.5px font size). */
const TEXT_COL_CH = 76;
const CH_ADVANCE_EM = 0.6;
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

  // Margin gate: measure the whoami text column against the pane.
  // Runs on mount, on pane resize (which also fires when the pane
  // unhides), on window resize, and once webfonts settle (the
  // paragraph's ch cap resolves in the loaded font's metrics).
  // Primary source is the [data-watching-anchor] paragraph in
  // DashboardPortfolio; the .whoami-block box plus the 76ch cap is
  // the fallback. The glyph hides only when no measurable text
  // reference exists at all, or the measured room is genuinely short.
  useLayoutEffect(() => {
    // When the viewport gate closes, `show` below already hides the
    // glyph (it ANDs wideEnough in); the stale placement is simply
    // re-measured the next time the gate opens.
    if (!wideEnough) return;
    const wrap = wrapRef.current;
    const pane = wrap?.parentElement;
    if (!wrap || !pane) return;

    const hide = () =>
      setPlacement((p) => (p.visible ? { top: p.top, visible: false } : p));

    const measure = () => {
      const paneRect = pane.getBoundingClientRect();
      if (paneRect.width === 0) {
        hide();
        return;
      }

      let textRight: number | null = null;
      let top: number | null = null;

      const anchor = pane.querySelector<HTMLElement>('[data-watching-anchor]');
      if (anchor) {
        const anchorRect = anchor.getBoundingClientRect();
        if (anchorRect.width > 0) {
          textRight = anchorRect.right;
          top = anchorRect.top - paneRect.top;
        }
      }

      if (textRight === null || top === null) {
        // Fallback: the whoami block's box is real DOM geometry, and
        // the text column inside it is capped at TEXT_COL_CH ch; IBM
        // Plex Mono's fixed advance turns that cap into pixels. If
        // the block is narrower than the cap, the text fills the
        // block and its right edge is the column's edge.
        const block = pane.querySelector<HTMLElement>('.whoami-block');
        const blockRect = block?.getBoundingClientRect();
        if (block && blockRect && blockRect.width > 0) {
          const fontSize = parseFloat(getComputedStyle(block).fontSize) || 12.5;
          const columnW = TEXT_COL_CH * CH_ADVANCE_EM * fontSize;
          textRight = Math.min(blockRect.left + columnW, blockRect.right);
          top = blockRect.top - paneRect.top;
        }
      }

      if (textRight === null || top === null) {
        hide();
        return;
      }
      const free = paneRect.right - textRight;
      setPlacement((prev) => {
        const next = { top, visible: free >= MIN_FREE_PX };
        return prev.top === next.top && prev.visible === next.visible ? prev : next;
      });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(pane);
    window.addEventListener('resize', measure);
    // A measurement taken before the webfont arrives uses fallback
    // font metrics (a wider ch can shrink the computed margin), so
    // re-measure once fonts settle.
    let fontsLive = true;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (fontsLive) measure();
      });
    }
    return () => {
      fontsLive = false;
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

  // The wrapper ALWAYS renders: the measurement effect above reaches
  // the pane through wrapRef, so returning null while unplaced would
  // starve the very measurement that could place the glyph (the
  // original Phase 7 bug — the eye could never appear). Until a
  // placement is proven, the wrapper is display:none: zero visual,
  // layout, or scroll presence, exactly as if it had returned null.
  return (
    <div
      ref={wrapRef}
      className="watching-glyph"
      aria-hidden="true"
      style={{
        display: show ? 'block' : 'none',
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

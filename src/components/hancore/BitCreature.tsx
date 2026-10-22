import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/**
 * BitCreature (G7) — "Bit, the stray node": an original ambient creature for
 * Karan's editor. Bit is a linked-list node that fell off its list — a small
 * box with a value cell (holding `1`) and a pointer cell, a `next`-arrow
 * tail, and one eye. Deliberately NOT the reference site's worm/eye/ghost:
 * different concept, different drawing, different behaviour.
 *
 * Behaviour (state machine, v1 exactly as spec'd):
 *   sleeping  Not rendered on stage. The den button in the bar shows `z`.
 *   waking    200ms pop-in at the den (bottom-right, just above the bar).
 *   roaming   Idle 1.2–2.5s (eye glances), then a parabolic hop of 3–5 cells
 *             (~350ms, ~1.5 cells high). Reverses at stage edges. Confined
 *             to the bottom band — it never crosses reading content.
 *   resting   After 4–7 hops or ~25s of roaming: sits 4–6s, blinks twice,
 *             then roams again.
 *   auto-sleep After 75s awake, Bit hops back to the den and sleeps on
 *             arrival. Esc / den toggle / leaving to the intro also sleep it.
 *
 * Rendering: one full-stage overlay canvas, pointer-events: none, z-index
 * below header/bar chrome and modals (default 5 — see INTEGRATION.md),
 * aria-hidden, never focusable. requestAnimationFrame runs ONLY while awake;
 * the loop pauses while the tab is hidden and resumes without time jumps.
 *
 * Reduced motion (G9): Bit never animates. Waking draws ONE static frame of
 * Bit sitting beside the den and the reported state is `resting`, so the bar
 * reads `NODE: resting`. Esc/toggle still dismisses.
 *
 * Control model: the parent owns `awake` (the den button in the status bar
 * toggles it). BitCreature reports every state transition through
 * `onStateChange` so the bar can render `NODE: <state>` in the same render
 * cycle, and asks the parent to sleep it (auto-sleep / Esc) through
 * `onAwakeChange(false)`.
 */

export type BitState = 'sleeping' | 'waking' | 'roaming' | 'resting';

export interface BitCreatureProps {
  /** Controlled awake flag — toggled by the den button in the bottom bar. */
  awake: boolean;
  /** Called when Bit itself decides to sleep (auto-sleep arrival, Esc). */
  onAwakeChange?: (awake: boolean) => void;
  /** Called on every state transition, for the bar's `NODE: …` readout. */
  onStateChange?: (state: BitState) => void;
  /**
   * When true, Bit's Esc-to-sleep stands down. The integrator passes this
   * while a modal / terminal / palette is open, so Esc closes that overlay
   * first (the G4 guard order) instead of sleeping Bit behind it.
   */
  suspendEsc?: boolean;
  /** Changes whenever the active theme changes; refreshes the palette. */
  themeKey?: string;
  /** Overlay z-index. Default 5: above the buffer (0/1), below header (50), bar (60) and modals. */
  zIndex?: number;
  /**
   * Px from the stage bottom to Bit's ground line. Default: `--desk-h` +
   * `--bar-h` read from :root (Bit walks the bottom of the workspace, on top
   * of the bar, above the desk). Pass an explicit value to override.
   */
  bottomInsetPx?: number;
}

export interface DenButtonProps {
  awake: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * The den control (G7): a real button for the bottom bar's readout zone.
 * Label `▸ den`; while Bit sleeps it also shows a tiny `z` glyph.
 * aria-pressed mirrors the awake state; both aria-labels are spec-fixed.
 * Keyboard: reachable by Tab in the bar's region cycle, Enter/Space toggles
 * (native button behaviour). Style it with the bar's button classes — the
 * integrator should keep it ≥44px tall under `(hover: none)` per G10.
 */
export const DenButton: FC<DenButtonProps> = ({ awake, onToggle, className }) => (
  <button
    type="button"
    className={className}
    data-tip="wake the node"
    aria-label={awake ? 'Put Bit back to sleep' : 'Wake Bit, the stray node'}
    aria-pressed={awake}
    onClick={onToggle}
  >
    {'▸ den'}
    {!awake && (
      <span aria-hidden="true" style={{ opacity: 0.6, fontSize: '0.8em', marginLeft: 4 }}>
        z
      </span>
    )}
  </button>
);

/* ------------------------------------------------------------------ */

const HOP_MS = 350;
const WAKE_MS = 200;
const AUTO_SLEEP_MS = 75_000;
const ROAM_BEFORE_REST_MS = 25_000;

interface Palette {
  chrome: string;
  accent: string;
  dim: string;
  line: string;
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    chrome: pick('--chrome', '#a9a49a'),
    accent: pick('--accent', '#ebe6db'),
    dim: pick('--dim', '#6d6b66'),
    line: pick('--line', '#181818'),
  };
}

function readVarPx(name: string, fallback: number): number {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

function readCellSize(): { cw: number; ch: number } {
  const cw = readVarPx('--cell-w', 7.5);
  const ch = readVarPx('--cell-h', 14);
  return { cw: cw > 0 ? cw : 7.5, ch: ch > 0 ? ch : 14 };
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

interface Machine {
  state: BitState;
  xCells: number;
  dir: 1 | -1;
  mode: 'idle' | 'hop';
  phaseEndsAt: number;
  hopFrom: number;
  hopTo: number;
  hopStart: number;
  wakeStart: number;
  awakeSince: number;
  roamingSince: number;
  restStart: number;
  hopsSinceRest: number;
  restAfterHops: number;
  returning: boolean;
}

/**
 * Draw Bit centred at (cxPx, groundPx). `dir` is the facing direction (the
 * pointer cell + tail lead). `liftPx` raises the tail mid-hop; `eyeMode`
 * covers open / glancing / blinked-shut.
 */
function drawBit(
  ctx: CanvasRenderingContext2D,
  cxPx: number,
  groundPx: number,
  dir: 1 | -1,
  cw: number,
  ch: number,
  pal: Palette,
  opts: { alpha: number; popScale: number; liftPx: number; eye: 'open' | 'shut'; glancePx: number },
): void {
  const w = 4 * cw; // value cell 2.6 cells + pointer cell 1.4 cells
  const h = 2 * ch;
  ctx.save();
  ctx.globalAlpha = opts.alpha;
  ctx.translate(cxPx, groundPx);
  ctx.scale(dir * opts.popScale, opts.popScale);
  ctx.translate(-w / 2, -h);

  // body — value cell filled with --line, pointer cell open
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = pal.chrome;
  ctx.fillStyle = pal.line;
  ctx.fillRect(0, 0, 2.6 * cw, h);
  ctx.strokeRect(0, 0, w, h);
  ctx.beginPath();
  ctx.moveTo(2.6 * cw, 0);
  ctx.lineTo(2.6 * cw, h);
  ctx.stroke();

  // the value Bit carries: `1`
  ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = pal.dim;
  ctx.fillText('1', 0.8 * cw, h / 2 + 0.5);

  // pointer dot in the pointer cell
  ctx.fillStyle = pal.chrome;
  ctx.beginPath();
  ctx.arc(3.3 * cw, h / 2, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // eye — in the value cell, right of the digit
  if (opts.eye === 'shut') {
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(1.85 * cw - 2.4, h / 2);
    ctx.lineTo(1.85 * cw + 2.4, h / 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.arc(1.85 * cw + opts.glancePx, h / 2, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // `next` tail — an arrow out of the pointer cell, lifting mid-hop
  const tailY = h / 2 - opts.liftPx;
  ctx.strokeStyle = pal.chrome;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w, h / 2);
  ctx.lineTo(w + 1.3 * cw, tailY);
  ctx.lineTo(w + 1.3 * cw - 3.5, tailY - 2.6);
  ctx.moveTo(w + 1.3 * cw, tailY);
  ctx.lineTo(w + 1.3 * cw - 3.5, tailY + 2.6);
  ctx.stroke();

  ctx.restore();
}

/* ------------------------------------------------------------------ */

export const BitCreature: FC<BitCreatureProps> = ({
  awake,
  onAwakeChange,
  onStateChange,
  suspendEsc = false,
  themeKey,
  zIndex = 5,
  bottomInsetPx,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paletteRef = useRef<Palette>(readPalette());

  // Callbacks in refs so the animation loop never restarts on re-render.
  const callbacksRef = useRef({ onAwakeChange, onStateChange });
  useEffect(() => {
    callbacksRef.current = { onAwakeChange, onStateChange };
  }, [onAwakeChange, onStateChange]);

  // Refresh the palette when the theme changes (no state reset).
  useEffect(() => {
    paletteRef.current = readPalette();
  }, [themeKey]);

  // Esc dismisses from anywhere — unless the integrator says an overlay
  // owns Esc right now (G4 guard order), via `suspendEsc`.
  useEffect(() => {
    if (!awake || suspendEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') callbacksRef.current.onAwakeChange?.(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [awake, suspendEsc]);

  /* Sleeping / reduced-motion states -------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!awake) {
      callbacksRef.current.onStateChange?.('sleeping');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    if (!reducedMotion) return; // the animated machine below owns this case

    // Reduced motion: one static frame of Bit sitting beside the den.
    callbacksRef.current.onStateChange?.('resting');
    const drawStatic = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w <= 0 || h <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const { cw, ch } = readCellSize();
      const inset = bottomInsetPx ?? readVarPx('--desk-h', 0) + readVarPx('--bar-h', 46);
      const ground = h - inset;
      const denCx = w - 4 * cw; // box centre: right edge 2 cells from the stage edge
      drawBit(ctx, denCx, ground, -1, cw, ch, paletteRef.current, {
        alpha: 1,
        popScale: 1,
        liftPx: 0,
        eye: 'open',
        glancePx: 0,
      });
    };
    drawStatic();
    const observer = new ResizeObserver(drawStatic);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [awake, reducedMotion, themeKey, bottomInsetPx]);

  /* Animated machine -------------------------------------------------- */
  useEffect(() => {
    if (!awake || reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    paletteRef.current = readPalette();
    const { cw, ch } = readCellSize();
    const sizeRef = { w: canvas.clientWidth, h: canvas.clientHeight };

    const denLeftCells = () => sizeRef.w / cw - 6; // box left edge at the den
    const startNow = performance.now();
    const m: Machine = {
      state: 'waking',
      xCells: denLeftCells(),
      dir: -1,
      mode: 'idle',
      phaseEndsAt: startNow + WAKE_MS,
      hopFrom: denLeftCells(),
      hopTo: denLeftCells(),
      hopStart: startNow,
      wakeStart: startNow,
      awakeSince: startNow,
      roamingSince: startNow,
      restStart: startNow,
      hopsSinceRest: 0,
      restAfterHops: randInt(4, 7),
      returning: false,
    };
    callbacksRef.current.onStateChange?.('waking');

    let rafId = 0;
    let running = true;
    let hiddenAt: number | null = null;

    const report = (s: BitState) => {
      if (m.state !== s) {
        m.state = s;
        callbacksRef.current.onStateChange?.(s);
      }
    };

    const sleepNow = () => {
      running = false;
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      callbacksRef.current.onStateChange?.('sleeping');
      callbacksRef.current.onAwakeChange?.(false);
    };

    const planIdle = (now: number) => {
      m.mode = 'idle';
      m.phaseEndsAt = now + (m.returning ? 250 : rand(1200, 2500));
    };

    const planHop = (now: number) => {
      const totalCells = sizeRef.w / cw;
      const minX = 0.7;
      const maxX = totalCells - 5.6; // box (4) + tail (1.3) + margin
      let widthCells = rand(3, 5);
      if (m.returning) {
        const dist = denLeftCells() - m.xCells;
        if (Math.abs(dist) <= 0.6) {
          sleepNow();
          return;
        }
        m.dir = dist > 0 ? 1 : -1;
        widthCells = Math.min(widthCells, Math.abs(dist));
      }
      let target = m.xCells + m.dir * widthCells;
      if (target < minX || target > maxX) {
        m.dir = m.dir === 1 ? -1 : 1;
        target = m.xCells + m.dir * widthCells;
        target = Math.max(minX, Math.min(maxX, target));
      }
      m.hopFrom = m.xCells;
      m.hopTo = target;
      m.hopStart = now;
      m.mode = 'hop';
    };

    const frame = (now: number) => {
      if (!running) return;
      rafId = requestAnimationFrame(frame);

      const w = sizeRef.w;
      const h = sizeRef.h;
      if (w <= 0 || h <= 0) return;
      const pal = paletteRef.current;
      const inset = bottomInsetPx ?? readVarPx('--desk-h', 0) + readVarPx('--bar-h', 46);
      const ground = h - inset;

      /* --- state transitions --- */
      if (m.state === 'waking' && now >= m.wakeStart + WAKE_MS) {
        report('roaming');
        m.roamingSince = now;
        planIdle(now);
      } else if (m.state === 'roaming') {
        if (!m.returning && now - m.awakeSince >= AUTO_SLEEP_MS) {
          m.returning = true;
          planIdle(now);
        }
        if (m.mode === 'idle' && now >= m.phaseEndsAt) {
          if (
            !m.returning &&
            (m.hopsSinceRest >= m.restAfterHops || now - m.roamingSince >= ROAM_BEFORE_REST_MS)
          ) {
            report('resting');
            m.restStart = now;
            m.phaseEndsAt = now + rand(4000, 6000);
          } else {
            planHop(now);
          }
        } else if (m.mode === 'hop') {
          const p = Math.min(1, (now - m.hopStart) / HOP_MS);
          m.xCells = m.hopFrom + (m.hopTo - m.hopFrom) * p;
          if (p >= 1) {
            m.xCells = m.hopTo;
            m.hopsSinceRest += 1;
            if (m.returning && Math.abs(denLeftCells() - m.xCells) <= 0.6) {
              sleepNow();
              return;
            }
            planIdle(now);
          }
        }
      } else if (m.state === 'resting') {
        if (!m.returning && now - m.awakeSince >= AUTO_SLEEP_MS) m.returning = true;
        if (now >= m.phaseEndsAt) {
          report('roaming');
          m.hopsSinceRest = 0;
          m.restAfterHops = randInt(4, 7);
          m.roamingSince = now;
          planIdle(now);
        }
      }

      /* --- draw --- */
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      let alpha = 1;
      let popScale = 1;
      let liftPx = 0;
      let yOffset = 0;
      let eye: 'open' | 'shut' = 'open';
      let glancePx = 0;

      if (m.state === 'waking') {
        const p = Math.min(1, (now - m.wakeStart) / WAKE_MS);
        alpha = p;
        popScale = 0.7 + 0.3 * p;
      } else if (m.state === 'roaming') {
        if (m.mode === 'hop') {
          const p = Math.min(1, (now - m.hopStart) / HOP_MS);
          yOffset = -Math.sin(Math.PI * p) * 1.5 * ch;
          liftPx = Math.sin(Math.PI * p) * 6;
        } else {
          glancePx = ((Math.floor(now / 800) % 3) - 1) * 1.6;
        }
      } else if (m.state === 'resting') {
        const t = now - m.restStart;
        if ((t > 900 && t < 1060) || (t > 2400 && t < 2560)) eye = 'shut';
      }

      const cxPx = (m.xCells + 2) * cw; // xCells tracks the box's left edge
      drawBit(ctx, cxPx, ground + yOffset, m.dir, cw, ch, pal, {
        alpha,
        popScale,
        liftPx,
        eye,
        glancePx,
      });
    };
    rafId = requestAnimationFrame(frame);

    const observer = new ResizeObserver(() => {
      sizeRef.w = canvas.clientWidth;
      sizeRef.h = canvas.clientHeight;
      const maxX = sizeRef.w / cw - 5.6;
      if (m.xCells > maxX) m.xCells = Math.max(0.7, maxX);
    });
    observer.observe(canvas);

    // Pause on hidden tab; on return, shift every timestamp by the hidden
    // duration so Bit is exactly where (and when) you left it.
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = performance.now();
        cancelAnimationFrame(rafId);
      } else if (hiddenAt !== null && running) {
        const delta = performance.now() - hiddenAt;
        hiddenAt = null;
        m.phaseEndsAt += delta;
        m.hopStart += delta;
        m.wakeStart += delta;
        m.awakeSince += delta;
        m.roamingSince += delta;
        m.restStart += delta;
        rafId = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [awake, reducedMotion, bottomInsetPx]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      tabIndex={-1}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        zIndex,
      }}
    />
  );
};

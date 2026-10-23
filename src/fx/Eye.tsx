import React, { useEffect, useRef } from 'react';
import { useCreatureBus } from './creatureBus';
import { eyeStore, publishEyeGeometry } from './eyeStore';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/**
 * The EYE (DESIGN-SPEC §2.4, Phase 9 Step 3) — an original canvas
 * dot-grid eye for the editor's eye zone, plus its stage-level tether.
 *
 * Form: an open ellipse ring (~100×85) sampled analytically from a
 * 5px dot grid (dots kept where they fall on the ring band), a denser
 * dark dotted disc for the pupil, and a corner-bracket frame — all
 * drawn on one 160×120 canvas, colours read from the theme CSS vars
 * (--fg / --dim / --bg) so a `:colorscheme` repaint re-skins it with
 * no per-theme code. No images, no artwork files, no blink.
 *
 * Tracking is two-layer (§2.4): the pupil (fast, lerp 0.06/frame,
 * clamped to x ∈ [0.265, 0.734], y ∈ [0.429, 0.640] of the eye's
 * local frame) follows the focus target; the whole eye (slow, lerp
 * 0.008/frame, clamped ±14px from home) drifts toward the cursor's
 * zone. Focus priority: the ghost caret while GHOST is typing, then
 * Bit's head while BIT is hunting, then the mouse cursor.
 *
 * Flight: an `activeFile` change glides the eye (wrapper transform,
 * ~400ms out, ~400ms back) toward the new section's prompt point
 * with a vertical squash dipping to ~0.55 mid-flight; the pupil
 * readouts read NaN and the eye reports `NaN` until it settles.
 * The inside-eye glitch (§2.6) arrives as the window CustomEvent
 * `phase9:eye-glitch` and swaps the ring for a jittered dense blob.
 *
 * Every frame the eye publishes its geometry to eyeStore (centre,
 * smoothed pupil point, focus point, flying) for EyeTether, and
 * writes its three readouts by direct DOM text writes — per-frame
 * state lives in refs only (§1.6). The loop pauses while the tab is
 * hidden. Reduced motion: one static frame, pupil centred in its
 * clamp range, no loop, no flight, no tether.
 */

const CANVAS_W = 160;
const CANVAS_H = 120;
const RING_W = 100;
const RING_H = 85;
const GRID = 5;
const RING_BAND = 0.13;
const PUPIL_RX = 20;
const PUPIL_RY = 17;
const PUPIL_GRID = 3.5;

const PUPIL_X_MIN = 0.265;
const PUPIL_X_MAX = 0.734;
const PUPIL_Y_MIN = 0.429;
const PUPIL_Y_MAX = 0.64;
const PUPIL_X_CENTRE = (PUPIL_X_MIN + PUPIL_X_MAX) / 2;
const PUPIL_Y_CENTRE = (PUPIL_Y_MIN + PUPIL_Y_MAX) / 2;

const PUPIL_LERP = 0.06;
const BODY_LERP = 0.008;
const BODY_MAX = 14;
const FLIGHT_MS = 800;
const FLIGHT_SQUASH_DIP = 0.45;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface EyePalette {
  fg: string;
  dim: string;
  bg: string;
  pupil: string;
}

function parseHex(colour: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(colour.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Dark mix for the pupil disc dots: --dim blended toward --bg. */
function darkMix(dim: string, bg: string): string {
  const d = parseHex(dim);
  const b = parseHex(bg);
  if (!d || !b) return dim;
  const mix = d.map((v, i) => Math.round(v * 0.55 + (b[i] ?? 0) * 0.45));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

function readPalette(): EyePalette {
  const cs = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  const dim = pick('--dim', '#6d6b66');
  const bg = pick('--bg', '#050505');
  return { fg: pick('--fg', '#ebe6db'), dim, bg, pupil: darkMix(dim, bg) };
}

type FocusKind = 'caret' | 'bit' | 'cursor';

interface FocusTarget {
  kind: FocusKind;
  x: number;
  y: number;
}

function elementCentre(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

function drawBrackets(ctx: CanvasRenderingContext2D, colour: string): void {
  const inset = 7;
  const len = 12;
  const right = CANVAS_W - inset;
  const bottom = CANVAS_H - inset;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1;
  ctx.beginPath();
  // top-left
  ctx.moveTo(inset, inset + len);
  ctx.lineTo(inset, inset);
  ctx.lineTo(inset + len, inset);
  // top-right
  ctx.moveTo(right - len, inset);
  ctx.lineTo(right, inset);
  ctx.lineTo(right, inset + len);
  // bottom-right
  ctx.moveTo(right, bottom - len);
  ctx.lineTo(right, bottom);
  ctx.lineTo(right - len, bottom);
  // bottom-left
  ctx.moveTo(inset + len, bottom);
  ctx.lineTo(inset, bottom);
  ctx.lineTo(inset, bottom - len);
  ctx.stroke();
}

function drawEyeFrame(
  ctx: CanvasRenderingContext2D,
  pal: EyePalette,
  pupil: { x: number; y: number },
  squash: number,
  glitch: boolean,
): void {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const a = RING_W / 2;
  const b = RING_H / 2;

  if (glitch) {
    // Inside-eye event (§2.6): the ring collapses into a dense
    // pixelated blob — dots on a dense grid inside the ellipse,
    // jittered afresh every frame.
    ctx.fillStyle = pal.fg;
    const step = 3.5;
    for (let gx = -a; gx <= a; gx += step) {
      for (let gy = -b; gy <= b; gy += step) {
        const nx = gx / a;
        const ny = gy / b;
        if (nx * nx + ny * ny > 1) continue;
        const jx = (Math.random() - 0.5) * 3;
        const jy = (Math.random() - 0.5) * 3;
        ctx.fillRect(cx + gx + jx - 1, cy + gy * squash + jy - 1, 2, 2);
      }
    }
    drawBrackets(ctx, pal.dim);
    return;
  }

  // Ring: dots on the analytic grid, kept on the ellipse ring band.
  ctx.fillStyle = pal.fg;
  for (let gx = -a - GRID; gx <= a + GRID; gx += GRID) {
    for (let gy = -b - GRID; gy <= b + GRID; gy += GRID) {
      const nx = gx / a;
      const ny = gy / b;
      const r = Math.sqrt(nx * nx + ny * ny);
      if (Math.abs(r - 1) > RING_BAND) continue;
      ctx.fillRect(cx + gx - 1, cy + gy * squash - 1, 2, 2);
    }
  }

  // Pupil: a denser dark dotted disc at the smoothed pupil point.
  const px = cx + (pupil.x - 0.5) * RING_W;
  const py = cy + (pupil.y - PUPIL_Y_CENTRE) * RING_H * squash;
  ctx.fillStyle = pal.pupil;
  for (let gx = -PUPIL_RX; gx <= PUPIL_RX; gx += PUPIL_GRID) {
    for (let gy = -PUPIL_RY; gy <= PUPIL_RY; gy += PUPIL_GRID) {
      const nx = gx / PUPIL_RX;
      const ny = gy / PUPIL_RY;
      if (nx * nx + ny * ny > 1) continue;
      ctx.fillRect(px + gx - 1, py + gy * squash - 1, 2, 2);
    }
  }

  drawBrackets(ctx, pal.dim);
}

/* ------------------------------------------------------------------ */
/* Eye                                                                 */
/* ------------------------------------------------------------------ */

export interface EyeProps {
  /** The current editor file id; a change triggers the flight. */
  activeFile: string;
}

export const Eye: React.FC<EyeProps> = ({ activeFile }) => {
  const bus = useCreatureBus();
  const reducedMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const eyeReadoutRef = useRef<HTMLSpanElement | null>(null);
  const pupilReadoutRef = useRef<HTMLSpanElement | null>(null);
  const mouseReadoutRef = useRef<HTMLSpanElement | null>(null);

  // Latest bus values, read per frame without restarting the loop.
  const busRef = useRef(bus);
  useEffect(() => {
    busRef.current = bus;
  });

  // Latest active file, read per frame by the loop (a change triggers
  // the flight; the palette is also re-read on change, per spec).
  const activeFileRef = useRef(activeFile);
  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  /* ---- Reduced motion: one static frame, no loop, no flight ---- */
  useEffect(() => {
    if (!reducedMotion) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawEyeFrame(ctx, readPalette(), { x: PUPIL_X_CENTRE, y: PUPIL_Y_CENTRE }, 1, false);

    const rect = canvas.getBoundingClientRect();
    const centre = { x: rect.left + CANVAS_W / 2, y: rect.top + CANVAS_H / 2 };
    publishEyeGeometry({
      eyeCenter: centre,
      pupilPoint: {
        x: centre.x + (PUPIL_X_CENTRE - 0.5) * RING_W,
        y: centre.y + (PUPIL_Y_CENTRE - PUPIL_Y_CENTRE) * RING_H,
      },
      focusPoint: null,
      flying: false,
    });
    busRef.current.setEye('tracking');
  }, [reducedMotion]);

  /* ---- Animated loop ---- */
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !wrap || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let palette = readPalette();
    let paletteReadAt = performance.now();

    const mouse = { x: 0, y: 0, has: false };
    const pupil = { x: PUPIL_X_CENTRE, y: PUPIL_Y_CENTRE };
    const body = { x: 0, y: 0 };
    const flightOffset = { x: 0, y: 0 };
    const flightTarget = { x: 0, y: 0 };
    let flying = false;
    let flightStart = 0;
    let glitch = false;
    let lastReported: string | null = null;
    let prevFile: string | null = null;
    let rafId = 0;
    let running = false;

    const report = (state: string) => {
      if (lastReported === state) return;
      lastReported = state;
      busRef.current.setEye(state);
    };

    const startFlight = (now: number) => {
      // Prompt point of the new section: the ghost caret if it is on
      // stage, else toward the buffer (its scroll region's top-left,
      // inset 40px). Offsets are measured from the eye's home centre
      // (current canvas centre minus body drift and flight offset).
      const rect = canvas.getBoundingClientRect();
      const home = {
        x: rect.left + CANVAS_W / 2 - body.x - flightOffset.x,
        y: rect.top + CANVAS_H / 2 - body.y - flightOffset.y,
      };
      let target: { x: number; y: number } | null = null;
      const caret = document.querySelector('[data-ghost-caret="true"]');
      if (caret) {
        target = elementCentre(caret);
      } else {
        const scroll = document.querySelector('.file-buffer-scroll');
        if (scroll) {
          const sr = scroll.getBoundingClientRect();
          target = { x: sr.left + 40, y: sr.top + 40 };
        }
      }
      if (!target) return;
      flightTarget.x = target.x - home.x;
      flightTarget.y = target.y - home.y;
      flying = true;
      flightStart = now;
      report('NaN');
    };

    // Flight trigger: the coordinator remounts / re-renders the Eye
    // with the new file id whenever the section changes.
    const checkFile = (now: number) => {
      // activeFileRef is kept current by the effect below.
      const current = activeFileRef.current;
      if (prevFile === null) {
        prevFile = current;
        return;
      }
      if (current !== prevFile) {
        prevFile = current;
        palette = readPalette();
        paletteReadAt = now;
        startFlight(now);
      }
    };

    const resolveFocus = (): FocusTarget | null => {
      const { ghost, bit } = busRef.current;
      if (ghost === 'typing') {
        const caret = document.querySelector('[data-ghost-caret="true"]');
        if (caret) return { kind: 'caret', ...elementCentre(caret) };
      }
      if (bit === 'hunting') {
        const head = document.querySelector('[data-bit-head="true"]');
        if (head) return { kind: 'bit', ...elementCentre(head) };
      }
      if (mouse.has) return { kind: 'cursor', x: mouse.x, y: mouse.y };
      return null;
    };

    const frame = (now: number) => {
      if (!running) return;
      rafId = requestAnimationFrame(frame);

      checkFile(now);
      if (now - paletteReadAt >= 1000) {
        palette = readPalette();
        paletteReadAt = now;
      }

      // Flight: out ~400ms, back ~400ms, as one sine excursion; the
      // squash dips to ~0.55 at the excursion's peak.
      let squash = 1;
      if (flying) {
        const p = clamp((now - flightStart) / FLIGHT_MS, 0, 1);
        const excursion = Math.sin(Math.PI * p);
        flightOffset.x = flightTarget.x * excursion;
        flightOffset.y = flightTarget.y * excursion;
        squash = 1 - FLIGHT_SQUASH_DIP * excursion;
        if (p >= 1) {
          flying = false;
          flightOffset.x = 0;
          flightOffset.y = 0;
          squash = 1;
        }
      }

      // Body (slow layer): drift toward the cursor's zone.
      if (mouse.has) {
        const rect0 = canvas.getBoundingClientRect();
        const homeX = rect0.left + CANVAS_W / 2 - body.x - flightOffset.x;
        const homeY = rect0.top + CANVAS_H / 2 - body.y - flightOffset.y;
        const wantX = clamp((mouse.x - homeX) * 0.02, -BODY_MAX, BODY_MAX);
        const wantY = clamp((mouse.y - homeY) * 0.02, -BODY_MAX, BODY_MAX);
        body.x += (wantX - body.x) * BODY_LERP;
        body.y += (wantY - body.y) * BODY_LERP;
      }
      wrap.style.transform = `translate(${body.x + flightOffset.x}px, ${body.y + flightOffset.y}px)`;

      const rect = canvas.getBoundingClientRect();
      const eyeCentre = { x: rect.left + CANVAS_W / 2, y: rect.top + CANVAS_H / 2 };
      const focus = resolveFocus();

      // Pupil (fast layer): gaze angle from the eye centre, clamped
      // into the local frame, smoothed at 0.06/frame.
      if (focus) {
        const dx = focus.x - eyeCentre.x;
        const dy = focus.y - eyeCentre.y;
        const angle = Math.atan2(dy, dx);
        const dist = Math.hypot(dx, dy);
        const intensity = Math.min(1, dist / 320);
        const tx = clamp(
          0.5 + Math.cos(angle) * (PUPIL_X_MAX - 0.5) * intensity,
          PUPIL_X_MIN,
          PUPIL_X_MAX,
        );
        const ty = clamp(
          PUPIL_Y_CENTRE + Math.sin(angle) * (PUPIL_Y_MAX - PUPIL_Y_CENTRE) * intensity,
          PUPIL_Y_MIN,
          PUPIL_Y_MAX,
        );
        pupil.x += (tx - pupil.x) * PUPIL_LERP;
        pupil.y += (ty - pupil.y) * PUPIL_LERP;
      }

      const pupilPoint = {
        x: eyeCentre.x + (pupil.x - 0.5) * RING_W,
        y: eyeCentre.y + (pupil.y - PUPIL_Y_CENTRE) * RING_H * squash,
      };
      const focusPoint = flying || !focus ? null : { x: focus.x, y: focus.y };

      publishEyeGeometry({ eyeCenter: eyeCentre, pupilPoint, focusPoint, flying });

      // State reporting — only on change.
      if (flying || glitch) report('NaN');
      else if (focus && focus.kind !== 'cursor') report('focused');
      else report('tracking');

      drawEyeFrame(ctx, palette, pupil, squash, glitch);

      // Readouts — direct DOM writes, never React state.
      const openness = (RING_H * squash) / RING_W;
      if (eyeReadoutRef.current) eyeReadoutRef.current.textContent = openness.toFixed(4);
      if (pupilReadoutRef.current) {
        const tetherLen = focusPoint
          ? Math.hypot(focusPoint.x - pupilPoint.x, focusPoint.y - pupilPoint.y)
          : 0;
        const z = 0.015 + 0.034 * Math.min(1, tetherLen / 1200);
        pupilReadoutRef.current.textContent =
          flying || glitch
            ? `NaN / NaN / ${z.toFixed(3)} / None`
            : `${pupil.x.toFixed(3)} / ${pupil.y.toFixed(3)} / ${z.toFixed(3)} / None`;
      }
      if (mouseReadoutRef.current) {
        const mx = mouse.has ? mouse.x / Math.max(1, window.innerWidth) : 0;
        const my = mouse.has ? mouse.y / Math.max(1, window.innerHeight) : 0;
        mouseReadoutRef.current.textContent = `${mx.toFixed(3)} / ${my.toFixed(3)}`;
      }
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
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.has = true;
    };
    const onGlitch = (e: Event) => {
      const detail = (e as CustomEvent<{ active?: boolean }>).detail;
      glitch = Boolean(detail?.active);
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('phase9:eye-glitch', onGlitch);
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => {
      stop();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('phase9:eye-glitch', onGlitch);
      document.removeEventListener('visibilitychange', onVisibility);
      wrap.style.transform = '';
    };
  }, [reducedMotion]);

  const readoutStyle: React.CSSProperties = {
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    fontSize: '10px',
    lineHeight: 1.5,
    color: 'var(--dim)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      data-eye="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '6px',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
      aria-hidden="true"
    >
      <div ref={wrapRef} style={{ willChange: 'transform' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ width: `${CANVAS_W}px`, height: `${CANVAS_H}px`, display: 'block' }}
        />
      </div>
      <div style={{ marginTop: '6px', alignSelf: 'stretch', paddingLeft: '10px' }}>
        <div style={readoutStyle}>
          {"['eye:u'] "}
          <span ref={eyeReadoutRef}>0.8500</span>
        </div>
        <div style={readoutStyle}>
          {"['pupil:u'] "}
          <span ref={pupilReadoutRef}>
            {`${PUPIL_X_CENTRE.toFixed(3)} / ${PUPIL_Y_CENTRE.toFixed(3)} / 0.015 / None`}
          </span>
        </div>
        <div style={readoutStyle}>
          {"['mouse:u'] "}
          <span ref={mouseReadoutRef}>0.000 / 0.000</span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* EyeTether                                                           */
/* ------------------------------------------------------------------ */

/**
 * The stage-level dashed tether (§2.4): a fixed, pointer-events-none
 * SVG overlay drawing a dashed line from the eye's smoothed pupil
 * point to its current focus point, reading eyeStore each frame on
 * its own rAF. It fades out over ~2s once the focus point stops
 * moving, and renders nothing when there is no focus point (which
 * includes mid-flight — the Eye publishes null then) or under
 * reduced motion.
 */
export const EyeTether: React.FC = () => {
  const reducedMotion = usePrefersReducedMotion();
  const lineRef = useRef<SVGLineElement | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const line = lineRef.current;
    if (!line) return;

    let rafId = 0;
    let running = false;
    let lastFocus: { x: number; y: number } | null = null;
    let lastMoveAt = performance.now();

    const frame = (now: number) => {
      if (!running) return;
      rafId = requestAnimationFrame(frame);

      const { pupilPoint, focusPoint, flying } = eyeStore;
      if (!focusPoint || flying) {
        line.setAttribute('opacity', '0');
        lastFocus = null;
        return;
      }
      if (
        !lastFocus ||
        Math.abs(focusPoint.x - lastFocus.x) > 0.5 ||
        Math.abs(focusPoint.y - lastFocus.y) > 0.5
      ) {
        lastMoveAt = now;
        lastFocus = { x: focusPoint.x, y: focusPoint.y };
      }
      const stillSeconds = (now - lastMoveAt) / 1000;
      const opacity = clamp(1 - stillSeconds / 2, 0, 1);
      line.setAttribute('x1', String(pupilPoint.x));
      line.setAttribute('y1', String(pupilPoint.y));
      line.setAttribute('x2', String(focusPoint.x));
      line.setAttribute('y2', String(focusPoint.y));
      line.setAttribute('opacity', opacity.toFixed(3));
    };

    const start = () => {
      if (running || document.hidden) return;
      running = true;
      lastMoveAt = performance.now();
      rafId = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 40,
        display: 'block',
      }}
    >
      <line
        ref={lineRef}
        x1={0}
        y1={0}
        x2={0}
        y2={0}
        stroke="var(--dim)"
        strokeWidth={1}
        strokeDasharray="3 4"
        opacity={0}
      />
    </svg>
  );
};

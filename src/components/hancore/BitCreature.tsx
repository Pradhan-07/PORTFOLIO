import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useCreatureBus } from '../../fx/creatureBus';

/**
 * BitCreature — Phase 9 (§2.6): "Bit", recast as the rail-edge vine.
 *
 * Bit is a living vine growing down the LEFT EDGE of the rail, on the
 * arc guide itself: a spiky neuron-like polyline with burst nodes,
 * drawn on the same full-stage, pointer-events-none canvas overlay as
 * before. Colours come only from theme CSS vars (--fg / --num family,
 * plus --dim / --line); the drawing is original.
 *
 * Geometry (recomputed every frame — 8 rects is cheap): the guide line
 * x = the nav's ([data-editor-file-nav]) left edge + 13px; slot centres
 * = the vertical centres of the card buttons ([data-file-button]).
 *
 * State machine (reported via onStateChange on every change):
 *   asleep     awake=false. Vine thins to a dim straight line.
 *   crawling   On wake, and after any travel/return: the vine
 *              extends/retracts along the guide over ~2s → resting.
 *   resting    Baseline after crawling / eating / a return.
 *   hunting    Cursor moving fast (a mousemove within the last 600ms
 *              AND smoothed cursor speed ≥ 40px/s): the head travels
 *              the guide toward the slot nearest the cursor's y; a
 *              dotted trail is drawn head → cursor; len grows.
 *   lurking    Cursor still for >2s but <30s: head waits at the
 *              nearest node, nodes breathe (scale pulse).
 *   tunneling  TUNNELING RULE (concrete): the smoothed cursor speed
 *              stays < 40px/s for a sustained 1s WHILE the cursor is
 *              still actively creeping (a mousemove within the last
 *              600ms — a fully stopped cursor is lurking, not
 *              tunneling) → head travels the guide slowly, nodes dim.
 *              (Between 600ms and 2s of stillness after hunting /
 *              tunneling, the previous state holds — hysteresis — then
 *              lurking takes over.)
 *   eating     Every ~45–75s while awake (randomised; only entered
 *              from resting / lurking / tunneling): fires the window
 *              CustomEvent 'phase9:bit-eat' with detail { index } for
 *              the slot nearest the head, bursts at that slot, lasts
 *              ~800ms → resting. (Step 5's rail consumes the event.)
 *   to-the-eye Mouse idle reaches 30s while awake: the head leaves the
 *              rail and travels guide-top → eye zone ([data-eye-zone])
 *              over ~3s on a 2-segment path. A mousemove aborts the
 *              trip → crawling (return).
 *   inside-eye On arrival: fires 'phase9:eye-glitch' { active: true }
 *              and sets the creature-bus ghost to 'repairing'. Lasts
 *              until the next mousemove: then 'phase9:eye-glitch'
 *              { active: false }, ghost stays 'repairing' ~500ms more
 *              then returns to 'idle', and the head returns to the
 *              rail → crawling → resting.
 *   If awake flips false at ANY point (incl. mid-inside-eye): the
 *   glitch is cleared, ghost → 'idle', state → 'asleep'.
 *   suspendEsc=true (overlays open): timers and state progression
 *   freeze; the current frame renders statically.
 *   document.hidden: the loop pauses (timestamps shift on resume).
 *
 * Sleep is manual-toggle only — the legacy 75s AUTO_SLEEP is removed.
 *
 * Readout: a 10px DOM div near the rail bottom reads
 * `['bit:u'] <value> / len <N>` — value = activity 0–1 computed from
 * the head's real travelled distance over the last second (normalised,
 * clamped); at rest it decays toward a ~0.05–0.15 pulse derived from
 * the pulse phase. len = current trail/node count (grows while
 * hunting, decays at rest). Both are written via refs, never state.
 *
 * The head also carries a 1px invisible DOM marker with
 * data-bit-head="true" (canvas cannot carry attributes) so the Eye
 * can find it; its transform is updated from the frame loop via ref.
 *
 * Reduced motion (§1.7): a static vine in the resting pose — no state
 * cycling, no eating, no glitch. The awake toggle still switches
 * asleep/resting instantly.
 */

export type BitState =
  | 'asleep'
  | 'resting'
  | 'crawling'
  | 'hunting'
  | 'lurking'
  | 'tunneling'
  | 'eating'
  | 'to-the-eye'
  | 'inside-eye';

export interface BitCreatureProps {
  /** Controlled awake flag — toggled by the BIT button in the status bar. */
  awake: boolean;
  /** Called when Bit itself decides to sleep (Esc). */
  onAwakeChange?: (awake: boolean) => void;
  /** Called on every state transition, for the bar's `BIT: …` readout. */
  onStateChange?: (state: BitState) => void;
  /**
   * When true, overlays own the stage: timers/state progression freeze
   * and Bit's Esc-to-sleep stands down (the G4 guard order).
   */
  suspendEsc?: boolean;
  /** Changes whenever the active theme changes; refreshes the palette. */
  themeKey?: string;
  /** Overlay z-index. Default 5: above the buffer (0/1), below header (50), bar (60) and modals. */
  zIndex?: number;
}

export interface DenButtonProps {
  awake: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Legacy den control (kept export — harmless; the Phase 9 bar no longer
 * imports it, but other importers must not break).
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

const CRAWL_MS = 2000;
const RETURN_MS = 1200;
const EAT_MS = 800;
const EYE_TRAVEL_MS = 3000;
const EYE_IDLE_MS = 30_000;
const HUNT_WINDOW_MS = 600;
const LURK_AFTER_MS = 2000;
const TUNNEL_SPEED = 40; // px/s
const TUNNEL_SUSTAIN_MS = 1000;
const HUNT_SPEED = 560; // px/s head travel while hunting
const TUNNEL_HEAD_SPEED = 80; // px/s head travel while tunneling
const LEN_MAX = 42;
const GHOST_REPAIR_TAIL_MS = 500;

interface Palette {
  fg: string;
  num: string;
  dim: string;
  line: string;
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    fg: pick('--fg', '#ebe6db'),
    num: pick('--num', '#e5637e'),
    dim: pick('--dim', '#6d6b66'),
    line: pick('--line', '#181818'),
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (t: number) => t * t * (3 - 2 * t);

interface Slot {
  index: number;
  y: number;
}

interface Geometry {
  w: number;
  h: number;
  guideX: number;
  guideTop: number;
  guideBottom: number;
  slots: Slot[];
  eye: { x: number; y: number } | null;
  hasNav: boolean;
}

/** Locate the rail guide + slots + eye zone, in canvas coordinates. */
function computeGeometry(canvas: HTMLCanvasElement): Geometry {
  const rect = canvas.getBoundingClientRect();
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const nav = document.querySelector('[data-editor-file-nav]');
  const slots: Slot[] = [];
  let guideX = 24;
  let guideTop = 80;
  let guideBottom = Math.max(120, h - 160);
  let hasNav = false;
  if (nav) {
    hasNav = true;
    const nr = nav.getBoundingClientRect();
    guideX = nr.left - rect.left + 13;
    guideTop = nr.top - rect.top + 6;
    guideBottom = nr.bottom - rect.top - 6;
    const buttons = nav.querySelectorAll('[data-file-button]');
    buttons.forEach((btn, i) => {
      const br = btn.getBoundingClientRect();
      slots.push({ index: i, y: br.top - rect.top + br.height / 2 });
    });
    if (slots.length > 0) {
      guideTop = Math.min(guideTop, slots[0].y - 44);
      guideBottom = Math.max(guideBottom, slots[slots.length - 1].y + 44);
    }
  }
  let eye: Geometry['eye'] = null;
  const eyeEl = document.querySelector('[data-eye-zone]');
  if (eyeEl) {
    const er = eyeEl.getBoundingClientRect();
    if (er.width > 0 && er.height > 0) {
      eye = { x: er.left - rect.left + er.width / 2, y: er.top - rect.top + er.height / 2 };
    }
  }
  if (!eye) eye = { x: Math.max(80, w - 140), y: 110 };
  return { w, h, guideX, guideTop, guideBottom, slots, eye, hasNav };
}

function nearestSlot(slots: Slot[], y: number): Slot | null {
  let best: Slot | null = null;
  let bestD = Infinity;
  for (const s of slots) {
    const d = Math.abs(s.y - y);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

interface DrawOpts {
  state: BitState;
  headX: number;
  headY: number;
  /** Vine's drawn tip (during crawling-wake the tip is still extending). */
  tipY: number;
  pulse: number; // seconds, drives breathing/pulse phase
  breathe: boolean;
  dimNodes: boolean;
  cursor: { x: number; y: number } | null; // hunting dotted trail target
  eat: { y: number; progress: number } | null;
  burst: boolean; // inside-eye head burst
}

/** Original drawing: spiky neuron vine down the guide + burst nodes. */
function drawVine(ctx: CanvasRenderingContext2D, g: Geometry, pal: Palette, o: DrawOpts): void {
  const { guideX } = g;

  if (o.state === 'asleep') {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = pal.dim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(guideX, g.guideTop);
    ctx.lineTo(guideX, g.guideBottom);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const tipY = clamp(o.tipY, g.guideTop, g.guideBottom);
  const onRail = o.state !== 'to-the-eye' && o.state !== 'inside-eye';
  const headY = o.headY;

  ctx.save();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = pal.fg;
  ctx.globalAlpha = o.state === 'tunneling' ? 0.65 : 0.9;

  // main stem — polyline with a slight organic wiggle
  ctx.beginPath();
  const step = 9;
  for (let y = g.guideTop; y <= tipY; y += step) {
    const x = guideX + Math.sin(y * 0.045 + o.pulse * 0.7) * 1.6;
    if (y === g.guideTop) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(guideX, tipY);
  ctx.stroke();

  // perpendicular spikes along the stem
  ctx.lineWidth = 1;
  ctx.globalAlpha *= 0.75;
  ctx.beginPath();
  let k = 0;
  for (let y = g.guideTop + 7; y < tipY - 4; y += 13, k += 1) {
    const x = guideX + Math.sin(y * 0.045 + o.pulse * 0.7) * 1.6;
    const dir = k % 2 === 0 ? 1 : -1;
    const len = 4 + ((k * 37) % 4);
    ctx.moveTo(x, y);
    ctx.lineTo(x + dir * len, y - 2);
  }
  ctx.stroke();
  ctx.restore();

  // burst nodes at each reached slot centre
  const nodeAlpha = o.dimNodes ? 0.4 : 0.95;
  for (const s of g.slots) {
    if (s.y > tipY + 1 && onRail) continue;
    const scale = o.breathe ? 1 + 0.18 * Math.sin(o.pulse * 1.6 + s.index * 1.3) : 1;
    const r = 3 * scale;
    ctx.save();
    ctx.globalAlpha = nodeAlpha;
    ctx.strokeStyle = pal.num;
    ctx.fillStyle = pal.num;
    ctx.lineWidth = 1;
    // radiating ticks
    ctx.beginPath();
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2 + s.index;
      ctx.moveTo(guideX + Math.cos(a) * (r + 1), s.y + Math.sin(a) * (r + 1));
      ctx.lineTo(guideX + Math.cos(a) * (r + 4.5), s.y + Math.sin(a) * (r + 4.5));
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(guideX, s.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // eating burst at the consumed slot
  if (o.eat) {
    const r = 6 + o.eat.progress * 22;
    ctx.save();
    ctx.globalAlpha = 1 - o.eat.progress * 0.7;
    ctx.strokeStyle = pal.num;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      ctx.moveTo(guideX + Math.cos(a) * r * 0.45, o.eat.y + Math.sin(a) * r * 0.45);
      ctx.lineTo(guideX + Math.cos(a) * r, o.eat.y + Math.sin(a) * r);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(guideX, o.eat.y, r * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // travel path (rail → eye): dotted line guide-top → head
  if (!onRail) {
    ctx.save();
    ctx.fillStyle = pal.dim;
    const x0 = guideX;
    const y0 = g.guideTop;
    const dx = o.headX - x0;
    const dy = o.headY - y0;
    const dist = Math.hypot(dx, dy);
    const n = Math.floor(dist / 10);
    for (let i = 1; i < n; i += 1) {
      const t = i / n;
      ctx.beginPath();
      ctx.arc(x0 + dx * t, y0 + dy * t, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // hunting dotted trail: head → cursor (drawn along the segment)
  if (o.state === 'hunting' && o.cursor) {
    ctx.save();
    ctx.fillStyle = pal.num;
    ctx.globalAlpha = 0.8;
    const dx = o.cursor.x - guideX;
    const dy = o.cursor.y - headY;
    const dist = Math.hypot(dx, dy);
    const n = Math.floor(dist / 11);
    for (let i = 1; i < n; i += 1) {
      const t = i / n;
      ctx.beginPath();
      ctx.arc(guideX + dx * t, headY + dy * t, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // head node — the vine's active tip
  const hx = onRail ? guideX : o.headX;
  const hy = headY;
  const headR = o.burst ? 5 + Math.sin(o.pulse * 6) * 1.2 : 4.2;
  ctx.save();
  ctx.strokeStyle = pal.num;
  ctx.fillStyle = pal.fg;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const ticks = o.burst ? 12 : 8;
  for (let i = 0; i < ticks; i += 1) {
    const a = (i / ticks) * Math.PI * 2 + o.pulse * 0.4;
    const outer = headR + (o.burst ? 7 : 5);
    ctx.moveTo(hx + Math.cos(a) * (headR + 1), hy + Math.sin(a) * (headR + 1));
    ctx.lineTo(hx + Math.cos(a) * outer, hy + Math.sin(a) * outer);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hx, hy, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */

interface Machine {
  state: BitState;
  stateSince: number;
  headX: number;
  headY: number;
  targetY: number;
  crawlFrom: { x: number; y: number };
  crawlMode: 'wake' | 'return';
  travelFrom: { x: number; y: number };
  eatIndex: number;
  eatY: number;
  nextEatAt: number;
  lowSpeedSince: number | null;
  ghostRepairUntil: number;
}

export const BitCreature: FC<BitCreatureProps> = ({
  awake,
  onAwakeChange,
  onStateChange,
  suspendEsc = false,
  themeKey,
  zIndex = 5,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const bus = useCreatureBus();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const headMarkRef = useRef<HTMLDivElement | null>(null);
  const readoutRef = useRef<HTMLDivElement | null>(null);
  const paletteRef = useRef<Palette | null>(null);
  const stateRef = useRef<BitState>('asleep');
  const glitchRef = useRef(false);
  const lenRef = useRef(8);
  const activityRef = useRef(0);
  const vNowRef = useRef(0);

  const callbacksRef = useRef({ onAwakeChange, onStateChange });
  useEffect(() => {
    callbacksRef.current = { onAwakeChange, onStateChange };
  }, [onAwakeChange, onStateChange]);

  const busRef = useRef(bus);
  useEffect(() => {
    busRef.current = bus;
  }, [bus]);

  const suspendRef = useRef(suspendEsc);
  useEffect(() => {
    suspendRef.current = suspendEsc;
  }, [suspendEsc]);

  useEffect(() => {
    paletteRef.current = readPalette();
  }, [themeKey]);

  const clearGlitch = () => {
    if (!glitchRef.current) return;
    glitchRef.current = false;
    window.dispatchEvent(new CustomEvent('phase9:eye-glitch', { detail: { active: false } }));
    busRef.current.setGhost('idle');
  };

  // Esc sleeps Bit — unless an overlay owns Esc right now (suspendEsc).
  useEffect(() => {
    if (!awake || suspendEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') callbacksRef.current.onAwakeChange?.(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [awake, suspendEsc]);

  // awake flips false at ANY point: clear the glitch, ghost → idle,
  // state → asleep (the static effect below draws the thinned vine).
  useEffect(() => {
    if (awake) return;
    clearGlitch();
    if (stateRef.current !== 'asleep') {
      stateRef.current = 'asleep';
      callbacksRef.current.onStateChange?.('asleep');
    }
    activityRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awake]);

  /* Static rendering: asleep (any motion setting) + reduced motion --- */
  useEffect(() => {
    if (awake && !reducedMotion) return; // the animated machine owns this
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    paletteRef.current = readPalette();

    const staticState: BitState = awake ? 'resting' : 'asleep';
    stateRef.current = staticState;
    callbacksRef.current.onStateChange?.(staticState);
    activityRef.current = awake ? 0.1 : 0;

    const drawStatic = () => {
      const g = computeGeometry(canvas);
      const w = g.w;
      const h = g.h;
      if (w <= 0 || h <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const pal = paletteRef.current ?? readPalette();
      const headSlot = g.slots[0] ?? null;
      const headY = headSlot ? headSlot.y : g.guideTop + 40;
      if (g.hasNav) {
        drawVine(ctx, g, pal, {
          state: staticState,
          headX: g.guideX,
          headY,
          tipY: staticState === 'asleep' ? g.guideBottom : g.guideBottom,
          pulse: 0,
          breathe: false,
          dimNodes: false,
          cursor: null,
          eat: null,
          burst: false,
        });
      }
      // head marker + readout placement (rail bottom)
      const ox = canvas.offsetLeft;
      const oy = canvas.offsetTop;
      if (headMarkRef.current) {
        headMarkRef.current.style.transform = `translate(${ox + g.guideX}px, ${oy + headY}px)`;
      }
      if (readoutRef.current) {
        readoutRef.current.style.transform = `translate(${ox + g.guideX - 2}px, ${oy + g.guideBottom + 10}px)`;
        readoutRef.current.style.display = g.hasNav ? 'block' : 'none';
        readoutRef.current.textContent = `['bit:u'] ${activityRef.current.toFixed(2)} / len ${Math.round(lenRef.current)}`;
      }
    };
    drawStatic();
    const observer = new ResizeObserver(drawStatic);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [awake, reducedMotion, themeKey]);

  /* Animated machine -------------------------------------------------- */
  useEffect(() => {
    if (!awake || reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    paletteRef.current = readPalette();

    const g0 = computeGeometry(canvas);
    const startHead = g0.slots[0]?.y ?? g0.guideTop + 40;
    let vNow = vNowRef.current;
    const m: Machine = {
      state: 'crawling',
      stateSince: vNow,
      headX: g0.guideX,
      headY: g0.guideTop,
      targetY: startHead,
      crawlFrom: { x: g0.guideX, y: g0.guideTop },
      crawlMode: 'wake',
      travelFrom: { x: g0.guideX, y: startHead },
      eatIndex: -1,
      eatY: startHead,
      nextEatAt: vNow + rand(45_000, 75_000),
      lowSpeedSince: null,
      ghostRepairUntil: 0,
    };
    stateRef.current = 'crawling';
    callbacksRef.current.onStateChange?.('crawling');

    // Cursor tracking (virtual-clock timestamps so suspend/hidden
    // freezes hold every timer, including idle detection).
    const mouse = {
      x: -1,
      y: -1,
      lastMoveAt: vNow,
      lastX: -1,
      lastY: -1,
      lastPerf: 0,
      speed: 0, // EMA of px/s
      movedFlag: false,
    };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const perf = performance.now();
      if (mouse.lastPerf > 0) {
        const dt = (perf - mouse.lastPerf) / 1000;
        if (dt > 0.005) {
          const inst = Math.hypot(x - mouse.lastX, y - mouse.lastY) / dt;
          mouse.speed = mouse.speed === 0 ? inst : mouse.speed * 0.65 + inst * 0.35;
        }
      }
      mouse.lastPerf = perf;
      mouse.lastX = x;
      mouse.lastY = y;
      mouse.x = x;
      mouse.y = y;
      mouse.lastMoveAt = vNowRef.current;
      mouse.movedFlag = true;
    };
    window.addEventListener('mousemove', onMouseMove);

    let rafId = 0;
    let running = true;
    let lastPerf = performance.now();
    let hiddenAt: number | null = null;
    const samples: { t: number; x: number; y: number }[] = [];

    const report = (s: BitState) => {
      if (m.state === s) return;
      m.state = s;
      m.stateSince = vNow;
      stateRef.current = s;
      callbacksRef.current.onStateChange?.(s);
    };

    const startCrawl = (mode: 'wake' | 'return', from: { x: number; y: number }) => {
      m.crawlMode = mode;
      m.crawlFrom = from;
      report('crawling');
    };

    const frame = () => {
      if (!running) return;
      rafId = requestAnimationFrame(frame);
      const perf = performance.now();
      let dt = perf - lastPerf;
      lastPerf = perf;
      if (dt > 50) dt = 50;
      if (dt < 0) dt = 0;

      const suspended = suspendRef.current;
      if (!suspended) {
        vNow += dt;
        vNowRef.current = vNow;
      }
      const g = computeGeometry(canvas);
      const w = g.w;
      const h = g.h;
      if (w <= 0 || h <= 0) return;
      const pal = paletteRef.current ?? readPalette();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const stillMs = vNow - mouse.lastMoveAt;
      const effSpeed = stillMs < 250 ? mouse.speed : 0;
      const pulse = vNow / 1000;

      if (!suspended) {
        /* --- ghost repairing tail after the inside-eye event --- */
        if (m.ghostRepairUntil > 0 && vNow >= m.ghostRepairUntil) {
          m.ghostRepairUntil = 0;
          busRef.current.setGhost('idle');
        }

        /* --- mouse-move exits from the eye states --- */
        if (mouse.movedFlag) {
          if (m.state === 'inside-eye') {
            clearGlitch();
            busRef.current.setGhost('repairing');
            m.ghostRepairUntil = vNow + GHOST_REPAIR_TAIL_MS;
            // glitch flag was cleared by clearGlitch → ghost set to
            // 'idle' there; re-assert 'repairing' for the 500ms tail.
            busRef.current.setGhost('repairing');
            startCrawl('return', { x: m.headX, y: m.headY });
          } else if (m.state === 'to-the-eye') {
            startCrawl('return', { x: m.headX, y: m.headY });
          }
          mouse.movedFlag = false;
        }

        /* --- state machine --- */
        const nearest = nearestSlot(g.slots, mouse.y >= 0 ? mouse.y : m.headY);
        const headNearest = nearestSlot(g.slots, m.headY);

        if (m.state === 'crawling') {
          const elapsed = vNow - m.stateSince;
          if (m.crawlMode === 'wake') {
            const target = nearest?.y ?? g.guideTop + 40;
            m.targetY = target;
            const p = easeOut(clamp(elapsed / CRAWL_MS, 0, 1));
            m.headX = g.guideX;
            m.headY = lerp(g.guideTop, target, p);
            if (elapsed >= CRAWL_MS) report('resting');
          } else {
            const target = headNearest?.y ?? g.slots[0]?.y ?? g.guideTop + 40;
            m.targetY = target;
            const p = smooth(clamp(elapsed / RETURN_MS, 0, 1));
            m.headX = lerp(m.crawlFrom.x, g.guideX, p);
            m.headY = lerp(m.crawlFrom.y, target, p);
            if (elapsed >= CRAWL_MS) {
              m.headX = g.guideX;
              report('resting');
            }
          }
        } else if (m.state === 'eating') {
          if (vNow - m.stateSince >= EAT_MS) {
            m.nextEatAt = vNow + rand(45_000, 75_000);
            report('resting');
          }
        } else if (m.state === 'to-the-eye') {
          const elapsed = vNow - m.stateSince;
          const p = clamp(elapsed / EYE_TRAVEL_MS, 0, 1);
          const eye = g.eye ?? { x: w - 140, y: 110 };
          if (p < 0.35) {
            const q = smooth(p / 0.35);
            m.headX = lerp(m.travelFrom.x, g.guideX, q);
            m.headY = lerp(m.travelFrom.y, g.guideTop, q);
          } else {
            const q = smooth((p - 0.35) / 0.65);
            m.headX = lerp(g.guideX, eye.x, q);
            m.headY = lerp(g.guideTop, eye.y, q);
          }
          if (p >= 1) {
            m.headX = eye.x;
            m.headY = eye.y;
            glitchRef.current = true;
            window.dispatchEvent(
              new CustomEvent('phase9:eye-glitch', { detail: { active: true } }),
            );
            busRef.current.setGhost('repairing');
            report('inside-eye');
          }
        } else if (m.state === 'inside-eye') {
          const eye = g.eye ?? { x: w - 140, y: 110 };
          m.headX = eye.x;
          m.headY = eye.y;
          // exit handled by the mousemove flag above
        } else {
          // resting / hunting / lurking / tunneling — shared decisions
          if (stillMs >= EYE_IDLE_MS) {
            m.travelFrom = { x: m.headX, y: m.headY };
            report('to-the-eye');
          } else if (
            vNow >= m.nextEatAt &&
            (m.state === 'resting' || m.state === 'lurking' || m.state === 'tunneling')
          ) {
            const slot = headNearest ?? nearest;
            if (slot) {
              m.eatIndex = slot.index;
              m.eatY = slot.y;
              window.dispatchEvent(
                new CustomEvent('phase9:bit-eat', { detail: { index: slot.index } }),
              );
              report('eating');
            } else {
              m.nextEatAt = vNow + rand(45_000, 75_000);
            }
          } else if (stillMs <= HUNT_WINDOW_MS && effSpeed >= TUNNEL_SPEED) {
            if (m.state !== 'hunting') report('hunting');
            m.lowSpeedSince = null;
          } else if (stillMs > LURK_AFTER_MS) {
            if (m.state !== 'lurking') report('lurking');
            m.lowSpeedSince = null;
          } else if (stillMs <= HUNT_WINDOW_MS && effSpeed < TUNNEL_SPEED) {
            // tunneling rule: slow creep sustained for 1s
            if (m.lowSpeedSince === null) m.lowSpeedSince = vNow;
            if (vNow - m.lowSpeedSince >= TUNNEL_SUSTAIN_MS && m.state !== 'tunneling') {
              report('tunneling');
            }
            // else: hysteresis — keep the current state
          } else {
            // 600ms–2s of stillness: hysteresis from hunting/tunneling,
            // resting stays resting until lurking takes over at 2s.
            m.lowSpeedSince = null;
            if (m.state === 'hunting' || m.state === 'tunneling') {
              // hold state briefly; head keeps travelling below
            } else if (m.state !== 'resting') {
              report('resting');
            }
          }

          /* head travel + len for the rail states */
          const dtS = dt / 1000;
          if (m.state === 'hunting') {
            const target = nearest?.y ?? m.headY;
            m.targetY = target;
            const maxStep = HUNT_SPEED * dtS;
            const dy = clamp(target - m.headY, -maxStep, maxStep);
            m.headY += dy;
            m.headX = g.guideX;
            lenRef.current = Math.min(LEN_MAX, lenRef.current + dtS * 6);
          } else if (m.state === 'tunneling') {
            const target = nearest?.y ?? m.headY;
            m.targetY = target;
            const maxStep = TUNNEL_HEAD_SPEED * dtS;
            const dy = clamp(target - m.headY, -maxStep, maxStep);
            m.headY += dy;
            m.headX = g.guideX;
            lenRef.current = Math.max(g.slots.length || 8, lenRef.current - dtS * 1.2);
          } else if (m.state === 'lurking') {
            const target = headNearest?.y ?? m.headY;
            m.headY = lerp(m.headY, target, 0.08);
            m.headX = g.guideX;
            lenRef.current = Math.max(g.slots.length || 8, lenRef.current - dtS * 2);
          } else if (m.state === 'resting') {
            m.headX = g.guideX;
            lenRef.current = Math.max(g.slots.length || 8, lenRef.current - dtS * 2.5);
          }
        }

        /* --- activity: real head distance over the last second --- */
        samples.push({ t: vNow, x: m.headX, y: m.headY });
        while (samples.length > 1 && samples[0].t < vNow - 1000) samples.shift();
        let dist = 0;
        for (let i = 1; i < samples.length; i += 1) {
          dist += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
        }
        const speedNorm = clamp(dist / 400, 0, 1);
        const pulseVal = 0.1 + 0.05 * Math.sin(pulse * 1.7);
        const targetActivity = Math.max(speedNorm, pulseVal);
        activityRef.current += (targetActivity - activityRef.current) * 0.08;
      }

      /* --- draw --- */
      // The stem spans the full guide once grown; only a wake-crawl
      // shows it still extending (tip = the travelling head).
      const crawlingWake = m.state === 'crawling' && m.crawlMode === 'wake';
      const tipY = crawlingWake ? m.headY : g.guideBottom;
      if (g.hasNav) {
        drawVine(ctx, g, pal, {
          state: m.state,
          headX: m.headX,
          headY: m.headY,
          tipY,
          pulse,
          breathe: m.state === 'lurking',
          dimNodes: m.state === 'tunneling',
          cursor:
            m.state === 'hunting' && mouse.x >= 0 ? { x: mouse.x, y: mouse.y } : null,
          eat:
            m.state === 'eating'
              ? { y: m.eatY, progress: clamp((vNow - m.stateSince) / EAT_MS, 0, 1) }
              : null,
          burst: m.state === 'inside-eye',
        });
      }

      /* --- DOM marker + readout via refs --- */
      const ox = canvas.offsetLeft;
      const oy = canvas.offsetTop;
      if (headMarkRef.current) {
        headMarkRef.current.style.transform = `translate(${ox + m.headX}px, ${oy + m.headY}px)`;
      }
      if (readoutRef.current) {
        readoutRef.current.style.transform = `translate(${ox + g.guideX - 2}px, ${oy + g.guideBottom + 10}px)`;
        readoutRef.current.style.display = g.hasNav ? 'block' : 'none';
        readoutRef.current.textContent = `['bit:u'] ${activityRef.current.toFixed(2)} / len ${Math.round(lenRef.current)}`;
      }
    };
    rafId = requestAnimationFrame(frame);

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = performance.now();
        cancelAnimationFrame(rafId);
      } else if (hiddenAt !== null && running) {
        hiddenAt = null;
        lastPerf = performance.now();
        mouse.lastPerf = 0;
        rafId = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('visibilitychange', onVisibility);
      clearGlitch();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awake, reducedMotion]);

  return (
    <>
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
      <div
        ref={headMarkRef}
        data-bit-head="true"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1,
          height: 1,
          pointerEvents: 'none',
          zIndex,
        }}
      />
      <div
        ref={readoutRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          fontSize: 10,
          lineHeight: 1.4,
          color: 'var(--dim)',
          fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex,
        }}
      />
    </>
  );
};

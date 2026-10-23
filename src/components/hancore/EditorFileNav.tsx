import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EDITOR_FILES } from '../../data/editorFiles';
import type { EditorFileId, EditorFileSpec } from '../../types';
import {
  normalisedWheelDelta,
  WHEEL_COOLDOWN_MS,
  WHEEL_GESTURE_GAP_MS,
} from '../../hooks/useWheelStepper';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { isoDay } from '../../lib/format';

interface EditorFileNavProps {
  activeFile: EditorFileId;
  onNavigate: (file: EditorFileId) => void;
  onStepFile: (direction: 1 | -1) => void;
  /** Phase 9 §2.6 coupling: Bit asleep → rail cards vanish, wake pill shows. */
  collapsed?: boolean;
  /** Called by the `wake bit` pill shown while collapsed. */
  onWake?: () => void;
}

/* ------------------------------------------------------------------ */
/* Arc drum geometry (DESIGN-SPEC §2.5, measured values)               */
/* ------------------------------------------------------------------ */

const FILE_COUNT = EDITOR_FILES.length; // 8 — offsets wrap at ±4
const SLOT_PX = 88; // vertical slot spacing along the arc
const BOW_PX = 25; // x(o) = BOW × (|o|/4)² — rightward as |o| grows
const ROT_PER_SLOT = 3.25; // rot(o) = o × 3.25° → −13° … 0° … +13°
const CARD_W = 118;
const CARD_H = 80;
const CARD_LEFT = 16;
const CENTRE_X = CARD_LEFT + CARD_W / 2; // guide passes through slot centres

/** Spring (Hooke): force = −TENSION·disp − FRICTION·vel. ω = √16 = 4,
 *  ζ = 4 / (2·√16) = 0.5 → underdamped, ~16% overshoot, ~2s settle on a
 *  1-slot step and ~2–4s of visible travel on multi-slot moves. */
const SPRING_TENSION = 16;
const SPRING_FRICTION = 4.0;
const SNAP_EPSILON = 0.01;

const WHEEL_THRESHOLD_PX = 48;
const IDLE_AFTER_MS = 20000;

/** Vertical drag distance (px) that counts as one touch step. */
const TOUCH_STEP_PX = 56;

/** Shortest wrapped distance on the 8-card circle, in (−4, 4]. */
const wrapOffset = (v: number): number => {
  const r = ((v % FILE_COUNT) + FILE_COUNT) % FILE_COUNT; // [0, 8)
  return r > 4 ? r - FILE_COUNT : r;
};

const indexOfFile = (id: EditorFileId): number =>
  Math.max(0, EDITOR_FILES.findIndex((f) => f.id === id));

/** Full transform for a card at circular offset `o` (pure function of
 *  the fractional drum position — §2.5). `upright` = reduced motion:
 *  no bow, no fan, scale still follows the slot. */
const cardTransform = (o: number, centreY: number, upright: boolean): string => {
  const ao = Math.abs(o);
  const x = upright ? 0 : BOW_PX * (ao / 4) ** 2;
  const rot = upright ? 0 : o * ROT_PER_SLOT;
  const scale = 1 + 0.18 * Math.max(0, 1 - ao);
  const y = centreY + o * SLOT_PX - CARD_H / 2;
  return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
};

/** Slot-centre point on the guide arc for offset `o`. */
const slotPoint = (o: number, centreY: number): { x: number; y: number } => ({
  x: CENTRE_X + BOW_PX * (Math.abs(o) / 4) ** 2,
  y: centreY + o * SLOT_PX,
});

/** SVG path approximating the guide arc through o ∈ [−4, 4]. */
const guidePath = (centreY: number): string => {
  let d = '';
  for (let o = -4; o <= 4.001; o += 0.25) {
    const p = slotPoint(o, centreY);
    d += `${o === -4 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
  }
  return d.trim();
};

/** 4-point starburst node polygon centred on (cx, cy). */
const starPoints = (cx: number, cy: number, rOuter: number, rInner: number): string => {
  const pts: string[] = [];
  for (let k = 0; k < 8; k += 1) {
    const angle = (k * Math.PI) / 4 - Math.PI / 2;
    const r = k % 2 === 0 ? rOuter : rInner;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(' ');
};

const GUIDE_NODE_OFFSETS = [-3, -1.5, 0, 1.5, 3];

/**
 * Card excerpts: two short lines per file, copied from the strings the
 * buffers themselves render. Static labels only — they do not claim to
 * be live renders. (Carried over from Phase 7.)
 */
const NAV_EXCERPTS: Record<EditorFileId, [string, string]> = {
  about: ['Karan Kumar Pradhan', 'B.Tech CSE Student @ VIT-AP University'],
  certifications: ['Hedera Certified Foundation', 'Hashgraph Association · Jun 2026'],
  projects: ['// pinned', 'indstate [FEATURED]'],
  stack: ['JavaScript 62.6% · 8 repos', 'TypeScript 18.9% · 3 repos'],
  journey: ['01 · Practising DSA in C++', 'C++20 · STL · Algorithms'],
  leetcode: ['29 solved', 'Easy 12 · Medium 15 · Hard 2'],
  themes: ['blackmoney', 'demon'],
  contact: ['pradhankaran058@gmail.com', 'github.com/Pradhan-07'],
};

/** Card face: mini excerpt block (thumbnail zone) over the file label. */
const CardFace: React.FC<{ spec: EditorFileSpec; isActive: boolean }> = ({ spec, isActive }) => {
  const excerpt = NAV_EXCERPTS[spec.id];
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {excerpt.map((line, li) => (
          <span
            key={line}
            style={{
              display: 'block',
              fontSize: '8.5px',
              lineHeight: 1.5,
              color:
                li === 0
                  ? isActive
                    ? 'var(--fg)'
                    : 'color-mix(in srgb, var(--fg) 55%, transparent)'
                  : 'var(--dim)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {line}
          </span>
        ))}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <span
          aria-hidden="true"
          style={{ width: '6px', height: '6px', borderRadius: '50%', background: spec.dot, flexShrink: 0 }}
        />
        <span style={{ flex: 1, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {spec.file}
        </span>
        <span style={{ fontSize: '8.5px', color: 'var(--dim)', letterSpacing: '0.06em' }}>{spec.kind}</span>
      </span>
    </>
  );
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
}

/**
 * The file rail — Phase 9 arc drum (§2.5).
 *
 * Desktop (>640px): the drum FOLLOWS `activeFile` (selection lives in
 * the Dashboard). A fractional `position` chases an integer target on a
 * Hooke spring in one rAF loop; every card's transform is a pure
 * function of its circular offset from that position, written straight
 * to the DOM via refs — no per-frame React state. Wheel handling is
 * the drum's own state machine (the shared useWheelStepper still
 * serves the landing wall): normalised deltas, 140ms gesture gap,
 * 48px threshold, magnitude-scaled 1–3 steps, 500ms post-step lock,
 * sub-threshold nudge that springs back, and an inertia guard so the
 * target never leads the position by more than 4 slots.
 *
 * ≤640px: the drum is hidden by CSS and the legacy flow list renders
 * inside the tabline disclosure sheet, exactly as before.
 */
export const EditorFileNav: React.FC<EditorFileNavProps> = ({
  activeFile,
  onNavigate,
  onStepFile,
  collapsed = false,
  onWake,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [idle, setIdle] = useState(false);
  const [ghost, setGhost] = useState<{ id: EditorFileId; key: number } | null>(null);
  const [dataDate, setDataDate] = useState<string | null>(null);
  const [drumSize, setDrumSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const drumRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const guideRef = useRef<SVGGElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = indexOfFile(activeFile);
  const activeSpec = EDITOR_FILES[activeIndex] ?? EDITOR_FILES[0];

  /* Drum state — refs only (§1.6). position/target are continuous
   * (unwrapped) slot values; card offsets wrap them onto the circle. */
  const positionRef = useRef(activeIndex);
  const velocityRef = useRef(0);
  const targetRef = useRef(activeIndex);
  const nudgeRef = useRef(0);
  const prevIndexRef = useRef(activeIndex);
  const lastRoundedRef = useRef(activeIndex);
  const lastInteractRef = useRef(0);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const reducedRef = useRef(reducedMotion);
  const collapsedRef = useRef(collapsed);
  const idleRef = useRef(false);
  const wheelRef = useRef({ acc: 0, lastAt: 0, lastDir: 0, lockUntil: 0 });

  const stepRef = useRef(onStepFile);
  useEffect(() => {
    stepRef.current = onStepFile;
  }, [onStepFile]);
  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);
  useEffect(() => {
    collapsedRef.current = collapsed;
  }, [collapsed]);
  useEffect(() => {
    lastInteractRef.current = performance.now();
  }, []);

  const markInteraction = useCallback(() => {
    lastInteractRef.current = performance.now();
    if (idleRef.current) {
      idleRef.current = false;
      setIdle(false);
    }
  }, []);

  /* Follow activeFile: retarget the spring by the SHORTEST wrapped
   * delta from where the target currently sits. A step that crosses
   * the wrap boundary flings a ghost copy of the outgoing card. */
  useEffect(() => {
    const idx = indexOfFile(activeFile);
    const prev = prevIndexRef.current;
    if (idx !== prev) {
      if (Math.abs(idx - prev) > FILE_COUNT / 2 && !reducedRef.current && !collapsedRef.current) {
        setGhost({ id: EDITOR_FILES[prev].id, key: performance.now() });
      }
      prevIndexRef.current = idx;
    }
    const base = Math.round(targetRef.current);
    const baseMod = ((base % FILE_COUNT) + FILE_COUNT) % FILE_COUNT;
    targetRef.current = base + wrapOffset(idx - baseMod);
    markInteraction();
  }, [activeFile, markInteraction]);

  /* Data date line: the snapshot's fetchedAt day (§2.5). Absent data
   * → the line is omitted, never invented (§0.2). */
  useEffect(() => {
    let cancelled = false;
    fetch('/data/github-snapshot.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { fetchedAt?: unknown } | null) => {
        if (!cancelled && j && typeof j.fetchedAt === 'string') setDataDate(isoDay(j.fetchedAt));
      })
      .catch(() => {
        /* omitted on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Drum sizing: ResizeObserver → size ref (loop) + state (SVG guide),
   * and the particle canvas backing store (DPR capped at 2, §1.6). */
  useEffect(() => {
    const drum = drumRef.current;
    if (!drum) return;
    const apply = () => {
      const w = drum.clientWidth;
      const h = drum.clientHeight;
      sizeRef.current = { w, h };
      setDrumSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      const canvas = canvasRef.current;
      if (canvas && w > 0 && h > 0) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(drum);
    return () => ro.disconnect();
  }, []);

  /* The one rAF loop: spring, card transforms, guide brightness,
   * particle bursts, idle-preview drift, idle detection. */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const particles: Particle[] = [];

    const spawnBurst = (centreY: number) => {
      const drum = drumRef.current;
      if (!drum || collapsedRef.current || idleRef.current) return;
      const cs = getComputedStyle(drum);
      const accent = cs.getPropertyValue('--accent').trim() || '#ffffff';
      const fg = cs.getPropertyValue('--fg').trim() || '#ffffff';
      const spawn = (o: number, count: number, color: string) => {
        const p = slotPoint(o, centreY);
        for (let k = 0; k < count; k += 1) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 24 + Math.random() * 60;
          particles.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 14,
            life: 0.5,
            max: 0.5,
            color,
          });
        }
      };
      spawn(-3, 14, accent); // largest at the top node
      spawn(0, 8, fg); // smaller at centre
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (document.hidden) return;
      const drum = drumRef.current;
      if (!drum) return;
      const { h } = sizeRef.current;
      if (h <= 0) return;
      const centreY = h / 2;
      const reduced = reducedRef.current;

      /* --- spring --- */
      if (reduced) {
        positionRef.current = targetRef.current;
        velocityRef.current = 0;
        nudgeRef.current = 0;
      } else {
        const disp = positionRef.current - targetRef.current;
        const force = -SPRING_TENSION * disp - SPRING_FRICTION * velocityRef.current;
        velocityRef.current += force * dt;
        positionRef.current += velocityRef.current * dt;
        if (Math.abs(positionRef.current - targetRef.current) < SNAP_EPSILON && Math.abs(velocityRef.current) < SNAP_EPSILON) {
          positionRef.current = targetRef.current;
          velocityRef.current = 0;
        }
        /* Nudge springs back once the gesture has gone quiet. */
        const w = wheelRef.current;
        if (now - w.lastAt > WHEEL_GESTURE_GAP_MS) {
          w.acc = 0;
          nudgeRef.current += (0 - nudgeRef.current) * Math.min(1, dt * 9);
          if (Math.abs(nudgeRef.current) < 0.001) nudgeRef.current = 0;
        }
      }

      /* --- idle minimal state (§2.5): 20s without rail interaction --- */
      if (!collapsedRef.current && !idleRef.current && now - lastInteractRef.current > IDLE_AFTER_MS) {
        idleRef.current = true;
        setIdle(true);
      }

      /* --- cards --- */
      const renderPos = positionRef.current + nudgeRef.current;
      if (!collapsedRef.current && !idleRef.current) {
        for (let i = 0; i < FILE_COUNT; i += 1) {
          const el = cardRefs.current[i];
          if (!el) continue;
          const o = wrapOffset(i - renderPos);
          el.style.transform = cardTransform(o, centreY, reduced);
          el.style.zIndex = String(30 - Math.round(Math.abs(o) * 4));
        }
      }

      /* --- guide brightness follows travel --- */
      if (guideRef.current) {
        const intensity = Math.min(
          1,
          Math.abs(velocityRef.current) * 0.45 +
            Math.abs(positionRef.current - targetRef.current) * 0.35 +
            Math.abs(nudgeRef.current) * 1.2,
        );
        guideRef.current.style.opacity = (0.32 + 0.68 * intensity).toFixed(3);
      }

      /* --- discrete step landing → particle burst --- */
      const rounded = Math.round(positionRef.current);
      if (rounded !== lastRoundedRef.current) {
        lastRoundedRef.current = rounded;
        if (!reduced) spawnBurst(centreY);
      }

      /* --- particles --- */
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, sizeRef.current.w, h);
        for (let i = particles.length - 1; i >= 0; i -= 1) {
          const p = particles[i];
          p.life -= dt;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          p.vy += 60 * dt; // gravity-lite
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          ctx.globalAlpha = Math.max(0, p.life / p.max);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        }
        ctx.globalAlpha = 1;
      }

      /* --- idle preview card drift (±6px, ~6s sine along the arc) --- */
      const pv = previewRef.current;
      if (pv && idleRef.current && !collapsedRef.current) {
        const oEff = reduced ? 1 : 1 + Math.sin((now * Math.PI * 2) / 6000) * (6 / SLOT_PX);
        pv.style.transform = cardTransform(oEff, centreY, reduced);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Ghost fling: WAAPI tumble of the outgoing card on a wrap step. */
  useEffect(() => {
    if (!ghost) return;
    const el = ghostRef.current;
    const centreY = (sizeRef.current.h || drumSize.h || 770) / 2 - CARD_H / 2;
    let timer: number | undefined;
    if (el && typeof el.animate === 'function') {
      const anim = el.animate(
        [
          { transform: `translate(0px, ${centreY.toFixed(1)}px) rotate(0deg)`, opacity: 1 },
          { transform: `translate(0px, ${(centreY + 120).toFixed(1)}px) rotate(40deg)`, opacity: 0 },
        ],
        { duration: 600, easing: 'ease-in', fill: 'forwards' },
      );
      anim.onfinish = () => setGhost(null);
    } else {
      timer = window.setTimeout(() => setGhost(null), 650);
    }
    const fallback = window.setTimeout(() => setGhost(null), 850);
    return () => {
      window.clearTimeout(fallback);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [ghost, drumSize.h]);

  /* Wheel v2 + touch on the nav root. The wheel machine is the drum's
   * own (NOT useWheelStepper — that still serves the landing wall):
   * non-passive, normalised deltas, 140ms gesture gap, deltas
   * discarded during the 500ms post-step lock, magnitude-scaled steps,
   * inertia guard, sub-threshold nudge. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom — leave it alone
      if (window.matchMedia('(max-width: 640px)').matches) return; // sheet band: page/list scrolls
      e.preventDefault();
      markInteraction();
      const w = wheelRef.current;
      const now = performance.now();
      if (now < w.lockUntil) return; // discard, do not bank
      if (now - w.lastAt > WHEEL_GESTURE_GAP_MS) w.acc = 0;
      const delta = normalisedWheelDelta(e);
      const dir = Math.sign(delta);
      if (dir !== 0 && w.lastDir !== 0 && dir !== w.lastDir) w.acc = 0;
      if (dir !== 0) w.lastDir = dir;
      w.acc += delta;
      w.lastAt = now;

      const mag = Math.abs(w.acc);
      if (mag >= WHEEL_THRESHOLD_PX) {
        /* Step count from the gesture's accumulated magnitude (the
         * gesture is time-bounded by the 140ms gap segmentation, so
         * magnitude over the gesture is its velocity measure):
         * light ≈ 1 step, firm ≈ 2, strong flick ≈ 3 (capped, §2.5). */
        let steps = mag < 120 ? 1 : mag < 260 ? 2 : 3;
        const stepDir = (w.acc > 0 ? 1 : -1) as 1 | -1;
        /* Inertia: the target may never lead the position by > 4. */
        const lead = targetRef.current - positionRef.current;
        while (steps > 0 && Math.abs(lead + stepDir * steps) > 4) steps -= 1;
        if (steps > 0) {
          for (let s = 0; s < steps; s += 1) stepRef.current(stepDir);
          w.lockUntil = now + WHEEL_COOLDOWN_MS;
        }
        w.acc = 0;
        nudgeRef.current = 0;
      } else {
        /* Sub-threshold: visual displacement at 0.4×, in slots. */
        nudgeRef.current = (w.acc * 0.4) / SLOT_PX;
      }
    };

    let touchStartY: number | null = null;
    let lastTouchStepAt = 0;
    const handleTouchStart = (e: TouchEvent) => {
      markInteraction();
      touchStartY = e.touches[0]?.clientY ?? null;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY === null) return;
      const y = e.touches[0]?.clientY;
      if (y === undefined) return;
      const dy = touchStartY - y; // drag up (dy > 0) = next file
      if (Math.abs(dy) < TOUCH_STEP_PX) return;
      e.preventDefault();
      touchStartY = y;
      const now = performance.now();
      if (now - lastTouchStepAt < WHEEL_COOLDOWN_MS) return;
      lastTouchStepAt = now;
      stepRef.current(dy > 0 ? 1 : -1);
    };
    const handleTouchEnd = () => {
      touchStartY = null;
    };

    root.addEventListener('wheel', handleWheel, { passive: false });
    root.addEventListener('touchstart', handleTouchStart, { passive: true });
    root.addEventListener('touchmove', handleTouchMove, { passive: false });
    root.addEventListener('touchend', handleTouchEnd);
    root.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      root.removeEventListener('wheel', handleWheel);
      root.removeEventListener('touchstart', handleTouchStart);
      root.removeEventListener('touchmove', handleTouchMove);
      root.removeEventListener('touchend', handleTouchEnd);
      root.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [markInteraction]);

  const handleSelect = (file: EditorFileId) => {
    markInteraction();
    onNavigate(file);
    setSheetOpen(false);
  };

  // Escape inside the nav closes the disclosure sheet (≤640) and puts
  // focus back on the toggle.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && sheetOpen) {
      e.stopPropagation();
      setSheetOpen(false);
      toggleRef.current?.focus();
    }
  };

  // ≤640 sheet: keep the active row reachable inside the sheet's own
  // scroll region (never scroll an ancestor).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const list = root.querySelector<HTMLElement>('.rail-sheet-list');
    const btn = list?.querySelector<HTMLElement>(`[data-file-button="${activeFile}"]`);
    if (!list || !btn) return;
    const listRect = list.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    if (listRect.height === 0 || btnRect.height === 0) return;
    const deltaTop = btnRect.top - listRect.top;
    if (deltaTop < 0) {
      list.scrollTop += deltaTop - 4;
    } else if (deltaTop + btnRect.height > listRect.height) {
      list.scrollTop += deltaTop + btnRect.height - listRect.height + 4;
    }
  }, [activeFile]);

  const centreY = (drumSize.h || 770) / 2;
  const previewSpec = EDITOR_FILES[(activeIndex + 1) % FILE_COUNT];
  const ghostSpec = ghost ? EDITOR_FILES[indexOfFile(ghost.id)] : null;

  return (
    <div
      ref={rootRef}
      className="editor-file-nav"
      data-editor-file-nav="true"
      onPointerLeave={() => {
        wheelRef.current.acc = 0;
      }}
      onKeyDown={handleKeyDown}
      style={{
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Tabline disclosure toggle — rendered always, displayed only in
          the ≤640 band (CSS). Names the open file; aria-expanded mirrors
          the sheet state exactly. */}
      <button
        ref={toggleRef}
        type="button"
        className="editor-tabline-toggle"
        aria-expanded={sheetOpen}
        aria-controls="editor-file-panel"
        onClick={() => {
          markInteraction();
          setSheetOpen((v) => !v);
        }}
        style={{
          display: 'none',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          minHeight: '44px',
          background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
          border: 'none',
          borderBottom: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
          padding: 'var(--sp-1) var(--sp-2)',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '11px',
          color: 'var(--fg)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: activeSpec.dot,
            flexShrink: 0,
          }}
        />
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activeSpec.file}
        </span>
        <span style={{ fontSize: '8.5px', color: 'var(--dim)', letterSpacing: '0.06em' }}>{activeSpec.kind}</span>
        <span aria-hidden="true" style={{ color: 'var(--dim)', fontSize: '10px' }}>{sheetOpen ? '▾' : '▸'}</span>
      </button>

      <div
        id="editor-file-panel"
        className={`editor-file-panel${sheetOpen ? ' is-open' : ' is-closed'}`}
        style={{
          height: '100%',
          background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
          borderRight: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
          fontFamily: '"IBM Plex Mono", monospace',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Explorer header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 'var(--sp-1) var(--sp-2)',
            fontSize: '9.5px',
            letterSpacing: '0.1em',
            color: 'var(--dim)',
            flexShrink: 0,
          }}
        >
          <span style={{ color: 'var(--accent)' }}>▸</span>
          <span>EXPLORER · karan.dev / src</span>
        </div>

        {/* ============ THE ARC DRUM (desktop >640px) ============ */}
        <div
          ref={drumRef}
          className="rail-drum"
          role="navigation"
          aria-label="Portfolio files"
          style={{
            position: 'relative',
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* Guide arc + starburst nodes — dim at rest, brightening
              while the drum travels (opacity driven by the rAF loop). */}
          <svg
            aria-hidden="true"
            focusable="false"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
            viewBox={drumSize.w > 0 && drumSize.h > 0 ? `0 0 ${drumSize.w} ${drumSize.h}` : undefined}
            preserveAspectRatio="none"
          >
            <g ref={guideRef} style={{ opacity: 0.32 }}>
              <path d={guidePath(centreY)} fill="none" stroke="var(--fg)" strokeWidth="1" />
              {GUIDE_NODE_OFFSETS.map((o) => {
                const p = slotPoint(o, centreY);
                return (
                  <polygon
                    key={o}
                    points={starPoints(p.x, p.y, o === 0 ? 6 : 4.5, o === 0 ? 2.2 : 1.7)}
                    fill="var(--fg)"
                    stroke="none"
                  />
                );
              })}
            </g>
          </svg>

          {/* ▶ marker — FIXED at the centre slot; cards pass under it. */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '3px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--accent)',
              fontSize: '10px',
              lineHeight: 1,
              zIndex: 55,
              pointerEvents: 'none',
            }}
          >
            ▶
          </span>

          {/* Particle burst canvas (bursts drawn by the rAF loop). */}
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 45 }}
          />

          {/* Drum cards — transforms written per-frame by the loop via
              refs; the ref callback seeds the docked transform so the
              first paint is already on the arc. Hover: NO feedback. */}
          {!collapsed &&
            !idle &&
            EDITOR_FILES.map((f, i) => {
              const isActive = activeFile === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  data-file-button={f.id}
                  onClick={() => handleSelect(f.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className="editor-file-button rail-card"
                  ref={(el) => {
                    cardRefs.current[i] = el;
                    if (el) {
                      const cy = (sizeRef.current.h || 770) / 2;
                      el.style.transform = cardTransform(wrapOffset(i - positionRef.current), cy, reducedRef.current);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${CARD_LEFT}px`,
                    top: 0,
                    width: `${CARD_W}px`,
                    height: `${CARD_H}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: '4px',
                    padding: '7px 9px',
                    boxSizing: 'border-box',
                    background: 'transparent',
                    border: 'none',
                    boxShadow: isActive
                      ? '0 0 0 1px var(--fg)'
                      : '0 0 0 1px color-mix(in srgb, var(--fg) 16%, transparent)',
                    color: isActive ? 'var(--fg)' : 'var(--dim)',
                    fontSize: '11px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    textAlign: 'left',
                    willChange: 'transform',
                  }}
                >
                  <CardFace spec={f} isActive={isActive} />
                </button>
              );
            })}

          {/* Wrap fling ghost — a copy of the outgoing card tumbling
              away while the real card re-enters from the other end. */}
          {ghost && ghostSpec && (
            <div
              key={ghost.key}
              ref={ghostRef}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${CARD_LEFT}px`,
                top: 0,
                width: `${CARD_W}px`,
                height: `${CARD_H}px`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '4px',
                padding: '7px 9px',
                boxSizing: 'border-box',
                boxShadow: '0 0 0 1px color-mix(in srgb, var(--fg) 16%, transparent)',
                color: 'var(--dim)',
                fontSize: '11px',
                zIndex: 46,
                pointerEvents: 'none',
                transform: `translate(0px, ${(centreY - CARD_H / 2).toFixed(1)}px)`,
              }}
            >
              <CardFace spec={ghostSpec} isActive={false} />
            </div>
          )}

          {/* Idle minimal state: one preview card (the NEXT file)
              drifting on the arc; non-interactive. */}
          {idle && !collapsed && (
            <div
              ref={previewRef}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${CARD_LEFT}px`,
                top: 0,
                width: `${CARD_W}px`,
                height: `${CARD_H}px`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '4px',
                padding: '7px 9px',
                boxSizing: 'border-box',
                boxShadow: '0 0 0 1px color-mix(in srgb, var(--fg) 16%, transparent)',
                color: 'var(--dim)',
                fontSize: '11px',
                zIndex: 10,
                pointerEvents: 'none',
                transform: cardTransform(1, centreY, reducedMotion),
              }}
            >
              <CardFace spec={previewSpec} isActive={false} />
            </div>
          )}

          {/* Collapsed (Bit asleep, §2.6): cards gone, guide + ▶ stay,
              and the wake pill appears in the rail zone. */}
          {collapsed && (
            <button
              type="button"
              onClick={() => {
                markInteraction();
                onWake?.();
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'var(--fg)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: '999px',
                padding: '7px 14px',
                fontFamily: 'inherit',
                fontSize: '10px',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                zIndex: 60,
              }}
            >
              wake bit
            </button>
          )}
        </div>

        {/* ============ LEGACY SHEET LIST (≤640px only, CSS) ============ */}
        <div
          role="navigation"
          aria-label="Portfolio files"
          className="editor-file-list rail-sheet-list scroll-contain"
          style={{
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            flex: '1 1 auto',
            padding: '10px 12px',
            gap: '6px',
          }}
        >
          {EDITOR_FILES.map((f) => {
            const isActive = activeFile === f.id;
            const excerpt = NAV_EXCERPTS[f.id];
            return (
              <button
                key={f.id}
                type="button"
                data-file-button={f.id}
                onClick={() => handleSelect(f.id)}
                aria-current={isActive ? 'true' : undefined}
                className="editor-file-button"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: '3px',
                  width: '100%',
                  position: 'relative',
                  background: 'transparent',
                  color: isActive ? 'var(--fg)' : 'var(--dim)',
                  border: 'none',
                  boxShadow: isActive
                    ? '0 0 0 1px var(--fg)'
                    : '0 0 0 1px color-mix(in srgb, var(--fg) 13%, transparent)',
                  padding: '7px 10px',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    aria-hidden="true"
                    style={{ width: '7px', height: '7px', borderRadius: '50%', background: f.dot, flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.file}</span>
                  <span style={{ fontSize: '8.5px', color: 'var(--dim)', letterSpacing: '0.06em' }}>{f.kind}</span>
                </span>
                <span aria-hidden="true" style={{ display: 'block' }}>
                  {excerpt.map((line) => (
                    <span
                      key={line}
                      style={{
                        display: 'block',
                        fontSize: '8.5px',
                        lineHeight: 1.5,
                        color: 'var(--dim)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {line}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        {/* Data date line (omitted when the snapshot can't be read). */}
        {dataDate && (
          <div
            className="rail-date-line"
            style={{
              padding: '6px var(--sp-2) 0',
              fontSize: '9px',
              lineHeight: 1.6,
              color: 'var(--dim)',
              flexShrink: 0,
            }}
          >
            data · {dataDate}
          </div>
        )}

        <div
          className="editor-explorer-hint"
          style={{
            padding: 'var(--sp-1) var(--sp-2)',
            fontSize: '9px',
            lineHeight: 1.7,
            color: 'var(--dim)',
            borderTop: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
            flexShrink: 0,
          }}
        >
          scroll · drag the wheel
          <br />
          ⌘K palette · ctrl+` terminal
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PROFILE } from '../data/profile';
import { fmtInt, isoDay } from '../lib/format';

/**
 * ContributionTree (DESIGN-SPEC §3.1.1) — the about panel group. A
 * seeded dendritic line-tree grows upward from a root, its branch mass
 * distributed across the year by months.json: each month's share of
 * the total contributions becomes that month's share of the segments,
 * in chronological "waves" (zero months grow nothing). The same
 * TreeModel the SVG draws feeds the numeric twin, so the counts on
 * screen are the tree's own outputs, never typed constants.
 *
 * Growth loop: p goes 0 → 1 over clamp(total × 0.4s, 20s, 60s),
 * holds ~10s at full growth, resets and regrows. Bit asleep freezes
 * the tree at the root (reached 0 / <total>); reduced motion renders
 * it fully grown and static. With no activity data the frame renders
 * an honest `activity data unavailable` line instead.
 */

export interface TreeSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  birth: number;
  depth: number;
}

export interface TreeModel {
  segments: TreeSegment[];
  tips: number;
  junctions: number;
  members: number;
  totalLength: number;
}

export interface MonthContributions {
  month: string;
  contributions: number;
}

/** mulberry32 — small seeded PRNG; same seed → same stream → same tree. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VIEW_W = 300;
const VIEW_H = 260;
const ROOT_X = VIEW_W / 2;
const ROOT_Y = 240;
const MAX_SEGMENTS = 420;

/**
 * growTree — pure generator. Builds the tree shape breadth-first
 * (parents always precede their children), then assigns each segment
 * a `birth` (the growth fraction at which it appears) from its rank:
 * the fraction of segments born by the end of a month's wave equals
 * that month's cumulative share of the contributions.
 */
// oxlint-disable-next-line only-export-components
export function growTree(months: MonthContributions[], total: number): TreeModel {
  const empty: TreeModel = { segments: [], tips: 0, junctions: 0, members: 0, totalLength: 0 };
  const monthSum = months.reduce((sum, m) => sum + Math.max(0, m.contributions), 0);
  const denom = total > 0 ? total : monthSum;
  if (denom <= 0 || monthSum <= 0) return empty;

  // Seed derived from the data itself: total + the months string.
  const monthsKey = months.map((m) => `${m.month}:${m.contributions}`).join('|');
  let seed = (Math.trunc(total) * 2654435761) >>> 0;
  for (let i = 0; i < monthsKey.length; i += 1) {
    seed = (Math.imul(seed ^ monthsKey.charCodeAt(i), 1597334677) + i) >>> 0;
  }
  const rand = mulberry32(seed);

  const target = Math.max(12, Math.min(MAX_SEGMENTS, Math.round(total / 2)));

  interface Node {
    x: number;
    y: number;
    angle: number; // radians from vertical; + leans right
    len: number;
    depth: number;
  }

  const raw: TreeSegment[] = [];
  const queue: Node[] = [{ x: ROOT_X, y: ROOT_Y, angle: 0, len: 34, depth: 0 }];

  while (queue.length > 0 && raw.length < target) {
    const node = queue.shift() as Node;
    const x2 = node.x + Math.sin(node.angle) * node.len;
    const y2 = node.y - Math.cos(node.angle) * node.len;
    raw.push({ x1: node.x, y1: node.y, x2, y2, birth: 0, depth: node.depth });

    const spent = node.len < 5 || node.depth >= 10 || raw.length >= target;
    if (spent) continue;

    // Branch: usually two children, sometimes a single continuation
    // or a triple fork.
    const roll = rand();
    const childCount = roll < 0.12 ? 1 : roll < 0.3 ? 3 : 2;
    for (let c = 0; c < childCount; c += 1) {
      if (raw.length + queue.length >= target) break;
      const spread =
        childCount === 1
          ? (rand() - 0.5) * 0.26
          : (c - (childCount - 1) / 2) * (0.46 + rand() * 0.32) + (rand() - 0.5) * 0.16;
      // Gentle steering back toward the centre keeps the crown in frame.
      const steer = ((ROOT_X - x2) / VIEW_W) * 0.1;
      queue.push({
        x: x2,
        y: y2,
        angle: node.angle + spread + steer,
        len: node.len * (0.78 + rand() * 0.12),
        depth: node.depth + 1,
      });
    }
  }

  // Tips / junctions from the drawn geometry: a segment is a tip when
  // no other segment starts at its end point; a junction is a start
  // point shared by two or more child segments.
  const key = (x: number, y: number) => `${Math.round(x * 10)}:${Math.round(y * 10)}`;
  const startCounts = new Map<string, number>();
  raw.forEach((s) => startCounts.set(key(s.x1, s.y1), (startCounts.get(key(s.x1, s.y1)) ?? 0) + 1));
  let tips = 0;
  raw.forEach((s) => {
    if (!startCounts.has(key(s.x2, s.y2))) tips += 1;
  });
  let junctions = 0;
  startCounts.forEach((count) => {
    if (count >= 2) junctions += 1;
  });

  // Births by rank across the monthly waves. Wave boundaries are the
  // cumulative contribution shares; a segment whose rank fraction
  // falls inside a wave is born inside that wave's share band.
  const waves: Array<{ share: number; cumBefore: number }> = [];
  let cum = 0;
  months.forEach((m) => {
    const share = Math.max(0, m.contributions) / denom;
    if (share > 0) waves.push({ share, cumBefore: cum });
    cum += share;
  });
  const n = raw.length;
  raw.forEach((seg, i) => {
    const rankFrac = (i + 0.5) / n;
    let birth = rankFrac;
    for (let w = 0; w < waves.length; w += 1) {
      const wave = waves[w];
      const waveEnd = wave.cumBefore + wave.share;
      if (rankFrac <= waveEnd || w === waves.length - 1) {
        const within = wave.share > 0 ? Math.min(1, Math.max(0, (rankFrac - wave.cumBefore) / wave.share)) : 0;
        birth = wave.cumBefore + within * wave.share;
        break;
      }
    }
    // Seeded jitter inside the band, then a monotonic pass over the
    // breadth-first order so a child never precedes its parent.
    seg.birth = Math.min(0.999, Math.max(0, birth + (rand() - 0.5) * 0.02));
    if (i > 0) seg.birth = Math.max(seg.birth, raw[i - 1].birth);
  });
  if (n > 0) raw[0].birth = 0;

  const totalLength = raw.reduce((sum, s) => sum + Math.hypot(s.x2 - s.x1, s.y2 - s.y1), 0);
  return { segments: raw, tips, junctions, members: raw.length, totalLength };
}

/* ------------------------------------------------------------------ */

export interface ContributionTreeProps {
  months: MonthContributions[];
  total: number;
  fetchedAt?: string | null;
  asleep: boolean;
  reducedMotion: boolean;
}

const MONO: React.CSSProperties = { fontFamily: '"IBM Plex Mono", monospace' };
const HOLD_MS = 10_000;

export const ContributionTree: React.FC<ContributionTreeProps> = ({
  months,
  total,
  fetchedAt,
  asleep,
  reducedMotion,
}) => {
  const model = useMemo(() => growTree(months, total), [months, total]);
  const [progress, setProgress] = useState(0);
  const [grownSec, setGrownSec] = useState(0);
  const elapsedRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const lastPaintRef = useRef(0);

  const durationSec = Math.min(60, Math.max(20, total * 0.4));
  const durationMs = durationSec * 1000;
  const looping = !asleep && !reducedMotion && model.members > 0;

  useEffect(() => {
    if (!looping) return;
    elapsedRef.current = 0;
    lastTsRef.current = null;
    lastPaintRef.current = 0;
    let raf = 0;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      if (lastTsRef.current === null) {
        lastTsRef.current = ts;
        return;
      }
      const delta = Math.min(ts - lastTsRef.current, 250);
      lastTsRef.current = ts;
      elapsedRef.current += delta;
      const cycleMs = durationMs + HOLD_MS;
      const inCycle = elapsedRef.current % cycleMs;
      const p = Math.min(1, inCycle / durationMs);
      // Throttle React state to ~8Hz; per-frame data stays in refs.
      if (ts - lastPaintRef.current >= 120) {
        lastPaintRef.current = ts;
        setProgress(p);
        setGrownSec(Math.min(inCycle, durationMs) / 1000);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [looping, durationMs]);

  const frameStyle: React.CSSProperties = {
    ...MONO,
    border: '1px solid var(--line)',
    outline: '1px solid var(--line)',
    outlineOffset: '3px',
    padding: '12px',
  };

  if (months.length === 0 || total <= 0 || model.members === 0) {
    return (
      <div style={frameStyle}>
        <div style={{ fontSize: '10px', color: 'var(--dim)' }}>activity data unavailable</div>
      </div>
    );
  }

  const p = reducedMotion ? 1 : asleep ? 0 : progress;
  const reached = Math.round(total * p);
  const grown = reducedMotion ? durationSec : asleep ? 0 : grownSec;

  // Live counts derived from the segments actually drawn at p.
  const drawn = model.segments.filter((s) => s.birth <= p);
  const drawnStartCounts = new Map<string, number>();
  const segKey = (x: number, y: number) => `${Math.round(x * 10)}:${Math.round(y * 10)}`;
  drawn.forEach((s) =>
    drawnStartCounts.set(segKey(s.x1, s.y1), (drawnStartCounts.get(segKey(s.x1, s.y1)) ?? 0) + 1)
  );
  let drawnTips = 0;
  drawn.forEach((s) => {
    if (!drawnStartCounts.has(segKey(s.x2, s.y2))) drawnTips += 1;
  });
  let drawnJunctions = 0;
  drawnStartCounts.forEach((count) => {
    if (count >= 2) drawnJunctions += 1;
  });
  const lengthMm = (total * 0.4 * p).toFixed(1);
  const segSpan = Math.min(0.06, Math.max(0.008, 1.6 / Math.max(1, model.members)));

  // Crown extents for the dimension line.
  let minX = VIEW_W;
  let maxX = 0;
  let minY = VIEW_H;
  model.segments.forEach((s) => {
    minX = Math.min(minX, s.x1, s.x2);
    maxX = Math.max(maxX, s.x1, s.x2);
    minY = Math.min(minY, s.y1, s.y2);
  });
  const dimY = Math.max(14, minY - 10);

  const firstYear = months[0].month.slice(0, 4);
  const lastYear = months[months.length - 1].month.slice(0, 4);
  const activeMonths = months.filter((m) => m.contributions > 0).length;

  // A–A echo: monthly totals as a filled silhouette.
  const maxMonth = Math.max(1, ...months.map((m) => m.contributions));
  const echoPts = months.map((m, i) => {
    const x = 2 + (i / Math.max(1, months.length - 1)) * 116;
    const y = 40 - (m.contributions / maxMonth) * 34;
    return { x, y };
  });
  const echoPath =
    `M ${echoPts[0].x.toFixed(1)} 42 ` +
    echoPts.map((pt) => `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ') +
    ` L ${echoPts[echoPts.length - 1].x.toFixed(1)} 42 Z`;
  const echoLine = echoPts.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');

  const twinRows: Array<[string, string]> = [
    ['members', fmtInt(drawn.length)],
    ['tips', fmtInt(drawnTips)],
    ['junctions', fmtInt(drawnJunctions)],
    ['length (mm)', lengthMm],
    ['grown (s)', grown.toFixed(1)],
    ['reached', `${fmtInt(reached)} / ${fmtInt(total)}`],
  ];

  const sprout = (key: string) => (
    <svg key={key} width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22 V11" stroke="var(--kw)" strokeWidth="1.2" fill="none" />
      <path d="M12 11 C12 7 9 5 5 5 C5 9 8 11 12 11 Z" stroke="var(--kw)" strokeWidth="1" fill="none" />
      <path d="M12 9 C12 5 15 3 19 3 C19 7 16 9 12 9 Z" stroke="var(--kw)" strokeWidth="1" fill="none" />
    </svg>
  );

  return (
    <div style={frameStyle} title={fetchedAt ? `data · ${isoDay(fetchedAt)}` : undefined}>
      <div style={{ fontSize: '10px', color: 'var(--dim)', marginBottom: '10px', letterSpacing: '0.04em' }}>
        {fmtInt(total)} points · 1 per contribution · {firstYear}–{lastYear}
      </div>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        {/* The tree */}
        <div style={{ flex: '1 1 55%', minWidth: '260px' }}>
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            role="img"
            aria-label={`contribution tree, ${fmtInt(reached)} of ${fmtInt(total)} grown`}
          >
            {/* dimension line across the crown */}
            <line x1={minX} y1={dimY} x2={maxX} y2={dimY} stroke="var(--dim)" strokeWidth="0.6" />
            <line x1={minX} y1={dimY - 3} x2={minX} y2={dimY + 3} stroke="var(--dim)" strokeWidth="0.6" />
            <line x1={maxX} y1={dimY - 3} x2={maxX} y2={dimY + 3} stroke="var(--dim)" strokeWidth="0.6" />
            <text x={VIEW_W / 2} y={dimY - 3} textAnchor="middle" fontSize="8" fill="var(--dim)" style={MONO}>
              {(total * 0.4).toFixed(1)} mm
            </text>
            <text x={VIEW_W / 2} y={Math.max(9, dimY - 12)} textAnchor="middle" fontSize="8" fill="var(--dim)" style={MONO}>
              apex {model.tips} steps
            </text>

            {/* A section markers */}
            <text x={4} y={VIEW_H / 2} fontSize="9" fill="var(--dim)" style={MONO}>
              A
            </text>
            <text x={VIEW_W - 12} y={VIEW_H / 2} fontSize="9" fill="var(--dim)" style={MONO}>
              A
            </text>

            {/* segments */}
            {model.segments.map((s, i) => {
              if (p < s.birth) return null;
              const local = Math.min(1, (p - s.birth) / segSpan);
              const ex = s.x1 + (s.x2 - s.x1) * local;
              const ey = s.y1 + (s.y2 - s.y1) * local;
              return (
                <line
                  key={i}
                  x1={s.x1}
                  y1={s.y1}
                  x2={ex}
                  y2={ey}
                  stroke="var(--fg)"
                  strokeWidth={Math.max(0.5, 1.6 - s.depth * 0.14)}
                  strokeLinecap="round"
                />
              );
            })}

            {/* base axis ticks 1–8 */}
            <line x1={10} y1={248} x2={VIEW_W - 10} y2={248} stroke="var(--dim)" strokeWidth="0.6" />
            {Array.from({ length: 8 }, (_, i) => {
              const x = 14 + i * ((VIEW_W - 28) / 7);
              return (
                <g key={i}>
                  <line x1={x} y1={246} x2={x} y2={250} stroke="var(--dim)" strokeWidth="0.6" />
                  <text x={x} y={258} textAnchor="middle" fontSize="7" fill="var(--dim)" style={MONO}>
                    {i + 1}
                  </text>
                </g>
              );
            })}
            <text x={VIEW_W - 2} y={238} textAnchor="end" fontSize="8" fill="var(--dim)" style={MONO}>
              root carries {fmtInt(total)}
            </text>
          </svg>
        </div>

        {/* Right column: A–A echo / numeric twin / mini panel */}
        <div style={{ flex: '1 1 38%', minWidth: '190px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ border: '1px solid var(--line)', padding: '8px' }}>
            <svg viewBox="0 0 120 44" style={{ width: '100%', height: 'auto', display: 'block' }} aria-hidden="true">
              <path d={echoPath} fill="color-mix(in srgb, var(--num) 30%, transparent)" stroke="none" />
              <polyline points={echoLine} fill="none" stroke="var(--num)" strokeWidth="0.8" />
            </svg>
            <div style={{ fontSize: '10px', color: 'var(--dim)', marginTop: '6px' }}>
              monthly echo · spans {activeMonths} active months
            </div>
          </div>

          <div style={{ border: '1px solid var(--line)', padding: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--dim)', marginBottom: '6px', letterSpacing: '0.06em' }}>
              as counts
            </div>
            {twinRows.map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  fontSize: '10px',
                  lineHeight: 1.7,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span style={{ color: 'var(--dim)' }}>{label}</span>
                <span style={{ color: 'var(--num)' }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid var(--line)', padding: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--dim)', marginBottom: '6px' }}>scale 4:1</div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
              {sprout('s1')}
              {sprout('s2')}
              {sprout('s3')}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--chrome)', lineHeight: 1.5 }}>{PROFILE.subtitle}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

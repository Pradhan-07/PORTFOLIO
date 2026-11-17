/**
 * ============================================================================
 * CANVAS STRAP RENDERER — BEEBOMBSHELL-STYLE TWISTING RIBBON
 * ============================================================================
 * Draws the lanyard straps as 3D-twisting ribbons on a 2D canvas, the
 * same technique beebombshell.com uses:
 *
 * - Each strap polyline is smoothed with a Catmull-Rom spline
 *   (8 subdivisions per segment, like the reference).
 * - The ribbon's half-width is modulated by cos(twist(u)): as the badge
 *   flips, twist grows along the strap (twist ∝ flip angle × u), the
 *   ribbon narrows, shows its BACK colour past 90°, and widens again —
 *   so the strap visibly rotates together with the card.
 * - Dashed stitching runs along both edges; the wearer's name/role is
 *   printed repeatedly along the front face (hidden when the back shows).
 * - A silver clasp sits at the strap convergence and a metal ring at
 *   the connector end.
 * ============================================================================
 */

export interface StrapPalette {
  front: string;
  back: string;
  print: string;
  stitching: string;
}

/** Reference-site palettes (dark / light). */
export const STRAP_PALETTES: { dark: StrapPalette; light: StrapPalette } = {
  dark: {
    front: "#121212",
    back: "#2c2c31",
    print: "rgba(246,245,241,.88)",
    stitching: "rgba(255,255,255,.35)",
  },
  light: {
    front: "#eeece6",
    back: "#cfcdc6",
    print: "rgba(18,18,18,.88)",
    stitching: "rgba(0,0,0,.3)",
  },
};

interface Pt {
  x: number;
  y: number;
}

interface Sample extends Pt {
  tx: number; // tangent (unit)
  ty: number;
  s: number; // cumulative arc length
  u: number; // 0..1 along the strap
}

/** Catmull-Rom smoothing with `subdiv` subdivisions per segment. */
export function smoothPoints(points: Pt[], subdiv = 8): Sample[] {
  if (points.length < 2) return [];
  const samples: Sample[] = [];
  const ext = [points[0], ...points, points[points.length - 1]];

  for (let i = 0; i < ext.length - 3; i++) {
    const p0 = ext[i];
    const p1 = ext[i + 1];
    const p2 = ext[i + 2];
    const p3 = ext[i + 3];
    for (let j = 0; j < subdiv; j++) {
      const t = j / subdiv;
      const t2 = t * t;
      const t3 = t2 * t;
      samples.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
        tx: 0,
        ty: 0,
        s: 0,
        u: 0,
      });
    }
  }
  const last = points[points.length - 1];
  samples.push({ x: last.x, y: last.y, tx: 0, ty: 0, s: 0, u: 1 });

  let total = 0;
  for (let i = 0; i < samples.length; i++) {
    if (i > 0) {
      total += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
    }
    samples[i].s = total;
  }
  for (let i = 0; i < samples.length; i++) {
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    samples[i].tx = dx / len;
    samples[i].ty = dy / len;
    samples[i].u = total > 0 ? samples[i].s / total : 0;
  }
  return samples;
}

export interface RibbonOptions {
  width: number;
  /** Twist in radians at arc-length fraction u (0..1). */
  twistAt: (u: number) => number;
  palette: StrapPalette;
  /** Repeated print text for the front face (optional). */
  printText?: string;
  /** Arc-length offset where printing starts. */
  printPhase?: number;
  /** Receives the arc-length interval of every printed glyph (audits/tests). */
  onPrintGlyphs?: (intervals: { char: string; start: number; end: number }[]) => void;
}

export function drawRibbon(
  ctx: CanvasRenderingContext2D,
  samples: Sample[],
  opts: RibbonOptions
) {
  if (samples.length < 2) return;
  const { width, twistAt, palette } = opts;
  const half = width / 2;

  const edge = (sm: Sample, side: 1 | -1): Pt => {
    const hw = half * Math.cos(twistAt(sm.u));
    return { x: sm.x + -sm.ty * hw * side, y: sm.y + sm.tx * hw * side };
  };

  // Face quads (front/back decided per segment by the twist at its middle)
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    const midU = (a.u + b.u) / 2;
    const facing = Math.cos(twistAt(midU));
    ctx.fillStyle = facing >= 0 ? palette.front : palette.back;
    const aL = edge(a, 1);
    const aR = edge(a, -1);
    const bL = edge(b, 1);
    const bR = edge(b, -1);
    ctx.beginPath();
    ctx.moveTo(aL.x, aL.y);
    ctx.lineTo(bL.x, bL.y);
    ctx.lineTo(bR.x, bR.y);
    ctx.lineTo(aR.x, aR.y);
    ctx.closePath();
    ctx.fill();
  }

  // Stitching along both edges (skips where the ribbon is edge-on)
  ctx.strokeStyle = palette.stitching;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  for (const side of [1, -1] as const) {
    ctx.beginPath();
    let started = false;
    for (const sm of samples) {
      const cos = Math.cos(twistAt(sm.u));
      if (Math.abs(cos) < 0.18) {
        started = false;
        continue;
      }
      const inset = (half - 3) * cos;
      const px = sm.x + -sm.ty * inset * side;
      const py = sm.y + sm.tx * inset * side;
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Printed text along the front face
  if (opts.printText) {
    const total = samples[samples.length - 1].s;
    const text = opts.printText;
    const charStep = 7.2;
    ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
    ctx.fillStyle = palette.print;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const glyphs: { char: string; start: number; end: number }[] = [];
    let charIdx = 0;
    // Print starts `printPhase` px down the strap, with the text's first
    // character — so the name reads from a chosen point on the strap.
    for (let sPos = opts.printPhase ?? 0; sPos < total; sPos += charStep, charIdx++) {
      // locate sample at arc length sPos
      let lo = 0;
      let hi = samples.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (samples[mid].s < sPos) lo = mid + 1;
        else hi = mid;
      }
      const sm = samples[Math.max(1, lo)];
      if (Math.cos(twistAt(sm.u)) <= 0.3) continue; // back face / edge-on
      const ch = text[charIdx % text.length];
      if (ch === " ") continue;
      ctx.save();
      ctx.translate(sm.x, sm.y);
      ctx.rotate(Math.atan2(sm.ty, sm.tx));
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      glyphs.push({ char: ch, start: sPos - 3.3, end: sPos + 3.3 });
    }
    opts.onPrintGlyphs?.(glyphs);
  }
}

/** Silver clasp (24×36) at the strap convergence, aligned to the connector. */
export function drawClasp(ctx: CanvasRenderingContext2D, from: Pt, to: Pt) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  const cx = from.x + Math.cos(ang) * 6;
  const cy = from.y + Math.sin(ang) * 6;

  const grad = ctx.createLinearGradient(cx - 12, cy, cx + 12, cy);
  grad.addColorStop(0, "#8e8e96");
  grad.addColorStop(0.35, "#e9e9ee");
  grad.addColorStop(0.6, "#b9b9c1");
  grad.addColorStop(1, "#7c7c85");

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang + Math.PI / 2);
  ctx.beginPath();
  ctx.roundRect(-12, -18, 24, 36, 5);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-6, -11, 12, 22, 3);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.stroke();
  ctx.restore();
}

/** Connector tab + metal ring between the connector end (p8) and strap end (p9). */
export function drawRingAndTab(
  ctx: CanvasRenderingContext2D,
  p8: Pt,
  p9: Pt,
  palette: StrapPalette
) {
  const ang = Math.atan2(p9.y - p8.y, p9.x - p8.x);
  const dist = Math.hypot(p9.x - p8.x, p9.y - p8.y);
  const mx = (p8.x + p9.x) / 2;
  const my = (p8.y + p9.y) / 2;

  // Tab
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(ang + Math.PI / 2);
  ctx.beginPath();
  ctx.roundRect(-6, -(dist + 10) / 2, 12, dist + 10, 4);
  ctx.fillStyle = palette.front;
  ctx.fill();
  ctx.restore();

  // Ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(p8.x, p8.y, 6, 0, Math.PI * 2);
  ctx.strokeStyle = "#c4c4cb";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

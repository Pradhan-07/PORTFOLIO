/**
 * ============================================================================
 * VERLET ROPE — BEEBOMBSHELL-STYLE DOUBLE-STRAP LANYARD
 * ============================================================================
 * Modelled directly on the lanyard at beebombshell.com (whose own source
 * describes it as "a verlet rope"):
 *
 * - 11 points. TWO pinned anchors at the top (center ± 30px) form a V:
 *   two straps converge at point 3, then a narrower connector runs
 *   3 -> 7 -> 8 (ring) -> 9, and the badge point (10) hangs from point 9
 *   on a long stick. The badge is rendered centred on the midpoint of
 *   points 9 and 10, so the long stick is hidden behind the badge.
 * - Gravity 0.55/step, velocity damping 0.992, velocity clamp ±30,
 *   12 constraint iterations — the reference site's exact constants.
 * - Dragging hard-pins the badge point to the pointer. The elongation
 *   feel comes from the solver: the rope is pulled along and stretches
 *   elastically, then snaps back with verlet momentum on release.
 * - One flagged stick (8 -> 10, rest = badgeStick + 12) is a one-way
 *   strut: it only pushes when compressed, keeping the badge from
 *   folding up into the ring.
 * - Sleep mode (from this site's earlier engine) stops the solver when
 *   the rope is at rest, so an idle hero costs ~0% CPU.
 * ============================================================================
 */

export interface VerletPoint {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  isPinned: boolean;
  invMass: number;
}

export interface VerletStick {
  p0Index: number;
  p1Index: number;
  restLength: number;
  oneWay?: boolean;
}

export interface PhysicsConfig {
  gravity: number;
  damping: number;
  constraintIterations: number;
  /** Reference segment length (upper straps), kept for telemetry/tests. */
  restSegmentLength: number;
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: 0.55,
  damping: 0.992,
  constraintIterations: 12,
  restSegmentLength: 35,
};

const POINT_COUNT = 11;
export const BADGE_POINT_INDEX = 10;
export const BADGE_TOP_POINT_INDEX = 9;

export class VerletRope {
  points: VerletPoint[] = [];
  sticks: VerletStick[] = [];
  config: PhysicsConfig;

  /** Layout anchors: straps pin at (anchorX ± 30, anchorY). */
  anchorX: number = 0;
  anchorY: number = 0;
  badgeStickLength: number = 430;

  accumulator: number = 0;
  lastTime: number = 0;

  isSleeping: boolean = false;
  private sleepFrames: number = 0;

  fps: number = 60;
  private fpsLastTime: number = 0;
  private fpsFrames: number = 0;

  constructor(config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG) {
    this.config = config;
  }

  /**
   * Lays out the rope exactly at rest (no initial drop or swing — the
   * first impression must be perfectly still).
   */
  init(centerX: number, topY: number, badgeStickLength: number) {
    this.anchorX = centerX;
    this.anchorY = topY;
    this.badgeStickLength = badgeStickLength;

    const l = 32; // vertical step of the upper straps
    const convY = topY + 96; // convergence point Y
    const c = 24; // connector step
    const p9Y = convY + 3 * c; // last drawn strap point Y
    const badgeY = p9Y + badgeStickLength;

    const mk = (x: number, y: number, pin = false): VerletPoint => ({
      x,
      y,
      oldX: x,
      oldY: y,
      isPinned: pin,
      invMass: pin ? 0 : 1,
    });

    this.points = [
      mk(centerX - 30, topY, true), // 0 left anchor (pinned)
      mk(centerX - 20, topY + l), // 1
      mk(centerX - 10, topY + 2 * l), // 2
      mk(centerX, convY), // 3 convergence
      mk(centerX + 30, topY, true), // 4 right anchor (pinned)
      mk(centerX + 20, topY + l), // 5
      mk(centerX + 10, topY + 2 * l), // 6
      mk(centerX, convY + c), // 7
      mk(centerX, convY + 2 * c), // 8 ring point
      mk(centerX, p9Y), // 9 strap end (hidden behind badge)
      mk(centerX, badgeY), // 10 badge point (hidden behind badge)
    ];

    const L = badgeStickLength;
    this.sticks = [
      { p0Index: 0, p1Index: 1, restLength: 35 },
      { p0Index: 1, p1Index: 2, restLength: 35 },
      { p0Index: 2, p1Index: 3, restLength: 35 },
      { p0Index: 4, p1Index: 5, restLength: 35 },
      { p0Index: 5, p1Index: 6, restLength: 35 },
      { p0Index: 6, p1Index: 3, restLength: 35 },
      { p0Index: 3, p1Index: 7, restLength: 24 },
      { p0Index: 7, p1Index: 8, restLength: 24 },
      { p0Index: 8, p1Index: 9, restLength: 24 },
      { p0Index: 9, p1Index: 10, restLength: L },
      { p0Index: 8, p1Index: 10, restLength: L + 12, oneWay: true },
    ];

    this.accumulator = 0;
    this.lastTime = performance.now();
    this.fpsLastTime = performance.now();
    this.fpsFrames = 0;
    this.isSleeping = false;
    this.sleepFrames = 0;
  }

  /**
   * Re-anchors after a container resize: pinned points move exactly,
   * every other point shifts by the anchor delta so the rope keeps its
   * current shape instead of snapping.
   */
  setAnchor(centerX: number, topY: number) {
    const dx = centerX - this.anchorX;
    const dy = topY - this.anchorY;
    this.anchorX = centerX;
    this.anchorY = topY;
    if (this.points.length !== POINT_COUNT) return;

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      if (p.isPinned) {
        p.x = i === 0 ? centerX - 30 : centerX + 30;
        p.y = topY;
        p.oldX = p.x;
        p.oldY = p.y;
      } else if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        p.x += dx;
        p.oldX += dx;
        p.y += dy;
        p.oldY += dy;
      }
    }
    this.wakeUp();
  }

  wakeUp() {
    this.isSleeping = false;
    this.sleepFrames = 0;
  }

  /**
   * One fixed solver step (dt = 1/60s), reference-site formulation:
   * verlet integration with 0.992 damping and ±30 velocity clamp,
   * then 12 relaxation iterations over two-sided distance constraints
   * (the one flagged strut only pushes when compressed).
   * While dragging, the badge point is pinned to the pointer target.
   */
  step(isDraggingBadge: boolean, target?: { x: number; y: number }) {
    const { gravity, damping, constraintIterations } = this.config;
    const pts = this.points;
    if (pts.length !== POINT_COUNT) return;

    let maxDisp = 0;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (p.isPinned) continue;

      if (isDraggingBadge && target && i === BADGE_POINT_INDEX) {
        p.x = target.x;
        p.y = target.y;
        p.oldX = target.x;
        p.oldY = target.y;
        continue;
      }

      const vx = (p.x - p.oldX) * damping;
      const vy = (p.y - p.oldY) * damping;
      p.oldX = p.x;
      p.oldY = p.y;
      const cx = Math.max(-30, Math.min(30, vx));
      const cy = Math.max(-30, Math.min(30, vy));
      p.x += cx;
      p.y += cy + gravity;
      maxDisp = Math.max(maxDisp, Math.abs(cx), Math.abs(cy));
    }

    for (let iter = 0; iter < constraintIterations; iter++) {
      for (const stick of this.sticks) {
        const p0 = pts[stick.p0Index];
        const p1 = pts[stick.p1Index];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const dist = Math.hypot(dx, dy) || 0.001;

        // One-way strut: only acts when compressed (dist < rest).
        if (stick.oneWay && dist >= stick.restLength) continue;

        const diff = (dist - stick.restLength) / dist;
        const w0 =
          p0.isPinned || (isDraggingBadge && stick.p0Index === BADGE_POINT_INDEX)
            ? 0
            : p0.invMass;
        const w1 =
          p1.isPinned || (isDraggingBadge && stick.p1Index === BADGE_POINT_INDEX)
            ? 0
            : p1.invMass;
        const wSum = w0 + w1;
        if (wSum === 0) continue;

        p0.x += dx * diff * (w0 / wSum);
        p0.y += dy * diff * (w0 / wSum);
        p1.x -= dx * diff * (w1 / wSum);
        p1.y -= dy * diff * (w1 / wSum);
      }
    }

    // Sleep when the rope has effectively stopped moving.
    if (!isDraggingBadge && maxDisp < 0.04) {
      this.sleepFrames++;
      if (this.sleepFrames > 45) {
        this.isSleeping = true;
        for (const p of pts) {
          p.oldX = p.x;
          p.oldY = p.y;
        }
      }
    } else {
      this.sleepFrames = 0;
    }
  }

  /** Main tick with fixed-timestep accumulator (1/60s slices). */
  update(currentTime: number, isDraggingBadge: boolean, target?: { x: number; y: number }) {
    this.fpsFrames++;
    if (currentTime - this.fpsLastTime >= 500) {
      this.fps = Math.round((this.fpsFrames * 1000) / (currentTime - this.fpsLastTime));
      this.fpsFrames = 0;
      this.fpsLastTime = currentTime;
    }

    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      return;
    }

    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    if (deltaTime > 0.05) deltaTime = 0.05;

    if (isDraggingBadge) this.wakeUp();
    if (this.isSleeping) return;

    const fixedDt = 1 / 60;
    this.accumulator += deltaTime;
    while (this.accumulator >= fixedDt) {
      this.step(isDraggingBadge, target);
      this.accumulator -= fixedDt;
      if (this.isSleeping) {
        this.accumulator = 0;
        break;
      }
    }
  }

  /**
   * Badge pose from the rope: the badge centre is the midpoint of
   * points 9 and 10; its angle is the tilt of that segment from
   * vertical; stretchRatio is the badge stick's current length / rest.
   */
  getBadgeTransform(): {
    x: number;
    y: number;
    angleRad: number;
    angleDeg: number;
    stretchRatio: number;
    isSleeping: boolean;
    fps: number;
  } {
    if (this.points.length !== POINT_COUNT) {
      return {
        x: this.anchorX,
        y: this.anchorY + 170 + this.badgeStickLength / 2,
        angleRad: 0,
        angleDeg: 0,
        stretchRatio: 1,
        isSleeping: true,
        fps: this.fps,
      };
    }

    const top = this.points[BADGE_TOP_POINT_INDEX];
    const badge = this.points[BADGE_POINT_INDEX];
    const angleRad = Math.atan2(-(badge.x - top.x), badge.y - top.y);
    const stickLen = Math.hypot(badge.x - top.x, badge.y - top.y);

    return {
      x: (top.x + badge.x) / 2,
      y: (top.y + badge.y) / 2,
      angleRad,
      angleDeg: Math.max(-24, Math.min(24, (angleRad * 180) / Math.PI)),
      stretchRatio: stickLen / Math.max(1, this.badgeStickLength),
      isSleeping: this.isSleeping,
      fps: this.fps,
    };
  }

  getSegmentLengths(): number[] {
    const lengths: number[] = [];
    for (const stick of this.sticks) {
      const p0 = this.points[stick.p0Index];
      const p1 = this.points[stick.p1Index];
      if (!p0 || !p1) continue;
      lengths.push(Math.hypot(p1.x - p0.x, p1.y - p0.y));
    }
    return lengths;
  }
}

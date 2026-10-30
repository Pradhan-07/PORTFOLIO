/**
 * ============================================================================
 * HIGH-FIDELITY VERLET INTEGRATION ENGINE FOR LANYARD & WEIGHTED ID BADGE
 * ============================================================================
 *
 * SPECIFICATION COMPLIANCE:
 * 1. Fixed timestep 1/60s with fractional sub-frame accumulator.
 * 2. 8 constraint relaxation iterations with mass-weighted distribution (heavy badge).
 * 3. Soft spring grab with 120ms progressive stiffness ramp & 0.2 lerp filtering.
 * 4. Dual damping: 0.985 linear rope damping + 0.92 separate angular damping.
 * 5. Velocity clamping (max step velocity 28px, release flick velocity 12px).
 * 6. Non-linear elastic strap elongation up to 2.2x rest length.
 * 7. Simulation sleep threshold to eliminate micro-jitter and idle CPU load.
 * ============================================================================
 */

export interface VerletPoint {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  isPinned: boolean;
  invMass: number; // 1.0 for strap points, ~0.28 for heavy badge
}

export interface VerletStick {
  p0Index: number;
  p1Index: number;
  restLength: number;
}

export interface PhysicsConfig {
  gravity: number;
  damping: number;
  angularDamping: number;
  constraintIterations: number;
  segmentCount: number;
  restSegmentLength: number;
  maxStretchRatio: number;
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: 0.62,
  damping: 0.985,
  angularDamping: 0.92,
  constraintIterations: 8,
  segmentCount: 10,
  restSegmentLength: 16,
  maxStretchRatio: 2.2,
};

export class VerletRope {
  points: VerletPoint[] = [];
  sticks: VerletStick[] = [];
  config: PhysicsConfig;

  totalRestLength: number = 0;
  accumulator: number = 0;
  lastTime: number = 0;
  idleTime: number = 0;

  // Soft spring grab tracking
  isDragging: boolean = false;
  dragElapsed: number = 0;
  filteredTarget: { x: number; y: number } = { x: 0, y: 0 };
  lastRawTarget: { x: number; y: number } = { x: 0, y: 0 };

  // Angular smoothing & settling
  currentAngleDeg: number = 0;
  targetAngleDeg: number = 0;

  // Energy & Sleep management
  isSleeping: boolean = false;
  sleepFrames: number = 0;

  constructor(config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG) {
    this.config = config;
  }

  /**
   * Initializes the rope hanging from anchorX, anchorY down to the badge clip.
   */
  init(anchorX: number, anchorY: number, dropOffset: number = 0) {
    this.points = [];
    this.sticks = [];
    const count = this.config.segmentCount;
    const segLen = this.config.restSegmentLength;

    for (let i = 0; i <= count; i++) {
      const y = anchorY + i * segLen - dropOffset;
      const isBadgePoint = i === count;

      this.points.push({
        x: anchorX,
        y: y,
        oldX: anchorX,
        oldY: y - (dropOffset > 0 ? 8 : 0),
        isPinned: i === 0,
        // Heavy badge: 3.5x mass of normal strap points
        invMass: i === 0 ? 0 : isBadgePoint ? 0.28 : 1.0,
      });
    }

    for (let i = 0; i < count; i++) {
      this.sticks.push({
        p0Index: i,
        p1Index: i + 1,
        restLength: segLen,
      });
    }

    this.totalRestLength = count * segLen;
    this.lastTime = performance.now();
    this.isSleeping = false;
    this.sleepFrames = 0;
    this.currentAngleDeg = 0;
    this.targetAngleDeg = 0;
  }

  wakeUp() {
    this.isSleeping = false;
    this.sleepFrames = 0;
  }

  /**
   * Advances the simulation by a fixed delta time slice (1/60s).
   */
  step(isDraggingBadge: boolean, rawTarget?: { x: number; y: number }) {
    const { gravity, damping, constraintIterations, maxStretchRatio } = this.config;
    this.idleTime += 0.018;

    const badgeIndex = this.points.length - 1;
    const badgePoint = this.points[badgeIndex];

    // Handle Grab State Transitions
    if (isDraggingBadge && rawTarget) {
      this.wakeUp();

      if (!this.isDragging) {
        // Just started dragging: initialize filtered target
        this.isDragging = true;
        this.dragElapsed = 0;
        this.filteredTarget = { x: badgePoint.x, y: badgePoint.y };
      }

      this.dragElapsed += 1 / 60;

      // Low-pass filter target position (0.2 factor removes mouse jitter)
      this.filteredTarget.x += (rawTarget.x - this.filteredTarget.x) * 0.2;
      this.filteredTarget.y += (rawTarget.y - this.filteredTarget.y) * 0.2;

      // Spring ramp: 0 to 1 over 120ms for smooth pickup
      const springStiffness = Math.min(1.0, this.dragElapsed / 0.12);

      // Apply soft spring force to badge point
      const springForceX = (this.filteredTarget.x - badgePoint.x) * (0.36 * springStiffness);
      const springForceY = (this.filteredTarget.y - badgePoint.y) * (0.36 * springStiffness);

      badgePoint.x += springForceX;
      badgePoint.y += springForceY;
    } else {
      if (this.isDragging) {
        // Just released: clamp flick release velocity to prevent launching
        const maxReleaseVel = 12;
        const vx = badgePoint.x - badgePoint.oldX;
        const vy = badgePoint.y - badgePoint.oldY;

        badgePoint.oldX = badgePoint.x - Math.max(-maxReleaseVel, Math.min(maxReleaseVel, vx));
        badgePoint.oldY = badgePoint.y - Math.max(-maxReleaseVel, Math.min(maxReleaseVel, vy));

        this.isDragging = false;
        this.dragElapsed = 0;
      }
    }

    // 1. Verlet position update with velocity clamping & subtle idle sway
    let totalKineticEnergy = 0;

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      if (p.isPinned) continue;

      let vx = (p.x - p.oldX) * damping;
      let vy = (p.y - p.oldY) * damping + gravity;

      // Clamp max step velocity to 28px
      const maxVel = 28;
      vx = Math.max(-maxVel, Math.min(maxVel, vx));
      vy = Math.max(-maxVel, Math.min(maxVel, vy));

      p.oldX = p.x;
      p.oldY = p.y;

      // Tiny natural idle sway (< 0.6 degrees) when settled
      const idleSway = !this.isDragging ? Math.sin(this.idleTime + i * 0.35) * 0.025 : 0;

      p.x += vx + idleSway;
      p.y += vy;

      totalKineticEnergy += vx * vx + vy * vy;
    }

    // Check Sleep Condition when at rest
    if (!this.isDragging && totalKineticEnergy < 0.008) {
      this.sleepFrames++;
      if (this.sleepFrames > 60) {
        this.isSleeping = true;
        return;
      }
    } else {
      this.sleepFrames = 0;
    }

    // Measure current total length to compute dynamic stretch factor
    let currentLength = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      currentLength += Math.hypot(
        this.points[i + 1].x - this.points[i].x,
        this.points[i + 1].y - this.points[i].y
      );
    }

    const currentStretch = this.totalRestLength > 0 ? currentLength / this.totalRestLength : 1;
    const clampedStretch = Math.min(maxStretchRatio, Math.max(1.0, currentStretch));

    // Non-linear elastic resistance: the further it stretches, the more resistance
    const excessStretch = clampedStretch - 1.0;
    const elasticStiffness = 1.0 - Math.pow(excessStretch / 1.2, 1.6) * 0.45;

    // 2. Mass-weighted Distance Constraint Relaxation
    for (let iter = 0; iter < constraintIterations; iter++) {
      for (let s = 0; s < this.sticks.length; s++) {
        const stick = this.sticks[s];
        const p0 = this.points[stick.p0Index];
        const p1 = this.points[stick.p1Index];

        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const dist = Math.hypot(dx, dy) || 0.0001;

        const targetLen = stick.restLength * (this.isDragging ? clampedStretch : 1.0);
        const diff = (targetLen - dist) / dist;

        const totalInvMass = p0.invMass + p1.invMass;
        if (totalInvMass === 0) continue;

        const ratio0 = (p0.invMass / totalInvMass) * elasticStiffness;
        const ratio1 = (p1.invMass / totalInvMass) * elasticStiffness;

        if (!p0.isPinned) {
          p0.x -= dx * diff * ratio0;
          p0.y -= dy * diff * ratio0;
        }
        if (!p1.isPinned) {
          p1.x += dx * diff * ratio1;
          p1.y += dy * diff * ratio1;
        }
      }
    }
  }

  /**
   * Main update tick using the fixed timestep accumulator.
   */
  update(
    currentTime: number,
    isDraggingBadge: boolean,
    rawTarget?: { x: number; y: number }
  ) {
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      return;
    }

    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Clamp delta time to avoid large physics steps on tab focus
    if (deltaTime > 0.08) deltaTime = 0.08;

    if (isDraggingBadge) {
      this.wakeUp();
    }

    if (this.isSleeping) {
      return;
    }

    const fixedDt = 1 / 60;
    this.accumulator += deltaTime;

    while (this.accumulator >= fixedDt) {
      this.step(isDraggingBadge, rawTarget);
      this.accumulator -= fixedDt;
    }
  }

  /**
   * Returns smoothed badge attachment coordinates, tilt angle, and stretch ratio.
   */
  getBadgeTransform(): {
    x: number;
    y: number;
    angleRad: number;
    angleDeg: number;
    stretchRatio: number;
  } {
    if (this.points.length < 2) {
      return { x: 0, y: 0, angleRad: 0, angleDeg: 0, stretchRatio: 1 };
    }

    const last = this.points[this.points.length - 1];
    const prev = this.points[this.points.length - 2];

    const dx = last.x - prev.x;
    const dy = last.y - prev.y;

    // Angle of the lowest segment relative to vertical
    const rawAngleRad = Math.atan2(dx, dy);

    // Clamp badge tilt to +-25 degrees as required in specification
    const maxAngleRad = (25 * Math.PI) / 180;
    const clampedRad = Math.max(-maxAngleRad, Math.min(maxAngleRad, rawAngleRad));
    const targetDeg = (clampedRad * 180) / Math.PI;

    // Angular Damping: smooth rotation over time so it settles cleanly in 2-3 sways
    this.currentAngleDeg += (targetDeg - this.currentAngleDeg) * (1 - this.config.angularDamping);

    // Compute current total stretch ratio
    let totalLen = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      totalLen += Math.hypot(
        this.points[i + 1].x - this.points[i].x,
        this.points[i + 1].y - this.points[i].y
      );
    }

    const rawStretch = this.totalRestLength > 0 ? totalLen / this.totalRestLength : 1;
    const stretchRatio = Math.min(this.config.maxStretchRatio, Math.max(1.0, rawStretch));

    return {
      x: last.x,
      y: last.y,
      angleRad: (this.currentAngleDeg * Math.PI) / 180,
      angleDeg: this.currentAngleDeg,
      stretchRatio,
    };
  }
}

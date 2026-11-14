/**
 * ============================================================================
 * HIGH-PRECISION VERLET ENGINE & DAMPED PENDULUM FOR LANYARD & ID BADGE
 * ============================================================================
 *
 * SPECIFICATION COMPLIANCE (beebombshell.com reference):
 * 1. Two-sided (equality) distance constraints on all 10 segments (NO crumpling/zigzag).
 * 2. 10 relaxation iterations per step with clamped corrections to prevent explosions.
 * 3. Fixed timestep 1/60s with fractional sub-frame accumulator & clamped max delta.
 * 4. Last rope point (points[10]) is the rigid clip anchor (gap < 1px at all times).
 * 5. Physical damped pendulum model for badge angle:
 *    - Restoring torque proportional to sin(angle)
 *    - Angular damping ~0.93 per step (settles in ~1.5s)
 *    - Inertial input from horizontal clip acceleration
 *    - Strict clamp to +-16 degrees
 *    - Low-pass filter on rendered angle
 * 6. Minimum strap length constraint: badge top is kept >= anchorY + 60px (never goes above notch).
 * 7. Soft pointer constraint with 120ms progressive stiffness ramp & flick velocity clamp.
 * 8. Sleep mode when velocities & angle are tiny to eliminate idle CPU usage.
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
}

export interface PhysicsConfig {
  gravity: number;
  damping: number;
  angularDamping: number;
  constraintIterations: number;
  segmentCount: number;
  restSegmentLength: number;
  maxStretchRatio: number;
  minStrapLength: number;
  scrollSway: boolean;
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: 0.65,
  damping: 0.962,
  angularDamping: 0.92,
  constraintIterations: 10,
  segmentCount: 10,
  restSegmentLength: 16,
  maxStretchRatio: 2.2,
  minStrapLength: 60, // Minimum distance below notch (desktop)
  scrollSway: true, // Clamped subtle pendulum impulse proportional to scroll velocity
};

export class VerletRope {
  points: VerletPoint[] = [];
  sticks: VerletStick[] = [];
  config: PhysicsConfig;

  anchorX: number = 0;
  anchorY: number = 0;
  totalRestLength: number = 0;
  accumulator: number = 0;
  lastTime: number = 0;
  idleTime: number = 0;

  // Elastic stretch state & snap-back
  currentStretchRatio: number = 1.0;
  targetStretchRatio: number = 1.0;
  stretchVelocity: number = 0;

  // Soft pointer grab tracking
  isDragging: boolean = false;
  dragElapsed: number = 0;
  filteredTarget: { x: number; y: number } = { x: 0, y: 0 };

  // Damped Pendulum Model for Badge Rotation
  badgeAngleDeg: number = 0;
  badgeAngularVel: number = 0;
  renderedAngleDeg: number = 0;
  prevClipVx: number = 0;
  clipAccX: number = 0;

  // Sleep & energy state
  isSleeping: boolean = false;
  sleepFrames: number = 0;

  // Telemetry for dev overlay & tests
  fps: number = 60;
  fpsLastTime: number = 0;
  fpsFrames: number = 0;

  constructor(config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG) {
    this.config = config;
  }

  /**
   * Initializes the rope hanging rigidly from anchorX, anchorY down to the badge clip.
   */
  init(anchorX: number, anchorY: number, dropOffset: number = 0) {
    this.anchorX = anchorX;
    this.anchorY = anchorY;
    this.points = [];
    this.sticks = [];
    const count = this.config.segmentCount;
    const segLen = this.config.restSegmentLength;

    for (let i = 0; i <= count; i++) {
      // Pinned top anchor (i === 0) is rigidly at anchorX, anchorY (never displaced by dropOffset)
      const isPinned = i === 0;
      const yOffset = isPinned ? 0 : (dropOffset > 0 ? dropOffset * (i / count) : 0);
      const y = anchorY + i * segLen - yOffset;
      const isBadgeClip = i === count;

      this.points.push({
        x: anchorX,
        y: y,
        oldX: anchorX,
        oldY: isPinned ? y : y - (dropOffset > 0 ? 6 : 0),
        isPinned,
        // Badge clip has higher mass (lower invMass) to model heavy badge momentum
        invMass: isPinned ? 0 : isBadgeClip ? 0.35 : 1.0,
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
    this.currentStretchRatio = 1.0;
    this.targetStretchRatio = 1.0;
    this.stretchVelocity = 0;
    this.lastTime = performance.now();
    this.fpsLastTime = performance.now();
    this.fpsFrames = 0;
    this.isSleeping = false;
    this.sleepFrames = 0;
    this.badgeAngleDeg = 0;
    this.badgeAngularVel = 0;
    this.renderedAngleDeg = 0;
    this.prevClipVx = 0;
    this.clipAccX = 0;
  }

  /**
   * Dynamically updates the anchor point when notch or container moves.
   */
  setAnchor(anchorX: number, anchorY: number) {
    const dx = anchorX - this.anchorX;
    const dy = anchorY - this.anchorY;
    this.anchorX = anchorX;
    this.anchorY = anchorY;

    if (this.points.length > 0) {
      this.points[0].x = anchorX;
      this.points[0].y = anchorY;
      this.points[0].oldX = anchorX;
      this.points[0].oldY = anchorY;

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        for (let i = 1; i < this.points.length; i++) {
          this.points[i].x += dx;
          this.points[i].oldX += dx;
          this.points[i].y += dy;
          this.points[i].oldY += dy;
        }
      }
    }
  }

  wakeUp() {
    this.isSleeping = false;
    this.sleepFrames = 0;
  }

  /**
   * Applies a subtle, clamped angular impulse proportional to scroll velocity (max +-2 deg)
   * so the badge feels gently alive while scrolling, with no drag force or positional offset.
   */
  applyScrollSway(velocity: number) {
    if (!this.config.scrollSway) return;
    // velocity in px/ms; clamp impulse strictly to max 2.0 degrees
    const impulse = Math.max(-2.0, Math.min(2.0, velocity * 0.75));
    this.badgeAngularVel += impulse;
    this.wakeUp();
  }

  /**
   * Advances simulation by one fixed timestep slice (dt = 1/60s).
   */
  step(isDraggingBadge: boolean, rawTarget?: { x: number; y: number }, dt: number = 1 / 60) {
    const { gravity, damping, angularDamping, constraintIterations, maxStretchRatio, minStrapLength } =
      this.config;

    this.idleTime += dt;
    if (this.points.length > 0) {
      this.points[0].x = this.anchorX;
      this.points[0].y = this.anchorY;
      this.points[0].oldX = this.anchorX;
      this.points[0].oldY = this.anchorY;
    }
    const clipIndex = this.points.length - 1;
    const clipPoint = this.points[clipIndex];

    // 1. Pointer Grab & Spring Constraint
    if (isDraggingBadge && rawTarget) {
      this.wakeUp();

      if (!this.isDragging) {
        this.isDragging = true;
        this.dragElapsed = 0;
        this.filteredTarget = { x: clipPoint.x, y: clipPoint.y };
      }

      this.dragElapsed += dt;

      // Soft low-pass filter on raw pointer target to eliminate mouse jitter
      this.filteredTarget.x += (rawTarget.x - this.filteredTarget.x) * 0.22;
      this.filteredTarget.y += (rawTarget.y - this.filteredTarget.y) * 0.22;

      // Ensure target never pushes badge above the minimum strap length
      const minY = this.anchorY + minStrapLength;
      if (this.filteredTarget.y < minY) {
        this.filteredTarget.y = minY;
      }

      // Stiffness ramps from 0 to 1 over 120ms on grab
      const stiffness = Math.min(1.0, this.dragElapsed / 0.12);

      // Spring displacement toward pointer
      const springForceX = (this.filteredTarget.x - clipPoint.x) * (0.38 * stiffness);
      const springForceY = (this.filteredTarget.y - clipPoint.y) * (0.38 * stiffness);

      clipPoint.x += springForceX;
      clipPoint.y += springForceY;

      // Dynamic stretch target calculated from distance to anchor, capped at maxStretchRatio
      const maxDistance = this.totalRestLength * maxStretchRatio;
      const dxFromAnchor = clipPoint.x - this.anchorX;
      const dyFromAnchor = clipPoint.y - this.anchorY;
      const distFromAnchor = Math.hypot(dxFromAnchor, dyFromAnchor);

      if (distFromAnchor > maxDistance) {
        clipPoint.x = this.anchorX + (dxFromAnchor / distFromAnchor) * maxDistance;
        clipPoint.y = this.anchorY + (dyFromAnchor / distFromAnchor) * maxDistance;
      }

      const desiredStretch = Math.min(distFromAnchor, maxDistance) / Math.max(1, this.totalRestLength);
      this.targetStretchRatio = Math.min(maxStretchRatio, Math.max(1.0, desiredStretch));
      this.currentStretchRatio += (this.targetStretchRatio - this.currentStretchRatio) * 0.3;
    } else {
      if (this.isDragging) {
        // Just released: clamp flick release velocity to prevent launching
        const maxReleaseVel = 12;
        const vx = clipPoint.x - clipPoint.oldX;
        const vy = clipPoint.y - clipPoint.oldY;

        clipPoint.oldX = clipPoint.x - Math.max(-maxReleaseVel, Math.min(maxReleaseVel, vx));
        clipPoint.oldY = clipPoint.y - Math.max(-maxReleaseVel, Math.min(maxReleaseVel, vy));

        this.isDragging = false;
        this.dragElapsed = 0;
        this.targetStretchRatio = 1.0;
      }

      // Elastic snap-back on release with subtle overshoot then settling
      const stretchError = 1.0 - this.currentStretchRatio;
      const springK = 38.0;
      const dampingC = 8.5;
      const stretchAcc = springK * stretchError - dampingC * this.stretchVelocity;
      this.stretchVelocity += stretchAcc * dt;
      this.currentStretchRatio += this.stretchVelocity * dt;

      // Clamp stretch ratio to physical bounds [0.98, 2.2]
      if (this.currentStretchRatio < 0.98) {
        this.currentStretchRatio = 0.98;
        this.stretchVelocity = 0;
      }
    }

    // 2. Verlet Position Integration with Velocity Clamping
    let totalKineticEnergy = 0;
    const maxVelocity = 28;

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      if (p.isPinned) continue;

      let vx = (p.x - p.oldX) * damping;
      let vy = (p.y - p.oldY) * damping + gravity;

      vx = Math.max(-maxVelocity, Math.min(maxVelocity, vx));
      vy = Math.max(-maxVelocity, Math.min(maxVelocity, vy));

      p.oldX = p.x;
      p.oldY = p.y;

      // Tiny natural idle sway (< 0.4px) when at rest
      const idleSway = !this.isDragging && !this.isSleeping ? Math.sin(this.idleTime * 1.5 + i * 0.3) * 0.015 : 0;

      p.x += vx + idleSway;
      p.y += vy;

      // Absolute boundary check: points cannot go above anchorY + minimum offset
      const minPointY = this.anchorY + (i / this.points.length) * minStrapLength;
      if (p.y < minPointY) {
        p.y = minPointY;
        p.oldY = p.y;
      }

      totalKineticEnergy += vx * vx + vy * vy;
    }

    // 3. Two-Sided (Equality) Distance Constraints (Relaxation Iterations)
    // Enforcing strict equality distance prevents the ribbon from compressing into zigzag/S-curves!
    for (let iter = 0; iter < constraintIterations; iter++) {
      for (let s = 0; s < this.sticks.length; s++) {
        const stick = this.sticks[s];
        const p0 = this.points[stick.p0Index];
        const p1 = this.points[stick.p1Index];

        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const dist = Math.hypot(dx, dy) || 0.0001;

        // Target length strictly obeys the current dynamic stretch ratio
        const targetLen = stick.restLength * this.currentStretchRatio;
        const diff = (targetLen - dist) / dist;

        // Clamp correction per iteration to eliminate numerical blow-ups
        const clampedDiff = Math.max(-0.45, Math.min(0.45, diff));

        const totalInvMass = p0.invMass + p1.invMass;
        if (totalInvMass === 0) continue;

        const delta0 = (p0.invMass / totalInvMass) * clampedDiff;
        const delta1 = (p1.invMass / totalInvMass) * clampedDiff;

        if (!p0.isPinned) {
          p0.x -= dx * delta0;
          p0.y -= dy * delta0;
        }
        if (!p1.isPinned) {
          p1.x += dx * delta1;
          p1.y += dy * delta1;
        }
      }

      // Enforce badge minimum height boundary constraint
      const minY = this.anchorY + minStrapLength;
      if (clipPoint.y < minY) {
        clipPoint.y = minY;
      }
    }

    // Guarantee all segment lengths strictly stay within [0.92x, 2.25x]
    for (let s = 0; s < this.sticks.length; s++) {
      const stick = this.sticks[s];
      const p0 = this.points[stick.p0Index];
      const p1 = this.points[stick.p1Index];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const minLen = stick.restLength * 0.92;
      const maxLen = stick.restLength * 2.25;

      if (dist > maxLen) {
        const factor = maxLen / dist;
        if (!p1.isPinned) {
          p1.x = p0.x + dx * factor;
          p1.y = p0.y + dy * factor;
        }
      } else if (dist < minLen) {
        const factor = minLen / dist;
        if (!p1.isPinned) {
          p1.x = p0.x + dx * factor;
          p1.y = p0.y + dy * factor;
        }
      }
    }

    // 4. Physical Damped Pendulum for Badge Tilt Angle
    // Derived strictly from horizontal clip acceleration and gravitational restoring torque
    const clipVx = clipPoint.x - clipPoint.oldX;
    this.clipAccX = clipVx - this.prevClipVx;
    this.prevClipVx = clipVx;

    const angleRad = (this.badgeAngleDeg * Math.PI) / 180;
    // Restoring torque proportional to sin(theta) - settles cleanly in ~1.5s
    const restoringTorque = -Math.sin(angleRad) * 72.0;
    // Inertial response: horizontal acceleration of the clip causes opposite swing
    const inertialTorque = -Math.max(-10, Math.min(10, this.clipAccX * 8.0)) * Math.cos(angleRad) * 4.0;

    const angularAcc = restoringTorque + inertialTorque;
    this.badgeAngularVel += angularAcc * dt;
    this.badgeAngularVel *= angularDamping; // ~0.93 per step settles in ~1.5s

    this.badgeAngleDeg += ((this.badgeAngularVel * 180) / Math.PI) * dt;

    // Strict clamp to +-16 degrees as requested
    this.badgeAngleDeg = Math.max(-16, Math.min(16, this.badgeAngleDeg));

    // Low-pass filter for butter-smooth visual render
    this.renderedAngleDeg += (this.badgeAngleDeg - this.renderedAngleDeg) * 0.22;

    // 5. Energy-based Sleep Check
    const isStationary =
      !this.isDragging &&
      totalKineticEnergy < 0.005 &&
      Math.abs(this.badgeAngularVel) < 0.001 &&
      Math.abs(this.badgeAngleDeg) < 0.15 &&
      Math.abs(this.currentStretchRatio - 1.0) < 0.01;

    if (isStationary) {
      this.sleepFrames++;
      if (this.sleepFrames > 45) {
        this.isSleeping = true;
        this.badgeAngleDeg = 0;
        this.renderedAngleDeg = 0;
        this.currentStretchRatio = 1.0;
        return;
      }
    } else {
      this.sleepFrames = 0;
    }
  }

  /**
   * Main update tick using the fixed timestep accumulator.
   */
  update(currentTime: number, isDraggingBadge: boolean, rawTarget?: { x: number; y: number }) {
    // Measure FPS
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

    // Clamp delta time to avoid large physics spikes on tab focus
    if (deltaTime > 0.05) deltaTime = 0.05;

    if (isDraggingBadge) {
      this.wakeUp();
    }

    if (this.isSleeping) {
      return;
    }

    const fixedDt = 1 / 60;
    this.accumulator += deltaTime;

    while (this.accumulator >= fixedDt) {
      this.step(isDraggingBadge, rawTarget, fixedDt);
      this.accumulator -= fixedDt;
    }
  }

  /**
   * Returns smoothed badge attachment coordinates, tilt angle, and stretch ratio.
   * Last point (points[points.length - 1]) is the rigid clip anchor.
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
    if (this.points.length < 2) {
      return {
        x: this.anchorX,
        y: this.anchorY + this.totalRestLength,
        angleRad: 0,
        angleDeg: 0,
        stretchRatio: 1,
        isSleeping: true,
        fps: this.fps,
      };
    }

    const clipPoint = this.points[this.points.length - 1];

    return {
      x: clipPoint.x,
      y: clipPoint.y,
      angleRad: (this.renderedAngleDeg * Math.PI) / 180,
      angleDeg: this.renderedAngleDeg,
      stretchRatio: this.currentStretchRatio,
      isSleeping: this.isSleeping,
      fps: this.fps,
    };
  }

  /**
   * Returns segment lengths for testing & telemetry assertions.
   */
  getSegmentLengths(): number[] {
    const lengths: number[] = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      lengths.push(
        Math.hypot(
          this.points[i + 1].x - this.points[i].x,
          this.points[i + 1].y - this.points[i].y
        )
      );
    }
    return lengths;
  }
}

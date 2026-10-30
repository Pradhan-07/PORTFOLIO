/**
 * ============================================================================
 * VERLET INTEGRATION PHYSICS ENGINE FOR LANYARD & BADGE
 * ============================================================================
 *
 * HOW VERLET INTEGRATION WORKS (BEGINNER'S GUIDE):
 * -----------------------------------------------
 * Standard game physics updates velocity: v = v + a*dt; x = x + v*dt.
 * In Verlet Integration, we never store velocity explicitly! Instead,
 * velocity is inferred from the displacement between the current position
 * and the previous frame's position:
 *
 *    implicit_velocity = (current_position - old_position) * damping
 *    new_position = current_position + implicit_velocity + acceleration * dt^2
 *    old_position = current_position
 *
 * DISTANCE CONSTRAINTS & STRAP STRETCHING:
 * ----------------------------------------
 * When two points are connected by a strap segment of rest length L:
 * 1. We measure the current distance: dist = sqrt(dx^2 + dy^2).
 * 2. If dist != L, we calculate the error: diff = (L - dist) / dist.
 * 3. We push both points toward or away from each other along the connecting line.
 * 4. To allow realistic strap stretching during an intentional drag, we apply a
 *    stiffness factor. When pulled hard by the user, the strap can stretch up
 *    to 2x its rest length, revealing the silver adjustment clasp ring!
 *
 * FIXED TIMESTEP ACCUMULATOR:
 * ---------------------------
 * Different displays run at 60Hz, 90Hz, 120Hz, or 144Hz.
 * To ensure the lanyard swings with the EXACT SAME speed and gravity on every device,
 * we accumulate elapsed frame time in an accumulator variable, and advance physics
 * in deterministic slices of fixedDt = 1/60th of a second.
 * ============================================================================
 */

export interface VerletPoint {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  isPinned: boolean;
}

export interface VerletStick {
  p0Index: number;
  p1Index: number;
  restLength: number;
}

export interface PhysicsConfig {
  gravity: number;
  damping: number;
  constraintIterations: number;
  segmentCount: number;
  restSegmentLength: number;
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: 0.58,
  damping: 0.982,
  constraintIterations: 7,
  segmentCount: 10,
  restSegmentLength: 16,
};

export class VerletRope {
  points: VerletPoint[] = [];
  sticks: VerletStick[] = [];
  config: PhysicsConfig;
  totalRestLength: number = 0;
  accumulator: number = 0;
  lastTime: number = 0;
  idleTime: number = 0;

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
      // Start higher if dropOffset is given (for intro drop-in animation)
      const y = anchorY + (i * segLen) - dropOffset;
      this.points.push({
        x: anchorX,
        y: y,
        oldX: anchorX + (Math.sin(i * 0.5) * 4), // slight initial angle for natural swing
        oldY: y - (dropOffset > 0 ? 12 : 0),
        isPinned: i === 0,
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
  }

  /**
   * Advances the simulation by a fixed delta time slice (1/60s).
   */
  step(isDraggingBadge: boolean, dragTarget?: { x: number; y: number }, stretchFactor: number = 1.0) {
    const { gravity, damping, constraintIterations } = this.config;
    this.idleTime += 0.018;

    // 1. Verlet position update with gravity and subtle idle micro-sway
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      if (p.isPinned) continue;

      // If user is actively dragging the badge, clamp the badge attachment point
      if (isDraggingBadge && dragTarget && i === this.points.length - 1) {
        p.x = dragTarget.x;
        p.y = dragTarget.y;
        p.oldX = dragTarget.x;
        p.oldY = dragTarget.y;
        continue;
      }

      // Calculate velocity implicitly from previous displacement
      const vx = (p.x - p.oldX) * damping;
      const vy = (p.y - p.oldY) * damping + gravity;

      p.oldX = p.x;
      p.oldY = p.y;

      // Add gentle idle micro-sway so the badge never feels lifeless or frozen
      const swayForce = Math.sin(this.idleTime + i * 0.4) * 0.04;

      p.x += vx + swayForce;
      p.y += vy;
    }

    // 2. Distance constraint relaxation
    // When dragged far, we allow the rope to stretch up to 2x rest length
    for (let iter = 0; iter < constraintIterations; iter++) {
      for (let s = 0; s < this.sticks.length; s++) {
        const stick = this.sticks[s];
        const p0 = this.points[stick.p0Index];
        const p1 = this.points[stick.p1Index];

        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const currentDist = Math.hypot(dx, dy) || 0.0001;

        // Dynamic target length based on drag stretch
        const targetLen = stick.restLength * stretchFactor;
        const diff = (targetLen - currentDist) / currentDist;

        // Half-and-half relaxation push
        const offsetX = dx * diff * 0.5;
        const offsetY = dy * diff * 0.5;

        if (!p0.isPinned) {
          p0.x -= offsetX;
          p0.y -= offsetY;
        }
        if (!p1.isPinned) {
          p1.x += offsetX;
          p1.y += offsetY;
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
    dragTarget?: { x: number; y: number },
    allowStretch: boolean = false
  ) {
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      return;
    }

    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Clamp max delta to prevent physics explosion after tab switch
    if (deltaTime > 0.1) deltaTime = 0.1;

    // Calculate current rope stretch
    let currentLength = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      currentLength += Math.hypot(
        this.points[i + 1].x - this.points[i].x,
        this.points[i + 1].y - this.points[i].y
      );
    }

    let stretchFactor = 1.0;
    if (allowStretch && isDraggingBadge && this.totalRestLength > 0) {
      stretchFactor = Math.min(2.0, Math.max(1.0, currentLength / this.totalRestLength));
    }

    const fixedDt = 1 / 60;
    this.accumulator += deltaTime;

    while (this.accumulator >= fixedDt) {
      this.step(isDraggingBadge, dragTarget, stretchFactor);
      this.accumulator -= fixedDt;
    }
  }

  /**
   * Returns the badge attachment point (last rope point) and its tilt angle.
   */
  getBadgeTransform(): { x: number; y: number; angleRad: number; angleDeg: number; stretchRatio: number } {
    if (this.points.length < 2) {
      return { x: 0, y: 0, angleRad: 0, angleDeg: 0, stretchRatio: 1 };
    }

    const last = this.points[this.points.length - 1];
    const prev = this.points[this.points.length - 2];

    const dx = last.x - prev.x;
    const dy = last.y - prev.y;

    // Rotation is the angle of the last segment relative to vertical (downwards)
    const angleRad = Math.atan2(dx, dy);
    // Clamp tilt angle to max ~22 degrees so the badge remains elegantly balanced
    const maxAngle = (22 * Math.PI) / 180;
    const clampedRad = Math.max(-maxAngle, Math.min(maxAngle, angleRad));
    const angleDeg = (clampedRad * 180) / Math.PI;

    // Compute total length to determine if clasp ring is visible
    let totalLen = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      totalLen += Math.hypot(
        this.points[i + 1].x - this.points[i].x,
        this.points[i + 1].y - this.points[i].y
      );
    }
    const stretchRatio = this.totalRestLength > 0 ? totalLen / this.totalRestLength : 1;

    return {
      x: last.x,
      y: last.y,
      angleRad: clampedRad,
      angleDeg,
      stretchRatio,
    };
  }
}


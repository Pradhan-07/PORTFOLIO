/**
 * eyeStore (DESIGN-SPEC §2.4, Phase 9 Step 3) — the Eye's per-frame
 * geometry, published for overlays that live outside the eye zone
 * (the stage-level tether). Framework-light on purpose (§1.6: per-frame
 * data stays in refs / plain objects, never React state): one mutable
 * exported object the Eye rewrites every frame, plus a tiny
 * subscribe/notify set for consumers that prefer push over polling.
 *
 * All coordinates are viewport coordinates (CSS px, as returned by
 * getBoundingClientRect / MouseEvent.clientX).
 */
export interface EyePoint {
  x: number;
  y: number;
}

export interface EyeGeometry {
  /** Centre of the eye in the viewport, body drift + flight included. */
  eyeCenter: EyePoint;
  /** The smoothed pupil point in the viewport (the tether's start). */
  pupilPoint: EyePoint;
  /**
   * The current focus point in the viewport — the ghost caret, Bit's
   * head, or the cursor. Null when there is no focus to tether to:
   * before the cursor is first seen, and mid-flight.
   */
  focusPoint: EyePoint | null;
  /** True while the eye is gliding to a new section's prompt point. */
  flying: boolean;
}

export const eyeStore: EyeGeometry = {
  eyeCenter: { x: 0, y: 0 },
  pupilPoint: { x: 0, y: 0 },
  focusPoint: null,
  flying: false,
};

type EyeStoreListener = () => void;

const listeners = new Set<EyeStoreListener>();

/** Subscribe to geometry publishes. Returns an unsubscribe function. */
export function subscribeEyeStore(listener: EyeStoreListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify subscribers that eyeStore changed (called once per publish). */
export function notifyEyeStore(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Publish one frame of geometry: mutates the shared object in place
 * (so pollers reading eyeStore directly always see the latest frame)
 * and then notifies subscribers.
 */
export function publishEyeGeometry(next: EyeGeometry): void {
  eyeStore.eyeCenter.x = next.eyeCenter.x;
  eyeStore.eyeCenter.y = next.eyeCenter.y;
  eyeStore.pupilPoint.x = next.pupilPoint.x;
  eyeStore.pupilPoint.y = next.pupilPoint.y;
  eyeStore.focusPoint = next.focusPoint ? { x: next.focusPoint.x, y: next.focusPoint.y } : null;
  eyeStore.flying = next.flying;
  notifyEyeStore();
}

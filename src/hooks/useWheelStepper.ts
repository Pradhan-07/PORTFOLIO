import { useCallback, useEffect, useRef } from 'react';

/**
 * useWheelStepper (SCROLL-SPEC §4.1) — one reusable state machine that
 * turns a stream of wheel events into discrete steps: "wheel gesture →
 * one step". Used by the file tree and the intro wall.
 *
 * The state machine, in order, per event:
 *   1. Pinch (ctrlKey) is never touched.
 *   2. Deltas are normalised across deltaModes (line/page → px) and the
 *      dominant axis wins.
 *   3. During the cooldown, incoming deltas are DISCARDED, not banked —
 *      banking them is what made trackpad flicks multi-fire through the
 *      whole momentum tail.
 *   4. A pause longer than the gesture gap, or a direction reversal,
 *      resets the accumulator (gesture segmentation) — stale deltas never
 *      combine across gestures.
 *   5. Past the threshold: exactly one step, accumulator cleared,
 *      cooldown starts.
 *
 * All state lives in refs — stepping never re-renders.
 */

export const WHEEL_LINE_PX = 16; // deltaMode 1 unit → px
export const WHEEL_PAGE_PX = 400; // deltaMode 2 unit → px (fixed step quantum)
export const WHEEL_THRESHOLD_PX = 48; // accumulated |delta| per step
export const WHEEL_COOLDOWN_MS = 320; // after a step, deltas are discarded
export const WHEEL_GESTURE_GAP_MS = 140; // silence longer than this = new gesture

/** Normalise a wheel event's dominant-axis delta to pixels. */
export function normalisedWheelDelta(e: WheelEvent): number {
  let delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (e.deltaMode === 1) delta *= WHEEL_LINE_PX;
  else if (e.deltaMode === 2) delta *= WHEEL_PAGE_PX;
  return delta;
}

interface WheelStepperState {
  accumulated: number;
  lastDirection: number;
  lastEventAt: number;
  lastStepAt: number;
}

export interface WheelStepper {
  /** Ref callback — attach to the host element that owns the gesture surface. */
  ref: (node: HTMLElement | null) => void;
  /** Clear any banked gesture state (pointer-leave, blur, mode change). */
  reset: () => void;
}

export function useWheelStepper(onStep: (direction: 1 | -1) => void): WheelStepper {
  const stepRef = useRef(onStep);
  useEffect(() => {
    stepRef.current = onStep;
  }, [onStep]);

  const stateRef = useRef<WheelStepperState>({
    accumulated: 0,
    lastDirection: 0,
    lastEventAt: 0,
    lastStepAt: 0,
  });
  const nodeRef = useRef<HTMLElement | null>(null);
  const handlerRef = useRef<((e: WheelEvent) => void) | null>(null);

  const reset = useCallback(() => {
    stateRef.current.accumulated = 0;
    stateRef.current.lastEventAt = 0;
  }, []);

  const ref = useCallback((node: HTMLElement | null) => {
    // Detach from the previous node, if any.
    if (nodeRef.current && handlerRef.current) {
      nodeRef.current.removeEventListener('wheel', handlerRef.current);
    }
    nodeRef.current = node;
    handlerRef.current = null;
    if (!node) return;

    const state = stateRef.current;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom gesture — leave it alone
      e.preventDefault(); // caller guarantees { passive: false }

      const delta = normalisedWheelDelta(e);
      const now = performance.now();

      // Cooldown: discard, do not bank (the S1 fix).
      if (now - state.lastStepAt < WHEEL_COOLDOWN_MS) return;

      // A pause in the event stream starts a new gesture.
      if (now - state.lastEventAt > WHEEL_GESTURE_GAP_MS) state.accumulated = 0;

      const dir = Math.sign(delta);
      if (dir !== 0 && dir !== state.lastDirection) {
        state.accumulated = 0;
        state.lastDirection = dir;
      }

      state.accumulated += delta;
      state.lastEventAt = now;

      if (Math.abs(state.accumulated) >= WHEEL_THRESHOLD_PX) {
        stepRef.current(state.accumulated > 0 ? 1 : -1);
        state.accumulated = 0;
        state.lastStepAt = now;
      }
    };

    handlerRef.current = handleWheel;
    // Native (non-passive) listener so preventDefault actually works —
    // React attaches its synthetic wheel handlers passively at the root.
    node.addEventListener('wheel', handleWheel, { passive: false });
  }, []);

  return { ref, reset };
}

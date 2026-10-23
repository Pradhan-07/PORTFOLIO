import { createContext, useContext } from 'react';

/**
 * creatureBus (DESIGN-SPEC Step 0) — the tiny state bus the creatures
 * and the ghost report through. Three state strings — bit / eye /
 * ghost — owned by the Dashboard (via CreatureBusProvider), consumed
 * by the status bar's telemetry columns (Step 2) and written by Bit
 * (Step 4), the Eye (Step 3) and the ghost engine (Step 1). State
 * strings only; all per-frame data stays in refs inside the creatures
 * themselves (§1.6).
 */
export interface CreatureBus {
  bit: string;
  eye: string;
  ghost: string;
  setBit: (state: string) => void;
  setEye: (state: string) => void;
  setGhost: (state: string) => void;
}

export const CreatureBusContext = createContext<CreatureBus | null>(null);

const INERT: CreatureBus = {
  bit: 'asleep',
  eye: 'tracking',
  ghost: 'idle',
  setBit: () => undefined,
  setEye: () => undefined,
  setGhost: () => undefined,
};

/** Read/write the creature bus. Outside a provider, returns inert defaults. */
export function useCreatureBus(): CreatureBus {
  return useContext(CreatureBusContext) ?? INERT;
}

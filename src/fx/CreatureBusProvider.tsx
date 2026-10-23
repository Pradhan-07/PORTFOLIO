import React, { useCallback, useMemo, useState } from 'react';
import { CreatureBusContext, type CreatureBus } from './creatureBus';

/** Provider for the creature state bus (see creatureBus.ts). */
export const CreatureBusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bit, setBitState] = useState('asleep');
  const [eye, setEyeState] = useState('tracking');
  const [ghost, setGhostState] = useState('idle');

  const setBit = useCallback((s: string) => setBitState((prev) => (prev === s ? prev : s)), []);
  const setEye = useCallback((s: string) => setEyeState((prev) => (prev === s ? prev : s)), []);
  const setGhost = useCallback((s: string) => setGhostState((prev) => (prev === s ? prev : s)), []);

  const value = useMemo<CreatureBus>(
    () => ({ bit, eye, ghost, setBit, setEye, setGhost }),
    [bit, eye, ghost, setBit, setEye, setGhost]
  );
  return <CreatureBusContext.Provider value={value}>{children}</CreatureBusContext.Provider>;
};

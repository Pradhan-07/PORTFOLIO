import { useEffect, useState } from 'react';
import type { WallData } from '../types';

export interface WallDataState {
  status: 'loading' | 'ready' | 'unavailable';
  data: WallData | null;
}

/**
 * Reads the G12 code-wall data from `/data/wall.json` (same-origin;
 * generated from Pradhan-07's own repos — see WALL-NOTES.md). Mirrors the
 * Phase-3 snapshot pattern: on any failure the state resolves to
 * 'unavailable' and consumers fall back to the built-in snippets — the
 * intro must never render blank, and no source links are ever fabricated.
 */
export function useWallData(): WallDataState {
  const [state, setState] = useState<WallDataState>({ status: 'loading', data: null });

  useEffect(() => {
    let cancelled = false;
    fetch('/data/wall.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<WallData>;
      })
      .then((json) => {
        if (cancelled) return;
        if (!json || !Array.isArray(json.files) || json.files.length === 0) {
          throw new Error('Wall data file has no files');
        }
        setState({ status: 'ready', data: json });
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Could not load code-wall data:', err);
        setState({ status: 'unavailable', data: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

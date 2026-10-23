import { useSyncExternalStore } from 'react';

/**
 * cmdline.ts (DESIGN-SPEC §2.3/§2.7) — the status-bar command line's
 * two side channels, kept as module stores so any component can write
 * without prop drilling:
 *
 *  - Echo: ghost-typed display text (`:e about`, `:colorscheme demon`)
 *    that the bar renders in its unfocused, empty `:` input. It is
 *    display only — never an input value change.
 *  - Pager: while a paged viewer is active (project shots, theme
 *    groups), the bar's host line 2 shows `/<base> [n/m]` instead of
 *    the key legend (§2.7). Null = legend.
 */

let echoText: string | null = null;
let echoNonce = 0;
let echoTimer: number | undefined;
let echoSnapshot: { text: string | null; nonce: number } = { text: null, nonce: 0 };
const echoListeners = new Set<() => void>();

function emitEcho() {
  echoSnapshot = { text: echoText, nonce: echoNonce };
  echoListeners.forEach((fn) => fn());
}

/** Show a ghost echo in the bar's command line; auto-clears after `holdMs`. */
export function echoCmdline(text: string, holdMs = 4000): void {
  echoText = text;
  echoNonce += 1;
  emitEcho();
  if (echoTimer !== undefined) window.clearTimeout(echoTimer);
  echoTimer = window.setTimeout(() => {
    echoText = null;
    emitEcho();
  }, holdMs);
}

export function clearCmdlineEcho(): void {
  if (echoTimer !== undefined) window.clearTimeout(echoTimer);
  echoText = null;
  emitEcho();
}

export function useCmdlineEcho(): { text: string | null; nonce: number } {
  return useSyncExternalStore(
    (fn) => {
      echoListeners.add(fn);
      return () => echoListeners.delete(fn);
    },
    () => echoSnapshot,
    () => echoSnapshot
  );
}

let pagerText: string | null = null;
const pagerListeners = new Set<() => void>();

function emitPager() {
  pagerListeners.forEach((fn) => fn());
}

/** Set (or clear, with null) the bar's pager readout, e.g. "/projects [2/5]". */
export function setPager(text: string | null): void {
  if (pagerText === text) return;
  pagerText = text;
  emitPager();
}

export function usePager(): string | null {
  return useSyncExternalStore(
    (fn) => {
      pagerListeners.add(fn);
      return () => pagerListeners.delete(fn);
    },
    () => pagerText,
    () => null
  );
}

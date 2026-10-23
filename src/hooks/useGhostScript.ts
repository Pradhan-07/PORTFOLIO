import React, { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { PROFILE } from '../data/profile';
import { useCreatureBus } from '../fx/creatureBus';
import { echoCmdline } from '../fx/cmdline';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * useGhostScript (DESIGN-SPEC §2.3) — the one ghost-typing engine every
 * section runs through. A section describes itself as a script of steps:
 *
 *  - `cmd`     types into the transcript prompt at ghost speed
 *              (10–15 chars/sec ⇒ 65–100ms/char, ±20% jitter, ~250ms
 *              pause at line start) while GHOST reports `typing`.
 *  - `out`     completes instantly when reached — its output renders
 *              once the step completes (see `isRevealed`).
 *  - `cmdline` emits into the status-bar `:` line via `echoCmdline`
 *              (the bar animates it) and completes after
 *              ~text.length × 25ms.
 *  - `pause`   waits.
 *
 * Lifecycle: when `active` flips true the ghost reports `repairing` for
 * ~300ms, then the script runs from step 0; on completion GHOST returns
 * to `idle`. When `active` flips false mid-run the run aborts at once
 * (pending timer cleared, no further steps) — the incoming section's
 * own hook drives the bus from there (`repairing` → `typing` → `idle`),
 * so an aborting hook never writes the bus on its way out. Under
 * reduced motion every step completes instantly on activation, GHOST
 * stays `idle`, and there is no repairing delay (§1.7).
 *
 * Implementation (§1.6): a single timeout chain owned by the effect;
 * all per-character work happens inside timer callbacks. React state is
 * only the discrete progress counters — `completed` (steps fully
 * done), `typing` (the in-progress cmd/cmdline partial) and `done`.
 * The script is keyed by its JSON signature, so a caller may rebuild
 * the array every render (e.g. around JSX outputs) without restarting
 * the run; only a real content change restarts it.
 */

export type GhostStep =
  | { type: 'cmd'; text: string }
  | { type: 'out'; id: string }
  | { type: 'cmdline'; text: string }
  | { type: 'pause'; ms: number };

export interface GhostTyping {
  stepIndex: number;
  text: string;
}

export interface GhostScriptApi {
  /** Count of steps fully completed — steps with index < completed are done. */
  completed: number;
  /** Partial text + step index of the cmd/cmdline step currently typing, else null. */
  typing: GhostTyping | null;
  /** Partial text of the step currently typing, else null. */
  typingText: string | null;
  /** Index (into the script) of the step currently typing, else -1. */
  typingStepIndex: number;
  /** Ids of the `out` steps revealed so far. */
  revealed: ReadonlySet<string>;
  /** True when the `out` step with this id has been revealed. */
  isRevealed: (outId: string) => boolean;
  /** True once every step has completed. */
  isComplete: boolean;
  /** Alias of `isComplete`. */
  done: boolean;
}

/** Back-compat alias for the result shape. */
export type UseGhostScriptResult = GhostScriptApi;

/** Prompt line 1: PROFILE.terminalPrompt minus its trailing '$'. */
export const GHOST_PROMPT_HEAD = PROFILE.terminalPrompt.replace(/\$$/, '');

const REPAIR_MS = 300;
const LINE_START_MS = 250;
const CMD_BASE_MS = 82; // ≈12 chars/sec, jittered into the 65–100ms/char band
const CMDLINE_CHAR_MS = 25;

interface GhostProgress {
  completed: number;
  typing: GhostTyping | null;
  done: boolean;
}

const INITIAL_PROGRESS: GhostProgress = { completed: 0, typing: null, done: false };

/** Per-character delay for cmd steps: base ±20% jitter (§1.6). */
function cmdCharDelay(): number {
  return CMD_BASE_MS * (0.8 + Math.random() * 0.4);
}

export function useGhostScript(active: boolean, script: GhostStep[]): GhostScriptApi {
  const { setGhost } = useCreatureBus();
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState<GhostProgress>(INITIAL_PROGRESS);

  // The run restarts whenever the activation signature changes (became
  // active, script content changed, motion preference flipped). The
  // reset uses React's adjust-state-during-render pattern so the
  // effect itself never has to set progress synchronously.
  const scriptKey = JSON.stringify(script);
  const signature = `${active ? 'on' : 'off'}|${reduced ? 'rm' : 'full'}|${scriptKey}`;
  const [seenSignature, setSeenSignature] = useState(signature);
  if (seenSignature !== signature) {
    setSeenSignature(signature);
    setProgress(INITIAL_PROGRESS);
  }

  useEffect(() => {
    if (!active) {
      // Inactive: the previous run's cleanup already cleared its
      // timer. Progress was reset during render; nothing to drive.
      return;
    }

    const steps = JSON.parse(scriptKey) as GhostStep[];

    if (reduced) {
      // Instant completion: cmdline side effects still fire (in
      // order, so the bar ends on the last echo); no repairing delay.
      for (const step of steps) {
        if (step.type === 'cmdline') echoCmdline(step.text);
      }
      setGhost('idle');
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    const schedule = (fn: () => void, ms: number) => {
      timer = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const finish = () => {
      setProgress({ completed: steps.length, typing: null, done: true });
      setGhost('idle');
    };

    const runStep = (index: number): void => {
      if (cancelled) return;
      if (index >= steps.length) {
        finish();
        return;
      }
      const step = steps[index];

      if (step.type === 'out') {
        setProgress((p) => ({ ...p, completed: index + 1 }));
        runStep(index + 1);
        return;
      }

      if (step.type === 'pause') {
        schedule(() => {
          setProgress((p) => ({ ...p, completed: index + 1 }));
          runStep(index + 1);
        }, step.ms);
        return;
      }

      if (step.type === 'cmdline') {
        echoCmdline(step.text);
        if (step.text.length === 0) {
          setProgress((p) => ({ ...p, completed: index + 1 }));
          runStep(index + 1);
          return;
        }
        let chars = 0;
        const tick = () => {
          chars += 1;
          setProgress((p) => ({
            ...p,
            typing: { stepIndex: index, text: step.text.slice(0, chars) },
          }));
          if (chars >= step.text.length) {
            schedule(() => {
              setProgress((p) => ({ ...p, typing: null, completed: index + 1 }));
              runStep(index + 1);
            }, 0);
          } else {
            schedule(tick, CMDLINE_CHAR_MS);
          }
        };
        schedule(tick, CMDLINE_CHAR_MS);
        return;
      }

      // cmd — ghost speed into the transcript prompt.
      setGhost('typing');
      if (step.text.length === 0) {
        schedule(() => {
          setProgress((p) => ({ ...p, typing: null, completed: index + 1 }));
          runStep(index + 1);
        }, LINE_START_MS);
        return;
      }
      let chars = 0;
      const tick = () => {
        chars += 1;
        setProgress((p) => ({
          ...p,
          typing: { stepIndex: index, text: step.text.slice(0, chars) },
        }));
        if (chars >= step.text.length) {
          setProgress((p) => ({ ...p, typing: null, completed: index + 1 }));
          runStep(index + 1);
        } else {
          schedule(tick, cmdCharDelay());
        }
      };
      // Longer pause at line start; the first character lands after it.
      setProgress((p) => ({ ...p, typing: { stepIndex: index, text: '' } }));
      schedule(tick, LINE_START_MS);
    };

    setGhost('repairing');
    schedule(() => runStep(0), REPAIR_MS);

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [active, scriptKey, reduced, setGhost]);

  const done = active && (reduced || progress.done);
  const completed = !active ? 0 : reduced ? script.length : progress.completed;
  const typing = !active || reduced ? null : progress.typing;

  const revealed = new Set<string>();
  for (let i = 0; i < completed && i < script.length; i += 1) {
    const step = script[i];
    if (step.type === 'out') revealed.add(step.id);
  }

  return {
    completed,
    typing,
    typingText: typing ? typing.text : null,
    typingStepIndex: typing ? typing.stepIndex : -1,
    revealed,
    isRevealed: (outId: string) => revealed.has(outId),
    isComplete: done,
    done,
  };
}

/**
 * GhostPromptLine — one transcript prompt header (two lines, §2.3):
 * line 1 is the prompt head (PROFILE.terminalPrompt minus the trailing
 * '$') in var(--dim); line 2 is '› ' in var(--num) followed by the
 * command in var(--fg). When `partial` is provided it renders instead
 * of `command`, with a blinking block caret after it, and the wrapper
 * carries data-ghost-caret="true" + aria-hidden="true" (the completed
 * line is the real, readable DOM once typing finishes). Written with
 * React.createElement so it can live in this .ts module alongside the
 * hook.
 */
export function GhostPromptLine({
  command,
  partial,
}: {
  command: string;
  partial?: string;
}): JSX.Element {
  const isTyping = partial !== undefined;
  const wrapperProps: Record<string, string> = {};
  if (isTyping) {
    wrapperProps['data-ghost-caret'] = 'true';
    wrapperProps['aria-hidden'] = 'true';
  }
  return React.createElement(
    'div',
    {
      ...wrapperProps,
      style: {
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '13px',
        lineHeight: 1.5,
      },
    },
    React.createElement('div', { style: { color: 'var(--dim)' } }, GHOST_PROMPT_HEAD),
    React.createElement(
      'div',
      null,
      React.createElement('span', { style: { color: 'var(--num)' } }, '› '),
      React.createElement('span', { style: { color: 'var(--fg)' } }, isTyping ? partial : command),
      isTyping
        ? React.createElement(
            'span',
            { className: 'cursor-blink', style: { color: 'var(--accent)' } },
            '█'
          )
        : null
    )
  );
}

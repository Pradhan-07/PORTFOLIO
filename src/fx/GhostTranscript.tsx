import React from 'react';
import {
  GHOST_PROMPT_HEAD,
  GhostPromptLine,
  useGhostScript,
  type GhostStep,
} from '../hooks/useGhostScript';

/**
 * GhostTranscript (DESIGN-SPEC §2.3) — the presentational runner every
 * section renders through. It builds the section's ghost script —
 * first a cmdline step `:e <fileBase>` for the status bar, then any
 * `introSteps`, then per block an optional `cmd` step (typed into the
 * transcript prompt) followed by an `out` step (rendered instantly
 * when reached) — and drives it with `useGhostScript`.
 *
 * A block renders nothing until reached: while its cmd types, the
 * prompt header shows the partial text (aria-hidden, carrying
 * data-ghost-caret for the eye's tether); once its out step completes,
 * the full header + output are real DOM. `introSteps` drive pacing and
 * side effects only (extra cmdline echoes, pauses) — an intro `out`
 * step has no node here and simply advances the run. Once the script
 * completes, a final bare prompt remains: prompt head, `› `, and a
 * blinking block cursor. Headers cap at --measure; the out blocks are
 * uncapped here — each section caps its own outputs (charts and grids
 * need the full panel width).
 */

export interface GhostBlock {
  id: string;
  cmd?: string;
  out: React.ReactNode;
}

export interface GhostTranscriptProps {
  active: boolean;
  fileBase: string;
  introSteps?: GhostStep[];
  blocks: GhostBlock[];
}

const HEADER_FONT: React.CSSProperties = {
  fontFamily: '"IBM Plex Mono", monospace',
  fontSize: '13px',
  lineHeight: 1.5,
};

export const GhostTranscript: React.FC<GhostTranscriptProps> = ({
  active,
  fileBase,
  introSteps,
  blocks,
}) => {
  // Build the script and the per-block step indices. This is rebuilt
  // every render on purpose: useGhostScript keys the run on the
  // script's content signature, so fresh arrays (around new JSX outs)
  // never restart typing — only a real cmd/fileBase change does.
  const script: GhostStep[] = [{ type: 'cmdline', text: `:e ${fileBase}` }];
  if (introSteps) script.push(...introSteps);
  const cmdIndex: number[] = [];
  const outIndex: number[] = [];
  blocks.forEach((block) => {
    if (block.cmd !== undefined) {
      cmdIndex.push(script.length);
      script.push({ type: 'cmd', text: block.cmd });
    } else {
      cmdIndex.push(-1);
    }
    outIndex.push(script.length);
    script.push({ type: 'out', id: block.id });
  });

  const { completed, typing, isComplete } = useGhostScript(active, script);

  return (
    <div>
      {blocks.map((block, i) => {
        const outDone = outIndex[i] < completed;
        const partialText =
          typing !== null && cmdIndex[i] >= 0 && typing.stepIndex === cmdIndex[i]
            ? typing.text
            : null;
        if (!outDone && partialText === null) return null;
        return (
          <React.Fragment key={block.id}>
            {block.cmd !== undefined &&
              (outDone ? (
                <div
                  style={{
                    maxWidth: 'var(--measure)',
                    marginTop: i === 0 ? 0 : '20px',
                    marginBottom: '10px',
                  }}
                >
                  <GhostPromptLine command={block.cmd} />
                </div>
              ) : partialText !== null ? (
                <div
                  style={{
                    maxWidth: 'var(--measure)',
                    marginTop: i === 0 ? 0 : '20px',
                    marginBottom: '10px',
                  }}
                >
                  <GhostPromptLine command={block.cmd} partial={partialText} />
                </div>
              ) : null)}
            {outDone ? block.out : null}
          </React.Fragment>
        );
      })}

      {isComplete && (
        <div
          style={{
            ...HEADER_FONT,
            maxWidth: 'var(--measure)',
            marginTop: '20px',
          }}
        >
          <div style={{ color: 'var(--dim)' }}>{GHOST_PROMPT_HEAD}</div>
          <div>
            <span style={{ color: 'var(--num)' }}>› </span>
            <span className="cursor-blink" style={{ color: 'var(--accent)' }}>
              █
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import type { Theme } from '../types';
import { BrandLogo } from './BrandLogo';
import { ContributionStrip } from './ContributionStrip';
import { useContributionsSnapshot } from '../hooks/useContributionsSnapshot';
import { DenButton, type BitState } from './hancore/BitCreature';

interface EditorStatusBarProps {
  theme: Theme;
  onCommand: (cmd: string) => void;
  activeSection: string;
  /** Current editor file name (e.g. about.tsx) — shown instead of the legacy section path when provided. */
  activeFileName?: string;
  /** G7: Bit, the stray node — den button + NODE: state readout. */
  bitAwake?: boolean;
  bitState?: BitState;
  onToggleBit?: () => void;
}

/**
 * The 46px bottom bar (G3): identity block (KP mark + KARAN.DEV + current
 * file echo + the `:` command line), a ~38-week contribution strip fed by
 * the local snapshot, and three state readouts that reflect REAL app
 * state — active theme, active file, current GitHub streak.
 *
 * Deliberately absent: a VISITORS sparkline. There is no real visitor
 * endpoint or data source for this static site, so nothing is faked.
 * The NODE: readout (G7) reports this app's own creature — Bit, the
 * stray node — and always shows his real state machine state.
 *
 * Phase 5 (visual parity): density pass — the static `[git:main@…]`
 * echo segment is removed (it duplicated the identity block and was
 * hidden by default anyway), readout type drops a step, and the zone
 * gaps tighten. Every remaining readout is real state; the decorative
 * .bar-legacy labels stay (the verify matrix has a decided rule about
 * them: hidden ≤900px is per spec, not a failure).
 *
 * Responsive: the strip hides ≤1100px, legacy chrome labels ≤900px, and
 * brand text / duplicate file echoes ≤640px, so the bar never overflows
 * at 390px wide.
 */
export const EditorStatusBar: React.FC<EditorStatusBarProps> = ({
  theme,
  onCommand,
  activeSection,
  activeFileName,
  bitAwake,
  bitState,
  onToggleBit,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState('');
  const snapshot = useContributionsSnapshot();

  const currentFile = activeFileName ?? `${activeSection}.cpp`;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim().toLowerCase();
    setInputVal('');
    setIsTyping(false);

    if (!cmd) return;

    if (cmd === ':help') {
      setCommandFeedback('Commands: :theme, :themes, :whoami, :about, :certifications, :focus, :stack, :experiments, :journey, :leetcode, :contact, :intro, :q');
    } else if (cmd === ':intro' || cmd === ':cinematic' || cmd === ':replay' || cmd === ':q') {
      onCommand('intro');
      setCommandFeedback(':launched cinematic sequence');
    } else if (cmd === ':theme') {
      onCommand('theme');
      setCommandFeedback(':theme switched');
    } else if ([':whoami', ':about', ':certifications', ':focus', ':stack', ':skills', ':experiments', ':projects', ':journey', ':leetcode', ':themes', ':contact'].includes(cmd)) {
      const section = cmd.replace(':', '').replace('skills', 'skills').replace('experiments', 'projects');
      onCommand(section);
      setCommandFeedback(`:jumped to ${section}`);
    } else {
      setCommandFeedback(`Unknown command: ${cmd}. Type :help for commands.`);
    }

    setTimeout(() => setCommandFeedback(''), 4000);
  };

  return (
    <aside
      className="editor-status-bar"
      aria-label="Editor Status"
      style={{
        position: 'relative',
        width: '100%',
        flexShrink: 0,
        zIndex: 60,
        background: 'var(--bg)',
        borderTop: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '10.5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--sp-2)',
        padding: '0 var(--frame-x)',
        height: 'var(--bar-h)',
        color: 'var(--chrome)',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* Left zone — identity block + command line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0 }}>
        <span
          className="bar-mode-chip"
          style={{
            background: 'var(--accent)',
            color: 'var(--bg)',
            fontWeight: 600,
            fontSize: '10.5px',
            letterSpacing: '0.06em',
            flexShrink: 0,
          }}
        >
          NORMAL
        </span>

        {/* Identity: KP mark + wordmark (integrates the current-file echo that follows) */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--fg)', flexShrink: 0 }}>
          <BrandLogo size={13} />
          <strong className="bar-brand-text" style={{ fontSize: '10.5px', letterSpacing: '0.08em' }}>
            KARAN.DEV
          </strong>
        </span>

        <span className="bar-file-path" style={{ color: 'var(--fg)', whiteSpace: 'nowrap' }}>
          ~/portfolio/{currentFile}
        </span>

        {/* Command Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '6px' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>:</span>
          <input
            type="text"
            className={`bar-command-input${isTyping || inputVal ? ' is-typing' : ''}`}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onFocus={() => setIsTyping(true)}
            onBlur={() => setIsTyping(false)}
            placeholder="type command (:help, :theme, :q)..."
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--fg)',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '11px',
              padding: '0 4px',
              outline: 'none',
              transition: 'width 200ms ease',
            }}
          />
        </form>

        {commandFeedback && (
          <span style={{ color: 'var(--accent)', fontSize: '10.5px', whiteSpace: 'nowrap' }}>
            {commandFeedback}
          </span>
        )}
      </div>

      {/* Middle zone — contribution strip from the local snapshot (hidden on small screens via CSS) */}
      <div className="bar-contrib-strip" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {snapshot.status === 'ready' ? (
          <ContributionStrip days={snapshot.days} weeks={38} />
        ) : (
          <span style={{ color: 'var(--dim)', fontSize: '9.5px', whiteSpace: 'nowrap' }}>
            {snapshot.status === 'loading' ? 'activity …' : 'activity unavailable'}
          </span>
        )}
      </div>

      {/* Right zone — real-state readouts + legacy chrome labels */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexShrink: 0 }}>
        {onToggleBit && (
          <>
            <DenButton awake={!!bitAwake} onToggle={onToggleBit} className="den-btn" />
            <span className="bar-readout bar-readout-node" style={{ color: 'var(--dim)', fontSize: '9.5px', whiteSpace: 'nowrap' }}>
              NODE: <strong style={{ color: 'var(--chrome)' }}>{bitState ?? 'sleeping'}</strong>
            </span>
          </>
        )}
        <span className="bar-readout bar-readout-theme" style={{ color: 'var(--dim)', fontSize: '9.5px', whiteSpace: 'nowrap' }}>
          theme: <strong style={{ color: 'var(--chrome)' }}>{theme.label}</strong>
        </span>

        <span className="bar-readout bar-readout-file" style={{ color: 'var(--dim)', fontSize: '9.5px', whiteSpace: 'nowrap' }}>
          file: <strong style={{ color: 'var(--chrome)' }}>{currentFile}</strong>
        </span>

        <span className="bar-readout bar-readout-streak" style={{ color: 'var(--dim)', fontSize: '9.5px', whiteSpace: 'nowrap' }}>
          streak:{' '}
          <strong style={{ color: '#66cc6a' }}>
            {snapshot.status === 'ready' ? `${snapshot.currentStreak}d` : '—'}
          </strong>
        </span>

        <span className="bar-legacy" style={{ color: 'var(--dim)', fontSize: '10.5px' }}>
          utf-8
        </span>

        <span className="bar-legacy" style={{ color: 'var(--dim)', fontSize: '10.5px' }}>
          [c++20]
        </span>

        <span className="bar-legacy" style={{ color: 'var(--chrome)', fontSize: '10.5px' }}>
          100% 42:1
        </span>
      </div>
    </aside>
  );
};

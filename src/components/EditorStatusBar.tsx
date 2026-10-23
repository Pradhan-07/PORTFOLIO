import React, { useEffect, useState } from 'react';
import type { Theme } from '../types';
import { ContributionStrip } from './ContributionStrip';
import { useContributionsSnapshot } from '../hooks/useContributionsSnapshot';
import type { BitState } from './hancore/BitCreature';
import { CERTIFICATIONS, PROFILE } from '../data/profile';
import { PROJECTS } from '../data/projects';
import { THEMES } from '../data/themes';
import { LEARNING_LOG } from '../data/learningLog';
import { fmtInt } from '../lib/format';
import { useCreatureBus } from '../fx/creatureBus';
import { useCmdlineEcho, usePager } from '../fx/cmdline';

/** The bar's per-section context data, from the build-time snapshots. */
interface BarContextData {
  publicRepos: number | null;
  stars: number | null;
  followers: number | null;
  languageCount: number | null;
  activeMonths: number | null;
  leetcodeSolved: number | null;
  leetcodeStreak: number | null;
}

interface EditorStatusBarProps {
  theme: Theme;
  onCommand: (cmd: string) => void;
  activeSection: string;
  /** Current editor file name (e.g. about.tsx) — keys the per-section stat columns when provided. */
  activeFileName?: string;
  /** Bit, the stray node — text toggle + BIT: state readout. */
  bitAwake?: boolean;
  bitState?: BitState;
  onToggleBit?: () => void;
}

/**
 * The 58px bottom bar (Phase 9 §2.7, lualine model): a flex row with a
 * hairline top rule on the dark ground.
 *
 *  a — host block (two lines, left): line 1 is the host label
 *      `PRADHAN-07` (his GitHub login) at 13px in --fg; line 2 (10px,
 *      --dim) alternates between the key legend and the pager readout
 *      (`/<file-base> [n/m]`) whenever a paged viewer is active.
 *  b/c — per-section stat columns keyed by the open file (labels dim
 *      uppercase, values --num via fmtInt); a column is omitted when
 *      its data is missing — never invented.
 *  x — creature telemetry: BIT / EYE / GHOST state strings from the
 *      creature bus, plus the Bit toggle as a plain text button
 *      (`wake bit` / `switch bit off`).
 *  y/z — right block: the ~38-week contribution strip fed by the local
 *      snapshot, beside STREAK <currentStreak> from the same snapshot.
 *
 * The `:` command line keeps its existing registry; unknown commands
 * answer with stock vim wording (`E492: Not an editor command: <x>`).
 * When the input is unfocused and empty, ghost cmdline echoes type
 * into the input area as display text (never an input value change).
 *
 * Deliberately absent: a VISITORS element. There is no real visitor
 * endpoint or data source for this static site, so nothing is faked
 * (§2.10). Type discipline (§1.2): only 13px (host line 1) and 10px
 * (everything else) inside the bar.
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
  const bus = useCreatureBus();
  const pager = usePager();
  const echo = useCmdlineEcho();
  const [barContext, setBarContext] = useState<BarContextData>({
    publicRepos: null,
    stars: null,
    followers: null,
    languageCount: null,
    activeMonths: null,
    leetcodeSolved: null,
    leetcodeStreak: null,
  });

  // Per-section context data — same-origin build-time snapshots only.
  // A failed fetch leaves the counts null and the dependent columns
  // are omitted; nothing is invented to fill the gap.
  useEffect(() => {
    let cancelled = false;
    fetch('/data/github-snapshot.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: { publicRepos?: number; followers?: number }; totals?: { stars?: number } } | null) => {
        if (cancelled || !data?.user) return;
        setBarContext((prev) => ({
          ...prev,
          publicRepos: data.user?.publicRepos ?? null,
          followers: data.user?.followers ?? null,
          stars: data.totals?.stars ?? null,
        }));
      })
      .catch(() => {
        // Snapshot unavailable — GitHub context columns omitted.
      });
    fetch('/data/stack.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { languages?: unknown[] } | null) => {
        if (cancelled || !data?.languages) return;
        setBarContext((prev) => ({ ...prev, languageCount: data.languages?.length ?? null }));
      })
      .catch(() => {
        // Snapshot unavailable — stack context columns omitted.
      });
    fetch('/data/months.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { months?: { contributions?: number }[] } | null) => {
        if (cancelled || !Array.isArray(data?.months)) return;
        const active = data.months.filter((m) => (m.contributions ?? 0) > 0).length;
        setBarContext((prev) => ({ ...prev, activeMonths: active }));
      })
      .catch(() => {
        // Snapshot unavailable — journey MONTHS column omitted.
      });
    fetch('/data/leetcode.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { solved?: { all?: number }; calendar?: { streak?: number } } | null) => {
        if (cancelled || !data) return;
        setBarContext((prev) => ({
          ...prev,
          leetcodeSolved: data.solved?.all ?? null,
          leetcodeStreak: data.calendar?.streak ?? null,
        }));
      })
      .catch(() => {
        // Snapshot unavailable — leetcode context columns omitted.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ghost cmdline echo typing (§2.7 / §1.6): when the input is
  // unfocused and empty, the echo text is revealed progressively at
  // ~25ms per character, keyed on the echo nonce. Display only — the
  // input's value is never touched.
  const [echoProgress, setEchoProgress] = useState<{ nonce: number; len: number }>({ nonce: -1, len: 0 });
  useEffect(() => {
    if (!echo.text) return;
    const full = echo.text;
    const nonce = echo.nonce;
    const id = window.setInterval(() => {
      setEchoProgress((prev) => {
        const cur = prev.nonce === nonce ? prev.len : 0;
        if (cur >= full.length) {
          window.clearInterval(id);
          return { nonce, len: cur };
        }
        return { nonce, len: cur + 1 };
      });
    }, 25);
    return () => window.clearInterval(id);
  }, [echo.text, echo.nonce]);

  // Progress from an older echo (nonce mismatch) reads as zero —
  // the reveal restarts per echo without a synchronous reset.
  const echoLen = echoProgress.nonce === echo.nonce ? echoProgress.len : 0;
  const showEcho = !isTyping && !inputVal && echo.text !== null;
  const echoDisplay = showEcho && echo.text ? echo.text.slice(0, echoLen) : null;

  const currentFile = activeFileName ?? `${activeSection}.cpp`;

  // The per-section stat columns (§2.7 b/c), keyed by the open file.
  // Labels dim uppercase, values --num; a column renders only when
  // its datum exists.
  const numStyle: React.CSSProperties = {
    color: 'var(--num)',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  };
  const statCols: { label: string; value: string }[] = [];
  if (currentFile === 'about.tsx') {
    if (barContext.publicRepos !== null) statCols.push({ label: 'REPOS', value: fmtInt(barContext.publicRepos) });
    if (barContext.stars !== null) statCols.push({ label: 'STARS', value: fmtInt(barContext.stars) });
    if (barContext.followers !== null) statCols.push({ label: 'FOLLOWERS', value: fmtInt(barContext.followers) });
  } else if (currentFile === 'certifications.md') {
    statCols.push({ label: 'CERTS', value: fmtInt(CERTIFICATIONS.length) });
    const latestIssued = CERTIFICATIONS[0]?.issued;
    if (latestIssued) statCols.push({ label: 'LATEST', value: latestIssued.toUpperCase() });
  } else if (currentFile === 'projects.tsx') {
    statCols.push({ label: 'PROJECTS', value: fmtInt(PROJECTS.length) });
    statCols.push({ label: 'FEATURED', value: fmtInt(PROJECTS.filter((p) => p.featured).length) });
    if (barContext.stars !== null) statCols.push({ label: 'STARS', value: fmtInt(barContext.stars) });
  } else if (currentFile === 'stack.ts') {
    if (barContext.languageCount !== null) statCols.push({ label: 'LANGS', value: fmtInt(barContext.languageCount) });
    statCols.push({ label: 'TOOLS', value: fmtInt(PROFILE.techStack.length) });
  } else if (currentFile === 'journey.log') {
    if (barContext.activeMonths !== null) statCols.push({ label: 'MONTHS', value: fmtInt(barContext.activeMonths) });
    statCols.push({ label: 'ENTRIES', value: fmtInt(LEARNING_LOG.length) });
  } else if (currentFile === 'leetcode.tsx') {
    if (barContext.leetcodeSolved !== null) statCols.push({ label: 'SOLVED', value: fmtInt(barContext.leetcodeSolved) });
    if (barContext.leetcodeStreak !== null) statCols.push({ label: 'STREAK', value: fmtInt(barContext.leetcodeStreak) });
  } else if (currentFile === 'themes.ts') {
    statCols.push({ label: 'THEMES', value: fmtInt(THEMES.length) });
  } else if (currentFile === 'contact.tsx') {
    const linkCount = [PROFILE.githubUrl, PROFILE.linkedinUrl, PROFILE.leetcodeUrl, PROFILE.email].filter(Boolean).length;
    statCols.push({ label: 'LINKS', value: fmtInt(linkCount) });
  }

  // Creature telemetry (x): state strings from the creature bus,
  // wired live by the Dashboard. The Bit string falls back to the
  // bitState prop while the bus still holds its inert default.
  const bitDisplay = bus.bit === 'asleep' && bitState ? bitState : bus.bit;
  const toggleLabel = bitAwake ? 'switch bit off' : 'wake bit';

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim().toLowerCase();
    setInputVal('');
    setIsTyping(false);

    if (!cmd) return;

    if (cmd === ':help') {
      setCommandFeedback('Commands: :theme, :themes, :whoami, :about, :certifications, :focus, :stack, :experiments, :projects, :journey, :leetcode, :contact, :intro, :q');
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
      const bare = cmd.startsWith(':') ? cmd.slice(1) : cmd;
      setCommandFeedback(`E492: Not an editor command: ${bare}`);
    }

    setTimeout(() => setCommandFeedback(''), 4000);
  };

  const labelStyle: React.CSSProperties = { color: 'var(--dim)' };
  const valueStyle: React.CSSProperties = { color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' };

  return (
    <aside
      className="editor-status-bar"
      aria-label="Editor Status"
      data-theme={theme.name}
      style={{
        position: 'relative',
        width: '100%',
        flexShrink: 0,
        zIndex: 60,
        // A dark bar — the theme ground pulled toward black so the bar
        // reads near-black under the (dark) default theme.
        background: 'color-mix(in srgb, var(--bg) 82%, #000)',
        borderTop: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '10px',
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
      {/* Left zone — host block (a) + stat columns (b/c) + command line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden', minWidth: 0 }}>
        {/* a — host block, two lines */}
        <div className="bar-host" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: 'var(--fg)', fontSize: '13px', lineHeight: 1.5, whiteSpace: 'nowrap' }}>
            {PROFILE.handle.toUpperCase()}
          </span>
          <span style={{ color: 'var(--dim)', fontSize: '10px', lineHeight: 1.5, whiteSpace: 'nowrap' }}>
            {pager !== null ? (
              <span className="bar-pager">{pager}</span>
            ) : (
              <span className="bar-legend">↑↓ section · ←→ shot · ↵ enter · : cmd</span>
            )}
          </span>
        </div>

        {/* b/c — per-section stat columns */}
        {statCols.length > 0 && (
          <div className="bar-stats" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {statCols.map((col) => (
              <span key={col.label} style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>
                <span style={labelStyle}>{col.label}</span>{' '}
                <strong style={numStyle}>{col.value}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Command Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '10px' }}>:</span>
          <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <input
              type="text"
              className={`bar-command-input${isTyping || inputVal ? ' is-typing' : ''}`}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              placeholder={echoDisplay !== null ? '' : 'type command (:help, :theme, :q)...'}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--fg)',
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '10px',
                padding: '0 4px',
                outline: 'none',
                transition: 'width 200ms ease',
              }}
            />
            {echoDisplay !== null && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--dim)',
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {echoDisplay}
              </span>
            )}
          </span>
        </form>

        {commandFeedback && (
          <span style={{ color: 'var(--accent)', fontSize: '10px', whiteSpace: 'nowrap' }}>
            {commandFeedback}
          </span>
        )}
      </div>

      {/* Right zone — creature telemetry (x) + contribution strip & streak (y/z) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        {/* x — creature telemetry + Bit toggle */}
        <div className="bar-creatures" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>
            <span style={labelStyle}>BIT</span> <strong style={valueStyle}>{bitDisplay}</strong>
          </span>
          <span style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>
            <span style={labelStyle}>EYE</span> <strong style={valueStyle}>{bus.eye}</strong>
          </span>
          <span style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>
            <span style={labelStyle}>GHOST</span> <strong style={valueStyle}>{bus.ghost}</strong>
          </span>
          {onToggleBit && (
            <button
              type="button"
              className="bar-bit-toggle"
              title={toggleLabel}
              onClick={onToggleBit}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--dim)',
                fontFamily: 'inherit',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {toggleLabel}
            </button>
          )}
        </div>

        {/* y — contribution strip from the local snapshot (hidden on small screens via CSS) */}
        <div className="bar-contrib-strip" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {snapshot.status === 'ready' ? (
            <ContributionStrip days={snapshot.days} weeks={38} />
          ) : (
            <span style={{ color: 'var(--dim)', fontSize: '10px', whiteSpace: 'nowrap' }}>
              {snapshot.status === 'loading' ? 'activity …' : 'activity unavailable'}
            </span>
          )}
        </div>

        {/* z — current streak from the same snapshot */}
        <span className="bar-readout bar-readout-streak" style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>
          <span style={labelStyle}>STREAK</span>{' '}
          <strong style={{ color: 'var(--kw)', fontVariantNumeric: 'tabular-nums' }}>
            {snapshot.status === 'ready' ? `${fmtInt(snapshot.currentStreak)}d` : '—'}
          </strong>
        </span>
      </div>
    </aside>
  );
};

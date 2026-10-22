import React, { useCallback, useEffect, useRef } from 'react';
import type { Theme } from '../types';
import type { WallDataState } from '../hooks/useWallData';
import { BrandLogo } from './BrandLogo';
import { PROFILE } from '../data/profile';
import { CODE_WALL_SNIPPETS } from '../data/codeSnippets';
import { CodeTickerPanel } from './hancore/CodeTickerPanel';
import { WireframeHandsKeyboard } from './hancore/WireframeHandsKeyboard';
import { useWheelStepper, WHEEL_COOLDOWN_MS } from '../hooks/useWheelStepper';

interface LandingScreenProps {
  theme: Theme;
  onEnter: () => void;
  onToggleTheme: () => void;
  isLeaving: boolean;
  /** G12 wall data (real repo files) — drives the sources nav + status line. */
  wall: WallDataState;
  /** Current wall position, in lines into the flattened wall data. */
  wallOffset: number;
  onWallOffsetChange: (offset: number) => void;
}

/** Lines the wall advances per wheel/key step (SCROLL-SPEC §4.5). */
const WALL_ROWS_PER_STEP = 6;
/** Vertical drag distance (px) per touch step. */
const TOUCH_STEP_PX = 56;

const LANG_LABELS: Record<string, string> = {
  cpp: 'C++',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  tsx: 'TSX',
  python: 'Python',
};

export const LandingScreen: React.FC<LandingScreenProps> = ({
  theme,
  onEnter,
  onToggleTheme,
  isLeaving,
  wall,
  wallOffset,
  onWallOffsetChange,
}) => {
  // Wall position model (SCROLL-SPEC §4.5 + G12): the wall data is one
  // flat list of lines; the offset picks where the visible grid starts.
  // The status line's file/line readout is derived from the same offset,
  // so it always names what is actually on the wall — real state, never
  // decoration, and never an invented path when the fallback snippets
  // are in use.
  const wallFiles = wall.status === 'ready' && wall.data ? wall.data.files : null;
  const totalLines = wallFiles
    ? wallFiles.reduce((sum, f) => sum + f.tokens.length, 0)
    : CODE_WALL_SNIPPETS.length;
  const safeTotal = Math.max(totalLines, 1);
  const currentOffset = ((wallOffset % safeTotal) + safeTotal) % safeTotal;

  let currentLabel = '';
  let currentLine = currentOffset + 1;
  if (wallFiles) {
    let acc = 0;
    for (const f of wallFiles) {
      if (currentOffset < acc + f.tokens.length) {
        currentLabel = `${f.repo}/${f.path}`;
        currentLine = currentOffset - acc + 1;
        break;
      }
      acc += f.tokens.length;
    }
    if (!currentLabel && wallFiles.length > 0) {
      const last = wallFiles[wallFiles.length - 1];
      currentLabel = `${last.repo}/${last.path}`;
      currentLine = last.tokens.length;
    }
  } else {
    const snippet = CODE_WALL_SNIPPETS[currentOffset % CODE_WALL_SNIPPETS.length];
    currentLabel = `snippet · ${snippet.lang}`;
  }

  const advanceWall = useCallback(
    (steps: number) => {
      onWallOffsetChange(currentOffset + steps * WALL_ROWS_PER_STEP);
    },
    [currentOffset, onWallOffsetChange]
  );

  // Wheel stepping over the landing (shared state machine, §4.1).
  const stepper = useWheelStepper((direction) => advanceWall(direction));
  const stepperRef = stepper.ref;
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    stepperRef(root);

    // Touch: vertical swipe steps the wall (§4.7).
    let touchStartY: number | null = null;
    let lastTouchStepAt = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? null;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY === null) return;
      const y = e.touches[0]?.clientY;
      if (y === undefined) return;
      const dy = touchStartY - y;
      if (Math.abs(dy) < TOUCH_STEP_PX) return;
      touchStartY = y;
      const now = performance.now();
      if (now - lastTouchStepAt < WHEEL_COOLDOWN_MS) return;
      lastTouchStepAt = now;
      advanceWall(dy > 0 ? 1 : -1);
    };
    const handleTouchEnd = () => {
      touchStartY = null;
    };
    root.addEventListener('touchstart', handleTouchStart, { passive: true });
    root.addEventListener('touchmove', handleTouchMove, { passive: true });
    root.addEventListener('touchend', handleTouchEnd);
    root.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      stepperRef(null);
      root.removeEventListener('touchstart', handleTouchStart);
      root.removeEventListener('touchmove', handleTouchMove);
      root.removeEventListener('touchend', handleTouchEnd);
      root.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [stepperRef, advanceWall]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onEnter();
      } else if (e.key === 't' || e.key === 'T') {
        if (!e.metaKey && !e.ctrlKey) {
          onToggleTheme();
        }
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        // Wall navigation keys (§4.5): arrows / j / k step, PageUp/PageDown jump.
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
          e.preventDefault();
          advanceWall(1);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          advanceWall(-1);
        } else if (e.key === 'PageDown') {
          e.preventDefault();
          advanceWall(5);
        } else if (e.key === 'PageUp') {
          e.preventDefault();
          advanceWall(-5);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, onToggleTheme, advanceWall]);

  return (
    <div
      ref={rootRef}
      className={`landing-stage ${isLeaving ? 'is-leaving' : ''}`}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100svh',
        minHeight: 'min(620px, 100svh)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        background: '#080908',
        color: 'var(--fg)',
        zIndex: 5,
        fontFamily: '"IBM Plex Mono", monospace',
        transition: 'opacity 300ms ease, filter 300ms ease',
      }}
    >
      {/* Exactly one H1 on the landing, screen-reader only (Round 1, §1.4):
          the visible wordmark is a brand lockup, not a heading. */}
      <h1 className="sr-only">{PROFILE.name} — portfolio</h1>

      {/* G12 attribution: every line on the wall is traceable to its real
          source. One link per wall file; excerpted files say so. When the
          wall data is unavailable the nav states that honestly — no
          fabricated links. */}
      {wallFiles ? (
        <nav aria-label="Code wall sources" className="sr-only">
          <ul>
            {wallFiles.map((f) => (
              <li key={f.sha}>
                <a href={f.blobUrl} target="_blank" rel="noreferrer noopener">
                  {f.repo} — {f.path} ({LANG_LABELS[f.lang] ?? f.lang}
                  {f.excerpt ? ', excerpt' : ''})
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : (
        <p className="sr-only">
          Code wall sources are unavailable; the wall is showing built-in code snippets.
        </p>
      )}

      {/* FRAME 02 — TOP HEADER REVEAL */}
      <header
        className="frame-top"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          zIndex: 10,
        }}
      >
        <div
          className="brand landing-brand"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--fg)',
            fontSize: '12px',
            textDecoration: 'none',
          }}
        >
          <BrandLogo size={18} />
          <span style={{ fontWeight: 500 }}>{PROFILE.domain}</span>
          <span
            style={{
              fontSize: '10px',
              padding: '1px 5px',
              borderRadius: '2px',
              background: 'var(--line)',
              color: 'var(--dim)',
              letterSpacing: '0.04em',
            }}
          >
            v2.0
          </span>
        </div>

        <nav
          className="switch"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            fontSize: '11px',
          }}
        >
          <a
            href={PROFILE.githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="quiet-link"
            style={{
              color: 'var(--dim)',
              textDecoration: 'none',
              letterSpacing: '0.08em',
              transition: 'color 180ms ease',
            }}
          >
            github ↗
          </a>

          <a
            href={PROFILE.linkedinUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="quiet-link"
            style={{
              color: 'var(--dim)',
              textDecoration: 'none',
              letterSpacing: '0.08em',
              transition: 'color 180ms ease',
            }}
          >
            linkedin ↗
          </a>
        </nav>
      </header>

      {/* CENTER VIEWPORT: CODE TICKER & WIREFRAME HANDS (Frames 03, 04, 05) */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          maxWidth: '880px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10,
          padding: '10px 0',
        }}
      >
        {/* Frame 03 & 04: Live Code Editor Ticker Panel (Central 50-60% width) */}
        <CodeTickerPanel />

        {/* Frame 05: Bottom Keyboard & Hand-Wireframe Visualization */}
        <WireframeHandsKeyboard
          themeFg={theme.fg}
          themeAccent={theme.accent}
        />
      </main>

      {/* FRAME 06 & 07 — BOTTOM BAR: LOWER LEFT TAGLINE & THEME/ENTER CONTROL */}
      <footer
        className="frame-bottom"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          fontSize: '11px',
          color: 'var(--dim)',
          zIndex: 10,
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* FRAME 06 — LOWER LEFT TAGLINE + LIVE WALL STATUS */}
        <div className="landing-status-line" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Decorative mono note — hidden from assistive tech (Round 1, §1.5). */}
          <span aria-hidden="true" style={{ color: 'var(--dim)', letterSpacing: '0.04em' }}>
            // building with curiosity.
          </span>
          {/* Vim-style status readout: the file currently on the wall and
              the line the visible grid starts at — derived from the real
              wall offset, updated by wheel / keys / swipe (§4.5). */}
          <span style={{ color: 'var(--chrome)', fontSize: '10.5px', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            NORMAL · {currentLabel} · {currentLine}:1
          </span>
        </div>

        {/* FRAME 07 — THEME AND ENTER CONTROL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Theme switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="theme-key-btn"
            title="Switch theme palette (or press T)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
              borderRadius: '2px',
              padding: '4px 10px',
              minHeight: '44px',
              color: 'var(--chrome)',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 180ms ease',
            }}
          >
            <span style={{ color: 'var(--accent)' }}>⌁</span>
            <span>theme [{theme.label}]</span>
          </button>

          {/* Enter Button */}
          <button
            type="button"
            onClick={onEnter}
            className="enter-btn"
            aria-label="Enter portfolio"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              minHeight: '44px',
              background: 'var(--fg)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: '2px',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '11.5px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              boxShadow: 'var(--ring)',
              transition: 'transform 180ms ease, filter 180ms ease',
            }}
          >
            <span>enter</span>
            <span style={{ fontSize: '13px', lineHeight: 1 }}>↵</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Theme } from '../types';
import type { WallDataState } from '../hooks/useWallData';
import { PROFILE } from '../data/profile';
import { THEMES } from '../data/themes';
import { CODE_WALL_SNIPPETS } from '../data/codeSnippets';
import { CodeTickerPanel } from './hancore/CodeTickerPanel';
import { ColorschemePicker } from './hancore/ColorschemePicker';
import { WireframeHandsKeyboard } from './hancore/WireframeHandsKeyboard';
import { useWheelStepper, WHEEL_COOLDOWN_MS } from '../hooks/useWheelStepper';

interface LandingScreenProps {
  theme: Theme;
  onEnter: () => void;
  /** Kept for App compatibility; the :theme control now opens the
   *  :colorscheme picker instead of cycling, so this is unused here. */
  onToggleTheme: () => void;
  /** Apply a theme by index (picker selection) — App owns + persists it. */
  onSelectTheme: (index: number) => void;
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
  onSelectTheme,
  isLeaving,
  wall,
  wallOffset,
  onWallOffsetChange,
}) => {
  // :colorscheme picker (§2.1) — opened by the :theme button / T key.
  // `pickerKey` remounts the picker on every open so its query and
  // highlight initialise fresh from props.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const openPicker = useCallback(() => {
    setPickerKey((k) => k + 1);
    setPickerOpen(true);
  }, []);
  const activeThemeIndex = Math.max(
    0,
    THEMES.findIndex((t) => t.name === theme.name)
  );

  // Wall position model (SCROLL-SPEC §4.5 + G12): the wall data is one
  // flat list of lines; the offset picks where the visible grid starts.
  // (The demo panel owns its own vim status line now — §2.1 — derived
  // from the demo's file/cursor state, not from this background offset.)
  const wallFiles = wall.status === 'ready' && wall.data ? wall.data.files : null;
  const totalLines = wallFiles
    ? wallFiles.reduce((sum, f) => sum + f.tokens.length, 0)
    : CODE_WALL_SNIPPETS.length;
  const safeTotal = Math.max(totalLines, 1);
  const currentOffset = ((wallOffset % safeTotal) + safeTotal) % safeTotal;

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
      // While the :colorscheme picker is open it owns the keyboard
      // (filter input, ↑/↓, Enter, Esc) — this handler stands down.
      if (pickerOpen) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        onEnter();
      } else if (e.key === 't' || e.key === 'T') {
        if (!e.metaKey && !e.ctrlKey) {
          openPicker();
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
  }, [onEnter, openPicker, advanceWall, pickerOpen]);

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
        // §2.2 phase A: the landing dims over the first 0.8s of the
        // enter transition (the .is-leaving class supplies the target).
        transition: 'opacity 800ms ease, filter 800ms ease',
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
        {/* Phase 5 (visual parity): the header is text-only — a plain
            wordmark left, one github link right. No logo lockup, no
            version chip, no second social link. */}
        <div
          className="brand landing-brand"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            color: 'var(--fg)',
            fontSize: '12px',
            textDecoration: 'none',
          }}
        >
          <span style={{ fontWeight: 500 }}>{PROFILE.domain}</span>
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
        </nav>
      </header>

      {/* CENTER VIEWPORT — Phase 9 (§2.1): the staged Neovim demo panel
          manages its own width (640px single pane / 815px split) and
          renders the vim status line + command-line row directly under
          the pane(s); the keyboard + hand-landmark artwork sits below
          that — same original WireframeHandsKeyboard component, fed the
          live theme colours. */}
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
        <div style={{ width: '100%' }}>
          <CodeTickerPanel wallFiles={wallFiles} />
        </div>

        {/* Keyboard diagram flanked by two hand-landmark wireframes —
            Karan's own canvas artwork, decorative over the wall. */}
        <div style={{ marginTop: '18px' }} aria-hidden="true">
          <WireframeHandsKeyboard themeFg={theme.fg} themeAccent={theme.accent} />
        </div>
      </main>

      {/* BOTTOM ROW — Phase 8: tagline left / :theme centre / enter
          right, three true zones (grid 1fr auto 1fr). */}
      <footer
        className="frame-bottom"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          width: '100%',
          fontSize: '11px',
          color: 'var(--dim)',
          zIndex: 10,
          gap: '12px',
        }}
      >
        {/* LEFT — the tagline note. Decorative — hidden from assistive
            tech (Round 1, §1.5). Karan's own wording, unchanged. */}
        <span aria-hidden="true" style={{ color: 'var(--dim)', letterSpacing: '0.04em', justifySelf: 'start' }}>
          // building with curiosity.
        </span>

        {/* CENTRE — the :theme control (§2.1: opens the :colorscheme
            picker; the label shows the current theme). Phase 5: a tiny
            borderless text control (the 44px min-height stays: touch
            target rule). */}
        <button
          type="button"
          onClick={openPicker}
          className="theme-key-btn"
          title="Switch theme palette (or press T)"
          style={{
            justifySelf: 'center',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            padding: '4px 6px',
            minHeight: '44px',
            color: 'var(--dim)',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '10.5px',
            cursor: 'pointer',
            transition: 'color 180ms ease',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>:</span>
          <span>theme [{theme.label}]</span>
        </button>

        {/* RIGHT — Enter. Phase 5: a small OUTLINED pill (transparent
            fill, hairline ring, pill radius) instead of the solid block.
            Gate behaviour is untouched: click, Enter key, the App-level
            timer fallback and Esc all work exactly as in Phase 4. */}
        <button
          type="button"
          onClick={onEnter}
          className="enter-btn"
          aria-label="Enter portfolio"
          style={{
            justifySelf: 'end',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            minHeight: '44px',
            background: 'transparent',
            color: 'var(--fg)',
            border: '1px solid color-mix(in srgb, var(--fg) 45%, transparent)',
            borderRadius: '999px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '11.5px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'border-color 180ms ease, color 180ms ease',
          }}
        >
          <span>enter</span>
          <span style={{ fontSize: '13px', lineHeight: 1 }}>↵</span>
        </button>
      </footer>

      {/* :colorscheme picker (§2.1) — remounted per open via key so its
          filter/highlight state starts fresh; selection applies through
          App's theme state and persists to localStorage there. */}
      {pickerOpen && (
        <ColorschemePicker
          key={pickerKey}
          open={pickerOpen}
          themes={THEMES}
          activeIndex={activeThemeIndex}
          onSelect={onSelectTheme}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
};

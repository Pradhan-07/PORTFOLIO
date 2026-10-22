import React, { useEffect, useRef, useState } from 'react';
import { EDITOR_FILES } from '../../data/editorFiles';
import type { EditorFileId } from '../../types';
import { useWheelStepper, WHEEL_COOLDOWN_MS } from '../../hooks/useWheelStepper';

interface EditorFileNavProps {
  activeFile: EditorFileId;
  onNavigate: (file: EditorFileId) => void;
  onStepFile: (direction: 1 | -1) => void;
}

/** Vertical drag distance (px) that counts as one touch step. */
const TOUCH_STEP_PX = 56;

/**
 * The file tree — the editor's primary navigation control.
 * - Click / Enter / Space opens a file (native button behaviour).
 * - Wheel over the tree steps one file at a time via the shared
 *   useWheelStepper state machine (normalised deltas, threshold, and a
 *   cooldown that DISCARDS momentum instead of banking it — SCROLL-SPEC
 *   §4.1/§4.2, the S1 fix).
 * - Touch: a vertical swipe steps files the same way (§4.7).
 * - Arrow keys / j / k stepping is handled globally by the Dashboard, which
 *   knows about modal and typing focus guards.
 * - Narrow stages (≤640px, G10): the tree collapses into a tabline
 *   disclosure — a toggle button naming the open file (aria-expanded
 *   always truthful) and the panel as an overlay sheet. Picking a file
 *   closes the sheet; Escape closes it and returns focus to the toggle.
 *   Above 640px the panel is the permanent sidebar and the open state
 *   is ignored by CSS.
 *
 * Capture over the tree is deliberately total (S9 decision): the tree is
 * a control surface, not a scroller. Its 8 rows + header + hint ≈ 390px
 * fit the stage's 560px floor, so the panel itself never needs to scroll;
 * if the file list ever outgrows that, the active row stays reachable via
 * keyboard focus (the Dashboard restores focus to the active file button).
 */
export const EditorFileNav: React.FC<EditorFileNavProps> = ({ activeFile, onNavigate, onStepFile }) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const activeSpec = EDITOR_FILES.find((f) => f.id === activeFile) ?? EDITOR_FILES[0];

  const stepRef = useRef(onStepFile);
  useEffect(() => {
    stepRef.current = onStepFile;
  }, [onStepFile]);

  const stepper = useWheelStepper((direction) => stepRef.current(direction));
  const stepperRef = stepper.ref;
  const stepperReset = stepper.reset;

  // Wheel + touch listeners on the nav root. The wheel ref comes from the
  // stepper hook; touch is wired here with the same step callback and the
  // same cooldown constant.
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    stepperRef(root);

    let touchStartY: number | null = null;
    let lastTouchStepAt = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? null;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY === null) return;
      const y = e.touches[0]?.clientY;
      if (y === undefined) return;
      const dy = touchStartY - y; // drag up (dy > 0) = next file
      if (Math.abs(dy) < TOUCH_STEP_PX) return;
      // One step per 56px of drag, at most one per cooldown window;
      // preventDefault stops pull-to-refresh and list scrolling (§4.7).
      e.preventDefault();
      touchStartY = y;
      const now = performance.now();
      if (now - lastTouchStepAt < WHEEL_COOLDOWN_MS) return;
      lastTouchStepAt = now;
      stepRef.current(dy > 0 ? 1 : -1);
    };
    const handleTouchEnd = () => {
      touchStartY = null;
    };

    root.addEventListener('touchstart', handleTouchStart, { passive: true });
    root.addEventListener('touchmove', handleTouchMove, { passive: false });
    root.addEventListener('touchend', handleTouchEnd);
    root.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      stepperRef(null);
      root.removeEventListener('touchstart', handleTouchStart);
      root.removeEventListener('touchmove', handleTouchMove);
      root.removeEventListener('touchend', handleTouchEnd);
      root.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [stepperRef]);

  const handleSelect = (file: EditorFileId) => {
    onNavigate(file);
    setSheetOpen(false);
  };

  // Escape inside the nav closes the disclosure sheet (≤640) and puts
  // focus back on the toggle — the G4 guard order keeps this local:
  // Dashboard-level Escape handling defers to open overlays first.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && sheetOpen) {
      e.stopPropagation();
      setSheetOpen(false);
      toggleRef.current?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className="editor-file-nav"
      data-editor-file-nav="true"
      onPointerLeave={stepperReset}
      onKeyDown={handleKeyDown}
      style={{
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Tabline disclosure toggle — rendered always, displayed only in
          the ≤640 band (CSS). Names the open file; aria-expanded mirrors
          the sheet state exactly. */}
      <button
        ref={toggleRef}
        type="button"
        className="editor-tabline-toggle"
        aria-expanded={sheetOpen}
        aria-controls="editor-file-panel"
        onClick={() => setSheetOpen((v) => !v)}
        style={{
          display: 'none',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          minHeight: '44px',
          background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
          border: 'none',
          borderBottom: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
          padding: 'var(--sp-1) var(--sp-2)',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '11px',
          color: 'var(--fg)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: activeSpec.dot,
            flexShrink: 0,
          }}
        />
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activeSpec.file}
        </span>
        <span style={{ fontSize: '8.5px', color: 'var(--dim)', letterSpacing: '0.06em' }}>{activeSpec.kind}</span>
        <span aria-hidden="true" style={{ color: 'var(--dim)', fontSize: '10px' }}>{sheetOpen ? '▾' : '▸'}</span>
      </button>

      <div
        id="editor-file-panel"
        className={`editor-file-panel${sheetOpen ? ' is-open' : ' is-closed'}`}
        style={{
          height: '100%',
          background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
          borderRight: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
          fontFamily: '"IBM Plex Mono", monospace',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Explorer header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 'var(--sp-1) var(--sp-2)',
            fontSize: '9.5px',
            letterSpacing: '0.1em',
            color: 'var(--dim)',
            borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
            flexShrink: 0,
          }}
        >
          <span style={{ color: 'var(--accent)' }}>▸</span>
          <span>EXPLORER · karan.dev / src</span>
        </div>

        {/* File list */}
        <div
          role="navigation"
          aria-label="Portfolio files"
          className="editor-file-list scroll-contain"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {EDITOR_FILES.map((f) => {
            const isActive = activeFile === f.id;
            return (
              <button
                key={f.id}
                type="button"
                data-file-button={f.id}
                onClick={() => handleSelect(f.id)}
                aria-current={isActive ? 'true' : undefined}
                className="editor-file-button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  background: isActive ? 'var(--line)' : 'transparent',
                  color: isActive ? 'var(--fg)' : 'var(--dim)',
                  border: 'none',
                  borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  borderBottom: '1px solid color-mix(in srgb, var(--fg) 5%, transparent)',
                  padding: 'var(--sp-1) var(--sp-2)',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'color 160ms ease, background 160ms ease',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: f.dot,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.file}</span>
                <span style={{ fontSize: '8.5px', color: 'var(--dim)', letterSpacing: '0.06em' }}>{f.kind}</span>
              </button>
            );
          })}
        </div>

        <div
          className="editor-explorer-hint"
          style={{
            marginTop: 'auto',
            padding: 'var(--sp-1) var(--sp-2)',
            fontSize: '9px',
            lineHeight: 1.7,
            color: 'var(--dim)',
            borderTop: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
            flexShrink: 0,
          }}
        >
          scroll / j · k — step files
          <br />
          ⌘K palette · ctrl+` terminal
        </div>
      </div>
    </div>
  );
};

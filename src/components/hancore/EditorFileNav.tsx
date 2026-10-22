import React, { useEffect, useRef } from 'react';
import { EDITOR_FILES } from '../../data/editorFiles';
import type { EditorFileId } from '../../types';

interface EditorFileNavProps {
  activeFile: EditorFileId;
  onNavigate: (file: EditorFileId) => void;
  onStepFile: (direction: 1 | -1) => void;
}

const WHEEL_THRESHOLD = 48; // accumulated px (or line-normalised px) per step
const WHEEL_COOLDOWN_MS = 320; // one file per gesture burst — no flicker-skipping

/**
 * The file tree — the editor's primary navigation control.
 * - Click / Enter / Space opens a file (native button behaviour).
 * - Wheel over the tree steps one file at a time: deltas accumulate past a
 *   threshold, then a cooldown swallows the rest of the gesture.
 * - Arrow keys / j / k stepping is handled globally by the Dashboard, which
 *   knows about modal and typing focus guards.
 */
export const EditorFileNav: React.FC<EditorFileNavProps> = ({ activeFile, onNavigate, onStepFile }) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stepRef = useRef(onStepFile);
  useEffect(() => {
    stepRef.current = onStepFile;
  }, [onStepFile]);

  // Native (non-passive) wheel listener so we can actually preventDefault —
  // React attaches its synthetic wheel handlers passively at the root.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let accumulated = 0;
    let lastStepAt = 0;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom gesture — leave it alone
      e.preventDefault();

      let delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) delta *= 16; // lines → px
      else if (e.deltaMode === 2) delta *= 100; // pages → px

      accumulated += delta;
      const now = performance.now();
      if (now - lastStepAt < WHEEL_COOLDOWN_MS) return;

      if (Math.abs(accumulated) >= WHEEL_THRESHOLD) {
        stepRef.current(accumulated > 0 ? 1 : -1);
        accumulated = 0;
        lastStepAt = now;
      }
    };

    root.addEventListener('wheel', handleWheel, { passive: false });
    return () => root.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div
      ref={rootRef}
      className="editor-file-nav"
      data-editor-file-nav="true"
      style={{
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <div
        className="editor-file-panel"
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
            padding: '9px 12px',
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
          className="editor-file-list"
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
                onClick={() => onNavigate(f.id)}
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
                  padding: '9px 12px',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'color 160ms ease, background 160ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--fg)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--dim)';
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
            padding: '9px 12px',
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

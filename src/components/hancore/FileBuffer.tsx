import React, { useLayoutEffect, useRef, useState } from 'react';
import type { EditorFileSpec } from '../../types';

interface FileBufferProps {
  file: EditorFileSpec;
  bufferRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

/** Never paint more gutter rows than this, however tall the content gets. */
const GUTTER_ROW_CAP = 4000;
/** Rows painted before the first measurement lands (and as a fallback). */
const GUTTER_ROWS_FALLBACK = 120;

/**
 * The single editor buffer every file renders inside: a winbar with the
 * file path + language, a line gutter, and one internally scrolling
 * region. Switching files swaps only the children rendered here — the
 * stage chrome around it never moves.
 *
 * Gutter (Phase 4 stretch, G2 — line-true): the row count is MEASURED
 * from the open buffer's real content height (ResizeObserver on the
 * content wrapper), so the numbers index the buffer's actual guide-grid
 * lines — one number per --cell-h line of the open file, no fixed pool
 * of decorative rows. The honest remainder: the buffer's children are
 * rich section blocks, not line-oriented text, so a number names a grid
 * line of the buffer, not a semantic line of source code.
 */
export const FileBuffer: React.FC<FileBufferProps> = ({ file, bufferRef, children }) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [gutterRows, setGutterRows] = useState(GUTTER_ROWS_FALLBACK);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const cellH =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-h')) || 14;
      const rows = Math.ceil(content.scrollHeight / cellH);
      setGutterRows(Math.max(1, Math.min(GUTTER_ROW_CAP, rows)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(content);
    return () => ro.disconnect();
    // The panes stay mounted and swap via `hidden`, and children change
    // identity per file — re-measure whenever the rendered file changes.
  }, [file.id, children]);

  return (
    <section
      className="file-buffer"
      aria-label={`Editor buffer — ${file.file}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
        background: 'color-mix(in srgb, var(--bg) 94%, transparent)',
      }}
    >
      {/* Winbar */}
      <div
        className="file-buffer-winbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: 'var(--sp-1) var(--sp-2)',
          borderBottom: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
          background: 'color-mix(in srgb, var(--bg) 88%, var(--line))',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '11px',
          color: 'var(--chrome)',
          flexShrink: 0,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: file.dot,
            flexShrink: 0,
          }}
        />
        <span style={{ color: 'var(--fg)', fontWeight: 500 }}>~/portfolio/{file.file}</span>
        <span style={{ color: 'var(--dim)', fontSize: '10px', letterSpacing: '0.06em' }}>{file.language}</span>
        <span style={{ marginLeft: 'auto', color: 'var(--dim)', fontSize: '10px', letterSpacing: '0.06em' }}>
          {file.kind} · buffer · utf-8
        </span>
      </div>

      {/* Scroll region — the only part of the stage that scrolls */}
      <div
        ref={bufferRef}
        className="file-buffer-scroll scroll-contain"
        tabIndex={0}
        role="region"
        aria-label={`Open file: ${file.file}. Use j and k or the arrow keys to move between files.`}
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: 1,
          minHeight: 0,
          position: 'relative',
        }}
      >
        {/* Screen-reader announcement of the newly opened file */}
        <div role="status" aria-live="polite" className="sr-only">
          Opened {file.file}
        </div>

        <div ref={contentRef} className="file-buffer-content" style={{ position: 'relative', minHeight: '100%' }}>
          {/* Line gutter — measured rows, each exactly one --cell-h tall */}
          <div className="file-gutter" aria-hidden="true">
            {Array.from({ length: gutterRows }, (_, i) => (
              <div key={i} className="file-gutter-line">
                {i + 1}
              </div>
            ))}
          </div>

          <div className="file-buffer-body">{children}</div>
        </div>
      </div>
    </section>
  );
};

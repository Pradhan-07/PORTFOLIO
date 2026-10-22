import React from 'react';
import type { EditorFileSpec } from '../../types';

interface FileBufferProps {
  file: EditorFileSpec;
  bufferRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

// How many gutter rows to paint. The gutter layer is clipped to the content
// height (overflow: hidden), so extra rows never add scroll height.
const GUTTER_ROWS = 420;

/**
 * The single editor buffer every file renders inside: a winbar with the
 * file path + language, a line gutter whose rows are exactly one --cell-h
 * tall, and one internally scrolling region. Switching files swaps only
 * the children rendered here — the stage chrome around it never moves.
 */
export const FileBuffer: React.FC<FileBufferProps> = ({ file, bufferRef, children }) => {
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
          padding: '7px 14px',
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
        <span style={{ color: 'var(--fg)', fontWeight: 500 }}>~/portfolio/src/{file.file}</span>
        <span style={{ color: 'var(--dim)', fontSize: '10px', letterSpacing: '0.06em' }}>{file.language}</span>
        <span style={{ marginLeft: 'auto', color: 'var(--dim)', fontSize: '10px', letterSpacing: '0.06em' }}>
          {file.kind} · buffer · utf-8
        </span>
      </div>

      {/* Scroll region — the only part of the stage that scrolls */}
      <div
        ref={bufferRef}
        className="file-buffer-scroll"
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

        <div className="file-buffer-content" style={{ position: 'relative', minHeight: '100%' }}>
          {/* Line gutter — rows snapped to the --cell-h character token */}
          <div className="file-gutter" aria-hidden="true">
            {Array.from({ length: GUTTER_ROWS }, (_, i) => (
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

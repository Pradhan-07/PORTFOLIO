import React from 'react';

interface EditorFileNavProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

interface EditorFile {
  file: string;
  section: string;
  kind: string;
  dot: string;
}

// The portfolio sections presented as files in an editor tree / tabline.
// Clicking a file scrolls to the matching section (same pattern as the header nav).
const EDITOR_FILES: EditorFile[] = [
  { file: 'about.tsx', section: 'about', kind: 'TSX', dot: '#3178c6' },
  { file: 'certifications.md', section: 'certifications', kind: 'MD', dot: '#66cc6a' },
  { file: 'projects.tsx', section: 'projects', kind: 'TSX', dot: '#3178c6' },
  { file: 'stack.ts', section: 'skills', kind: 'TS', dot: '#e8c268' },
  { file: 'journey.log', section: 'journey', kind: 'LOG', dot: 'var(--chrome)' },
  { file: 'leetcode.tsx', section: 'leetcode', kind: 'TSX', dot: '#3178c6' },
  { file: 'contact.tsx', section: 'contact', kind: 'TSX', dot: '#3178c6' },
];

export const EditorFileNav: React.FC<EditorFileNavProps> = ({ activeSection, onNavigate }) => {
  // The hero sits at the top of about.tsx in this file model.
  const effectiveActive = activeSection === 'hero' ? 'about' : activeSection;

  return (
    <div
      className="editor-file-nav"
      style={{
        maxWidth: '1200px',
        margin: '20px auto 0 auto',
        padding: '0 24px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
          border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
          borderRadius: '3px',
          fontFamily: '"IBM Plex Mono", monospace',
          overflow: 'hidden',
        }}
      >
        {/* Explorer header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 12px',
            fontSize: '9.5px',
            letterSpacing: '0.1em',
            color: 'var(--dim)',
            borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>▸</span>
          <span>EXPLORER · karan.dev / src</span>
          <span style={{ marginLeft: 'auto', letterSpacing: '0.04em' }}>click a file to open its section</span>
        </div>

        {/* File tabline */}
        <div
          role="navigation"
          aria-label="Portfolio files"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {EDITOR_FILES.map((f) => {
            const isActive = effectiveActive === f.section;
            return (
              <button
                key={f.file}
                type="button"
                onClick={() => onNavigate(f.section)}
                aria-current={isActive ? 'true' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: isActive ? 'var(--line)' : 'transparent',
                  color: isActive ? 'var(--fg)' : 'var(--dim)',
                  border: 'none',
                  borderRight: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
                  borderTop: isActive
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                  padding: '8px 13px',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
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
                <span>{f.file}</span>
                <span style={{ fontSize: '8.5px', color: 'var(--dim)', letterSpacing: '0.06em' }}>
                  {f.kind}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

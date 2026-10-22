import React from 'react';
import { THEMES } from '../data/themes';
import type { Theme } from '../types';

interface ThemesSectionProps {
  activeTheme: Theme;
  onSelectTheme: (index: number) => void;
}

const SYNTAX_CHIPS: Array<{ key: keyof Theme['kinds']; label: string }> = [
  { key: 'keyword', label: 'kw' },
  { key: 'string', label: 'str' },
  { key: 'function', label: 'fn' },
  { key: 'type', label: 'ty' },
  { key: 'number', label: 'num' },
];

/**
 * Themes as a browsable editor file: every palette Karan ships, with its
 * base + syntax colours as swatches. Selecting one re-skins the whole
 * stage live through the existing CSS-variable theme engine, and the
 * choice persists in localStorage (handled in App).
 */
export const ThemesSection: React.FC<ThemesSectionProps> = ({ activeTheme, onSelectTheme }) => {
  return (
    <section
      id="themes"
      className="themes-section file-section"
      style={{
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
      }}
    >
      <div className="section-container">
        <div
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '11px',
            color: 'var(--dim)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          {'// 07 · THEMES'}
        </div>

        <h2
          style={{
            margin: '0 0 16px 0',
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
            fontWeight: 400,
            color: 'var(--fg)',
            letterSpacing: '-0.02em',
          }}
        >
          Editor <span style={{ fontStyle: 'italic', color: 'var(--chrome)' }}>themes.</span>
        </h2>

        <p
          style={{
            margin: '0 0 36px 0',
            fontFamily: '"Archivo", sans-serif',
            fontSize: '15px',
            color: 'var(--dim)',
            maxWidth: '680px',
            lineHeight: 1.6,
          }}
        >
          Eight palettes this site ships with. Pick one and the whole editor — wall, buffer and bar —
          re-skins instantly. Your choice is remembered on this device for your next visit.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '14px',
          }}
        >
          {THEMES.map((t, index) => {
            const isActive = t.name === activeTheme.name;
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => onSelectTheme(index)}
                aria-pressed={isActive}
                style={{
                  textAlign: 'left',
                  background: t.bg,
                  color: t.fg,
                  border: isActive
                    ? `1px solid ${t.accent}`
                    : '1px solid color-mix(in srgb, var(--fg) 14%, transparent)',
                  borderRadius: '3px',
                  padding: '16px',
                  cursor: 'pointer',
                  fontFamily: '"IBM Plex Mono", monospace',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{t.label}</span>
                  <span style={{ fontSize: '9px', color: t.dim, letterSpacing: '0.08em' }}>
                    {isActive ? '● ACTIVE' : t.light ? 'LIGHT' : 'DARK'}
                  </span>
                </span>

                {/* Base swatches */}
                <span style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { c: t.bg, label: 'bg' },
                    { c: t.fg, label: 'fg' },
                    { c: t.accent, label: 'accent' },
                    { c: t.chrome, label: 'chrome' },
                    { c: t.line, label: 'line' },
                  ].map((s) => (
                    <span key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '2px',
                          background: s.c,
                          border: '1px solid rgba(127,127,127,0.35)',
                          display: 'block',
                        }}
                      />
                      <span style={{ fontSize: '8px', color: t.dim }}>{s.label}</span>
                    </span>
                  ))}
                </span>

                {/* Syntax-kind swatches */}
                <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {SYNTAX_CHIPS.map((chip) => (
                    <span
                      key={chip.key}
                      style={{
                        fontSize: '9px',
                        color: t.kinds[chip.key],
                        border: '1px solid rgba(127,127,127,0.3)',
                        borderRadius: '2px',
                        padding: '2px 6px',
                      }}
                    >
                      {chip.label} {t.kinds[chip.key]}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

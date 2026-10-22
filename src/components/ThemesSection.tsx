import React from 'react';
import { THEMES } from '../data/themes';
import type { Theme } from '../types';

interface ThemesSectionProps {
  activeTheme: Theme;
  onSelectTheme: (index: number) => void;
}

const SYNTAX_TOKENS: Array<{ key: keyof Theme['kinds']; label: string }> = [
  { key: 'keyword', label: 'kw' },
  { key: 'string', label: 'str' },
  { key: 'function', label: 'fn' },
  { key: 'type', label: 'ty' },
  { key: 'number', label: 'num' },
];

/**
 * Themes as a browsable editor file: every palette Karan ships.
 * Selecting one re-skins the whole stage live through the existing
 * CSS-variable theme engine, and the choice persists in localStorage
 * (handled in App).
 *
 * Phase 5 (visual parity): the theme CARDS are gone — above all, no row
 * is ever painted in a theme's own background (the bright full-block
 * light-theme card was the worst offender). Each theme is one compact
 * text row in the CURRENT theme's colours: name, DARK/LIGHT as plain
 * text, a few small inline swatch squares (base colours) and the syntax
 * kinds as coloured text tokens, with ACTIVE as a text marker.
 */
export const ThemesSection: React.FC<ThemesSectionProps> = ({ activeTheme, onSelectTheme }) => {
  return (
    <section
      id="themes"
      className="themes-section file-section"
      style={{
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      <div className="section-container">
        <div
          style={{
            fontSize: '11px',
            color: 'var(--dim)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          {'// 07 · THEMES'}
        </div>

        <h2
          style={{
            margin: '0 0 12px 0',
            fontFamily: 'inherit',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--fg)',
            letterSpacing: '0.01em',
            lineHeight: 1.5,
          }}
        >
          Editor <span style={{ color: 'var(--chrome)' }}>themes.</span>
        </h2>

        <p
          style={{
            margin: '0 0 28px 0',
            fontSize: '12.5px',
            color: 'var(--dim)',
            maxWidth: '76ch',
            lineHeight: 1.75,
          }}
        >
          Eight palettes this site ships with. Pick one and the whole editor — wall, buffer and bar —
          re-skins instantly. Your choice is remembered on this device for your next visit.
        </p>

        <div>
          {THEMES.map((t, index) => {
            const isActive = t.name === activeTheme.name;
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => onSelectTheme(index)}
                aria-pressed={isActive}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  flexWrap: 'wrap',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  color: 'var(--fg)',
                  border: 'none',
                  borderBottom: '1px solid color-mix(in srgb, var(--fg) 7%, transparent)',
                  padding: '11px 2px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                }}
              >
                {/* Name + mode as plain text */}
                <span style={{ minWidth: '150px', display: 'inline-flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{ fontWeight: 600, color: isActive ? 'var(--fg)' : 'var(--chrome)' }}>{t.label}</span>
                  <span style={{ fontSize: '9.5px', color: 'var(--dim)', letterSpacing: '0.08em' }}>
                    {t.light ? 'LIGHT' : 'DARK'}
                  </span>
                </span>

                {/* Base swatches — small squares only, never a block */}
                <span style={{ display: 'inline-flex', gap: '5px', alignItems: 'center' }}>
                  {[
                    { c: t.bg, label: 'bg' },
                    { c: t.fg, label: 'fg' },
                    { c: t.accent, label: 'accent' },
                    { c: t.chrome, label: 'chrome' },
                    { c: t.line, label: 'line' },
                  ].map((s) => (
                    <span
                      key={s.label}
                      title={`${s.label} ${s.c}`}
                      style={{
                        width: '11px',
                        height: '11px',
                        background: s.c,
                        border: '1px solid rgba(127,127,127,0.4)',
                        display: 'inline-block',
                      }}
                    />
                  ))}
                </span>

                {/* Syntax kinds as coloured text tokens */}
                <span style={{ display: 'inline-flex', gap: '10px', flexWrap: 'wrap' }}>
                  {SYNTAX_TOKENS.map((chip) => (
                    <span key={chip.key} style={{ fontSize: '10.5px', color: t.kinds[chip.key] }}>
                      {chip.label}
                    </span>
                  ))}
                </span>

                {/* Active marker — text only */}
                {isActive && (
                  <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.08em' }}>
                    ● ACTIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

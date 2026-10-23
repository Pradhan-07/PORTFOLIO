import React, { useEffect, useRef, useState } from 'react';
import { THEMES } from '../data/themes';
import type { Theme } from '../types';
import { GhostTranscript, type GhostBlock } from '../fx/GhostTranscript';
import { echoCmdline } from '../fx/cmdline';

interface ThemesSectionProps {
  activeTheme: Theme;
  onSelectTheme: (index: number) => void;
  active?: boolean;
}

/** Swatch strip colours for a theme, in spec order (§3.7). */
const swatchColors = (t: Theme): Array<{ c: string; label: string }> => [
  { c: t.bg, label: 'bg' },
  { c: t.fg, label: 'fg' },
  { c: t.accent, label: 'accent' },
  { c: t.chrome, label: 'chrome' },
  { c: t.dim, label: 'dim' },
  { c: t.line, label: 'line' },
  { c: t.kinds.keyword, label: 'keyword' },
  { c: t.kinds.string, label: 'string' },
  { c: t.kinds.function, label: 'function' },
  { c: t.kinds.type, label: 'type' },
  { c: t.kinds.number, label: 'number' },
];

/** Full token list for the lightbox: base tokens + every kinds entry. */
const tokenRows = (t: Theme): Array<{ name: string; value: string }> => [
  { name: 'bg', value: t.bg },
  { name: 'fg', value: t.fg },
  { name: 'accent', value: t.accent },
  { name: 'dim', value: t.dim },
  { name: 'chrome', value: t.chrome },
  { name: 'line', value: t.line },
  ...(Object.entries(t.kinds) as Array<[string, string]>).map(([name, value]) => ({
    name: `kinds.${name}`,
    value,
  })),
];

/**
 * Phase 9 (§3.7): themes.ts as a ghost transcript — `fetch themes/`
 * (count + current), then one group `themes/ — 8 themes` whose cards
 * hang on a vertical git-graph rail (● nodes). Each card is a swatch
 * strip in the theme's own colours, its name, a micro factual line
 * and an `[active]` marker. Clicking a card echoes
 * `:colorscheme <name>` into the status-bar cmdline, then applies the
 * theme through the existing App state (persist/apply path). Hover
 * reveals `view large`, opening a lightbox with the enlarged strip
 * and the full token list. No dates, no thumbnails, no stars.
 */
export const ThemesSection: React.FC<ThemesSectionProps> = ({ activeTheme, onSelectTheme, active }) => {
  const effectiveActive = active ?? true;
  const [lightboxTheme, setLightboxTheme] = useState<Theme | null>(null);
  const [hotCard, setHotCard] = useState<string | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lightboxTheme) return;
    lightboxRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setLightboxTheme(null);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [lightboxTheme]);

  const handleSelect = (t: Theme, index: number) => {
    echoCmdline(`:colorscheme ${t.name}`);
    onSelectTheme(index);
  };

  const introOut = (
    <>
      <div style={{ fontSize: '12.5px', color: 'var(--chrome)', marginBottom: '20px' }}>
        <span style={{ color: 'var(--dim)' }}>themes </span>
        <span style={{ color: 'var(--num)' }}>{THEMES.length}</span>
        <span style={{ color: 'var(--dim)' }}> · current </span>
        <span style={{ color: 'var(--fg)' }}>{activeTheme.name}</span>
      </div>

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
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '13px',
          fontWeight: 400,
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
    </>
  );

  const groupOut = (
    <div>
      <div style={{ fontSize: '12.5px', color: 'var(--fg)', marginBottom: '16px' }}>
        themes/ — {THEMES.length} themes
      </div>

      {/* Cards on a vertical git-graph rail */}
      <div style={{ position: 'relative', paddingLeft: '24px' }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '6px',
            top: 0,
            bottom: 0,
            width: '1px',
            background: 'var(--line)',
          }}
        />
        {THEMES.map((t, index) => {
          const isActive = t.name === activeTheme.name;
          const isHot = hotCard === t.name;
          return (
            <div key={t.name} style={{ position: 'relative', marginBottom: '10px' }}>
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '-21px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  color: isActive ? 'var(--accent)' : 'var(--dim)',
                }}
              >
                ●
              </span>
              <div
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onClick={() => handleSelect(t, index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(t, index);
                  }
                }}
                onMouseEnter={() => setHotCard(t.name)}
                onMouseLeave={() => setHotCard((h) => (h === t.name ? null : h))}
                onFocus={() => setHotCard(t.name)}
                onBlur={() => setHotCard((h) => (h === t.name ? null : h))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  flexWrap: 'wrap',
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'left',
                  background: 'none',
                  color: 'var(--fg)',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--line)'}`,
                  padding: '11px 12px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                }}
              >
                {/* Swatch strip in the theme's own colours */}
                <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
                  {swatchColors(t).map((s) => (
                    <span
                      key={s.label}
                      title={`${s.label} ${s.c}`}
                      style={{
                        width: '14px',
                        height: '14px',
                        background: s.c,
                        border: '1px solid rgba(127,127,127,0.4)',
                        display: 'inline-block',
                      }}
                    />
                  ))}
                </span>

                <span style={{ fontWeight: 600, color: isActive ? 'var(--fg)' : 'var(--chrome)' }}>
                  {t.label}
                </span>

                <span style={{ fontSize: '10px', color: 'var(--dim)' }}>
                  bg {t.bg} · accent {t.accent} · {t.light ? 'light' : 'dark'}
                </span>

                {isActive && (
                  <span style={{ fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.06em' }}>
                    [active]
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxTheme(t);
                  }}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                    fontSize: '10px',
                    color: 'var(--chrome)',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    opacity: isHot ? 1 : 0,
                    pointerEvents: isHot ? 'auto' : 'none',
                  }}
                >
                  view large
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const blocks: GhostBlock[] = [
    { id: 'intro', cmd: 'fetch themes/', out: introOut },
    { id: 'group', out: groupOut },
  ];

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
        <GhostTranscript active={effectiveActive} fileBase="themes" blocks={blocks} />
      </div>

      {/* Theme lightbox — enlarged strip + full token list */}
      {lightboxTheme && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${lightboxTheme.name} theme tokens`}
          tabIndex={-1}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxTheme(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: '"IBM Plex Mono", monospace',
            outline: 'none',
          }}
        >
          <div
            style={{
              border: '1px solid var(--line)',
              background: 'var(--bg)',
              padding: '16px 18px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '86vh',
              overflow: 'auto',
              fontSize: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '14px',
                fontSize: '10px',
                color: 'var(--dim)',
                marginBottom: '14px',
              }}
            >
              <span style={{ color: 'var(--fg)', fontSize: '12px' }}>{lightboxTheme.label}</span>
              <span>{lightboxTheme.light ? 'light' : 'dark'}</span>
              <span>esc</span>
              <button
                type="button"
                onClick={() => setLightboxTheme(null)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  fontSize: '10px',
                  color: 'var(--chrome)',
                  cursor: 'pointer',
                }}
              >
                close
              </button>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {swatchColors(lightboxTheme).map((s) => (
                <span
                  key={s.label}
                  title={`${s.label} ${s.c}`}
                  style={{
                    width: '28px',
                    height: '28px',
                    background: s.c,
                    border: '1px solid rgba(127,127,127,0.4)',
                    display: 'inline-block',
                  }}
                />
              ))}
            </div>

            <div>
              {tokenRows(lightboxTheme).map((row) => (
                <div key={row.name} style={{ lineHeight: 1.7 }}>
                  <span style={{ color: 'var(--dim)' }}>{row.name} → </span>
                  <span style={{ color: 'var(--fg)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

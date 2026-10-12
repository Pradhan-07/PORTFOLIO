import React, { useEffect } from 'react';
import type { Theme } from '../types';
import { BrandLogo } from './BrandLogo';
import { PROFILE } from '../data/profile';
import { CodeTickerPanel } from './hancore/CodeTickerPanel';
import { WireframeHandsKeyboard } from './hancore/WireframeHandsKeyboard';

interface LandingScreenProps {
  theme: Theme;
  onEnter: () => void;
  onToggleTheme: () => void;
  isLeaving: boolean;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  theme,
  onEnter,
  onToggleTheme,
  isLeaving,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onEnter();
      } else if (e.key === 't' || e.key === 'T') {
        if (!e.metaKey && !e.ctrlKey) {
          onToggleTheme();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, onToggleTheme]);

  return (
    <div
      className={`landing-stage ${isLeaving ? 'is-leaving' : ''}`}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100svh',
        minHeight: '620px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 36px',
        boxSizing: 'border-box',
        background: '#080908',
        color: 'var(--fg)',
        zIndex: 5,
        fontFamily: '"IBM Plex Mono", monospace',
        transition: 'opacity 300ms ease, filter 300ms ease',
      }}
    >
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
          className="brand"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--fg)',
            fontSize: '12px',
            letterSpacing: '0.1em',
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
        {/* FRAME 06 — LOWER LEFT TAGLINE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--dim)', letterSpacing: '0.04em' }}>
            // building with curiosity.
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
              background: 'var(--fg)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: '2px',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '11.5px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
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

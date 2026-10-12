import React from 'react';
import type { Theme } from '../types';
import { BrandLogo } from './BrandLogo';
import { PROFILE } from '../data/profile';

interface NavigationProps {
  theme: Theme;
  onBackToIntro: () => void;
  onToggleTheme: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  theme,
  onBackToIntro,
  onToggleTheme,
  activeSection,
  onNavigate,
}) => {
  const navItems = [
    { id: 'hero', label: 'whoami' },
    { id: 'about', label: 'about' },
    { id: 'focus', label: 'focus' },
    { id: 'skills', label: 'stack' },
    { id: 'projects', label: 'experiments' },
    { id: 'journey', label: 'journey' },
    { id: 'contact', label: 'contact' },
  ];

  return (
    <header
      className="portfolio-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 36px',
        background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        transition: 'background-color 300ms ease, border-color 300ms ease',
      }}
    >
      {/* Brand logo & back-to-intro link */}
      <button
        type="button"
        onClick={onBackToIntro}
        className="nav-brand"
        title="Return to intro screen (Esc)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'var(--fg)',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '12px',
          letterSpacing: '0.12em',
          cursor: 'pointer',
        }}
      >
        <BrandLogo size={18} />
        <span style={{ fontWeight: 500 }}>{PROFILE.domain}</span>
        <span
          style={{
            fontSize: '9.5px',
            color: 'var(--dim)',
            padding: '1px 5px',
            background: 'var(--line)',
            borderRadius: '2px',
          }}
        >
          intro ↩
        </span>
      </button>

      {/* Center Nav tabs */}
      <nav
        className="nav-links"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '11px',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`nav-tab ${isActive ? 'is-active' : ''}`}
              style={{
                background: isActive ? 'color-mix(in srgb, var(--fg) 10%, transparent)' : 'none',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '2px',
                color: isActive ? 'var(--fg)' : 'var(--dim)',
                cursor: 'pointer',
                letterSpacing: '0.06em',
                transition: 'all 180ms ease',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          type="button"
          onClick={onToggleTheme}
          className="theme-key-nav"
          title="Switch theme (T)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--line)',
            border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
            borderRadius: '2px',
            padding: '5px 10px',
            color: 'var(--chrome)',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'color 180ms ease',
          }}
        >
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>:</span>
          <span>{theme.label}</span>
        </button>

        <a
          href={PROFILE.githubUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="nav-github-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--dim)',
            textDecoration: 'none',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '11px',
            letterSpacing: '0.08em',
            padding: '5px 8px',
            transition: 'color 180ms ease',
          }}
        >
          github ↗
        </a>

        <a
          href={PROFILE.linkedinUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="nav-linkedin-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--dim)',
            textDecoration: 'none',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '11px',
            letterSpacing: '0.08em',
            padding: '5px 8px',
            transition: 'color 180ms ease',
          }}
        >
          linkedin ↗
        </a>
      </div>
    </header>
  );
};

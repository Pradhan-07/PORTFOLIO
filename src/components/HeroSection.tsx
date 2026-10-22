import React from 'react';
import { PROFILE } from '../data/profile';

interface HeroSectionProps {
  onExploreClick: () => void;
}

/**
 * Phase 5 (visual parity): the hero is no longer a marketing block inside
 * the about.tsx buffer — no serif display name, no status pill, no info
 * chips, no filled buttons. It renders as the continuation of the whoami
 * transcript above it: plain token-coloured text lines and text commands.
 * Every string and action from the card version survives verbatim.
 */
export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
  return (
    <section
      id="hero"
      className="hero-section file-section"
      style={{
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      <div className="section-container">
        {/* Status line — plain text, no pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--chrome)',
            letterSpacing: '0.04em',
            marginBottom: '18px',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>●</span>
          <span>{PROFILE.status}</span>
        </div>

        {/* Name — a plain output line, not a display heading */}
        <h1
          style={{
            margin: '0 0 4px 0',
            fontFamily: 'inherit',
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--fg)',
            letterSpacing: '0.01em',
            lineHeight: 1.5,
          }}
        >
          {PROFILE.name}
        </h1>

        {/* Professional Subtitle */}
        <h2
          style={{
            margin: '0 0 10px 0',
            fontFamily: 'inherit',
            fontSize: '12.5px',
            fontWeight: 500,
            color: 'var(--accent)',
            letterSpacing: '0.04em',
          }}
        >
          {PROFILE.subtitle}
        </h2>

        {/* Tagline — text line (serif italic removed from buffers) */}
        <p
          style={{
            margin: '0 0 18px 0',
            fontSize: '12.5px',
            color: 'var(--chrome)',
            lineHeight: 1.6,
          }}
        >
          {PROFILE.tagline}
        </p>

        {/* Introduction Paragraph */}
        <p
          style={{
            margin: '0 0 28px 0',
            fontSize: '12.5px',
            lineHeight: 1.75,
            color: 'color-mix(in srgb, var(--fg) 82%, transparent)',
            maxWidth: '76ch',
          }}
        >
          {PROFILE.heroDescription}
        </p>

        {/* Technical status — plain label:value text tokens, no chips */}
        <div
          style={{
            display: 'flex',
            gap: '8px 24px',
            flexWrap: 'wrap',
            fontSize: '11px',
            marginBottom: '28px',
            color: 'var(--dim)',
          }}
        >
          <span>
            <span style={{ color: 'var(--chrome)' }}>PRIMARY:</span>{' '}
            <span style={{ color: 'var(--fg)' }}>C++ (DSA & Algorithms)</span>
          </span>
          <span>
            <span style={{ color: 'var(--chrome)' }}>INTERESTS:</span>{' '}
            <span style={{ color: 'var(--fg)' }}>AI/ML & Web Development</span>
          </span>
          <span>
            <span style={{ color: 'var(--chrome)' }}>MODE:</span>{' '}
            <span style={{ color: 'var(--accent)' }}>BUILDING WITH CURIOSITY</span>
          </span>
        </div>

        {/* Actions — text commands, no filled/outline button boxes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap', fontSize: '12px' }}>
          <button
            type="button"
            onClick={onExploreClick}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--accent)',
              font: 'inherit',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            &gt; explore my work ↵
          </button>

          <a
            href={PROFILE.githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              color: 'var(--chrome)',
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            github ↗
          </a>
        </div>
      </div>
    </section>
  );
};

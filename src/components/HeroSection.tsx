import React from 'react';
import { PROFILE } from '../data/profile';

interface HeroSectionProps {
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
  return (
    <section
      id="hero"
      className="hero-section"
      style={{
        padding: '72px 0 64px 0',
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
      }}
    >
      <div className="section-container" style={{ maxWidth: '920px', margin: '0 auto', padding: '0 24px' }}>
        {/* Terminal Header Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '11px',
            color: 'var(--dim)',
            letterSpacing: '0.08em',
            marginBottom: '20px',
            background: 'var(--line)',
            padding: '4px 10px',
            borderRadius: '2px',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>●</span>
          <span>{PROFILE.status}</span>
        </div>

        {/* Big Expressive Heading with Serif Flair */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 'clamp(3rem, 7vw, 4.8rem)',
              fontWeight: 400,
              color: 'var(--fg)',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            {PROFILE.name}
          </h1>
        </div>

        {/* Professional Subtitle */}
        <h2
          style={{
            margin: '0 0 12px 0',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 'clamp(14px, 2.8vw, 17px)',
            fontWeight: 500,
            color: 'var(--accent)',
            letterSpacing: '0.04em',
          }}
        >
          {PROFILE.subtitle}
        </h2>

        {/* Main Tagline */}
        <p
          style={{
            margin: '0 0 20px 0',
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 'clamp(1.25rem, 2.8vw, 1.7rem)',
            color: 'var(--chrome)',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}
        >
          {PROFILE.tagline}
        </p>

        {/* Introduction Paragraph */}
        <p
          style={{
            margin: '0 0 36px 0',
            fontFamily: '"Archivo", sans-serif',
            fontSize: 'clamp(15px, 2.2vw, 17px)',
            lineHeight: 1.7,
            color: 'color-mix(in srgb, var(--fg) 85%, transparent)',
            maxWidth: '740px',
            fontWeight: 350,
          }}
        >
          {PROFILE.heroDescription}
        </p>

        {/* Technical Status Row */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '11px',
            marginBottom: '36px',
            color: 'var(--dim)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--line)', padding: '6px 12px', borderRadius: '2px' }}>
            <span style={{ color: 'var(--chrome)' }}>PRIMARY:</span>
            <span style={{ color: 'var(--fg)' }}>C++ (DSA & Algorithms)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--line)', padding: '6px 12px', borderRadius: '2px' }}>
            <span style={{ color: 'var(--chrome)' }}>INTERESTS:</span>
            <span style={{ color: 'var(--fg)' }}>AI/ML & Web Development</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--line)', padding: '6px 12px', borderRadius: '2px' }}>
            <span style={{ color: 'var(--chrome)' }}>MODE:</span>
            <span style={{ color: 'var(--accent)' }}>BUILDING WITH CURIOSITY</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onExploreClick}
            className="primary-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 22px',
              background: 'var(--fg)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: '2px',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'transform 180ms ease, filter 180ms ease',
            }}
          >
            <span>Explore my work</span>
            <span>↓</span>
          </button>

          <a
            href={PROFILE.githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="secondary-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 20px',
              background: 'transparent',
              color: 'var(--fg)',
              border: '1px solid color-mix(in srgb, var(--fg) 20%, transparent)',
              borderRadius: '2px',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '12px',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              transition: 'background-color 180ms ease, border-color 180ms ease',
            }}
          >
            <span>GitHub</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
};

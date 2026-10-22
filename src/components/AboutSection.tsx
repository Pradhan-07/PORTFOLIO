import React from 'react';
import { PROFILE } from '../data/profile';

export const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="about-section file-section"
      style={{
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
      }}
    >
      <div className="section-container">
        {/* Section Label */}
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
          // 01 · ABOUT
        </div>

        {/* Section Heading */}
        <h2
          style={{
            margin: '0 0 36px 0',
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
            fontWeight: 400,
            color: 'var(--fg)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          A little <span style={{ fontStyle: 'italic', color: 'var(--chrome)' }}>about me.</span>
        </h2>

        {/* Editorial Text Blocks */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            fontFamily: '"Archivo", sans-serif',
            fontSize: '16px',
            lineHeight: 1.8,
            color: 'color-mix(in srgb, var(--fg) 85%, transparent)',
            fontWeight: 350,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ margin: 0 }}>
              {PROFILE.aboutParagraphs[0]}
            </p>
            <p style={{ margin: 0 }}>
              {PROFILE.aboutParagraphs[1]}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <p style={{ margin: 0 }}>
              {PROFILE.aboutParagraphs[2]}
            </p>

            {/* Engineering Principles Card */}
            <div
              style={{
                marginTop: 'auto',
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '3px',
                padding: '20px',
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '11.5px',
                lineHeight: 1.7,
              }}
            >
              <div style={{ color: 'var(--chrome)', marginBottom: '8px', fontWeight: 500, letterSpacing: '0.06em' }}>
                // CORE LEARNING PRINCIPLES
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--dim)' }}>
                <li>Depth in fundamentals over shallow breadth</li>
                <li>Algorithmic thinking tested with code implementation</li>
                <li>Active exploration: learn by building real projects</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

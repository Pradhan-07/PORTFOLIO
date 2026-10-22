import React from 'react';
import { PROFILE } from '../data/profile';

/**
 * Phase 5 (visual parity): the About block inside about.tsx is bare text —
 * the two-column editorial grid and the principles CARD are gone. The
 * three paragraphs stack as transcript text and the principles render as
 * comment/dash lines. All copy is verbatim from the card version.
 */
export const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="about-section file-section"
      style={{
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      <div className="section-container">
        {/* Section Label */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--dim)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          // 01 · ABOUT
        </div>

        {/* Section heading — a plain text line now, no serif display type */}
        <h2
          style={{
            margin: '0 0 24px 0',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--fg)',
            letterSpacing: '0.01em',
            lineHeight: 1.5,
          }}
        >
          A little <span style={{ color: 'var(--chrome)' }}>about me.</span>
        </h2>

        {/* Paragraphs — single-column transcript text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            fontSize: '12.5px',
            lineHeight: 1.75,
            color: 'color-mix(in srgb, var(--fg) 82%, transparent)',
            maxWidth: '76ch',
            marginBottom: '28px',
          }}
        >
          <p style={{ margin: 0 }}>{PROFILE.aboutParagraphs[0]}</p>
          <p style={{ margin: 0 }}>{PROFILE.aboutParagraphs[1]}</p>
          <p style={{ margin: 0 }}>{PROFILE.aboutParagraphs[2]}</p>
        </div>

        {/* Core learning principles — comment line + dash lines, no card */}
        <div style={{ fontSize: '12px', lineHeight: 1.8 }}>
          <div style={{ color: 'var(--chrome)', letterSpacing: '0.06em', marginBottom: '4px' }}>
            // CORE LEARNING PRINCIPLES
          </div>
          <div style={{ color: 'color-mix(in srgb, var(--fg) 78%, transparent)' }}>
            <div>
              <span style={{ color: 'var(--dim)' }}>- </span>Depth in fundamentals over shallow breadth
            </div>
            <div>
              <span style={{ color: 'var(--dim)' }}>- </span>Algorithmic thinking tested with code implementation
            </div>
            <div>
              <span style={{ color: 'var(--dim)' }}>- </span>Active exploration: learn by building real projects
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

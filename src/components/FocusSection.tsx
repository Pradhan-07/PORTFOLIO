import React from 'react';
import { FOCUS_AREAS } from '../data/profile';

/**
 * Phase 5 (visual parity): the three focus CARDS are now text entries in
 * the buffer — a numbered title line, the status as plain text (no pill
 * badge, per the comparison notes), subtitle/description as transcript
 * text, and topics as one `·`-joined line instead of tag chips. Entries
 * are separated by hairlines only. All copy is verbatim.
 */
export const FocusSection: React.FC = () => {
  return (
    <section
      id="focus"
      className="focus-section file-section"
      style={{
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      <div className="section-container">
        {/* Section Header */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--dim)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          // 02 · DIRECTION
        </div>
        <h2
          style={{
            margin: '0 0 10px 0',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--fg)',
            letterSpacing: '0.01em',
            lineHeight: 1.5,
          }}
        >
          Current <span style={{ color: 'var(--chrome)' }}>focus areas.</span>
        </h2>
        <p
          style={{
            margin: '0 0 28px 0',
            fontSize: '11.5px',
            color: 'var(--dim)',
            maxWidth: '76ch',
            lineHeight: 1.7,
          }}
        >
          Actively exploring these technical areas during my second year of computer science engineering.
        </p>

        {/* Focus entries — text blocks separated by hairlines */}
        <div>
          {FOCUS_AREAS.map((area, idx) => (
            <div
              key={area.id}
              style={{
                padding: '20px 0',
                borderTop: idx === 0 ? 'none' : '1px solid color-mix(in srgb, var(--fg) 7%, transparent)',
              }}
            >
              {/* Index · Title · Status (plain text, no badge) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '6px',
                  fontSize: '12.5px',
                }}
              >
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{area.number}</span>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--fg)',
                    letterSpacing: '0.01em',
                  }}
                >
                  {area.title}
                </h3>
                <span style={{ color: 'var(--dim)', fontSize: '10.5px', letterSpacing: '0.04em' }}>
                  {area.status}
                </span>
              </div>

              {/* Subtitle */}
              <p
                style={{
                  margin: '0 0 10px 0',
                  fontSize: '11.5px',
                  color: 'var(--chrome)',
                  lineHeight: 1.6,
                }}
              >
                {area.subtitle}
              </p>

              {/* Description */}
              <p
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '12.5px',
                  lineHeight: 1.75,
                  color: 'color-mix(in srgb, var(--fg) 80%, transparent)',
                  maxWidth: '76ch',
                }}
              >
                {area.description}
              </p>

              {/* Topics — one joined text line, no chips */}
              <div style={{ fontSize: '11px', color: 'var(--dim)', lineHeight: 1.7 }}>
                <span style={{ color: 'var(--chrome)' }}>topics:</span> {area.topics.join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

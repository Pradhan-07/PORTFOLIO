import React from 'react';
import { FOCUS_AREAS } from '../data/profile';

export const FocusSection: React.FC = () => {
  return (
    <section
      id="focus"
      className="focus-section file-section"
      style={{
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
      }}
    >
      <div className="section-container">
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '36px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '11px',
                color: 'var(--dim)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              // 02 · DIRECTION
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
                fontWeight: 400,
                color: 'var(--fg)',
                letterSpacing: '-0.02em',
              }}
            >
              Current <span style={{ fontStyle: 'italic', color: 'var(--chrome)' }}>focus areas.</span>
            </h2>
          </div>

          <p
            style={{
              margin: 0,
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '11px',
              color: 'var(--dim)',
              maxWidth: '320px',
              lineHeight: 1.6,
            }}
          >
            Actively exploring these technical areas during my second year of computer science engineering.
          </p>
        </div>

        {/* 3 Editorial Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '20px',
          }}
        >
          {FOCUS_AREAS.map((area) => (
            <div
              key={area.id}
              className="focus-card"
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '3px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 200ms ease, transform 200ms ease',
              }}
            >
              <div>
                {/* Index & Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{area.number}</span>
                  <span
                    style={{
                      color: 'var(--dim)',
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: 'color-mix(in srgb, var(--bg) 60%, transparent)',
                      borderRadius: '2px',
                    }}
                  >
                    {area.status}
                  </span>
                </div>

                {/* Title */}
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    fontFamily: '"Archivo", sans-serif',
                    fontSize: '17px',
                    fontWeight: 600,
                    color: 'var(--fg)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {area.title}
                </h3>

                {/* Subtitle */}
                <p
                  style={{
                    margin: '0 0 16px 0',
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '11px',
                    color: 'var(--chrome)',
                    lineHeight: 1.5,
                  }}
                >
                  {area.subtitle}
                </p>

                {/* Description */}
                <p
                  style={{
                    margin: '0 0 20px 0',
                    fontFamily: '"Archivo", sans-serif',
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    color: 'color-mix(in srgb, var(--fg) 75%, transparent)',
                    fontWeight: 350,
                  }}
                >
                  {area.description}
                </p>
              </div>

              {/* Topics Tag List */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  borderTop: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
                  paddingTop: '16px',
                }}
              >
                {area.topics.map((topic, i) => (
                  <span
                    key={i}
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '10px',
                      color: 'var(--dim)',
                      background: 'color-mix(in srgb, var(--bg) 50%, transparent)',
                      padding: '3px 7px',
                      borderRadius: '2px',
                    }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

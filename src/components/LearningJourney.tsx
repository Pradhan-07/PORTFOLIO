import React from 'react';
import { LEARNING_JOURNEY } from '../data/profile';

export const LearningJourney: React.FC = () => {
  return (
    <section
      id="journey"
      className="journey-section"
      style={{
        padding: '72px 0',
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
      }}
    >
      <div className="section-container" style={{ maxWidth: '920px', margin: '0 auto', padding: '0 24px' }}>
        {/* Section Header */}
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
          // 05 · ENGINEERING LOG
        </div>

        <h2
          style={{
            margin: '0 0 16px 0',
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
            fontWeight: 400,
            color: 'var(--fg)',
            letterSpacing: '-0.02em',
          }}
        >
          Currently in <span style={{ fontStyle: 'italic', color: 'var(--chrome)' }}>progress.</span>
        </h2>

        <p
          style={{
            margin: '0 0 36px 0',
            fontFamily: '"Archivo", sans-serif',
            fontSize: '15px',
            color: 'var(--dim)',
            maxWidth: '680px',
            lineHeight: 1.6,
          }}
        >
          An ongoing log of study notes and active engineering endeavors as a second-year computer science engineering student.
        </p>

        {/* Notebook Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {LEARNING_JOURNEY.map((item, idx) => (
            <div
              key={item.id}
              className="journey-entry"
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '3px',
                padding: '24px 26px',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: '24px',
                alignItems: 'baseline',
                transition: 'border-color 180ms ease',
              }}
            >
              {/* Left Index */}
              <div
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '12px',
                  color: 'var(--dim)',
                  minWidth: '32px',
                }}
              >
                0{idx + 1}
              </div>

              {/* Middle Title & Description */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: '"Archivo", sans-serif',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--fg)',
                    }}
                  >
                    {item.title}
                  </h3>

                  <span
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '10px',
                      color: 'var(--chrome)',
                      background: 'color-mix(in srgb, var(--bg) 60%, transparent)',
                      padding: '2px 7px',
                      borderRadius: '2px',
                    }}
                  >
                    {item.tag}
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontFamily: '"Archivo", sans-serif',
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    color: 'color-mix(in srgb, var(--fg) 75%, transparent)',
                    fontWeight: 350,
                  }}
                >
                  {item.notes}
                </p>
              </div>

              {/* Right Status Badge */}
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '10px',
                    color: 'var(--accent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                    padding: '3px 8px',
                    borderRadius: '2px',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.04em',
                  }}
                >
                  ● {item.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

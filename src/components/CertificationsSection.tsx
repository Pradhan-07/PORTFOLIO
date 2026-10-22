import React from 'react';
import { CERTIFICATIONS } from '../data/profile';

export const CertificationsSection: React.FC = () => {
  return (
    <section
      id="certifications"
      className="certifications-section file-section"
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
          {'// CREDENTIALS · CERTIFICATIONS'}
        </div>

        {/* Section Heading */}
        <h2
          style={{
            margin: '0 0 16px 0',
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
            fontWeight: 400,
            color: 'var(--fg)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Certified on <span style={{ fontStyle: 'italic', color: 'var(--chrome)' }}>Hedera.</span>
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
          Industry certifications earned alongside my degree — distributed ledger fundamentals and
          Hedera development, issued by the Hashgraph Association.
        </p>

        {/* Certification Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {CERTIFICATIONS.map((cert) => (
            <div
              key={cert.id}
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '3px',
                padding: '22px',
                fontFamily: '"IBM Plex Mono", monospace',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: '#66cc6a',
                    border: '1px solid color-mix(in srgb, #66cc6a 40%, transparent)',
                    background: 'color-mix(in srgb, #66cc6a 10%, transparent)',
                    padding: '2px 8px',
                    borderRadius: '2px',
                  }}
                >
                  {cert.credential}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--dim)' }}>{cert.issued}</span>
              </div>

              <div
                style={{
                  fontFamily: '"Archivo", sans-serif',
                  fontSize: '16.5px',
                  fontWeight: 600,
                  color: 'var(--fg)',
                  lineHeight: 1.4,
                  marginBottom: '8px',
                }}
              >
                {cert.name}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--dim)', letterSpacing: '0.04em' }}>
                ISSUER: <span style={{ color: 'var(--chrome)' }}>{cert.issuer}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

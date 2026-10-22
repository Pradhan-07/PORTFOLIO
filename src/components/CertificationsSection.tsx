import React from 'react';
import { CERTIFICATIONS } from '../data/profile';

/**
 * Phase 5 (visual parity): certifications.md entries are text blocks —
 * the credential chip and cards are gone. Credential renders as plain
 * green text, issuer/issued as a meta line. All data verbatim.
 */
export const CertificationsSection: React.FC = () => {
  return (
    <section
      id="certifications"
      className="certifications-section file-section"
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
          {'// CREDENTIALS · CERTIFICATIONS'}
        </div>

        {/* Section heading — plain text line, no serif */}
        <h2
          style={{
            margin: '0 0 12px 0',
            fontFamily: 'inherit',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--fg)',
            letterSpacing: '0.01em',
            lineHeight: 1.5,
          }}
        >
          Certified on <span style={{ color: 'var(--chrome)' }}>Hedera.</span>
        </h2>

        <p
          style={{
            margin: '0 0 28px 0',
            fontSize: '12.5px',
            color: 'var(--dim)',
            maxWidth: '76ch',
            lineHeight: 1.75,
          }}
        >
          Industry certifications earned alongside my degree — distributed ledger fundamentals and
          Hedera development, issued by the Hashgraph Association.
        </p>

        {/* Certification entries — text blocks separated by hairlines */}
        <div>
          {CERTIFICATIONS.map((cert, idx) => (
            <div
              key={cert.id}
              style={{
                padding: '16px 0',
                borderTop: idx === 0 ? 'none' : '1px solid color-mix(in srgb, var(--fg) 7%, transparent)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '5px',
                }}
              >
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: '#66cc6a',
                  }}
                >
                  {cert.credential}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)', lineHeight: 1.5 }}>
                  {cert.name}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--dim)', letterSpacing: '0.04em' }}>
                ISSUER: <span style={{ color: 'var(--chrome)' }}>{cert.issuer}</span>
                {' · '}ISSUED: <span style={{ color: 'var(--chrome)' }}>{cert.issued}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

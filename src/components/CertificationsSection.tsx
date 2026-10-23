import React from 'react';
import { CERTIFICATIONS } from '../data/profile';
import { GhostTranscript, type GhostBlock } from '../fx/GhostTranscript';

/**
 * CertificationsSection (DESIGN-SPEC §3.2) — the certifications buffer
 * as a ghost transcript: cmdline `:e certifications`, then an intro
 * block (`ls certifications/`) whose output is the existing label,
 * heading and intro copy verbatim, then one block per certification —
 * name in --fg, the credential id in --kw, and dim label rows
 * `issuer <…>` · `issued <…>` · `credential <…>`, hairline-separated
 * as before. No badges, no logos. `active` comes from the Dashboard
 * wiring (Step 2+); undefined renders fully (the ghost run keys off
 * the effective value).
 */
export const CertificationsSection: React.FC<{ active?: boolean }> = ({ active }) => {
  const effectiveActive = active ?? true;

  const introOut = (
    <>
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
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '13px',
          fontWeight: 400,
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
    </>
  );

  const blocks: GhostBlock[] = [
    { id: 'certifications-intro', cmd: 'ls certifications/', out: introOut },
    ...CERTIFICATIONS.map((cert, idx) => ({
      id: cert.id,
      out: (
        <div
          style={{
            padding: '16px 0',
            borderTop:
              idx === 0
                ? 'none'
                : '1px solid color-mix(in srgb, var(--fg) 7%, transparent)',
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
                color: 'var(--kw)',
              }}
            >
              {cert.credential}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)', lineHeight: 1.5 }}>
              {cert.name}
            </span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--dim)', letterSpacing: '0.04em' }}>
            issuer <span style={{ color: 'var(--chrome)' }}>{cert.issuer}</span>
            {' · '}issued <span style={{ color: 'var(--chrome)' }}>{cert.issued}</span>
            {' · '}credential <span style={{ color: 'var(--kw)' }}>{cert.credential}</span>
          </div>
        </div>
      ),
    })),
  ];

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
        <GhostTranscript active={effectiveActive} fileBase="certifications" blocks={blocks} />
      </div>
    </section>
  );
};

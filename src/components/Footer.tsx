import React from 'react';
import { PROFILE } from '../data/profile';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onBackToTop: () => void;
  onBackToIntro: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onBackToTop, onBackToIntro }) => {
  return (
    <footer
      className="portfolio-footer"
      style={{
        padding: '52px 0 68px 0',
        background: 'color-mix(in srgb, var(--bg) 95%, transparent)',
        borderTop: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '11.5px',
        color: 'var(--dim)',
      }}
    >
      <div
        className="section-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Top Footer Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Identity & Status */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <button
                type="button"
                onClick={onBackToIntro}
                title="Return to landing screen"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--fg)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  font: 'inherit',
                }}
              >
                <BrandLogo size={16} />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{PROFILE.name}</span>
              </button>
            </div>

            <div style={{ color: 'var(--chrome)', fontSize: '11px', marginBottom: '4px' }}>
              {PROFILE.footerRole}
            </div>

            <div style={{ color: 'var(--dim)', fontSize: '11px' }}>
              {PROFILE.footerNote}
            </div>
          </div>

          {/* Working Links & Back to Top */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <a
              href={PROFILE.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              style={{
                color: 'var(--chrome)',
                textDecoration: 'none',
                letterSpacing: '0.04em',
                transition: 'color 180ms ease',
              }}
            >
              GitHub ↗
            </a>

            <a
              href={PROFILE.linkedinUrl}
              target="_blank"
              rel="noreferrer noopener"
              style={{
                color: 'var(--chrome)',
                textDecoration: 'none',
                letterSpacing: '0.04em',
                transition: 'color 180ms ease',
              }}
            >
              LinkedIn ↗
            </a>

            <a
              href={`mailto:${PROFILE.email}`}
              style={{
                color: 'var(--chrome)',
                textDecoration: 'none',
                letterSpacing: '0.04em',
                transition: 'color 180ms ease',
              }}
            >
              Email ↗
            </a>

            <button
              type="button"
              onClick={onBackToTop}
              title="Scroll to top"
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '2px',
                color: 'var(--chrome)',
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '11px',
                padding: '5px 12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 180ms ease',
              }}
            >
              <span>top</span>
              <span>↑</span>
            </button>
          </div>
        </div>

        {/* Bottom Sub-note */}
        <div
          style={{
            borderTop: '1px solid color-mix(in srgb, var(--fg) 6%, transparent)',
            paddingTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: 'var(--dim)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span>karan.dev · engineering in progress</span>
          <span>VIT-AP University · Computer Science Engineering</span>
        </div>
      </div>
    </footer>
  );
};

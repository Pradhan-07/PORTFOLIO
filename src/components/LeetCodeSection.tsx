import React from 'react';
import { PROFILE } from '../data/profile';

export const LeetCodeSection: React.FC = () => {
  return (
    <section
      id="leetcode"
      className="leetcode-section"
      style={{
        padding: '72px 0',
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
      }}
    >
      <div className="section-container" style={{ maxWidth: '920px', margin: '0 auto', padding: '0 24px' }}>
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
          {'// LEETCODE · DSA PRACTICE LOG'}
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
          LeetCode, in <span style={{ fontStyle: 'italic', color: 'var(--chrome)' }}>C++.</span>
        </h2>

        {/* Verified solved summary */}
        <p
          style={{
            margin: '0 0 28px 0',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '13px',
            color: 'var(--fg)',
            letterSpacing: '0.04em',
          }}
        >
          29 solved · Easy 12 · Medium 15 · Hard 2 · C++
        </p>

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
          Daily algorithmic practice in C++ — arrays, two pointers, backtracking and beyond.
          Mediums outnumber Easies: fewer, harder problems over padded counts.
        </p>

        {/* Live LeetCode Card */}
        <div
          style={{
            background: 'var(--line)',
            border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
            borderRadius: '3px',
            padding: '20px',
            fontFamily: '"IBM Plex Mono", monospace',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
              paddingBottom: '10px',
              marginBottom: '16px',
              fontSize: '11px',
              color: 'var(--chrome)',
            }}
          >
            <span>~/leetcode/{PROFILE.leetcodeDisplay}</span>
            <a
              href={PROFILE.leetcodeUrl}
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
            >
              leetcode.com/u/pradhan_07 ↗
            </a>
          </div>

          <a
            href={PROFILE.leetcodeUrl}
            target="_blank"
            rel="noreferrer noopener"
            style={{ display: 'block' }}
          >
            <img
              src="https://leetcard.jacoblin.cool/pradhan_07?theme=dark&ext=heatmap"
              alt="Karan Kumar Pradhan LeetCode stats and submission heatmap (pradhan_07)"
              style={{
                width: '100%',
                maxWidth: '640px',
                height: 'auto',
                display: 'block',
                margin: '0 auto',
                borderRadius: '2px',
              }}
            />
          </a>
        </div>
      </div>
    </section>
  );
};

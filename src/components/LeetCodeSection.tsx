import React from 'react';
import { PROFILE } from '../data/profile';

/**
 * Phase 5 (visual parity): leetcode.tsx is bare text — the framed card
 * around the stats image is gone. The path line and profile link render
 * as plain text above the (frameless) LeetCode card image. All copy and
 * the verified solved line are verbatim.
 */
export const LeetCodeSection: React.FC = () => {
  return (
    <section
      id="leetcode"
      className="leetcode-section file-section"
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
          {'// LEETCODE · DSA PRACTICE LOG'}
        </div>

        {/* Section heading — plain text line, no serif */}
        <h2
          style={{
            margin: '0 0 12px 0',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--fg)',
            letterSpacing: '0.01em',
            lineHeight: 1.5,
          }}
        >
          LeetCode, in <span style={{ color: 'var(--chrome)' }}>C++.</span>
        </h2>

        {/* Verified solved summary */}
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '12.5px',
            color: 'var(--fg)',
            letterSpacing: '0.04em',
          }}
        >
          29 solved · Easy 12 · Medium 15 · Hard 2 · C++
        </p>

        <p
          style={{
            margin: '0 0 32px 0',
            fontSize: '12.5px',
            color: 'var(--dim)',
            maxWidth: '76ch',
            lineHeight: 1.75,
          }}
        >
          Daily algorithmic practice in C++ — arrays, two pointers, backtracking and beyond.
          Mediums outnumber Easies: fewer, harder problems over padded counts.
        </p>

        {/* LeetCode card — path line as text, image frameless */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '14px',
              fontSize: '11px',
              color: 'var(--dim)',
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
              }}
            />
          </a>
        </div>
      </div>
    </section>
  );
};

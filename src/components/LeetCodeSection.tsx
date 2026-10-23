import React, { useEffect, useState } from 'react';
import { PROFILE } from '../data/profile';
import { GhostTranscript, type GhostBlock } from '../fx/GhostTranscript';
import { fmtInt } from '../lib/format';

interface LeetCodeData {
  solved: { all: number; easy: number; medium: number; hard: number };
  calendar?: { streak?: number };
  ranking?: number;
}

type LeetState = LeetCodeData | null | 'error';

/**
 * Phase 9 (§3.6): leetcode.tsx as a ghost transcript — `fetch
 * leetcode` prints stat rows from public/data/leetcode.json (solved
 * with the easy/medium/hard sub-line, language, rank and streak only
 * when present), then `ls card/` shows the LeetCard image inside a
 * hairline framed shot panel. If the fetch fails, the verified solved
 * line renders verbatim — it is pinned content, not fabrication.
 */
export const LeetCodeSection: React.FC<{ active?: boolean }> = ({ active }) => {
  const effectiveActive = active ?? true;
  const [data, setData] = useState<LeetState>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/leetcode.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((json: LeetCodeData | null) => {
        if (cancelled) return;
        setData(json && json.solved ? json : 'error');
      })
      .catch(() => {
        if (!cancelled) setData('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const statRow = (label: string, value: React.ReactNode) => (
    <div>
      <span style={{ color: 'var(--dim)' }}>{label} </span>
      <span style={{ color: 'var(--chrome)' }}>{value}</span>
    </div>
  );

  const fetchOut = (
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
        {'// LEETCODE · DSA PRACTICE LOG'}
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
        LeetCode, in <span style={{ color: 'var(--chrome)' }}>C++.</span>
      </h2>

      {data !== null && data !== 'error' ? (
        <div style={{ fontSize: '12.5px', lineHeight: 1.75, marginBottom: '20px' }}>
          {statRow('solved', <span style={{ color: 'var(--num)' }}>{data.solved.all}</span>)}
          <div style={{ fontSize: '11px', color: 'var(--dim)' }}>
            easy {data.solved.easy} · medium {data.solved.medium} · hard {data.solved.hard}
          </div>
          {statRow('language', PROFILE.primaryLanguage)}
          {typeof data.ranking === 'number' &&
            statRow('rank', <span style={{ color: 'var(--num)' }}>{fmtInt(data.ranking)}</span>)}
          {typeof data.calendar?.streak === 'number' &&
            statRow('streak', <span style={{ color: 'var(--num)' }}>{data.calendar.streak}</span>)}
        </div>
      ) : data === 'error' ? (
        /* Verified solved summary — pinned content */
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
      ) : null}

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
    </>
  );

  const cardOut = (
    <div>
      <div
        style={{
          fontSize: '10px',
          color: 'var(--dim)',
          marginBottom: '10px',
          letterSpacing: '0.04em',
        }}
      >
        leetcode · card
      </div>
      <div style={{ border: '1px solid var(--line)', padding: '14px' }}>
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
  );

  const blocks: GhostBlock[] = [
    { id: 'fetch', cmd: 'fetch leetcode', out: fetchOut },
    { id: 'card', cmd: 'ls card/', out: cardOut },
  ];

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
        <GhostTranscript active={effectiveActive} fileBase="leetcode" blocks={blocks} />
      </div>
    </section>
  );
};

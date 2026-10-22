import React, { useEffect, useState } from 'react';
import { LEARNING_LOG } from '../data/learningLog';

/**
 * Real activity dates for the log entries (Comparison Round 1, §7.6).
 * LEARNING_LOG's `updatedAt` fields are cadence phrases ("Daily
 * consistency"), not dates — so each entry's date is derived from the
 * Phase-3 GitHub snapshot: the latest real `pushedAt` month among the
 * repos that represent the entry's category. Nothing is invented: if
 * the snapshot is unavailable, no date is rendered at all.
 */
const CATEGORY_REPOS: Record<string, string[]> = {
  dsa: ['DSA_CPP', 'leetcode_question_answer', 'DSA'],
  'ai-ml': ['study_detection', 'magic_hand', 'meme_gesture', 'SMOKE'],
  web: ['PORTFOLIO', 'indstate', 'Clientele', 'Resolutions_Tracker'],
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface SnapshotRepo {
  name: string;
  pushedAt: string;
}

const useActivityMonths = (): Record<string, string> => {
  const [months, setMonths] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    fetch('/data/github-snapshot.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { repos?: SnapshotRepo[] } | null) => {
        if (cancelled || !data?.repos) return;
        const byRepo = new Map(data.repos.map((r) => [r.name, r.pushedAt]));
        const out: Record<string, string> = {};
        for (const [category, repos] of Object.entries(CATEGORY_REPOS)) {
          let latest = '';
          for (const name of repos) {
            const pushed = byRepo.get(name);
            if (pushed && pushed > latest) latest = pushed;
          }
          if (latest) {
            const d = new Date(latest);
            if (!Number.isNaN(d.getTime())) {
              out[category] = `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
            }
          }
        }
        setMonths(out);
      })
      .catch(() => {
        // Snapshot unavailable — entries simply render without a date.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return months;
};

/**
 * Phase 5 (visual parity): journey.log entries are log lines, not cards —
 * no fills, borders or status badges. Each entry is a numbered text block
 * (title, meta line, description, topics as one joined line, status as
 * plain coloured text) separated by hairlines. The snapshot-derived
 * activity month logic above is untouched.
 */
export const LearningJourney: React.FC = () => {
  const activityMonths = useActivityMonths();
  return (
    <section
      id="journey"
      className="journey-section file-section"
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
          // 05 · ENGINEERING LEARNING LOG
        </div>

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
          Currently in <span style={{ color: 'var(--chrome)' }}>progress.</span>
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
          An ongoing log of study notes, algorithmic practice, and active software projects as a second-year computer science engineering student.
        </p>

        {/* Log entries — text blocks separated by hairlines */}
        <div>
          {LEARNING_LOG.map((item, idx) => (
            <div
              key={item.id}
              className="journey-entry"
              style={{
                padding: '20px 0',
                borderTop: idx === 0 ? 'none' : '1px solid color-mix(in srgb, var(--fg) 7%, transparent)',
              }}
            >
              {/* Title line: index · title · status as plain text */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--dim)' }}>0{idx + 1}</span>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--fg)',
                  }}
                >
                  {item.title}
                </h3>
                <span
                  style={{
                    fontSize: '10.5px',
                    color: item.status === 'Practicing' ? '#66cc6a' : 'var(--accent)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.04em',
                  }}
                >
                  ● {item.status.toUpperCase()}
                </span>
              </div>

              {/* Meta line: tag · domain · cadence · snapshot activity month */}
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--dim)',
                  marginBottom: '10px',
                  lineHeight: 1.7,
                }}
              >
                <span style={{ color: 'var(--chrome)' }}>{item.tag}</span>
                {' · '}
                {item.domain} · {item.updatedAt}
                {activityMonths[item.category]
                  ? ` · activity ${activityMonths[item.category]}`
                  : ''}
              </div>

              <p
                style={{
                  margin: '0 0 10px 0',
                  fontSize: '12.5px',
                  lineHeight: 1.75,
                  color: 'color-mix(in srgb, var(--fg) 80%, transparent)',
                  maxWidth: '76ch',
                }}
              >
                {item.description}
              </p>

              {/* Key topics — one joined text line, no chips */}
              <div style={{ fontSize: '11px', color: 'var(--dim)', lineHeight: 1.7 }}>
                <span style={{ color: 'var(--chrome)' }}>topics:</span> {item.keyTopics.join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

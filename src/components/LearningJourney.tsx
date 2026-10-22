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

export const LearningJourney: React.FC = () => {
  const activityMonths = useActivityMonths();
  return (
    <section
      id="journey"
      className="journey-section file-section"
      style={{
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
      }}
    >
      <div className="section-container">
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
          // 05 · ENGINEERING LEARNING LOG
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
          An ongoing log of study notes, algorithmic practice, and active software projects as a second-year computer science engineering student.
        </p>

        {/* Notebook Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {LEARNING_LOG.map((item, idx) => (
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

                <div
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '11px',
                    color: 'var(--dim)',
                    marginBottom: '8px',
                  }}
                >
                  {item.domain} · {item.updatedAt}
                  {activityMonths[item.category]
                    ? ` · activity ${activityMonths[item.category]}`
                    : ''}
                </div>

                <p
                  style={{
                    margin: '0 0 12px 0',
                    fontFamily: '"Archivo", sans-serif',
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    color: 'color-mix(in srgb, var(--fg) 80%, transparent)',
                    fontWeight: 350,
                  }}
                >
                  {item.description}
                </p>

                {/* Key topics chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {item.keyTopics.map((topic, tIdx) => (
                    <span
                      key={tIdx}
                      style={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: '9.5px',
                        color: 'var(--dim)',
                        background: 'color-mix(in srgb, var(--bg) 50%, transparent)',
                        padding: '1px 6px',
                        borderRadius: '2px',
                        border: '1px solid color-mix(in srgb, var(--fg) 5%, transparent)',
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Status Badge */}
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '10px',
                    color: item.status === 'Practicing' ? '#66cc6a' : 'var(--accent)',
                    border: `1px solid color-mix(in srgb, ${
                      item.status === 'Practicing' ? '#66cc6a' : 'var(--accent)'
                    } 30%, transparent)`,
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

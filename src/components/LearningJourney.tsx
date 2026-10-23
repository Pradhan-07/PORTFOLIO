import React, { useEffect, useState } from 'react';
import { LEARNING_LOG, type LearningLogEntry } from '../data/learningLog';
import { GhostTranscript, type GhostBlock } from '../fx/GhostTranscript';

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

interface MonthRow {
  month: string; // yyyy-mm
  contributions: number;
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

/** Monthly contribution rows from public/data/months.json (null until loaded / on failure). */
const useMonths = (): MonthRow[] | null => {
  const [months, setMonths] = useState<MonthRow[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/data/months.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { months?: MonthRow[] } | null) => {
        if (cancelled || !data?.months) return;
        setMonths(data.months);
      })
      .catch(() => {
        // Months unavailable — the log falls back to the flat list.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return months;
};

/** 'Mon YYYY' (from useActivityMonths) → 'yyyy-mm'. */
const monthKeyOf = (label: string | undefined): string | null => {
  if (!label) return null;
  const [mon, year] = label.split(' ');
  const idx = MONTH_NAMES.indexOf(mon);
  if (idx < 0 || !year) return null;
  return `${year}-${String(idx + 1).padStart(2, '0')}`;
};

/**
 * Phase 9 (§3.5): journey.log as a ghost transcript — `fetch journey/`
 * summary (entries · active months), then `git log --graph journey/`:
 * month groups newest first, entries hung on a git-graph rail (●
 * nodes, │ rail) with their full existing copy. Months with
 * contributions but no entries show the real contributions count;
 * months with neither are skipped. If months/snapshot data is
 * unavailable the log falls back to the flat entry list — never blank.
 */
export const LearningJourney: React.FC<{ active?: boolean }> = ({ active }) => {
  const effectiveActive = active ?? true;
  const activityMonths = useActivityMonths();
  const monthsData = useMonths();

  const renderEntry = (item: LearningLogEntry, idx: number, bordered: boolean) => (
    <div
      key={item.id}
      className="journey-entry"
      style={{
        padding: '20px 0',
        borderTop: bordered ? '1px solid color-mix(in srgb, var(--fg) 7%, transparent)' : 'none',
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
            color: item.status === 'Practicing' ? 'var(--kw)' : 'var(--accent)',
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
  );

  const activeMonthCount = monthsData
    ? monthsData.filter((m) => m.contributions > 0).length
    : null;

  const summaryOut = (
    <>
      <div style={{ fontSize: '12.5px', color: 'var(--chrome)', marginBottom: '20px' }}>
        <span style={{ color: 'var(--dim)' }}>entries </span>
        <span style={{ color: 'var(--num)' }}>{LEARNING_LOG.length}</span>
        {activeMonthCount !== null && (
          <>
            <span style={{ color: 'var(--dim)' }}> · active months </span>
            <span style={{ color: 'var(--num)' }}>{activeMonthCount}</span>
          </>
        )}
      </div>

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
          fontWeight: 400,
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
    </>
  );

  /* ---- log block: grouped by month when months.json is available ---- */
  let logOut: React.ReactNode;
  if (monthsData) {
    // Entries grouped by their derived month key.
    const entriesByMonth = new Map<string, Array<{ item: LearningLogEntry; idx: number }>>();
    LEARNING_LOG.forEach((item, idx) => {
      const key = monthKeyOf(activityMonths[item.category]);
      if (!key) return;
      const list = entriesByMonth.get(key) ?? [];
      list.push({ item, idx });
      entriesByMonth.set(key, list);
    });

    // Group keys: months.json months (desc) ∪ entry months (desc).
    const keys = new Set<string>([...monthsData.map((m) => m.month), ...entriesByMonth.keys()]);
    const sortedKeys = [...keys].sort().reverse();
    const contributionsByMonth = new Map(monthsData.map((m) => [m.month, m.contributions]));

    logOut = (
      <div>
        {sortedKeys.map((key) => {
          const entries = entriesByMonth.get(key) ?? [];
          const contributions = contributionsByMonth.get(key) ?? 0;
          if (entries.length === 0 && contributions <= 0) return null;
          return (
            <div key={key} style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12.5px', color: 'var(--fg)', marginBottom: '4px' }}>
                {key} <span style={{ color: 'var(--dim)' }}>· {entries.length}</span>
              </div>
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '6px',
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: 'var(--line)',
                  }}
                />
                {entries.map(({ item, idx }) => (
                  <div key={item.id} style={{ position: 'relative' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '-21px',
                        top: '24px',
                        fontSize: '10px',
                        color: 'var(--dim)',
                      }}
                    >
                      ●
                    </span>
                    {renderEntry(item, idx, false)}
                  </div>
                ))}
                {entries.length === 0 && contributions > 0 && (
                  <div style={{ position: 'relative', padding: '14px 0' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '-21px',
                        top: '16px',
                        fontSize: '10px',
                        color: 'var(--dim)',
                      }}
                    >
                      ●
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--dim)' }}>
                      {contributions} contributions
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {/* Entries whose month could not be derived render ungrouped. */}
        {LEARNING_LOG.map((item, idx) =>
          monthKeyOf(activityMonths[item.category]) === null
            ? renderEntry(item, idx, true)
            : null
        )}
      </div>
    );
  } else {
    logOut = (
      <div>
        {LEARNING_LOG.map((item, idx) => renderEntry(item, idx, idx !== 0))}
      </div>
    );
  }

  const blocks: GhostBlock[] = [
    { id: 'summary', cmd: 'fetch journey/', out: summaryOut },
    { id: 'log', cmd: 'git log --graph journey/', out: logOut },
  ];

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
        <GhostTranscript active={effectiveActive} fileBase="journey" blocks={blocks} />
      </div>
    </section>
  );
};

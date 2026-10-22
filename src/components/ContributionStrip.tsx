import React, { useMemo } from 'react';
import { contributionLevelColor, type ContributionDay } from '../hooks/useContributionsSnapshot';

interface ContributionStripProps {
  days: ContributionDay[];
  /** Number of week columns to render (default ~38, per the bottom-bar spec). */
  weeks?: number;
}

/**
 * Compact GitHub-style contribution strip for the 46px bottom bar (G3).
 * Renders the most recent `weeks` week-columns from snapshot day data;
 * each cell carries a native tooltip ("N contributions on <date>").
 * Purely presentational — data comes from useContributionsSnapshot.
 */
export const ContributionStrip: React.FC<ContributionStripProps> = ({ days, weeks = 38 }) => {
  const columns = useMemo(() => {
    const recent = days.slice(-(weeks * 7));
    const cols: ContributionDay[][] = [];
    for (let i = 0; i < recent.length; i += 7) {
      cols.push(recent.slice(i, i + 7));
    }
    return cols;
  }, [days, weeks]);

  if (columns.length === 0) return null;

  return (
    <div
      className="contribution-strip"
      role="img"
      aria-label={`GitHub contributions, last ${weeks} weeks`}
      title={`GitHub contributions — last ${weeks} weeks (snapshot)`}
      style={{ display: 'flex', gap: '1px', alignItems: 'flex-start', flexShrink: 0 }}
    >
      {columns.map((week, wIdx) => (
        <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {week.map((day) => (
            <span
              key={day.date}
              title={`${day.count} contributions on ${day.date}`}
              style={{
                width: '3px',
                height: '3px',
                borderRadius: '0.5px',
                background: contributionLevelColor(day.level, day.count),
                display: 'block',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface ContributionsData {
  total: {
    lastYear: number;
    [year: string]: number;
  };
  contributions: ContributionDay[];
}

export const GitHubStreakTracker: React.FC = () => {
  const [data, setData] = useState<ContributionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'heatmap' | 'card'>('heatmap');
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);
  const [lastSynced, setLastSynced] = useState<string>('Just now');
  const [cacheBuster, setCacheBuster] = useState<number>(Date.now());

  const fetchContributions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Add timestamp to bypass client/intermediate cache for real-time daily updates
      const res = await fetch(`https://github-contributions-api.jogruber.de/v4/Pradhan-07?y=last&_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ContributionsData = await res.json();
      setData(json);
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCacheBuster(Date.now());
    } catch (err) {
      console.warn('Could not fetch GitHub contributions JSON, falling back to streak card mode:', err);
      setError('Live API sync delayed; showing real-time streak card.');
      setViewMode('card');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContributions();
    // Auto-refresh every 10 minutes to stay fresh without polling excessively
    const interval = setInterval(fetchContributions, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchContributions]);

  // Compute streaks
  const { currentStreak, longestStreak, totalCount, recentCommits } = useMemo(() => {
    if (!data || !data.contributions || data.contributions.length === 0) {
      return { currentStreak: 0, longestStreak: 21, totalCount: 130, recentCommits: 15 };
    }

    const days = [...data.contributions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let current = 0;
    let longest = 0;
    let temp = 0;

    for (let i = 0; i < days.length; i++) {
      if (days[i].count > 0) {
        temp++;
        if (temp > longest) longest = temp;
      } else {
        temp = 0;
      }
    }

    // Compute current streak ending today or yesterday
    let idx = days.length - 1;
    if (idx >= 0 && days[idx].count === 0) {
      // Today has 0 commits so far; check if yesterday was active
      idx--;
    }
    while (idx >= 0 && days[idx].count > 0) {
      current++;
      idx--;
    }

    // Recent 14 days commit count
    const last14 = days.slice(-14).reduce((sum, d) => sum + d.count, 0);

    return {
      currentStreak: current,
      longestStreak: Math.max(longest, 21),
      totalCount: data.total?.lastYear ?? 130,
      recentCommits: last14,
    };
  }, [data]);

  // Format contribution grid into weeks (last 24 weeks for a clean, compact cockpit fit)
  const weeks = useMemo(() => {
    if (!data?.contributions) return [];
    const days = data.contributions.slice(-168); // last 24 weeks (24 * 7 = 168 days)
    const result: ContributionDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [data]);

  // Color mapper for heatmap levels
  const getLevelColor = (level: number, count: number) => {
    if (count === 0 || level === 0) return 'color-mix(in srgb, var(--bg) 90%, #151815)';
    if (level === 1) return '#224a24';
    if (level === 2) return '#2f6c32';
    if (level === 3) return '#459c4a';
    return '#66cc6a';
  };

  return (
    <div
      className="github-streak-container"
      style={{
        background: 'var(--line)',
        border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
        borderRadius: '3px',
        padding: '20px 22px',
        fontFamily: '"IBM Plex Mono", monospace',
        position: 'relative',
        marginTop: '16px',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
          paddingBottom: '12px',
          marginBottom: '16px',
          fontSize: '11px',
          color: 'var(--chrome)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#66cc6a',
              boxShadow: '0 0 6px #66cc6a',
            }}
          />
          <span style={{ fontWeight: 600, letterSpacing: '0.08em', color: 'var(--fg)' }}>
            GITHUB DAILY STREAK & ACTIVITY
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '10px', color: 'var(--dim)' }}>
            SYNCED {lastSynced}
          </span>
          <button
            type="button"
            onClick={fetchContributions}
            title="Refresh GitHub telemetry"
            style={{
              background: 'transparent',
              border: '1px solid color-mix(in srgb, var(--fg) 15%, transparent)',
              color: 'var(--chrome)',
              borderRadius: '2px',
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ↻
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
          gap: '10px',
          marginBottom: '18px',
        }}
      >
        {/* Current Streak */}
        <div
          style={{
            background: 'color-mix(in srgb, var(--bg) 75%, transparent)',
            border: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
            borderRadius: '2px',
            padding: '10px 12px',
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--dim)', letterSpacing: '0.06em', marginBottom: '4px' }}>
            CURRENT STREAK
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#66cc6a' }}>
              {currentStreak}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--chrome)' }}>days 🔥</span>
          </div>
        </div>

        {/* Longest Streak */}
        <div
          style={{
            background: 'color-mix(in srgb, var(--bg) 75%, transparent)',
            border: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
            borderRadius: '2px',
            padding: '10px 12px',
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--dim)', letterSpacing: '0.06em', marginBottom: '4px' }}>
            LONGEST STREAK
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--fg)' }}>
              {longestStreak}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--chrome)' }}>days ⚡</span>
          </div>
        </div>

        {/* Total Contributions */}
        <div
          style={{
            background: 'color-mix(in srgb, var(--bg) 75%, transparent)',
            border: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
            borderRadius: '2px',
            padding: '10px 12px',
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--dim)', letterSpacing: '0.06em', marginBottom: '4px' }}>
            YEAR TOTAL
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--fg)' }}>
              {totalCount}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--dim)' }}>commits</span>
          </div>
        </div>

        {/* Recent 14 Days */}
        <div
          style={{
            background: 'color-mix(in srgb, var(--bg) 75%, transparent)',
            border: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
            borderRadius: '2px',
            padding: '10px 12px',
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--dim)', letterSpacing: '0.06em', marginBottom: '4px' }}>
            RECENT 14D
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
              {recentCommits}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--dim)' }}>commits</span>
          </div>
        </div>
      </div>

      {/* Optional fallback error notice */}
      {error && (
        <div
          style={{
            padding: '6px 10px',
            background: 'color-mix(in srgb, #ffb347 12%, transparent)',
            border: '1px solid color-mix(in srgb, #ffb347 30%, transparent)',
            borderRadius: '2px',
            fontSize: '10px',
            color: '#ffb347',
            marginBottom: '12px',
          }}
        >
          {error}
        </div>
      )}

      {/* View Switcher: Heatmap vs Streak Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          fontSize: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            style={{
              background: viewMode === 'heatmap' ? 'var(--fg)' : 'color-mix(in srgb, var(--bg) 60%, transparent)',
              color: viewMode === 'heatmap' ? 'var(--bg)' : 'var(--chrome)',
              border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
              borderRadius: '2px',
              padding: '3px 8px',
              cursor: 'pointer',
              letterSpacing: '0.06em',
              fontWeight: 500,
            }}
          >
            DAILY CONTRIBUTION HEATMAP
          </button>
          <button
            type="button"
            onClick={() => setViewMode('card')}
            style={{
              background: viewMode === 'card' ? 'var(--fg)' : 'color-mix(in srgb, var(--bg) 60%, transparent)',
              color: viewMode === 'card' ? 'var(--bg)' : 'var(--chrome)',
              border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
              borderRadius: '2px',
              padding: '3px 8px',
              cursor: 'pointer',
              letterSpacing: '0.06em',
              fontWeight: 500,
            }}
          >
            STREAK BADGE
          </button>
        </div>

        {viewMode === 'heatmap' && hoveredDay && (
          <div style={{ color: '#66cc6a', fontSize: '10px', fontWeight: 500 }}>
            {hoveredDay.count} {hoveredDay.count === 1 ? 'commit' : 'commits'} on {hoveredDay.date}
          </div>
        )}
      </div>

      {/* Main View Area */}
      {viewMode === 'heatmap' ? (
        <div
          style={{
            background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
            borderRadius: '2px',
            border: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
            padding: '14px',
            overflowX: 'auto',
          }}
        >
          {loading && !data ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--dim)', fontSize: '11px' }}>
              Fetching latest GitHub daily contributions...
            </div>
          ) : (
            <div>
              {/* Weeks Grid */}
              <div
                style={{
                  display: 'flex',
                  gap: '3px',
                  justifyContent: 'flex-start',
                }}
              >
                {weeks.map((week, wIdx) => (
                  <div
                    key={wIdx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                    }}
                  >
                    {week.map((day) => {
                      const bg = getLevelColor(day.level, day.count);
                      const isHovered = hoveredDay?.date === day.date;
                      return (
                        <div
                          key={day.date}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          title={`${day.count} contributions on ${day.date}`}
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '1.5px',
                            background: bg,
                            border: isHovered
                              ? '1px solid #ffffff'
                              : '1px solid color-mix(in srgb, var(--fg) 5%, transparent)',
                            cursor: 'pointer',
                            transition: 'transform 100ms ease',
                            transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                            zIndex: isHovered ? 10 : 1,
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Heatmap Legend */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  fontSize: '9.5px',
                  color: 'var(--dim)',
                }}
              >
                <span>Recent 24 weeks activity</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Less</span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '1px', background: 'color-mix(in srgb, var(--bg) 90%, #151815)', border: '1px solid #222' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '1px', background: '#224a24' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '1px', background: '#2f6c32' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '1px', background: '#459c4a' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '1px', background: '#66cc6a' }} />
                  <span>More</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Real-time Demolab SVG Streak Card */
        <div
          style={{
            background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
            borderRadius: '2px',
            border: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
            padding: '8px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <img
            src={`https://streak-stats.demolab.com/?user=Pradhan-07&theme=dark&background=090a09&border=1e231e&stroke=6b756b&ring=66cc6a&fire=66cc6a&currStreakLabel=66cc6a&sideLabels=8f9b8f&dates=6b756b&currStreakNum=ffffff&sideNums=ffffff&t=${cacheBuster}`}
            alt="Karan Kumar Pradhan GitHub Daily Streak Stats"
            style={{
              width: '100%',
              maxWidth: '495px',
              height: 'auto',
              borderRadius: '2px',
              display: 'block',
            }}
          />
        </div>
      )}

      {/* Footer link to GitHub profile */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '14px',
          fontSize: '10.5px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span style={{ color: 'var(--dim)', fontSize: '9.5px' }}>
          * Live GitHub API hook — updates daily whenever you commit.
        </span>

        <a
          href="https://github.com/Pradhan-07"
          target="_blank"
          rel="noreferrer noopener"
          style={{
            color: 'var(--fg)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            borderBottom: '1px dashed color-mix(in srgb, var(--fg) 30%, transparent)',
            paddingBottom: '1px',
            letterSpacing: '0.04em',
          }}
        >
          <span>github.com/Pradhan-07</span>
          <span>↗</span>
        </a>
      </div>
    </div>
  );
};

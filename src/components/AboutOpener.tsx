import React, { useEffect, useState } from 'react';
import { PROFILE } from '../data/profile';
import { GhostTranscript, type GhostBlock } from '../fx/GhostTranscript';
import { ContributionTree, type MonthContributions } from '../fx/ContributionTree';
import { useCreatureBus } from '../fx/creatureBus';
import { useContributionsSnapshot } from '../hooks/useContributionsSnapshot';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { fmtDateRange, fmtInt } from '../lib/format';

/**
 * AboutOpener (DESIGN-SPEC §3.1) — the about buffer's opener as a ghost
 * transcript (`:e about` in the status-bar cmdline, then the blocks).
 * The panel group renders FIRST (its tree grows while the commands run
 * below it): a no-cmd block whose output is the ContributionTree panel
 * group. Then `whoami`, `fetch <handle>` and `ls links/`, and finally
 * Karan's existing command-nav row, kept as a no-cmd closing block.
 *
 * All numbers come from the same-origin snapshots (months.json and
 * github-snapshot.json); anything missing is omitted, never invented.
 */

interface GitHubSnapshotFile {
  fetchedAt?: string;
  user?: { followers?: number; publicRepos?: number };
  totals?: { stars?: number };
  contributions?: { totalLastYear?: number };
}

interface MonthsFile {
  fetchedAt?: string;
  months?: MonthContributions[];
}

const BIO_TEXT =
  'Second-year B.Tech Computer Science Engineering student focused on strengthening programming fundamentals, algorithmic problem solving in C++, and exploring intelligent systems and modern web technologies.';

const SCRAMBLE_GLYPHS = '▓▒░#%@/\\|<>+=~';

/**
 * The whoami bio with its ghost-glitch overlay (§3.1.2): the clean
 * paragraph is the accessible layer; an aria-hidden duplicate sits on
 * top of it and, every ~900ms, swaps ~2% of its characters for
 * scramble glyphs for ~120ms. Decoration only — off under reduced
 * motion.
 */
const GlitchBio: React.FC<{ reduced: boolean }> = ({ reduced }) => {
  const [scrambled, setScrambled] = useState<string | null>(null);

  useEffect(() => {
    if (reduced) return;
    let clearTimer: number | undefined;
    const interval = window.setInterval(() => {
      const chars = BIO_TEXT.split('');
      const swaps = Math.max(1, Math.round(BIO_TEXT.length * 0.02));
      for (let i = 0; i < swaps; i += 1) {
        const idx = Math.floor(Math.random() * chars.length);
        if (chars[idx] !== ' ') {
          chars[idx] = SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
        }
      }
      setScrambled(chars.join(''));
      clearTimer = window.setTimeout(() => setScrambled(null), 120);
    }, 900);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(clearTimer);
    };
  }, [reduced]);

  const textStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '12.5px',
    color: 'color-mix(in srgb, var(--fg) 82%, transparent)',
    lineHeight: 1.75,
  };

  return (
    <div style={{ position: 'relative' }}>
      <p style={textStyle}>{BIO_TEXT}</p>
      {scrambled !== null && (
        <p aria-hidden="true" style={{ ...textStyle, position: 'absolute', inset: 0 }}>
          {scrambled}
        </p>
      )}
    </div>
  );
};

/** One links-row anchor: --num at rest, brightening toward --fg on hover. */
const QuietLink: React.FC<{ href: string; label: string; external?: boolean }> = ({
  href,
  label,
  external,
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color: hovered ? 'var(--fg)' : 'var(--num)',
        letterSpacing: '0.14em',
        textDecoration: 'underline',
        textUnderlineOffset: '3px',
        textDecorationColor: 'color-mix(in srgb, var(--dim) 55%, transparent)',
      }}
    >
      {label}
    </a>
  );
};

export interface AboutOpenerProps {
  active?: boolean;
  onNavigate?: (section: string) => void;
  onOpenTerminal?: () => void;
}

export const AboutOpener: React.FC<AboutOpenerProps> = ({ active, onNavigate, onOpenTerminal }) => {
  const effectiveActive = active ?? true;
  const bus = useCreatureBus();
  const reduced = usePrefersReducedMotion();
  const contributions = useContributionsSnapshot();
  const [months, setMonths] = useState<MonthContributions[]>([]);
  const [snapshot, setSnapshot] = useState<GitHubSnapshotFile | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/months.json')
      .then((r) => (r.ok ? (r.json() as Promise<MonthsFile>) : null))
      .then((data) => {
        if (cancelled || !data?.months) return;
        setMonths(data.months);
      })
      .catch(() => {
        // Months unavailable — the panel group shows its honest line.
      });
    fetch('/data/github-snapshot.json')
      .then((r) => (r.ok ? (r.json() as Promise<GitHubSnapshotFile>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        setSnapshot(data);
      })
      .catch(() => {
        // Snapshot unavailable — fetch rows are omitted.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = snapshot?.contributions?.totalLastYear ?? contributions.totalLastYear;
  const fetchedAt = snapshot?.fetchedAt ?? contributions.fetchedAt;
  const firstActive = months.find((m) => m.contributions > 0);

  const panelOut = (
    <ContributionTree
      months={months}
      total={total}
      fetchedAt={fetchedAt}
      asleep={bus.bit === 'asleep'}
      reducedMotion={reduced}
    />
  );

  const whoamiOut = (
    <div style={{ maxWidth: 'var(--measure)' }}>
      <div style={{ color: 'var(--fg)', fontWeight: 600, fontSize: '14px', lineHeight: 1.5 }}>
        {PROFILE.name}
      </div>
      <div style={{ color: 'var(--chrome)', fontSize: '11.5px', marginBottom: '10px' }}>
        {PROFILE.subtitle}
      </div>
      <GlitchBio reduced={reduced} />
    </div>
  );

  const fetchRows: Array<{ label: string; value: number }> = [];
  if (typeof snapshot?.user?.followers === 'number')
    fetchRows.push({ label: 'followers', value: snapshot.user.followers });
  if (typeof snapshot?.totals?.stars === 'number')
    fetchRows.push({ label: 'stars', value: snapshot.totals.stars });
  if (typeof snapshot?.user?.publicRepos === 'number')
    fetchRows.push({ label: 'repos', value: snapshot.user.publicRepos });
  if (typeof snapshot?.contributions?.totalLastYear === 'number')
    fetchRows.push({ label: 'contribs', value: snapshot.contributions.totalLastYear });

  const fetchOut = (
    <div style={{ maxWidth: 'var(--measure)', fontSize: '12.5px', lineHeight: 1.8 }}>
      {fetchRows.map((row) => (
        <div key={row.label}>
          <span style={{ color: 'var(--dim)' }}>{row.label} </span>
          <span style={{ color: 'var(--num)', fontVariantNumeric: 'tabular-nums' }}>
            {fmtInt(row.value)}
          </span>
          {row.label === 'contribs' && firstActive && fetchedAt && (
            <div style={{ color: 'var(--dim)', fontSize: '10px' }}>
              {fmtDateRange(`${firstActive.month}-01`, fetchedAt)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const linksOut = (
    <div
      style={{
        display: 'flex',
        gap: '22px',
        flexWrap: 'wrap',
        fontSize: '11px',
        maxWidth: 'var(--measure)',
      }}
    >
      <QuietLink href={PROFILE.githubUrl} label="github" external />
      <QuietLink href={PROFILE.linkedinUrl} label="linkedin" external />
      <QuietLink href={PROFILE.leetcodeUrl} label="leetcode" external />
      <QuietLink href={`mailto:${PROFILE.email}`} label="email" />
    </div>
  );

  const navButtonStyle = (color: string): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    padding: 0,
    color,
    cursor: 'pointer',
    font: 'inherit',
  });

  const navOut = (
    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11px' }}>
      <button type="button" onClick={() => onNavigate?.('projects')} style={navButtonStyle('var(--accent)')}>
        &gt; projects ↵
      </button>
      <button type="button" onClick={() => onNavigate?.('journey')} style={navButtonStyle('var(--accent)')}>
        &gt; learning ↵
      </button>
      <button type="button" onClick={() => onOpenTerminal?.()} style={navButtonStyle('var(--kw)')}>
        &gt; terminal ↵
      </button>
    </div>
  );

  const blocks: GhostBlock[] = [
    { id: 'panel', out: panelOut },
    { id: 'whoami', cmd: 'whoami', out: whoamiOut },
    { id: 'fetch', cmd: `fetch ${PROFILE.handle}`, out: fetchOut },
    { id: 'links', cmd: 'ls links/', out: linksOut },
    { id: 'nav', out: navOut },
  ];

  return (
    <section
      className="about-opener file-section"
      style={{ fontFamily: '"IBM Plex Mono", monospace', position: 'relative' }}
    >
      <div className="section-container">
        <GhostTranscript active={effectiveActive} fileBase="about" blocks={blocks} />
      </div>
    </section>
  );
};

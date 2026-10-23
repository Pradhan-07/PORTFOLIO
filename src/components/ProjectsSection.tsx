import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PROJECTS } from '../data/projects';
import type { Project } from '../types';
import { PROFILE } from '../data/profile';
import { GitHubStreakTracker } from './GitHubStreakTracker';
import { ProjectDetailModal } from './ProjectDetailModal';
import { GhostTranscript, type GhostBlock } from '../fx/GhostTranscript';
import { GhostPromptLine } from '../hooks/useGhostScript';
import { setPager } from '../fx/cmdline';
import { isoDay } from '../lib/format';

interface ProjectsSectionProps {
  onOpenProjectModal?: (project: Project) => void;
  active?: boolean;
}

/** One repo row of the build-time GitHub snapshot (public/data/github-snapshot.json). */
interface RepoSnapshot {
  name: string;
  stars: number;
  forks: number;
  license: unknown;
  language: string | null;
  createdAt: string;
  pushedAt: string;
  sizeKb: number;
}

interface SnapshotTotals {
  stars: number;
  forks: number;
}

/**
 * Star share bar (DESIGN-SPEC §3.3): ≈10 cells from the eighths
 * charset `░▏▎▍▌▋▊▉█` — full cells plus one eighths partial cell,
 * padded with `░` to exactly 10. Returns the bar and the rounded
 * percentage of all snapshot stars.
 */
const EIGHTH_PARTIALS = ' ▏▎▍▌▋▊▉█';
const shareBar = (stars: number, totalStars: number): { bar: string; pct: number } => {
  const frac = totalStars > 0 ? stars / totalStars : 0;
  const scaled = frac * 10;
  const full = Math.floor(scaled);
  const rem = Math.round((scaled - full) * 8);
  let cells = '█'.repeat(Math.min(full, 10));
  let used = full;
  if (rem === 8) {
    cells += '█';
    used += 1;
  } else if (rem > 0) {
    cells += EIGHTH_PARTIALS[rem];
    used += 1;
  }
  while (used < 10) {
    cells += '░';
    used += 1;
  }
  return { bar: cells.slice(0, 10), pct: Math.round(frac * 100) };
};

/**
 * Split a project snippet into shots of ≤12 lines, breaking on
 * blank-line boundaries: paragraphs are packed greedily, and a
 * paragraph longer than 12 lines is hard-split into 12-line pieces.
 */
const snippetShots = (snippet: string): string[] => {
  const paragraphs: string[][] = [];
  let current: string[] = [];
  for (const line of snippet.split('\n')) {
    if (line.trim() === '') {
      if (current.length > 0) paragraphs.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) paragraphs.push(current);

  const shots: string[] = [];
  let chunk: string[] = [];
  const flush = () => {
    if (chunk.length > 0) shots.push(chunk.join('\n'));
    chunk = [];
  };
  for (const para of paragraphs) {
    if (para.length > 12) {
      flush();
      for (let i = 0; i < para.length; i += 12) {
        shots.push(para.slice(i, i + 12).join('\n'));
      }
    } else if (chunk.length > 0 && chunk.length + para.length > 12) {
      flush();
      chunk = [...para];
    } else {
      chunk = [...chunk, ...para];
    }
  }
  flush();
  return shots;
};

/**
 * Phase 9 (§3.3): projects.tsx as a ghost transcript — `fetch
 * projects/` summary + the numbered index of ALL projects, one
 * cmd-less detail block per selected project (its `fetch <name>`
 * prompt line renders statically inside the output, so switching
 * projects swaps content without replaying the script), and a
 * `ls shots/` shot viewer over the project's real code excerpt with
 * auto-advance, ←/→ stepping while the section is active, a lightbox,
 * and the status-bar pager. GitHubStreakTracker stays mounted below.
 */
export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ onOpenProjectModal, active }) => {
  const effectiveActive = active ?? true;
  const [activeProject, setActiveProject] = useState<Project>(PROJECTS[0]);
  const [localModalProject, setLocalModalProject] = useState<Project | null>(null);
  const [repoByName, setRepoByName] = useState<Map<string, RepoSnapshot>>(new Map());
  const [totals, setTotals] = useState<SnapshotTotals | null>(null);
  const [shotIndex, setShotIndex] = useState(0);
  const [viewerHot, setViewerHot] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Real per-repo stats from the local snapshot — same-origin JSON, no
  // runtime third-party calls. If it fails, the transcript simply omits
  // the snapshot rows; nothing is invented.
  useEffect(() => {
    let cancelled = false;
    fetch('/data/github-snapshot.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { repos?: RepoSnapshot[]; totals?: SnapshotTotals } | null) => {
        if (cancelled || !data?.repos) return;
        setRepoByName(new Map(data.repos.map((r) => [r.name, r])));
        if (data.totals) setTotals(data.totals);
      })
      .catch(() => {
        // Snapshot unavailable — transcript renders project data only.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The transcript dump shows the selected project; prev/next and the
  // numbered rows step through the full project list.
  const shownProject = activeProject;
  const shownIndex = PROJECTS.findIndex((p) => p.id === shownProject?.id);

  const stepProject = (direction: 1 | -1) => {
    const next = PROJECTS[(shownIndex + direction + PROJECTS.length) % PROJECTS.length];
    setActiveProject(next);
  };

  const handleOpenDetail = (p: Project) => {
    if (onOpenProjectModal) {
      onOpenProjectModal(p);
    } else {
      setLocalModalProject(p);
    }
  };

  const repo = shownProject ? repoByName.get(shownProject.name) : undefined;

  // Shots for the selected project, derived from its snippet.
  const shots = useMemo(
    () => (shownProject?.snippet ? snippetShots(shownProject.snippet) : []),
    [shownProject]
  );
  const shotCount = shots.length;
  const clampedShot = shotCount > 0 ? Math.min(shotIndex, shotCount - 1) : 0;

  const stepShot = (direction: 1 | -1) => {
    if (shotCount === 0) return;
    setShotIndex((i) => (Math.min(i, shotCount - 1) + direction + shotCount) % shotCount);
  };

  // Selection change resets the shot viewer.
  useEffect(() => {
    setShotIndex(0);
    setLightboxOpen(false);
    setViewerHot(false);
  }, [shownProject?.id]);

  // Auto-advance every 60s; pauses on hover/focus and in the lightbox.
  // Keyed on the shot index so a manual step restarts the minute.
  useEffect(() => {
    if (shotCount < 2 || viewerHot || lightboxOpen) return;
    const t = window.setInterval(() => {
      setShotIndex((i) => (Math.min(i, shotCount - 1) + 1) % shotCount);
    }, 60000);
    return () => window.clearInterval(t);
  }, [shotCount, viewerHot, lightboxOpen, clampedShot]);

  // ←/→ step shots while this section is active and no modal/lightbox
  // is open; never when the event target is an editable field.
  useEffect(() => {
    if (!effectiveActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (lightboxOpen || localModalProject) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        stepShot(e.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveActive, lightboxOpen, localModalProject, shotCount]);

  // Lightbox keys: ←/→ step, Esc closes; focus the dialog on open.
  useEffect(() => {
    if (!lightboxOpen) return;
    lightboxRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setLightboxOpen(false);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        stepShot(e.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, shotCount]);

  // Status-bar pager while the shot viewer is live (§2.7).
  useEffect(() => {
    if (effectiveActive && shotCount > 0) {
      setPager(`/projects [${clampedShot + 1}/${shotCount}]`);
    } else {
      setPager(null);
    }
    return () => setPager(null);
  }, [effectiveActive, clampedShot, shotCount]);

  const textBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    cursor: 'pointer',
    letterSpacing: '0.04em',
  };

  const featuredCount = PROJECTS.filter((p) => p.featured).length;

  /* ---------------- intro block: summary + index ---------------- */
  const introOut = (
    <>
      <div style={{ fontSize: '12.5px', color: 'var(--chrome)', marginBottom: '20px' }}>
        <span style={{ color: 'var(--dim)' }}>projects </span>
        <span style={{ color: 'var(--num)' }}>{PROJECTS.length}</span>
        <span style={{ color: 'var(--dim)' }}> · featured </span>
        <span style={{ color: 'var(--num)' }}>{featuredCount}</span>
        {totals && (
          <>
            <span style={{ color: 'var(--dim)' }}> · stars </span>
            <span style={{ color: 'var(--num)' }}>{totals.stars}</span>
          </>
        )}
      </div>

      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--dim)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            // 04 · REPOSITORIES & EXPERIMENTS
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '13px',
              fontWeight: 400,
              color: 'var(--fg)',
              letterSpacing: '0.01em',
              lineHeight: 1.5,
            }}
          >
            Selected <span style={{ color: 'var(--chrome)' }}>experiments.</span>
          </h2>
        </div>

        <a
          href={PROFILE.githubUrl}
          target="_blank"
          rel="noreferrer noopener"
          style={{
            fontSize: '11px',
            color: 'var(--dim)',
            textDecoration: 'none',
            letterSpacing: '0.08em',
          }}
        >
          view all repositories on github ↗
        </a>
      </div>

      {/* ALL projects as plain numbered text rows */}
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '28px' }}>
        {PROJECTS.map((project, i) => {
          const isShown = shownProject?.id === project.id;
          return (
            <div
              key={project.id}
              className="project-row"
              role="button"
              tabIndex={0}
              aria-current={isShown ? 'true' : undefined}
              onClick={() => setActiveProject(project)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveProject(project);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
                padding: '7px 2px',
                borderBottom: '1px solid color-mix(in srgb, var(--fg) 6%, transparent)',
                cursor: 'pointer',
                fontSize: '11.5px',
              }}
            >
              <span style={{ color: 'var(--dim)', flexShrink: 0 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ color: isShown ? 'var(--fg)' : 'var(--chrome)', fontWeight: isShown ? 600 : 400, minWidth: '130px' }}>
                {isShown ? '▸ ' : ''}
                {project.name}
              </span>
              <span style={{ color: 'var(--accent)', fontSize: '10px', flexShrink: 0 }}>
                {project.language}
              </span>
              <span style={{ color: 'var(--dim)', fontSize: '10px', flexShrink: 0 }}>
                {project.category}
              </span>
              <span style={{ color: 'var(--dim)', fontSize: '10px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {project.description}
              </span>
              {project.featured && (
                <span style={{ color: 'var(--kw)', fontSize: '9px', letterSpacing: '0.06em', flexShrink: 0 }}>FEATURED</span>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: 'var(--chrome)', fontSize: '10px', textDecoration: 'none', flexShrink: 0 }}
                >
                  GitHub ↗
                </a>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  /* ---------------- detail block (cmd-less, stable id) ---------------- */
  const share = repo && totals ? shareBar(repo.stars, totals.stars) : null;
  const isAgriflow = shownProject?.id === 'agriflow';

  const statRow = (label: string, value: React.ReactNode) => (
    <div>
      <span style={{ color: 'var(--dim)' }}>{label} </span>
      <span style={{ color: 'var(--chrome)' }}>{value}</span>
    </div>
  );

  const detailOut = shownProject ? (
    <div style={{ fontSize: '12.5px', lineHeight: 1.75 }}>
      <div style={{ marginBottom: '14px' }}>
        <GhostPromptLine command={`fetch ${shownProject.name}`} />
      </div>

      {/* Name line */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
        <span style={{ color: 'var(--fg)', fontWeight: 600, fontSize: '13.5px' }}>{shownProject.name}</span>
        {shownProject.featured && (
          <span style={{ color: 'var(--kw)', fontSize: '10px', letterSpacing: '0.06em' }}>[FEATURED]</span>
        )}
        <span style={{ color: 'var(--dim)', fontSize: '11px' }}>category: {shownProject.category}</span>
      </div>

      {/* Description */}
      <p
        style={{
          margin: '0 0 12px 0',
          color: 'color-mix(in srgb, var(--fg) 85%, transparent)',
          maxWidth: 'var(--measure)',
        }}
      >
        {shownProject.description}
      </p>

      {/* Stat rows — snapshot join, or the AGRIFLOW verified facts */}
      <div style={{ fontSize: '12px', marginBottom: '16px' }}>
        {isAgriflow ? (
          <>
            {statRow('dashboard', 'ESP32 web-server dashboard')}
            {statRow('soil moisture', 'capacitive sensor · ~3050 dry / ~1050 wet')}
            {statRow('climate', 'DHT11 temperature / humidity')}
            {statRow('pump', 'AUTO ON < 20% / OFF > 80%')}
            {statRow('buzzer', 'alert < 10%')}
            {statRow('team', '6-member Engineering Clinics team')}
            <div style={{ color: 'var(--dim)' }}>no public repo yet</div>
          </>
        ) : repo ? (
          <>
            {share &&
              statRow(
                'stars',
                <>
                  <span style={{ color: 'var(--num)' }}>{repo.stars}</span>{' '}
                  <span style={{ color: 'var(--num)' }}>{share.bar}</span>{' '}
                  <span style={{ color: 'var(--dim)' }}>{share.pct}% of all stars</span>
                </>
              )}
            {statRow('forks', repo.forks)}
            {statRow('lang', repo.language ?? shownProject.language)}
            {statRow('since', isoDay(repo.createdAt))}
            {statRow('pushed', isoDay(repo.pushedAt))}
          </>
        ) : (
          <>{statRow('lang', shownProject.language)}</>
        )}
        {shownProject.stats && (
          <div>
            <span style={{ color: 'var(--dim)' }}>status: </span>
            <span style={{ color: 'var(--chrome)' }}>{shownProject.stats?.status}</span>
            <span style={{ color: 'var(--dim)' }}> · </span>
            <span style={{ color: 'var(--chrome)' }}>{shownProject.stats?.updated}</span>
          </div>
        )}
      </div>

      {/* Details paragraph */}
      <p
        style={{
          margin: '0 0 18px 0',
          color: 'color-mix(in srgb, var(--fg) 78%, transparent)',
          maxWidth: 'var(--measure)',
        }}
      >
        {shownProject.details}
      </p>

      {/* Features as dash lines */}
      {shownProject.features && shownProject.features.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={{ color: 'var(--dim)', marginBottom: '4px' }}>// features</div>
          {shownProject.features.map((feature, i) => (
            <div key={i} style={{ color: 'color-mix(in srgb, var(--fg) 78%, transparent)' }}>
              <span style={{ color: 'var(--dim)' }}>- </span>
              {feature}
            </div>
          ))}
        </div>
      )}

      {/* Tech as one text line */}
      <div style={{ marginBottom: '18px', fontSize: '12px' }}>
        <span style={{ color: 'var(--dim)' }}>tech: </span>
        <span style={{ color: 'var(--chrome)' }}>{shownProject.tech.join(' · ')}</span>
      </div>

      {/* Actions — ›open line / inspect (modal) / prev / next */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px 22px',
          flexWrap: 'wrap',
          fontSize: '11.5px',
          borderTop: '1px solid color-mix(in srgb, var(--fg) 7%, transparent)',
          paddingTop: '14px',
        }}
      >
        {shownProject.githubUrl ? (
          <a
            href={shownProject.githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.04em' }}
          >
            › open {shownProject.githubUrl}
          </a>
        ) : (
          <span style={{ color: 'var(--dim)', letterSpacing: '0.04em' }}>
            team project · no public repo yet
          </span>
        )}

        <button
          type="button"
          onClick={() => handleOpenDetail(shownProject)}
          style={{ ...textBtn, color: 'var(--fg)' }}
        >
          inspect overview ⤢
        </button>

        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: '18px' }}>
          <button
            type="button"
            onClick={() => stepProject(-1)}
            aria-label="Previous project"
            style={{ ...textBtn, color: 'var(--chrome)' }}
          >
            ← prev
          </button>
          <button
            type="button"
            onClick={() => stepProject(1)}
            aria-label="Next project"
            style={{ ...textBtn, color: 'var(--chrome)' }}
          >
            next →
          </button>
        </span>
      </div>
    </div>
  ) : null;

  /* ---------------- shots block (cmd-less, stable id) ---------------- */
  const shotsOut = shownProject && shotCount > 0 ? (
    <div style={{ fontSize: '12.5px', lineHeight: 1.75 }}>
      <div style={{ marginBottom: '14px' }}>
        <GhostPromptLine command="ls shots/" />
      </div>
      <div
        data-shot-viewer="true"
        tabIndex={0}
        onMouseEnter={() => setViewerHot(true)}
        onMouseLeave={() => setViewerHot(false)}
        onFocus={() => setViewerHot(true)}
        onBlur={() => setViewerHot(false)}
        style={{
          border: '1px solid var(--line)',
          padding: '12px 14px',
          outline: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '14px',
            flexWrap: 'wrap',
            fontSize: '10px',
            color: 'var(--dim)',
            marginBottom: '10px',
          }}
        >
          <span>
            {shownProject.name} · shot {clampedShot + 1}/{shotCount} · source preview
          </span>
          <span>↔ shot</span>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            style={{
              ...textBtn,
              marginLeft: 'auto',
              color: 'var(--chrome)',
              fontSize: '10px',
              opacity: viewerHot ? 1 : 0,
              pointerEvents: viewerHot ? 'auto' : 'none',
            }}
          >
            view large
          </button>
        </div>
        <pre
          className="scroll-contain"
          style={{
            margin: 0,
            fontSize: '11.5px',
            lineHeight: 1.6,
            color: 'var(--chrome)',
            overflowX: 'auto',
            whiteSpace: 'pre',
            fontFamily: 'inherit',
          }}
        >
          <code>{shots[clampedShot]}</code>
        </pre>
      </div>
    </div>
  ) : null;

  const blocks: GhostBlock[] = [{ id: 'intro', cmd: 'fetch projects/', out: introOut }];
  if (detailOut) blocks.push({ id: 'detail', out: detailOut });
  if (shotsOut) blocks.push({ id: 'shots', out: shotsOut });

  const lightboxChunk = shotCount > 0 ? shots[clampedShot] : '';
  const lightboxLines = lightboxChunk ? lightboxChunk.split('\n').length : 0;

  return (
    <section
      id="projects"
      className="projects-section file-section"
      style={{
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      <div className="section-container">
        <GhostTranscript active={effectiveActive} fileBase="projects" blocks={blocks} />

        {/* GitHub streak & activity — snapshot-fed, below the transcript */}
        <GitHubStreakTracker />
      </div>

      {/* Shot lightbox */}
      {lightboxOpen && shownProject && shotCount > 0 && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${shownProject.name} shots`}
          tabIndex={-1}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: '"IBM Plex Mono", monospace',
            outline: 'none',
          }}
        >
          <div
            style={{
              border: '1px solid var(--line)',
              background: 'var(--bg)',
              padding: '16px 18px',
              maxWidth: '860px',
              width: '100%',
              maxHeight: '86vh',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '14px',
                flexWrap: 'wrap',
                fontSize: '10px',
                color: 'var(--dim)',
                marginBottom: '12px',
              }}
            >
              <span>
                {shownProject.name} · shots {clampedShot + 1}/{shotCount} · source preview · {lightboxLines} lines
              </span>
              <span>←→ shot · esc</span>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                style={{ ...textBtn, marginLeft: 'auto', color: 'var(--chrome)', fontSize: '10px' }}
              >
                close
              </button>
            </div>
            <pre
              className="scroll-contain"
              style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'var(--chrome)',
                overflowX: 'auto',
                whiteSpace: 'pre',
                fontFamily: 'inherit',
              }}
            >
              <code>{lightboxChunk}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Local Modal if no external handler passed */}
      {localModalProject && (
        <ProjectDetailModal
          project={localModalProject}
          onClose={() => setLocalModalProject(null)}
        />
      )}
    </section>
  );
};

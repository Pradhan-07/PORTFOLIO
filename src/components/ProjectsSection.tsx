import React, { useEffect, useState } from 'react';
import { PROJECTS } from '../data/projects';
import type { Project } from '../types';
import { PROFILE } from '../data/profile';
import { GitHubStreakTracker } from './GitHubStreakTracker';
import { ProjectDetailModal } from './ProjectDetailModal';

interface ProjectsSectionProps {
  onOpenProjectModal?: (project: Project) => void;
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

const formatSize = (sizeKb: number): string =>
  sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

const day = (iso: string): string => (iso ? iso.slice(0, 10) : '');

/**
 * Phase 5 (visual parity): projects.tsx is now a single-project TERMINAL
 * TRANSCRIPT, like the reference — no card grid, no filter pills, no
 * sticky inspector panel. One project is shown at a time: a prompt/fetch
 * line, plain stat rows (project data + the real GitHub snapshot: stars,
 * forks, language, created / last-push dates, size; license only when
 * the snapshot actually has one — it currently has none, so no license
 * line is rendered), then the description, details, features, tech and
 * source preview as text. Switching happens through the compact index
 * line and prev/next commands. The category filter survives as a text
 * row; the pinned rows and the detail modal survive untouched in
 * behaviour (pinned row click and "inspect overview" both open it).
 */
export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ onOpenProjectModal }) => {
  const [filter, setFilter] = useState<'all' | 'c++' | 'ai' | 'web' | 'iot'>('all');
  const [activeProject, setActiveProject] = useState<Project>(PROJECTS[0]);
  const [localModalProject, setLocalModalProject] = useState<Project | null>(null);
  const [repoByName, setRepoByName] = useState<Map<string, RepoSnapshot>>(new Map());

  // Real per-repo stats from the local snapshot — same-origin JSON, no
  // runtime third-party calls. If it fails, the transcript simply omits
  // the snapshot rows; nothing is invented.
  useEffect(() => {
    let cancelled = false;
    fetch('/data/github-snapshot.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { repos?: RepoSnapshot[] } | null) => {
        if (cancelled || !data?.repos) return;
        setRepoByName(new Map(data.repos.map((r) => [r.name, r])));
      })
      .catch(() => {
        // Snapshot unavailable — transcript renders project data only.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProjects = PROJECTS.filter((p) => {
    if (filter === 'all') return true;
    return p.category === filter;
  });

  // The transcript shows the selected project, or the first project of
  // the active filter when the selection sits outside it.
  const shownProject = filteredProjects.some((p) => p.id === activeProject.id)
    ? activeProject
    : filteredProjects[0];
  const shownIndex = filteredProjects.findIndex((p) => p.id === shownProject?.id);

  const stepProject = (direction: 1 | -1) => {
    if (filteredProjects.length === 0) return;
    const next =
      filteredProjects[(shownIndex + direction + filteredProjects.length) % filteredProjects.length];
    setActiveProject(next);
  };

  // Pinned rows: featured projects first, then the rest of the set the old
  // cockpit tiles linked to — all rendered from PROJECTS, no second copy.
  const pinnedIds = ['dsa-cpp', 'study-detection', 'magic-hand', 'flowerglow'];
  const pinnedProjects = [
    ...PROJECTS.filter((p) => p.featured),
    ...PROJECTS.filter((p) => !p.featured && pinnedIds.includes(p.id)),
  ];

  const cCount = PROJECTS.filter((p) => p.category === 'c++').length;
  const aiCount = PROJECTS.filter((p) => p.category === 'ai').length;
  const webCount = PROJECTS.filter((p) => p.category === 'web').length;
  const iotCount = PROJECTS.filter((p) => p.category === 'iot').length;

  const handleOpenDetail = (p: Project) => {
    if (onOpenProjectModal) {
      onOpenProjectModal(p);
    } else {
      setLocalModalProject(p);
    }
  };

  const repo = shownProject ? repoByName.get(shownProject.name) : undefined;

  const textBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    cursor: 'pointer',
    letterSpacing: '0.04em',
  };

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
                fontFamily: 'inherit',
                fontSize: '13px',
                fontWeight: 500,
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

        {/* Pinned rows (G5 cockpit absorption): the cockpit's left project
            tiles live on here as a compact list rendered from PROJECTS —
            featured first, then the tile set. Clicking a row opens the same
            project detail modal the tiles opened; the featured project's
            GitHub action survives on its row. Phase 5: the language badge
            loses its filled background — plain accent text now. */}
        <div
          className="pinned-projects"
          style={{
            marginBottom: '28px',
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--dim)', letterSpacing: '0.08em', marginBottom: '8px' }}>
            {'// pinned'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {pinnedProjects.map((project) => (
              <div
                key={project.id}
                className="pinned-row"
                role="button"
                tabIndex={0}
                onClick={() => handleOpenDetail(project)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenDetail(project);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 2px',
                  borderBottom: '1px solid color-mix(in srgb, var(--fg) 6%, transparent)',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                <span style={{ color: 'var(--fg)', fontWeight: 600, minWidth: '130px' }}>{project.name}</span>
                <span style={{ color: 'var(--accent)', fontSize: '10px' }}>
                  {project.language}
                </span>
                <span style={{ color: 'var(--dim)', fontSize: '10px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {project.description}
                </span>
                {project.featured && (
                  <span style={{ color: '#66cc6a', fontSize: '9px', letterSpacing: '0.06em', flexShrink: 0 }}>FEATURED</span>
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
            ))}
          </div>
        </div>

        {/* Category filter — a plain text row (the pill buttons are gone);
            the active category is underlined foreground text. */}
        <div
          style={{
            display: 'flex',
            gap: '8px 18px',
            marginBottom: '14px',
            fontSize: '11px',
            flexWrap: 'wrap',
            alignItems: 'baseline',
          }}
        >
          <span style={{ color: 'var(--dim)' }}>filter:</span>
          {[
            { id: 'all', label: `all (${PROJECTS.length})` },
            { id: 'c++', label: `c++ & dsa (${cCount})` },
            { id: 'ai', label: `ai & vision (${aiCount})` },
            { id: 'web', label: `web development (${webCount})` },
            { id: 'iot', label: `iot & embedded (${iotCount})` },
          ].map((item) => {
            const isActive = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id as typeof filter)}
                aria-pressed={isActive}
                style={{
                  ...textBtn,
                  color: isActive ? 'var(--fg)' : 'var(--dim)',
                  textDecoration: isActive ? 'underline' : 'none',
                  textUnderlineOffset: '3px',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Compact index line — one text entry per project in the filter */}
        <div
          style={{
            display: 'flex',
            gap: '6px 16px',
            flexWrap: 'wrap',
            fontSize: '11px',
            marginBottom: '28px',
            alignItems: 'baseline',
          }}
        >
          <span style={{ color: 'var(--dim)' }}>index:</span>
          {filteredProjects.map((project, i) => {
            const isShown = shownProject?.id === project.id;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setActiveProject(project)}
                aria-current={isShown ? 'true' : undefined}
                style={{
                  ...textBtn,
                  color: isShown ? 'var(--fg)' : 'var(--dim)',
                  fontWeight: isShown ? 600 : 400,
                }}
              >
                {isShown ? '▸ ' : ''}
                {String(i + 1).padStart(2, '0')} {project.name}
              </button>
            );
          })}
        </div>

        {/* Single-project transcript */}
        {shownProject && (
          <div key={shownProject.id} style={{ fontSize: '12.5px', lineHeight: 1.75 }}>
            {/* Fetch line */}
            <div style={{ color: 'var(--dim)', marginBottom: '14px', wordBreak: 'break-all' }}>
              {PROFILE.terminalPrompt}{' '}
              <span style={{ color: 'var(--chrome)' }}>
                {shownProject.githubUrl
                  ? `gh repo view ${PROFILE.handle}/${shownProject.name}`
                  : `cat projects/${shownProject.id}.md`}
              </span>
            </div>

            {/* Name line */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span style={{ color: 'var(--fg)', fontWeight: 600, fontSize: '13.5px' }}>{shownProject.name}</span>
              {shownProject.featured && (
                <span style={{ color: '#66cc6a', fontSize: '10px', letterSpacing: '0.06em' }}>[FEATURED]</span>
              )}
              <span style={{ color: 'var(--dim)', fontSize: '11px' }}>category: {shownProject.category}</span>
            </div>

            {/* Stat rows — project data first, then the real snapshot */}
            <div style={{ color: 'var(--chrome)', fontSize: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: 'var(--dim)' }}>language: </span>
                {shownProject.language}
                {repo?.language && repo.language !== shownProject.language ? (
                  <span style={{ color: 'var(--dim)' }}> · gh: {repo.language}</span>
                ) : null}
              </div>
              {repo && (
                <div>
                  <span style={{ color: 'var(--dim)' }}>stars: </span>
                  {repo.stars}
                  <span style={{ color: 'var(--dim)' }}> · forks: </span>
                  {repo.forks}
                  {typeof repo.license === 'string' && (
                    <>
                      <span style={{ color: 'var(--dim)' }}> · license: </span>
                      {repo.license}
                    </>
                  )}
                </div>
              )}
              {repo && (
                <div>
                  <span style={{ color: 'var(--dim)' }}>created: </span>
                  {day(repo.createdAt)}
                  <span style={{ color: 'var(--dim)' }}> · last push: </span>
                  {day(repo.pushedAt)}
                  <span style={{ color: 'var(--dim)' }}> · size: </span>
                  {formatSize(repo.sizeKb)}
                </div>
              )}
              <div>
                <span style={{ color: 'var(--dim)' }}>status: </span>
                {shownProject.stats?.status}
                <span style={{ color: 'var(--dim)' }}> · </span>
                {shownProject.stats?.updated}
              </div>
            </div>

            {/* Description + details as text */}
            <p
              style={{
                margin: '0 0 12px 0',
                color: 'color-mix(in srgb, var(--fg) 85%, transparent)',
                maxWidth: '76ch',
              }}
            >
              {shownProject.description}
            </p>
            <p
              style={{
                margin: '0 0 18px 0',
                color: 'color-mix(in srgb, var(--fg) 78%, transparent)',
                maxWidth: '76ch',
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

            {/* Source preview — plain text, no snippet box */}
            {shownProject.snippet && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: 'var(--dim)', marginBottom: '4px' }}>// source preview</div>
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
                  <code>{shownProject.snippet}</code>
                </pre>
              </div>
            )}

            {/* Actions — text commands: github / inspect (modal) / prev / next */}
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
                  view on github ↗
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
        )}

        {/* GitHub streak & activity — snapshot-fed, below the transcript */}
        <GitHubStreakTracker />
      </div>

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

import React, { useState } from 'react';
import { PROJECTS } from '../data/projects';
import type { Project } from '../types';
import { PROFILE } from '../data/profile';
import { GitHubStreakTracker } from './GitHubStreakTracker';
import { ProjectDetailModal } from './ProjectDetailModal';

interface ProjectsSectionProps {
  onOpenProjectModal?: (project: Project) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ onOpenProjectModal }) => {
  const [filter, setFilter] = useState<'all' | 'c++' | 'ai' | 'web' | 'iot'>('all');
  const [activeProject, setActiveProject] = useState<Project>(PROJECTS[0]);
  const [localModalProject, setLocalModalProject] = useState<Project | null>(null);

  const filteredProjects = PROJECTS.filter((p) => {
    if (filter === 'all') return true;
    return p.category === filter;
  });

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

  return (
    <section
      id="projects"
      className="projects-section"
      style={{
        padding: '72px 0',
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
      }}
    >
      <div className="section-container" style={{ maxWidth: '920px', margin: '0 auto', padding: '0 24px' }}>
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '11px',
                color: 'var(--dim)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              // 04 · REPOSITORIES & EXPERIMENTS
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
                fontWeight: 400,
                color: 'var(--fg)',
                letterSpacing: '-0.02em',
              }}
            >
              Selected <span style={{ fontStyle: 'italic', color: 'var(--chrome)' }}>experiments.</span>
            </h2>
          </div>

          <a
            href={PROFILE.githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '11px',
              color: 'var(--dim)',
              textDecoration: 'none',
              letterSpacing: '0.08em',
              transition: 'color 180ms ease',
            }}
          >
            view all repositories on github ↗
          </a>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '32px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '11px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { id: 'all', label: `all (${PROJECTS.length})` },
            { id: 'c++', label: `c++ & dsa (${cCount})` },
            { id: 'ai', label: `ai & vision (${aiCount})` },
            { id: 'web', label: `web development (${webCount})` },
            { id: 'iot', label: `iot & embedded (${iotCount})` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as any)}
              style={{
                background: filter === item.id ? 'var(--fg)' : 'var(--line)',
                color: filter === item.id ? 'var(--bg)' : 'var(--chrome)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '2px',
                padding: '5px 12px',
                cursor: 'pointer',
                letterSpacing: '0.06em',
                transition: 'all 180ms ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Editor-Inspired Project Container */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Project List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredProjects.map((project) => {
              const isSelected = activeProject.id === project.id;
              return (
                <div
                  key={project.id}
                  onClick={() => setActiveProject(project)}
                  className={`project-item ${isSelected ? 'is-selected' : ''}`}
                  style={{
                    background: isSelected ? 'var(--line)' : 'color-mix(in srgb, var(--line) 40%, transparent)',
                    border: isSelected
                      ? '1px solid color-mix(in srgb, var(--accent) 50%, transparent)'
                      : '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
                    borderRadius: '3px',
                    padding: '16px 18px',
                    cursor: 'pointer',
                    transition: 'all 180ms ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: isSelected ? 'var(--accent)' : 'var(--dim)', fontSize: '12px' }}>
                        {isSelected ? '▶' : '▷'}
                      </span>
                      <span
                        style={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: '13.5px',
                          fontWeight: 500,
                          color: isSelected ? 'var(--fg)' : 'var(--chrome)',
                        }}
                      >
                        {project.name}
                      </span>
                      {project.featured && (
                        <span
                          style={{
                            fontSize: '9px',
                            color: '#66cc6a',
                            border: '1px solid color-mix(in srgb, #66cc6a 40%, transparent)',
                            background: 'color-mix(in srgb, #66cc6a 10%, transparent)',
                            padding: '1px 5px',
                            borderRadius: '2px',
                            fontWeight: 600,
                          }}
                        >
                          FEATURED
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: '10px',
                          color: 'var(--dim)',
                          background: 'color-mix(in srgb, var(--bg) 70%, transparent)',
                          padding: '2px 6px',
                          borderRadius: '2px',
                        }}
                      >
                        {project.language}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(project);
                        }}
                        title="Open full project overview"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--dim)',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          fontSize: '11px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--dim)')}
                      >
                        ⤢
                      </button>
                    </div>
                  </div>

                  <p
                    style={{
                      margin: '0 0 10px 0',
                      fontFamily: '"Archivo", sans-serif',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: 'color-mix(in srgb, var(--fg) 75%, transparent)',
                      fontWeight: 350,
                    }}
                  >
                    {project.description}
                  </p>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {project.tech.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: '9.5px',
                          color: 'var(--dim)',
                          padding: '1px 5px',
                          background: 'color-mix(in srgb, var(--bg) 50%, transparent)',
                          borderRadius: '2px',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Project Inspector Buffer + Live GitHub Daily Streak Tracker */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'sticky',
              top: '80px',
            }}
          >
            {/* Active Project Inspector Buffer */}
            <div
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
                borderRadius: '3px',
                padding: '22px',
                fontFamily: '"IBM Plex Mono", monospace',
              }}
            >
              {/* Winbar Header */}
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
                }}
              >
                <span>~/Projects/{activeProject.name}</span>
                <span style={{ color: activeProject.featured ? '#66cc6a' : 'var(--accent)' }}>
                  {activeProject.featured ? '[FEATURED]' : '[PUBLIC]'}
                </span>
              </div>

              {/* Title & Language */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--fg)', marginBottom: '4px' }}>
                  {activeProject.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--dim)' }}>
                  LANGUAGE: <span style={{ color: 'var(--chrome)' }}>{activeProject.language}</span> · REPO STATUS:{' '}
                  <span style={{ color: 'var(--accent)' }}>{activeProject.stats?.status}</span>
                </div>
              </div>

              {/* In-depth details */}
              <p
                style={{
                  fontFamily: '"Archivo", sans-serif',
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: 'color-mix(in srgb, var(--fg) 85%, transparent)',
                  margin: '0 0 18px 0',
                  fontWeight: 350,
                }}
              >
                {activeProject.details}
              </p>

              {/* Code Snippet Box */}
              {activeProject.snippet && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--dim)', marginBottom: '6px', letterSpacing: '0.08em' }}>
                    // SOURCE PREVIEW
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '12px',
                      background: 'color-mix(in srgb, var(--bg) 80%, transparent)',
                      borderRadius: '2px',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      color: 'var(--chrome)',
                      overflowX: 'auto',
                      border: '1px solid color-mix(in srgb, var(--fg) 6%, transparent)',
                    }}
                  >
                    <code>{activeProject.snippet}</code>
                  </pre>
                </div>
              )}

              {/* Actions: View on GitHub + Open Detail Modal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                {activeProject.githubUrl ? (
                  <a
                    href={activeProject.githubUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: 'var(--fg)',
                      color: 'var(--bg)',
                      textDecoration: 'none',
                      borderRadius: '2px',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      transition: 'filter 180ms ease',
                    }}
                  >
                    <span>View on GitHub</span>
                    <span>↗</span>
                  </a>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: 'color-mix(in srgb, var(--bg) 60%, transparent)',
                      color: 'var(--dim)',
                      border: '1px dashed color-mix(in srgb, var(--fg) 20%, transparent)',
                      borderRadius: '2px',
                      fontSize: '11px',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Team project · no public repo yet
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenDetail(activeProject)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'color-mix(in srgb, var(--bg) 60%, transparent)',
                    color: 'var(--fg)',
                    border: '1px solid color-mix(in srgb, var(--fg) 14%, transparent)',
                    borderRadius: '2px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <span>Inspect Overview</span>
                  <span>⤢</span>
                </button>
              </div>
            </div>

            {/* Live GitHub Daily Streak & Contribution Hub */}
            <GitHubStreakTracker />
          </div>
        </div>
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

import React, { useEffect } from 'react';
import type { Project } from '../types';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!project) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 180ms ease forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          background: 'color-mix(in srgb, var(--bg) 96%, #0d0f0d)',
          border: '1px solid color-mix(in srgb, var(--fg) 16%, transparent)',
          borderRadius: '4px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
          fontFamily: '"IBM Plex Mono", monospace',
        }}
      >
        {/* Modal Windowbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
            background: 'color-mix(in srgb, var(--bg) 80%, var(--line))',
            fontSize: '11px',
            color: 'var(--chrome)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: project.featured ? '#66cc6a' : 'var(--accent)',
                boxShadow: project.featured ? '0 0 6px #66cc6a' : 'none',
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>
              ~/Projects/{project.name}
            </span>
            <span
              style={{
                fontSize: '9.5px',
                color: 'var(--dim)',
                background: 'color-mix(in srgb, var(--bg) 60%, transparent)',
                padding: '1px 6px',
                borderRadius: '2px',
              }}
            >
              {project.language}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--dim)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 6px',
              fontFamily: 'inherit',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--dim)')}
          >
            ✕ [Esc]
          </button>
        </div>

        {/* Modal Content Body */}
        <div
          className="scroll-contain"
          style={{
            padding: '24px 26px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Header block */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h2
                id="modal-project-title"
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'var(--fg)',
                  letterSpacing: '-0.01em',
                }}
              >
                {project.name}
              </h2>
              {project.featured && (
                <span
                  style={{
                    fontSize: '10px',
                    color: '#66cc6a',
                    border: '1px solid color-mix(in srgb, #66cc6a 40%, transparent)',
                    background: 'color-mix(in srgb, #66cc6a 10%, transparent)',
                    padding: '2px 8px',
                    borderRadius: '2px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                  }}
                >
                  FEATURED PROJECT
                </span>
              )}
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--chrome)',
                  background: 'color-mix(in srgb, var(--fg) 8%, transparent)',
                  padding: '2px 8px',
                  borderRadius: '2px',
                }}
              >
                STATUS: {project.stats?.status || 'Active Repository'}
              </span>
            </div>

            <p
              style={{
                margin: 0,
                fontFamily: '"Archivo", sans-serif',
                fontSize: '15px',
                lineHeight: 1.55,
                color: 'color-mix(in srgb, var(--fg) 85%, transparent)',
                fontWeight: 350,
              }}
            >
              {project.description}
            </p>
          </div>

          {/* Architecture & Implementation Details */}
          <div
            style={{
              padding: '16px 18px',
              background: 'color-mix(in srgb, var(--line) 60%, transparent)',
              border: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
              borderRadius: '3px',
            }}
          >
            <div style={{ fontSize: '10.5px', color: 'var(--dim)', letterSpacing: '0.08em', marginBottom: '6px' }}>
              // ARCHITECTURE & IMPLEMENTATION
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: '"Archivo", sans-serif',
                fontSize: '13.5px',
                lineHeight: 1.6,
                color: 'color-mix(in srgb, var(--fg) 80%, transparent)',
                fontWeight: 350,
              }}
            >
              {project.details}
            </p>
          </div>

          {/* Confirmed Technologies */}
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--dim)', letterSpacing: '0.08em', marginBottom: '8px' }}>
              // CONFIRMED TECH STACK
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {project.tech.map((t, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '11px',
                    color: 'var(--fg)',
                    background: 'color-mix(in srgb, var(--line) 90%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
                    padding: '3px 8px',
                    borderRadius: '2px',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Key Implemented Features */}
          {project.features && project.features.length > 0 && (
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--dim)', letterSpacing: '0.08em', marginBottom: '8px' }}>
                // VERIFIED IMPLEMENTED FEATURES
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontFamily: '"Archivo", sans-serif',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: 'color-mix(in srgb, var(--fg) 80%, transparent)',
                }}
              >
                {project.features.map((feat, idx) => (
                  <li key={idx}>{feat}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Code Preview */}
          {project.snippet && (
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--dim)', letterSpacing: '0.08em', marginBottom: '6px' }}>
                // SOURCE CODE PREVIEW
              </div>
              <pre
                className="scroll-contain"
                style={{
                  margin: 0,
                  padding: '14px',
                  background: 'color-mix(in srgb, var(--bg) 95%, #080908)',
                  borderRadius: '3px',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: 'var(--chrome)',
                  overflowX: 'auto',
                  border: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
                }}
              >
                <code>{project.snippet}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            borderTop: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
            background: 'color-mix(in srgb, var(--bg) 80%, var(--line))',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '10.5px', color: 'var(--dim)' }}>
            {project.githubUrl ? `github.com/Pradhan-07/${project.name}` : 'Team project · no public repository yet'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid color-mix(in srgb, var(--fg) 14%, transparent)',
                color: 'var(--chrome)',
                padding: '7px 14px',
                borderRadius: '2px',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Close
            </button>

            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 16px',
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
                <span>Open on GitHub</span>
                <span>↗</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

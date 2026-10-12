import React, { useState, useEffect, useRef } from 'react';
import type { Theme, Project } from '../../types';
import { PROFILE } from '../../data/profile';
import { PROJECTS } from '../../data/projects';
import { BrandLogo } from '../BrandLogo';
import { HeroSection } from '../HeroSection';
import { AboutSection } from '../AboutSection';
import { FocusSection } from '../FocusSection';
import { SkillsSection } from '../SkillsSection';
import { ProjectsSection } from '../ProjectsSection';
import { LearningJourney } from '../LearningJourney';
import { ContactSection } from '../ContactSection';
import { Footer } from '../Footer';
import { EditorStatusBar } from '../EditorStatusBar';
import { ProjectDetailModal } from '../ProjectDetailModal';
import { InteractiveTerminalModal } from '../InteractiveTerminalModal';
import { CommandPaletteModal } from '../CommandPaletteModal';

interface DashboardPortfolioProps {
  theme: Theme;
  onBackToIntro: () => void;
  onToggleTheme: () => void;
}

export const DashboardPortfolio: React.FC<DashboardPortfolioProps> = ({
  theme,
  onBackToIntro,
  onToggleTheme,
}) => {
  const [activeSection, setActiveSection] = useState('hero');
  const [graphMode, setGraphMode] = useState<'dsa' | 'ai' | 'web'>('dsa');
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [selectedProjectModal, setSelectedProjectModal] = useState<Project | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K and Ctrl+`)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Ctrl+` for Terminal
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Evolving interactive mathematical contour graph
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 520);
    const height = (canvas.height = 140);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Grid background markings
      ctx.strokeStyle = 'color-mix(in srgb, var(--fg) 6%, transparent)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const midY = height / 2;

      // MODE 1: DSA / C++ — Asymptotic algorithmic curves & partitions
      if (graphMode === 'dsa') {
        const curves = [
          { color: 'var(--accent)', alpha: 0.9, amp: 26, freq: 0.018, speed: 0.032 },
          { color: 'var(--chrome)', alpha: 0.5, amp: 18, freq: 0.024, speed: 0.02 },
          { color: 'var(--dim)', alpha: 0.35, amp: 12, freq: 0.038, speed: 0.04 },
        ];

        curves.forEach((c) => {
          ctx.strokeStyle = c.color;
          ctx.globalAlpha = c.alpha;
          ctx.lineWidth = 1;
          ctx.beginPath();

          for (let x = 0; x < width; x += 4) {
            let perturbation = 0;
            if (pointerPos.active) {
              const dist = Math.abs(x - pointerPos.x);
              if (dist < 80) {
                perturbation = Math.sin((80 - dist) * 0.08) * 16;
              }
            }
            const y = midY + Math.sin(x * c.freq + frame * c.speed) * c.amp + perturbation;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });

        // Pointer pivot highlight
        if (pointerPos.active) {
          ctx.strokeStyle = '#66cc6a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pointerPos.x, pointerPos.y, 14, 0, Math.PI * 2);
          ctx.stroke();
        }

        const scanX = (frame * 1.5) % width;
        ctx.strokeStyle = 'color-mix(in srgb, var(--accent) 40%, transparent)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(scanX, 0);
        ctx.lineTo(scanX, height);
        ctx.stroke();

        ctx.font = '8.5px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'var(--dim)';
        ctx.globalAlpha = 1;
        ctx.fillText(`f(x) = O(N log N) · STL RED-BLACK TREE PARTITIONS · PIVOT x:${Math.round(scanX)}`, 10, height - 8);
      }
      // MODE 2: AI / ML — Gradient descent, activation heuristics
      else if (graphMode === 'ai') {
        ctx.strokeStyle = 'var(--accent)';
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 1.2;
        ctx.beginPath();

        for (let x = 0; x < width; x += 3) {
          // Sigmoid & gradient descent convergence curve
          const normX = (x / width) * 10 - 5;
          const sigmoid = 1 / (1 + Math.exp(-normX));
          const lossDescent = Math.exp(-x / 140) * Math.sin(x * 0.05 + frame * 0.04) * 28;
          const y = midY + (sigmoid - 0.5) * 45 + lossDescent;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Pulsing Neural Nodes
        const nodePositions = [width * 0.2, width * 0.45, width * 0.7, width * 0.9];
        nodePositions.forEach((nx, nIdx) => {
          const ny = midY + Math.sin(frame * 0.05 + nIdx) * 18;
          ctx.fillStyle = '#66cc6a';
          ctx.beginPath();
          ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.font = '8.5px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'var(--dim)';
        ctx.globalAlpha = 1;
        ctx.fillText(`∇L(θ) = -η·dL/dθ · LOSS CONVERGENCE: 0.034 · TENSOR INFERENCE`, 10, height - 8);
      }
      // MODE 3: Web Dev — 60fps Event Loop & Hydration Stream
      else {
        // Frame rate square wave & telemetry packets
        ctx.strokeStyle = 'var(--chrome)';
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 0; x < width; x += 4) {
          const tick = Math.sin(x * 0.08 + frame * 0.08) > 0 ? 18 : -18;
          const ripple = pointerPos.active && Math.abs(x - pointerPos.x) < 60 ? Math.sin((frame + x) * 0.2) * 12 : 0;
          const y = midY + tick + ripple;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.font = '8.5px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'var(--dim)';
        ctx.globalAlpha = 1;
        ctx.fillText(`EVENT LOOP: 60FPS · REACT 19 HYDRATION · SUPABASE STREAMING TICK`, 10, height - 8);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [graphMode, pointerPos]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const handleCommand = (cmd: string) => {
    if (cmd === 'intro') onBackToIntro();
    else if (cmd === 'theme') onToggleTheme();
    else if (cmd === 'term' || cmd === 'terminal') setIsTerminalOpen(true);
    else if (cmd === 'dsa') scrollToSection('focus');
    else scrollToSection(cmd);
  };

  const handleOpenProjectById = (projId: string) => {
    const found = PROJECTS.find((p) => p.id === projId || p.name.toLowerCase() === projId.toLowerCase());
    if (found) {
      setSelectedProjectModal(found);
    } else {
      scrollToSection('projects');
    }
  };

  // 6 Left Project Tiles with tilt rotations
  const leftTiles: Array<{
    id: string;
    label: string;
    tilt: number;
    desc: string;
    lang?: string;
    isBrand?: boolean;
    url?: string;
    projectId?: string;
  }> = [
    { id: 'brand', label: 'KP // CORE', tilt: -2.5, desc: 'B.Tech CSE · VIT-AP', isBrand: true },
    { id: 'dsa', label: 'DSA_CPP', tilt: 1.8, desc: 'C++ Algorithms & STL', lang: 'C++', projectId: 'dsa-cpp' },
    { id: 'study', label: 'study_detection', tilt: -1.2, desc: 'Vision Attention Tracker', lang: 'Python', projectId: 'study-detection' },
    { id: 'magic', label: 'magic_hand', tilt: 2.2, desc: 'Real-time Hand Gestures', lang: 'Python', projectId: 'magic-hand' },
    {
      id: 'indstate',
      label: 'indstate',
      tilt: -1.5,
      desc: 'Trusted Property Marketplace',
      lang: 'React',
      url: 'https://github.com/Pradhan-07/indstate',
      projectId: 'indstate',
    },
    { id: 'glow', label: 'flowerglow', tilt: 1.6, desc: 'Interactive Canvas UI', lang: 'Canvas', projectId: 'flowerglow' },
  ];

  return (
    <div
      className="dashboard-portfolio-wrapper"
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        background: 'color-mix(in srgb, var(--bg) 96%, transparent)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 32px',
          background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '11px',
        }}
      >
        <button
          type="button"
          onClick={onBackToIntro}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: 'none',
            border: 'none',
            color: 'var(--fg)',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit',
          }}
        >
          <BrandLogo size={18} />
          <span style={{ fontWeight: 500 }}>{PROFILE.domain}</span>
          <span
            style={{
              fontSize: '9.5px',
              padding: '1px 5px',
              background: 'var(--line)',
              borderRadius: '2px',
              color: 'var(--dim)',
            }}
          >
            intro ↩
          </span>
        </button>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="nav-links">
          {['whoami', 'focus', 'stack', 'experiments', 'journey', 'contact'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() =>
                scrollToSection(
                  item === 'whoami'
                    ? 'hero'
                    : item === 'stack'
                    ? 'skills'
                    : item === 'experiments'
                    ? 'projects'
                    : item
                )
              }
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--dim)',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '2px',
                fontSize: '11px',
                letterSpacing: '0.04em',
                transition: 'color 180ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--dim)')}
            >
              {item}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quick Palette Trigger */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Open Command Palette (Cmd+K / Ctrl+K)"
            style={{
              background: 'var(--line)',
              border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
              borderRadius: '2px',
              padding: '4px 7px',
              color: 'var(--chrome)',
              cursor: 'pointer',
              fontSize: '10.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>⌘K</span>
          </button>

          {/* Quick Terminal Trigger */}
          <button
            type="button"
            onClick={() => setIsTerminalOpen(true)}
            title="Open Interactive Terminal"
            style={{
              background: 'var(--line)',
              border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
              borderRadius: '2px',
              padding: '4px 7px',
              color: 'var(--chrome)',
              cursor: 'pointer',
              fontSize: '10.5px',
            }}
          >
            &gt;_ term
          </button>

          {/* Theme switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            style={{
              background: 'var(--line)',
              border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
              borderRadius: '2px',
              padding: '4px 8px',
              color: 'var(--chrome)',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            <span style={{ color: 'var(--accent)' }}>:</span>
            <span>{theme.label}</span>
          </button>

          <a
            href={PROFILE.githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: 'var(--dim)', textDecoration: 'none' }}
          >
            github ↗
          </a>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3-AREA DASHBOARD COCKPIT (Frames 13 - 19) */}
      {/* ========================================================================= */}
      <section
        className="cockpit-dashboard-section"
        style={{
          maxWidth: '1200px',
          margin: '24px auto 48px auto',
          padding: '0 24px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '170px 1fr 190px',
            gap: '24px',
            alignItems: 'start',
          }}
          className="cockpit-grid"
        >
          {/* AREA 1: LEFT VERTICAL COLUMN OF TILTED PROJECT TILES (Frame 14) */}
          <div
            className="left-tiles-column"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'relative',
            }}
          >
            {/* Vertical connector line / filament */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                bottom: '10px',
                left: '50%',
                width: '1px',
                background: 'color-mix(in srgb, var(--fg) 12%, transparent)',
                zIndex: 0,
              }}
            />

            {leftTiles.map((tile) => {
              const cardContent = tile.isBrand ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BrandLogo size={18} />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fg)' }}>{tile.label}</div>
                    <div style={{ fontSize: '8.5px', color: 'var(--dim)' }}>{tile.desc}</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--fg)' }}>{tile.label}</span>
                    <span style={{ fontSize: '8px', color: 'var(--accent)', background: 'var(--bg)', padding: '1px 4px', borderRadius: '2px' }}>{tile.lang}</span>
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'var(--dim)', lineHeight: 1.3 }}>{tile.desc}</div>
                </div>
              );

              const cardStyle: React.CSSProperties = {
                position: 'relative',
                zIndex: 1,
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 14%, transparent)',
                borderRadius: '3px',
                padding: '10px 12px',
                transform: `rotate(${tile.tilt}deg)`,
                transition: 'transform 200ms ease, border-color 200ms ease',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                fontFamily: '"IBM Plex Mono", monospace',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
              };

              // If has project details, click opens the detail modal for rich inspection
              const handleClick = (e: React.MouseEvent) => {
                if (tile.projectId) {
                  e.preventDefault();
                  handleOpenProjectById(tile.projectId);
                } else if (tile.isBrand) {
                  scrollToSection('hero');
                } else {
                  scrollToSection('projects');
                }
              };

              return (
                <div
                  key={tile.id}
                  onClick={handleClick}
                  style={cardStyle}
                  title={`Inspect ${tile.label}`}
                >
                  {cardContent}
                </div>
              );
            })}
          </div>

          {/* AREA 2: CENTRAL TERMINAL PANEL WITH INTERACTIVE GRAPH & WHOAMI */}
          <div
            className="center-terminal-panel"
            style={{
              background: 'color-mix(in srgb, var(--bg) 95%, #101010)',
              border: '1px solid color-mix(in srgb, var(--fg) 14%, transparent)',
              borderRadius: '3px',
              padding: '20px 24px',
              fontFamily: '"IBM Plex Mono", monospace',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Terminal Header & Mode Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
                paddingBottom: '10px',
                marginBottom: '16px',
                fontSize: '11px',
                color: 'var(--chrome)',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <span>fish ~ · KARAN-DEV</span>

              {/* Interactive Graph Mode Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {(['dsa', 'ai', 'web'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setGraphMode(m)}
                    style={{
                      background: graphMode === m ? 'var(--accent)' : 'transparent',
                      color: graphMode === m ? 'var(--bg)' : 'var(--dim)',
                      border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                      borderRadius: '2px',
                      padding: '2px 6px',
                      fontSize: '9.5px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  >
                    {m === 'dsa' ? 'DSA / C++' : m === 'ai' ? 'AI / ML' : 'WEB DEV'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Graph Canvas with pointer tracking */}
            <div
              style={{ position: 'relative', marginBottom: '20px', width: '100%' }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPointerPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
              }}
              onMouseLeave={() => setPointerPos((prev) => ({ ...prev, active: false }))}
              onTouchMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const touch = e.touches[0];
                if (touch) {
                  setPointerPos({ x: touch.clientX - rect.left, y: touch.clientY - rect.top, active: true });
                }
              }}
              onTouchEnd={() => setPointerPos((prev) => ({ ...prev, active: false }))}
            >
              <canvas
                ref={graphCanvasRef}
                style={{
                  width: '100%',
                  height: '140px',
                  display: 'block',
                  background: 'color-mix(in srgb, var(--bg) 90%, #060806)',
                  borderRadius: '2px',
                  border: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
                  cursor: 'crosshair',
                }}
              />
            </div>

            {/* Telemetry Summary Badges */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                marginBottom: '20px',
                fontSize: '10px',
              }}
            >
              <div
                onClick={() => scrollToSection('focus')}
                style={{ background: 'var(--line)', padding: '8px 10px', borderRadius: '2px', cursor: 'pointer' }}
              >
                <div style={{ color: 'var(--dim)', fontSize: '8.5px' }}>CURRENT FOCUS</div>
                <div style={{ color: 'var(--fg)', fontWeight: 600, marginTop: '2px' }}>DSA / C++ ↗</div>
              </div>
              <div
                onClick={() => scrollToSection('focus')}
                style={{ background: 'var(--line)', padding: '8px 10px', borderRadius: '2px', cursor: 'pointer' }}
              >
                <div style={{ color: 'var(--dim)', fontSize: '8.5px' }}>EXPLORING</div>
                <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}>AI / ML ↗</div>
              </div>
              <div
                onClick={() => scrollToSection('projects')}
                style={{ background: 'var(--line)', padding: '8px 10px', borderRadius: '2px', cursor: 'pointer' }}
              >
                <div style={{ color: 'var(--dim)', fontSize: '8.5px' }}>BUILDING</div>
                <div style={{ color: 'var(--chrome)', fontWeight: 600, marginTop: '2px' }}>WEB DEVELOPMENT ↗</div>
              </div>
            </div>

            {/* whoami Command & Profile Reveal */}
            <div
              style={{
                borderTop: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
                paddingTop: '16px',
                fontSize: '12px',
                lineHeight: 1.6,
              }}
            >
              <div style={{ color: 'var(--dim)', marginBottom: '4px' }}>
                karan@dev ~ <span style={{ color: 'var(--accent)' }}>&gt; whoami</span>
              </div>
              <div style={{ color: 'var(--fg)', fontWeight: 600, fontSize: '14px' }}>
                {PROFILE.name}
              </div>
              <div style={{ color: 'var(--chrome)', fontSize: '11px', marginBottom: '8px' }}>
                {PROFILE.subtitle}
              </div>
              <p
                style={{
                  margin: '0 0 14px 0',
                  fontFamily: '"Archivo", sans-serif',
                  fontSize: '13px',
                  color: 'color-mix(in srgb, var(--fg) 80%, transparent)',
                  lineHeight: 1.6,
                  fontWeight: 350,
                }}
              >
                Second-year B.Tech Computer Science Engineering student focused on strengthening programming fundamentals, algorithmic problem solving in C++, and exploring intelligent systems and modern web technologies.
              </p>

              {/* Command-style Navigation Links */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11px' }}>
                <button
                  type="button"
                  onClick={() => scrollToSection('projects')}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', font: 'inherit' }}
                >
                  &gt; projects ↵
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('journey')}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', font: 'inherit' }}
                >
                  &gt; learning ↵
                </button>
                <button
                  type="button"
                  onClick={() => setIsTerminalOpen(true)}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#66cc6a', cursor: 'pointer', font: 'inherit' }}
                >
                  &gt; terminal ↵
                </button>
              </div>
            </div>
          </div>

          {/* AREA 3: RIGHT MEANINGFUL TELEMETRY & ACTIONS PANEL (Requirement 6) */}
          <div
            className="right-cluster-column"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '10.5px',
            }}
          >
            {/* Status & Engineering Matrix */}
            <div
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '3px',
                padding: '14px',
              }}
            >
              <div style={{ color: 'var(--dim)', fontSize: '9px', marginBottom: '8px', letterSpacing: '0.06em' }}>
                // STATUS & PROFILE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--chrome)' }}>
                <div>
                  <span style={{ color: 'var(--dim)', fontSize: '9px' }}>CURRENT FOCUS: </span>
                  <a
                    href="#focus"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('focus');
                    }}
                    style={{ color: 'var(--fg)', textDecoration: 'none', fontWeight: 600 }}
                  >
                    DSA / C++ ↗
                  </a>
                </div>
                <div>
                  <span style={{ color: 'var(--dim)', fontSize: '9px' }}>EXPLORING: </span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>AI / ML</span>
                </div>
                <div>
                  <span style={{ color: 'var(--dim)', fontSize: '9px' }}>BUILDING: </span>
                  <span style={{ color: 'var(--chrome)', fontWeight: 600 }}>Web Development</span>
                </div>
                <div>
                  <span style={{ color: 'var(--dim)', fontSize: '9px' }}>STATUS: </span>
                  <span style={{ color: 'var(--dim)' }}>Learning & building @ VIT-AP</span>
                </div>
              </div>
            </div>

            {/* Featured Project Card: indstate */}
            <div
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, #66cc6a 30%, transparent)',
                borderRadius: '3px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#66cc6a', fontSize: '9px', fontWeight: 600 }}>// FEATURED PROJECT</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#66cc6a', boxShadow: '0 0 6px #66cc6a' }} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)', marginBottom: '3px' }}>
                indstate
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--dim)', marginBottom: '10px' }}>
                Trusted Property Marketplace [React · Supabase]
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenProjectById('indstate')}
                  style={{
                    background: 'var(--fg)',
                    color: 'var(--bg)',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '2px',
                    fontSize: '9.5px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Overview ⤢
                </button>
                <a
                  href="https://github.com/Pradhan-07/indstate"
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{
                    background: 'transparent',
                    border: '1px solid color-mix(in srgb, var(--fg) 14%, transparent)',
                    color: 'var(--chrome)',
                    padding: '3px 8px',
                    borderRadius: '2px',
                    fontSize: '9.5px',
                    textDecoration: 'none',
                  }}
                >
                  GitHub ↗
                </a>
              </div>
            </div>

            {/* Quick Interactive Command Launchers */}
            <div
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '3px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ color: 'var(--dim)', fontSize: '9px' }}>// TOOLS & SHORTCUTS</div>
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'color-mix(in srgb, var(--bg) 60%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                  padding: '5px 8px',
                  borderRadius: '2px',
                  color: 'var(--fg)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'inherit',
                }}
              >
                <span>Command Palette</span>
                <span style={{ color: 'var(--dim)' }}>⌘K</span>
              </button>
              <button
                type="button"
                onClick={() => setIsTerminalOpen(true)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'color-mix(in srgb, var(--bg) 60%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                  padding: '5px 8px',
                  borderRadius: '2px',
                  color: 'var(--fg)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'inherit',
                }}
              >
                <span>Interactive Terminal</span>
                <span style={{ color: 'var(--dim)' }}>&gt;_</span>
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM INFORMATION BAR (Frame 18) */}
        <div
          style={{
            marginTop: '24px',
            background: 'var(--line)',
            border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
            borderRadius: '2px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '10.5px',
            color: 'var(--chrome)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>KARAN-DEV</span>
            <span>LANGUAGE: <strong style={{ color: 'var(--accent)' }}>C++</strong></span>
            <span>FOCUS: <strong style={{ color: 'var(--fg)' }}>DSA</strong></span>
            <span>EXPLORING: <strong style={{ color: 'var(--chrome)' }}>AI/ML</strong></span>
            <span>INTEREST: <strong style={{ color: 'var(--chrome)' }}>WEB DEV</strong></span>
            <span>FEATURED: <strong style={{ color: '#66cc6a' }}>indstate</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--dim)' }}>STATUS: LEARNING &amp; BUILDING</span>
            <span style={{ color: '#66cc6a' }}>●</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* COMPLETE PORTFOLIO CONTENT SECTIONS (Part 4) */}
      {/* ========================================================================= */}
      <main style={{ flex: 1, paddingBottom: '40px' }}>
        <HeroSection onExploreClick={() => scrollToSection('projects')} />
        <AboutSection />
        <FocusSection />
        <SkillsSection />
        <ProjectsSection onOpenProjectModal={(p) => setSelectedProjectModal(p)} />
        <LearningJourney />
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer onBackToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })} onBackToIntro={onBackToIntro} />

      {/* Vim Bottom Status Bar */}
      <EditorStatusBar
        theme={theme}
        onCommand={handleCommand}
        activeSection={activeSection}
      />

      {/* Interactive Project Detail Modal */}
      {selectedProjectModal && (
        <ProjectDetailModal
          project={selectedProjectModal}
          onClose={() => setSelectedProjectModal(null)}
        />
      )}

      {/* Interactive Command Terminal Modal */}
      <InteractiveTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onNavigate={scrollToSection}
        onToggleTheme={onToggleTheme}
        onOpenProject={handleOpenProjectById}
      />

      {/* Command Palette Modal (Cmd+K / Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={scrollToSection}
        onToggleTheme={onToggleTheme}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        onOpenProjectDetail={handleOpenProjectById}
      />
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import type { Theme } from '../../types';
import { PROFILE } from '../../data/profile';
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
  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Evolving mathematical contour graph in the central terminal panel
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 520);
    let height = (canvas.height = 140);

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

      // Mathematical curves (Sine + Cosine harmonics simulating algorithmic complexity)
      const curves = [
        { color: 'var(--accent)', alpha: 0.85, amp: 28, freq: 0.015, speed: 0.03 },
        { color: 'var(--chrome)', alpha: 0.45, amp: 20, freq: 0.022, speed: 0.02 },
        { color: 'var(--dim)', alpha: 0.35, amp: 14, freq: 0.035, speed: 0.04 },
      ];

      curves.forEach((c) => {
        ctx.strokeStyle = c.color;
        ctx.globalAlpha = c.alpha;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const midY = height / 2;

        for (let x = 0; x < width; x += 4) {
          const y = midY + Math.sin(x * c.freq + frame * c.speed) * c.amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Moving scanning coordinate indicator
      const scanX = (frame * 1.5) % width;
      ctx.strokeStyle = 'color-mix(in srgb, var(--accent) 40%, transparent)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(scanX, 0);
      ctx.lineTo(scanX, height);
      ctx.stroke();

      // Coordinates text readout
      ctx.font = '8px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'var(--dim)';
      ctx.globalAlpha = 1;
      ctx.fillText(`f(x)=O(N log N) · x:${Math.round(scanX)}`, 10, height - 8);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

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
    else scrollToSection(cmd);
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
  }> = [
    { id: 'brand', label: 'KP // CORE', tilt: -2.5, desc: 'B.Tech CSE · VIT-AP', isBrand: true },
    { id: 'dsa', label: 'DSA_CPP', tilt: 1.8, desc: 'C++ Algorithms & STL', lang: 'C++' },
    { id: 'study', label: 'study_detection', tilt: -1.2, desc: 'Vision Attention Tracker', lang: 'Python' },
    { id: 'magic', label: 'magic_hand', tilt: 2.2, desc: 'Real-time Hand Gestures', lang: 'Python' },
    {
      id: 'indstate',
      label: 'indstate',
      tilt: -1.5,
      desc: 'Trusted Property Marketplace',
      lang: 'React',
      url: 'https://github.com/Pradhan-07/indstate',
    },
    { id: 'glow', label: 'flowerglow', tilt: 1.6, desc: 'Interactive Canvas UI', lang: 'Canvas' },
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
              onClick={() => scrollToSection(item === 'whoami' ? 'hero' : item === 'stack' ? 'skills' : item === 'experiments' ? 'projects' : item)}
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
            >
              {item}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            gridTemplateColumns: '170px 1fr 180px',
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

              if (tile.url) {
                return (
                  <a
                    key={tile.id}
                    href={tile.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    style={cardStyle}
                  >
                    {cardContent}
                  </a>
                );
              }

              return (
                <div
                  key={tile.id}
                  onClick={() => scrollToSection('projects')}
                  style={cardStyle}
                >
                  {cardContent}
                </div>
              );
            })}
          </div>

          {/* AREA 2: CENTRAL TERMINAL PANEL WITH GRAPH & WHOAMI (Frames 15 & 16) */}
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
            {/* Terminal Header */}
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
              }}
            >
              <span>fish ~ · KARAN-DEV</span>
              <span style={{ color: 'var(--accent)', fontSize: '10px' }}>[SYSTEM: RUNNING]</span>
            </div>

            {/* Interactive Contour Graph */}
            <div style={{ position: 'relative', marginBottom: '20px', width: '100%' }}>
              <canvas
                ref={graphCanvasRef}
                style={{
                  width: '100%',
                  height: '140px',
                  display: 'block',
                  background: 'color-mix(in srgb, var(--bg) 80%, transparent)',
                  borderRadius: '2px',
                  border: '1px solid color-mix(in srgb, var(--fg) 6%, transparent)',
                }}
              />
            </div>

            {/* 3 Compact Focus Data Badges under graph */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                marginBottom: '20px',
                fontSize: '10px',
              }}
            >
              <div style={{ background: 'var(--line)', padding: '8px 10px', borderRadius: '2px' }}>
                <div style={{ color: 'var(--dim)', fontSize: '8.5px' }}>CURRENT FOCUS</div>
                <div style={{ color: 'var(--fg)', fontWeight: 600, marginTop: '2px' }}>DSA / C++</div>
              </div>
              <div style={{ background: 'var(--line)', padding: '8px 10px', borderRadius: '2px' }}>
                <div style={{ color: 'var(--dim)', fontSize: '8.5px' }}>EXPLORING</div>
                <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}>AI / ML</div>
              </div>
              <div style={{ background: 'var(--line)', padding: '8px 10px', borderRadius: '2px' }}>
                <div style={{ color: 'var(--dim)', fontSize: '8.5px' }}>BUILDING</div>
                <div style={{ color: 'var(--chrome)', fontWeight: 600, marginTop: '2px' }}>WEB DEVELOPMENT</div>
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
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    font: 'inherit',
                  }}
                >
                  &gt; projects ↵
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('journey')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    font: 'inherit',
                  }}
                >
                  &gt; learning ↵
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('contact')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    font: 'inherit',
                  }}
                >
                  &gt; contact ↵
                </button>
              </div>
            </div>
          </div>

          {/* AREA 3: RIGHT GENERATIVE CLUSTER & COORDINATES (Frame 17) */}
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
            {/* Telemetry card */}
            <div
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '3px',
                padding: '14px',
              }}
            >
              <div style={{ color: 'var(--dim)', fontSize: '9px', marginBottom: '6px' }}>// COORDINATES</div>
              <div style={{ color: 'var(--chrome)', lineHeight: 1.5 }}>
                <div>X: 42.802</div>
                <div>Y: 88.419</div>
                <div>Z: 0.941</div>
                <div style={{ color: 'var(--accent)', marginTop: '4px' }}>STATE: ACTIVE</div>
              </div>
            </div>

            {/* Code Fragment Box */}
            <div
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '3px',
                padding: '14px',
              }}
            >
              <div style={{ color: 'var(--dim)', fontSize: '9px', marginBottom: '6px' }}>// CODE CORE</div>
              <div style={{ color: 'var(--dim)', fontSize: '9.5px', lineHeight: 1.4, whiteSpace: 'pre' }}>
{`template <T>
class Heap {
  vector<T> a;
};`}
              </div>
            </div>

            {/* Geometric Crosshair Box */}
            <div
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '3px',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '16px', color: 'var(--dim)', letterSpacing: '4px' }}>+ · +</div>
              <div style={{ fontSize: '8.5px', color: 'var(--dim)', marginTop: '6px' }}>ENGINEERED WITH CURIOSITY</div>
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--dim)' }}>STATUS: LEARNING</span>
            <span style={{ color: 'var(--accent)' }}>●</span>
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
        <ProjectsSection />
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
    </div>
  );
};

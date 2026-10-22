import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Theme, Project, EditorFileId } from '../../types';
import { PROFILE } from '../../data/profile';
import { PROJECTS } from '../../data/projects';
import { EDITOR_FILES } from '../../data/editorFiles';
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
import { EditorFileNav } from './EditorFileNav';
import { FileBuffer } from './FileBuffer';
import { WatchingGlyph } from './WatchingGlyph';
import { CockpitGraph } from './CockpitGraph';
import { DeskStrip } from './DeskStrip';
import { BitCreature, type BitState } from './BitCreature';
import { CertificationsSection } from '../CertificationsSection';
import { LeetCodeSection } from '../LeetCodeSection';
import { ThemesSection } from '../ThemesSection';
import { ProjectDetailModal } from '../ProjectDetailModal';
import { InteractiveTerminalModal } from '../InteractiveTerminalModal';
import { CommandPaletteModal } from '../CommandPaletteModal';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { normalisedWheelDelta } from '../../hooks/useWheelStepper';

interface DashboardPortfolioProps {
  theme: Theme;
  onBackToIntro: () => void;
  onToggleTheme: () => void;
  onSelectTheme: (index: number) => void;
}

export const DashboardPortfolio: React.FC<DashboardPortfolioProps> = ({
  theme,
  onBackToIntro,
  onToggleTheme,
  onSelectTheme,
}) => {
  const [activeSection, setActiveSection] = useState('hero');
  const [activeFile, setActiveFile] = useState<EditorFileId>('about');
  const [selectedProjectModal, setSelectedProjectModal] = useState<Project | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  // G7: Bit, the stray node — the shell owns his awake flag (the bar's
  // den button toggles it) and mirrors his state for the NODE: readout.
  const [bitAwake, setBitAwake] = useState(false);
  const [bitState, setBitState] = useState<BitState>('sleeping');
  // G6: the desk height is owned by the --desk-h CSS token (height bands
  // in index.css); resolve it to px for DeskStrip's height prop so the
  // strip, the stage grid row and Bit's ground line all agree.
  const [deskHeightPx, setDeskHeightPx] = useState(0);
  useEffect(() => {
    const read = () => {
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--desk-h'));
      setDeskHeightPx(Number.isFinite(v) && v > 0 ? v : 0);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);
  const reducedMotion = usePrefersReducedMotion();

  const bufferRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  // Per-file buffer scroll memory (SCROLL-SPEC §4.6): each file is a
  // buffer — leaving and returning restores its scroll position. Explicit
  // anchor navigation overrides the remembered position.
  const scrollMemoryRef = useRef<Partial<Record<EditorFileId, number>>>({});
  const activeFileRef = useRef<EditorFileId>('about');
  const pendingAnchorRef = useRef<string | null>(null);
  const navFocusPendingRef = useRef(false);

  const activeFileSpec = EDITOR_FILES.find((f) => f.id === activeFile) ?? EDITOR_FILES[0];

  // --- File model -----------------------------------------------------------
  // Opening a file swaps only the buffer content; the stage chrome stays put.
  const openFile = useCallback((fileId: EditorFileId, anchorSection?: string) => {
    const spec = EDITOR_FILES.find((f) => f.id === fileId) ?? EDITOR_FILES[0];
    // Remember where the outgoing file was scrolled to (buffer semantics).
    if (bufferRef.current) {
      scrollMemoryRef.current[activeFileRef.current] = bufferRef.current.scrollTop;
    }
    activeFileRef.current = spec.id;
    pendingAnchorRef.current = anchorSection && anchorSection !== spec.section ? anchorSection : null;
    setActiveFile(spec.id);
    setActiveSection(anchorSection ?? spec.section);
  }, []);

  // Legacy section ids (hero, focus, skills, …) resolve to their file.
  // Phase 5 bug fix (59-point verification, the one FAIL): the status
  // bar's `:stack` command sends the FILE ID 'stack', but the stack
  // file's legacy section is 'skills' — a section-only lookup missed and
  // fell through to about.tsx. Resolution now also matches file ids, so
  // 'stack' opens stack.ts exactly like the header nav (which pre-maps
  // stack → skills) does. All other command mappings were verified
  // working live and resolve identically under the widened lookup:
  // whoami/about → about.tsx, focus → about's #focus anchor,
  // experiments → projects.tsx, journey/contact/certifications/
  // leetcode/themes → their files' sections.
  const openSection = useCallback(
    (sectionId: string) => {
      const spec =
        EDITOR_FILES.find((f) => f.section === sectionId) ??
        EDITOR_FILES.find((f) => f.id === sectionId);
      if (spec) {
        openFile(spec.id, sectionId);
      } else {
        // hero and focus both live inside about.tsx
        openFile('about', sectionId);
      }
    },
    [openFile]
  );

  const stepFile = useCallback(
    (direction: 1 | -1) => {
      const idx = EDITOR_FILES.findIndex((f) => f.id === activeFile);
      const next = EDITOR_FILES[(idx + direction + EDITOR_FILES.length) % EDITOR_FILES.length];
      openFile(next.id);
    },
    [activeFile, openFile]
  );

  // After a file switch: jump to a pending anchor (such as #focus) when
  // one was requested, otherwise restore the file's remembered scroll
  // position; move focus to the new tree item when the switch came from
  // keyboard navigation inside the tree.
  useEffect(() => {
    if (navFocusPendingRef.current) {
      navFocusPendingRef.current = false;
      document.querySelector<HTMLButtonElement>(`[data-file-button="${activeFile}"]`)?.focus();
    }
    const buffer = bufferRef.current;
    if (!buffer) return;
    const anchor = pendingAnchorRef.current;
    pendingAnchorRef.current = null;
    const raf = requestAnimationFrame(() => {
      if (anchor) {
        const el = document.getElementById(anchor);
        if (el) {
          const top = el.getBoundingClientRect().top - buffer.getBoundingClientRect().top + buffer.scrollTop;
          buffer.scrollTo({ top: Math.max(0, top - 4), behavior: reducedMotion ? 'auto' : 'smooth' });
          // The anchor landing becomes this file's remembered position.
          scrollMemoryRef.current[activeFile] = Math.max(0, top - 4);
          return;
        }
      }
      // No anchor: restore the file's remembered position (first visit = 0).
      // Restoration is never animated, reduced motion or not (§4.6).
      buffer.scrollTo({ top: scrollMemoryRef.current[activeFile] ?? 0, behavior: 'auto' });
    });
    return () => cancelAnimationFrame(raf);
  }, [activeFile, reducedMotion]);

  // Stage wheel routing (SCROLL-SPEC §4.3): wheel over non-scrollable
  // stage chrome (header, winbar, gutter, status bar) scrolls the buffer
  // instead of dying — the pointer's resting place never disables the
  // primary input. Zones that own their wheel behaviour bail out first.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleStageWheel = (e: WheelEvent) => {
      // Any overlay open: overlays own their wheel behaviour entirely.
      if (isCommandPaletteOpen || isTerminalOpen || selectedProjectModal) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // The tree's own stepper owns its surface…
      if (target.closest('[data-editor-file-nav]')) return;
      // …the buffer scrolls natively…
      if (target.closest('.file-buffer-scroll')) return;
      // …and dialogs / form fields keep native behaviour.
      if (target.closest('[role="dialog"], input, textarea, select, [contenteditable="true"]')) return;

      const buffer = bufferRef.current;
      if (!buffer) return;
      e.preventDefault();
      buffer.scrollTop += normalisedWheelDelta(e);
    };

    stage.addEventListener('wheel', handleStageWheel, { passive: false });
    return () => stage.removeEventListener('wheel', handleStageWheel);
  }, [isCommandPaletteOpen, isTerminalOpen, selectedProjectModal]);

  // Global keyboard: Cmd/Ctrl+K palette, Ctrl+` terminal, and the
  // file-stepping keys (arrows / j / k) with modal + typing focus guards.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }
      // Ctrl+` for Terminal
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
        return;
      }

      // File stepping stands down while any overlay is open…
      if (isCommandPaletteOpen || isTerminalOpen || selectedProjectModal) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const inFileTree = Boolean(target.closest('[data-editor-file-nav]'));
      if (!inFileTree) {
        // …while typing in any field…
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
        // …and while focus sits on an interactive control inside the buffer
        // (its own arrow/key behaviour wins). The buffer region itself and
        // plain content remain valid stepping contexts.
        if (target.closest('button, a, input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      }

      let direction: 1 | -1 | 0 = 0;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') direction = 1;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') direction = -1;
      if (!direction) return;

      e.preventDefault();
      if (inFileTree) navFocusPendingRef.current = true;
      stepFile(direction);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepFile, isCommandPaletteOpen, isTerminalOpen, selectedProjectModal]);

  // All existing navigation call sites (header, cockpit, terminal, palette,
  // status-bar commands) keep calling scrollToSection — it now resolves the
  // section to its editor file and swaps the buffer instead of scrolling
  // the document.
  const scrollToSection = openSection;

  const handleBackToTop = () => {
    openFile('about');
    scrollMemoryRef.current.about = 0;
    bufferRef.current?.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  // Leaving for the intro puts Bit back to sleep (G7) — returning to
  // the portfolio does not resurrect him.
  const handleBackToIntro = useCallback(() => {
    setBitAwake(false);
    setBitState('sleeping');
    onBackToIntro();
  }, [onBackToIntro]);

  const handleCommand = (cmd: string) => {
    if (cmd === 'intro') handleBackToIntro();
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

  return (
    <div
      ref={stageRef}
      className="dashboard-portfolio-wrapper editor-stage"
      style={{
        position: 'relative',
        zIndex: 10,
        height: '100svh',
        // Below 560px viewport height the stage compresses instead of
        // clipping the bottom bar off-screen (SCROLL-SPEC §4.8).
        minHeight: 'min(560px, 100svh)',
        overflow: 'hidden',
        background: 'color-mix(in srgb, var(--bg) 96%, transparent)',
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) var(--bar-h) minmax(0, var(--desk-h))',
      }}
    >
      {/* Top Header — frame row of the stage */}
      <header
        className="stage-header"
        style={{
          position: 'relative',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--sp-2) var(--frame-x)',
          background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '11px',
        }}
      >
        <button
          type="button"
          className="hdr-btn"
          onClick={handleBackToIntro}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--sp-2)',
            background: 'none',
            border: 'none',
            color: 'var(--fg)',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit',
          }}
        >
          <BrandLogo size={18} />
          <span className="stage-brand-text" style={{ fontWeight: 500 }}>{PROFILE.domain}</span>
          <span
            style={{
              fontSize: '9.5px',
              padding: '1px 5px',
              background: 'var(--line)',
              borderRadius: 'var(--radius)',
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
                borderRadius: 'var(--radius)',
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
            className="hdr-btn"
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Open Command Palette (Cmd+K / Ctrl+K)"
            style={{
              background: 'var(--line)',
              border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
              borderRadius: 'var(--radius)',
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
            className="hdr-btn"
            onClick={() => setIsTerminalOpen(true)}
            title="Open Interactive Terminal"
            style={{
              background: 'var(--line)',
              border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
              borderRadius: 'var(--radius)',
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
            className="hdr-btn"
            onClick={onToggleTheme}
            style={{
              background: 'var(--line)',
              border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
              borderRadius: 'var(--radius)',
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

      {/* Editor workspace: file tree + the one buffer. Only the buffer scrolls. */}
      <div
        className="editor-workspace"
        style={{
          display: 'grid',
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <EditorFileNav activeFile={activeFile} onNavigate={(f) => openFile(f)} onStepFile={stepFile} />

        <FileBuffer file={activeFileSpec} bufferRef={bufferRef}>
          {/* about.tsx — cockpit + hero + about + focus. Inactive files stay
              mounted but hidden, so interactive state (skills pane, project
              filter, streak tracker) survives file switches. */}
          <div hidden={activeFile !== 'about'} className="editor-file-pane" style={{ position: 'relative' }}>
          {/* Phase 7: the watching glyph — an original parametric ASCII
              eye for the About buffer's right margin. It self-gates on
              viewport width and the empty margin measured beside the
              whoami paragraph (the data-watching-anchor below), and
              stays display:none when there genuinely is no room. */}
          <WatchingGlyph />

      {/* ========================================================================= */}
      {/* ABOUT OPENER — the cockpit, absorbed (G5). The animated graph is    */}
      {/* now this buffer's header visual and the whoami panel its opening    */}
      {/* lines. Status readouts live in the bottom bar; the project tiles   */}
      {/* became the pinned rows at the top of projects.tsx; the wireframe   */}
      {/* hands/keyboard motif lives on in the desk strip (G6).              */}
      {/* ========================================================================= */}
      <section className="about-opener file-section">
        <div className="section-container">
          <CockpitGraph onNavigate={scrollToSection} />

          {/* whoami — the About buffer's opening lines. Phase 5 (visual
              parity): no terminal CARD — the buffer opens as bare
              transcript text on empty space: a prompt line, then its
              output lines, token-coloured. Same content, same nav
              commands below. */}
          <div
            className="whoami-block"
            style={{
              marginTop: 'var(--sp-3)',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '12.5px',
              lineHeight: 1.6,
            }}
          >
            <div style={{ color: 'var(--dim)', marginBottom: '6px' }}>
              {PROFILE.terminalPrompt} <span style={{ color: 'var(--accent)' }}>whoami</span>
            </div>
            <div style={{ color: 'var(--fg)', fontWeight: 600, fontSize: '14px' }}>
              {PROFILE.name}
            </div>
            <div style={{ color: 'var(--chrome)', fontSize: '11.5px', marginBottom: '10px' }}>
              {PROFILE.subtitle}
            </div>
            <p
              data-watching-anchor="whoami"
              style={{
                margin: '0 0 14px 0',
                fontSize: '12.5px',
                color: 'color-mix(in srgb, var(--fg) 82%, transparent)',
                lineHeight: 1.75,
                maxWidth: '76ch',
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
      </section>

      {/* ========================================================================= */}
      {/* COMPLETE PORTFOLIO CONTENT SECTIONS (Part 4) */}
      {/* ========================================================================= */}
      <HeroSection onExploreClick={() => scrollToSection('projects')} />
          <AboutSection />
          <FocusSection />
          </div>

          <div hidden={activeFile !== 'certifications'} className="editor-file-pane">
            <CertificationsSection />
          </div>

          <div hidden={activeFile !== 'projects'} className="editor-file-pane">
            <ProjectsSection onOpenProjectModal={(p) => setSelectedProjectModal(p)} />
          </div>

          <div hidden={activeFile !== 'stack'} className="editor-file-pane">
            <SkillsSection />
          </div>

          <div hidden={activeFile !== 'journey'} className="editor-file-pane">
            <LearningJourney />
          </div>

          <div hidden={activeFile !== 'leetcode'} className="editor-file-pane">
            <LeetCodeSection />
          </div>

          <div hidden={activeFile !== 'themes'} className="editor-file-pane">
            <ThemesSection activeTheme={theme} onSelectTheme={onSelectTheme} />
          </div>

          <div hidden={activeFile !== 'contact'} className="editor-file-pane">
            <ContactSection />
            <Footer onBackToTop={handleBackToTop} onBackToIntro={handleBackToIntro} />
          </div>
        </FileBuffer>
      </div>


      {/* Vim Bottom Status Bar */}
      <EditorStatusBar
        theme={theme}
        onCommand={handleCommand}
        activeSection={activeSection}
        activeFileName={activeFileSpec.file}
        bitAwake={bitAwake}
        bitState={bitState}
        onToggleBit={() => setBitAwake((prev) => !prev)}
      />

      {/* G6: the desk — the stage's bottom row. Pure decoration. */}
      <DeskStrip themeKey={theme.name} height={deskHeightPx} />

      {/* G7: Bit's overlay — full stage, click-through, below chrome. */}
      <BitCreature
        awake={bitAwake}
        onAwakeChange={setBitAwake}
        onStateChange={setBitState}
        suspendEsc={isTerminalOpen || isCommandPaletteOpen || !!selectedProjectModal}
        themeKey={theme.name}
        zIndex={5}
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

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
import { Eye, EyeTether } from '../../fx/Eye';
import { AboutOpener } from '../AboutOpener';
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
import { useCreatureBus } from '../../fx/creatureBus';

interface DashboardPortfolioProps {
  theme: Theme;
  onBackToIntro: () => void;
  onToggleTheme: () => void;
  onSelectTheme: (index: number) => void;
  /** Phase 9 (§2.9): deep-linked file from the URL hash, when App found one. */
  initialFile?: EditorFileId;
}

const FILE_IDS: readonly string[] = EDITOR_FILES.map((f) => f.id);

export const DashboardPortfolio: React.FC<DashboardPortfolioProps> = ({
  theme,
  onBackToIntro,
  onToggleTheme,
  onSelectTheme,
  initialFile,
}) => {
  const bus = useCreatureBus();
  const [activeSection, setActiveSection] = useState(
    () => EDITOR_FILES.find((f) => f.id === initialFile)?.section ?? 'hero'
  );
  const [activeFile, setActiveFile] = useState<EditorFileId>(initialFile ?? 'about');
  const [selectedProjectModal, setSelectedProjectModal] = useState<Project | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  // G7: Bit, the stray node — the shell owns his awake flag (the bar's
  // den button toggles it) and mirrors his state for the NODE: readout.
  const [bitAwake, setBitAwake] = useState(false);
  const [bitState, setBitState] = useState<BitState>('asleep');
  // Phase 9 (§2.8): the desk is a page section below the fold now —
  // DeskStrip self-budgets its height from the viewport (deskHeight.ts);
  // the old --desk-h stage-row plumbing is gone.
  const reducedMotion = usePrefersReducedMotion();

  const bufferRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Phase 9 (§2.8): page scrolling (stage ↔ desk below the fold). The
  // document's CSS scroll-behavior is smooth; wheel/key page moves must
  // be instant, so the behaviour is suspended for the duration of the
  // programmatic scroll.
  const scrollPageBy = useCallback((delta: number) => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollBy(0, delta);
    html.style.scrollBehavior = prev;
  }, []);
  // §2.9: true while a popstate-driven file change is being applied, so
  // openFile does not push a duplicate history entry for it.
  const applyingPopRef = useRef(false);
  // Per-file buffer scroll memory (SCROLL-SPEC §4.6): each file is a
  // buffer — leaving and returning restores its scroll position. Explicit
  // anchor navigation overrides the remembered position.
  const scrollMemoryRef = useRef<Partial<Record<EditorFileId, number>>>({});
  const activeFileRef = useRef<EditorFileId>(initialFile ?? 'about');
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
    // §2.9: section changes push their hash (deep-linkable history).
    if (!applyingPopRef.current && window.location.hash !== `#${spec.id}`) {
      window.history.pushState(null, '', `#${spec.id}`);
    }
  }, []);

  // §2.9: on mount, sync the hash to the file we opened with (replace —
  // the landing stays the implicit entry before #about); afterwards,
  // browser back/forward walks section history via popstate.
  useEffect(() => {
    const target = `#${activeFileRef.current}`;
    if (window.location.hash !== target) {
      window.history.replaceState(null, '', target);
    }
    const onPopState = () => {
      const h = window.location.hash.replace(/^#/, '');
      if (!FILE_IDS.includes(h)) return;
      const id = h as EditorFileId;
      if (id === activeFileRef.current) return;
      applyingPopRef.current = true;
      openFile(id);
      applyingPopRef.current = false;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // stage chrome (header, status bar) scrolls the buffer instead of
  // dying — the pointer's resting place never disables the primary
  // input. Zones that own their wheel behaviour bail out first.
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
      // §2.8: while the page is scrolled toward the desk, chrome wheel
      // moves the page, not the buffer.
      if (window.scrollY > 0) {
        scrollPageBy(normalisedWheelDelta(e));
        return;
      }
      buffer.scrollTop += normalisedWheelDelta(e);
    };

    stage.addEventListener('wheel', handleStageWheel, { passive: false });
    return () => stage.removeEventListener('wheel', handleStageWheel);
  }, [isCommandPaletteOpen, isTerminalOpen, selectedProjectModal, scrollPageBy]);

  // §2.8 wheel chaining at the buffer's edges: buffer at its bottom +
  // wheel down → the page scrolls to the desk; page scrolled + wheel
  // up → the page scrolls back before the buffer resumes.
  useEffect(() => {
    const buffer = bufferRef.current;
    if (!buffer) return;
    const onWheel = (e: WheelEvent) => {
      if (isCommandPaletteOpen || isTerminalOpen || selectedProjectModal) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('[role="dialog"], input, textarea, select, [contenteditable="true"]')) return;
      const maxPage = document.documentElement.scrollHeight - window.innerHeight;
      if (maxPage <= 0) return;
      const delta = normalisedWheelDelta(e);
      const pageY = window.scrollY;
      if (delta > 0) {
        const atBottom = buffer.scrollTop + buffer.clientHeight >= buffer.scrollHeight - 1;
        if (atBottom && pageY < maxPage) {
          e.preventDefault();
          scrollPageBy(Math.min(delta, maxPage - pageY));
        }
      } else if (delta < 0 && pageY > 0) {
        e.preventDefault();
        scrollPageBy(Math.max(delta, -pageY));
      }
    };
    buffer.addEventListener('wheel', onWheel, { passive: false });
    return () => buffer.removeEventListener('wheel', onWheel);
  }, [isCommandPaletteOpen, isTerminalOpen, selectedProjectModal, scrollPageBy]);

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

      // Phase 9 (§2.8): PageDown / PageUp scroll the PAGE (stage ↔ desk).
      if (e.key === 'PageDown' || e.key === 'PageUp') {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
        e.preventDefault();
        scrollPageBy((e.key === 'PageDown' ? 1 : -1) * window.innerHeight * 0.9);
        return;
      }

      let direction: 1 | -1 | 0 = 0;
      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') direction = 1;
      else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') direction = -1;
      // §3.3: in projects.tsx, ←/→ belong to the shot viewer, not file
      // stepping (the viewer's own capture listener consumes them).
      else if (activeFileRef.current !== 'projects') {
        if (e.key === 'ArrowRight') direction = 1;
        else if (e.key === 'ArrowLeft') direction = -1;
      }
      if (!direction) return;

      e.preventDefault();
      if (inFileTree) navFocusPendingRef.current = true;
      stepFile(direction);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepFile, isCommandPaletteOpen, isTerminalOpen, selectedProjectModal, scrollPageBy]);

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
    setBitState('asleep');
    bus.setBit('asleep');
    // Leaving the editor clears the section hash (§2.9).
    window.history.pushState(null, '', window.location.pathname + window.location.search);
    onBackToIntro();
  }, [onBackToIntro, bus]);

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
    <div className="dashboard-scroll-root" style={{ position: 'relative' }}>
    <div
      ref={stageRef}
      className="dashboard-portfolio-wrapper editor-stage"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: '100svh',
        // Below 560px viewport height the stage compresses instead of
        // clipping the bottom bar off-screen (SCROLL-SPEC §4.8).
        minHeight: 'min(560px, 100svh)',
        overflow: 'hidden',
        background: 'color-mix(in srgb, var(--bg) 96%, transparent)',
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) var(--bar-h)',
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

        {/* Phase 8: the top-center nav row (whoami/focus/stack/
            experiments/journey/contact) is REMOVED — the file rail is
            the navigation, full stop. The header carries only the
            brand (back to intro) and the right-side utilities. */}

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
        <EditorFileNav
          activeFile={activeFile}
          onNavigate={(f) => openFile(f)}
          onStepFile={stepFile}
          collapsed={!bitAwake}
          onWake={() => setBitAwake(true)}
        />

        <FileBuffer file={activeFileSpec} bufferRef={bufferRef}>
          {/* about.tsx — cockpit + hero + about + focus. Inactive files stay
              mounted but hidden, so interactive state (skills pane, project
              filter, streak tracker) survives file switches. */}
          <div hidden={activeFile !== 'about'} className="editor-file-pane" style={{ position: 'relative' }}>
          {/* Phase 9 (§3.1): the WatchingGlyph margin mechanism is
              retired — the eye now lives in the stage's eye column
              (§2.4) in every section. WatchingGlyph.tsx stays in the
              repo unmounted, like CockpitGraph. */}

      {/* ========================================================================= */}
      {/* ABOUT OPENER — Phase 9 (§3.1): the opener is now the ghost-typed  */}
      {/* transcript in AboutOpener: the contribution-tree panel group,    */}
      {/* the whoami block with its glitch overlay, the fetch block and     */}
      {/* the links row. AsciiChartPanel is retired (unmounted, kept in     */}
      {/* the repo like CockpitGraph); the whoami copy lives in AboutOpener. */}
      {/* ========================================================================= */}
      <AboutOpener
        active={activeFile === 'about'}
        onNavigate={scrollToSection}
        onOpenTerminal={() => setIsTerminalOpen(true)}
      />

      {/* ========================================================================= */}
      {/* COMPLETE PORTFOLIO CONTENT SECTIONS (Part 4) */}
      {/* ========================================================================= */}
      <HeroSection onExploreClick={() => scrollToSection('projects')} />
          <AboutSection />
          <FocusSection />
          </div>

          <div hidden={activeFile !== 'certifications'} className="editor-file-pane">
            <CertificationsSection active={activeFile === 'certifications'} />
          </div>

          <div hidden={activeFile !== 'projects'} className="editor-file-pane">
            <ProjectsSection active={activeFile === 'projects'} onOpenProjectModal={(p) => setSelectedProjectModal(p)} />
          </div>

          <div hidden={activeFile !== 'stack'} className="editor-file-pane">
            <SkillsSection active={activeFile === 'stack'} />
          </div>

          <div hidden={activeFile !== 'journey'} className="editor-file-pane">
            <LearningJourney active={activeFile === 'journey'} />
          </div>

          <div hidden={activeFile !== 'leetcode'} className="editor-file-pane">
            <LeetCodeSection active={activeFile === 'leetcode'} />
          </div>

          <div hidden={activeFile !== 'themes'} className="editor-file-pane">
            <ThemesSection active={activeFile === 'themes'} activeTheme={theme} onSelectTheme={onSelectTheme} />
          </div>

          <div hidden={activeFile !== 'contact'} className="editor-file-pane">
            <ContactSection active={activeFile === 'contact'} />
            <Footer onBackToTop={handleBackToTop} onBackToIntro={handleBackToIntro} />
          </div>
        </FileBuffer>

        {/* Phase 9 (§1.1/§2.4): the eye zone — third grid column, the
            eye's fixed home at the panel's top-right, same spot in
            every section. The zone collapses below 1150px. */}
        <div className="eye-zone" data-eye-zone="true">
          <Eye activeFile={activeFile} />
        </div>
      </div>

      {/* §2.4: the eye's dashed tether — a stage-level overlay drawing
          from the eye to its current focus target. */}
      <EyeTether />


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

      {/* G7: Bit's overlay — full stage, click-through, below chrome. */}
      <BitCreature
        awake={bitAwake}
        onAwakeChange={setBitAwake}
        onStateChange={(s) => {
          setBitState(s);
          bus.setBit(s);
        }}
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

      {/* Phase 9 (§2.8): the desk — a page section BELOW the sticky
          stage, reached by page scroll. Pure decoration (aria-hidden);
          height self-budgeted by deskHeight.ts (≤184px, hidden ≤640px). */}
      <DeskStrip themeKey={theme.name} />
    </div>
  );
};

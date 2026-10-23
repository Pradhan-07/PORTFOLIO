import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { THEMES } from './data/themes';
import type { Theme } from './types';
import { CanvasWall } from './components/CanvasWall';
import { LandingScreen } from './components/LandingScreen';
import { DashboardPortfolio } from './components/hancore/DashboardPortfolio';
import { RadialEclipseTransition } from './components/hancore/RadialEclipseTransition';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { useWallData } from './hooks/useWallData';
import { CreatureBusProvider } from './fx/CreatureBusProvider';
import type { EditorFileId } from './types';

const THEME_STORAGE_KEY = 'karan-portfolio-theme';

/** Phase 9 (§2.9): section hashes — a valid one deep-links into the editor. */
const SECTION_HASHES: readonly string[] = [
  'about',
  'certifications',
  'projects',
  'stack',
  'journey',
  'leetcode',
  'themes',
  'contact',
];

const fileFromHash = (): EditorFileId | null => {
  const h = window.location.hash.replace(/^#/, '');
  return SECTION_HASHES.includes(h) ? (h as EditorFileId) : null;
};

const readStoredThemeIndex = (): number => {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    const parsed = raw === null ? NaN : Number.parseInt(raw, 10);
    return Number.isInteger(parsed) && parsed >= 0 && parsed < THEMES.length ? parsed : 0;
  } catch {
    return 0;
  }
};

export const App: React.FC = () => {
  const reducedMotion = usePrefersReducedMotion();
  const [themeIndex, setThemeIndex] = useState<number>(readStoredThemeIndex);
  // §2.9 deep link: a valid section hash skips the landing entirely.
  const [initialFile] = useState<EditorFileId | null>(() =>
    typeof window === 'undefined' ? null : fileFromHash()
  );
  const [screen, setScreen] = useState<'landing' | 'portfolio'>(initialFile ? 'portfolio' : 'landing');
  // G12 code wall: real repo files from /data/wall.json (null while
  // loading or if the file is unavailable — CanvasWall then falls back
  // to the built-in snippets). The wall navigation offset lives here
  // because the wall canvas is App's child, behind both screens; the
  // landing drives it and derives its status-line readout from it.
  const wall = useWallData();
  const wallLines = useMemo(
    () => (wall.data ? wall.data.files.flatMap((f) => f.tokens) : null),
    [wall.data]
  );
  const [wallOffset, setWallOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentTheme: Theme = THEMES[themeIndex];

  // Apply theme variables to root document
  const applyThemeVariables = useCallback((theme: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--fg', theme.fg);
    root.style.setProperty('--ink', theme.fg);
    root.style.setProperty('--dim', theme.dim);
    root.style.setProperty('--chrome', theme.chrome);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--line', theme.line);
    root.style.setProperty('--kw', theme.kinds.keyword);
    root.style.setProperty('--str', theme.kinds.string);
    root.style.setProperty('--fn', theme.kinds.function);
    root.style.setProperty('--ty', theme.kinds.type);
    root.style.setProperty('--num', theme.kinds.number);
    root.style.colorScheme = theme.light ? 'light' : 'dark';
  }, []);

  useEffect(() => {
    applyThemeVariables(currentTheme);
  }, [currentTheme, applyThemeVariables]);

  // Document scroll lock (SCROLL-SPEC §4.4, amended by Phase 9 §2.8):
  // the LANDING never scrolls (a short viewport must not reveal its
  // overflow), but the PORTFOLIO page scrolls between the sticky stage
  // and the desk below the fold — so the lock applies on the landing
  // only and is released while the editor is mounted.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (screen === 'landing') {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    } else {
      html.style.overflow = '';
      body.style.overflow = '';
    }
  }, [screen]);

  // Persist the chosen theme so it is restored on the next visit.
  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, String(themeIndex));
    } catch {
      // Storage unavailable (private mode etc.) — theme still applies for the session.
    }
  }, [themeIndex]);

  const handleToggleTheme = () => {
    setThemeIndex((prev) => (prev + 1) % THEMES.length);
  };

  const handleSelectTheme = (index: number) => {
    if (index >= 0 && index < THEMES.length) {
      setThemeIndex(index);
    }
  };

  // Trigger Part 2: Radial Eclipse Transition
  // Reduced motion (G9): no cinematic sequence — go straight to the portfolio.
  const handleStartEnterTransition = () => {
    // §2.2: a second Enter/click while the gate is running SKIPS it —
    // jump straight to the transition's end state.
    if (isTransitioning) {
      handleTransitionComplete();
      return;
    }
    if (reducedMotion) {
      handleTransitionComplete();
      return;
    }
    setIsTransitioning(true);
  };

  // Called when Radial Eclipse Transition completes (Frames 08 - 12)
  const handleTransitionComplete = () => {
    setScreen('portfolio');
    setIsTransitioning(false);
    window.scrollTo(0, 0);
  };

  // Escape during the gate (Comparison Round 1, S1): cancel the
  // transition and stay on the landing — the editor never mounts.
  const handleCancelTransition = () => {
    setIsTransitioning(false);
  };

  const handleBackToLanding = () => {
    setScreen('landing');
    setIsTransitioning(false);
    window.scrollTo(0, 0);
  };

  return (
    <div
      className="app-wrapper"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        overflowX: 'hidden',
      }}
    >
      {/* Background Matrix Canvas Wall */}
      <CanvasWall
        theme={currentTheme}
        interactive={screen === 'landing' && !isTransitioning}
        wallLines={wallLines}
        wallRowOffset={wallOffset}
      />

      {/* Screens */}
      {screen === 'landing' ? (
        <LandingScreen
          theme={currentTheme}
          onEnter={handleStartEnterTransition}
          onToggleTheme={handleToggleTheme}
          onSelectTheme={handleSelectTheme}
          isLeaving={isTransitioning}
          wall={wall}
          wallOffset={wallOffset}
          onWallOffsetChange={setWallOffset}
        />
      ) : (
        <CreatureBusProvider>
          <DashboardPortfolio
            theme={currentTheme}
            onBackToIntro={handleBackToLanding}
            onToggleTheme={handleToggleTheme}
            onSelectTheme={handleSelectTheme}
            initialFile={initialFile ?? undefined}
          />
        </CreatureBusProvider>
      )}

      {/* Part 2: Signature Radial Eclipse Expanding Burst Transition */}
      {isTransitioning && (
        <RadialEclipseTransition
          onComplete={handleTransitionComplete}
          onCancel={handleCancelTransition}
          themeAccent={currentTheme.accent}
        />
      )}
    </div>
  );
};

export default App;

import React, { useState, useEffect, useCallback } from 'react';
import { THEMES } from './data/themes';
import type { Theme } from './types';
import { CanvasWall } from './components/CanvasWall';
import { LandingScreen } from './components/LandingScreen';
import { DashboardPortfolio } from './components/hancore/DashboardPortfolio';
import { RadialEclipseTransition } from './components/hancore/RadialEclipseTransition';

const THEME_STORAGE_KEY = 'karan-portfolio-theme';

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
  const [themeIndex, setThemeIndex] = useState<number>(readStoredThemeIndex);
  const [screen, setScreen] = useState<'landing' | 'portfolio'>('landing');
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
  const handleStartEnterTransition = () => {
    setIsTransitioning(true);
  };

  // Called when Radial Eclipse Transition completes (Frames 08 - 12)
  const handleTransitionComplete = () => {
    setScreen('portfolio');
    setIsTransitioning(false);
    window.scrollTo(0, 0);
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
        background: '#080908',
        color: 'var(--fg)',
        overflowX: 'hidden',
      }}
    >
      {/* Background Matrix Canvas Wall */}
      <CanvasWall theme={currentTheme} interactive={screen === 'landing' && !isTransitioning} />

      {/* Screens */}
      {screen === 'landing' ? (
        <LandingScreen
          theme={currentTheme}
          onEnter={handleStartEnterTransition}
          onToggleTheme={handleToggleTheme}
          isLeaving={isTransitioning}
        />
      ) : (
        <DashboardPortfolio
          theme={currentTheme}
          onBackToIntro={handleBackToLanding}
          onToggleTheme={handleToggleTheme}
          onSelectTheme={handleSelectTheme}
        />
      )}

      {/* Part 2: Signature Radial Eclipse Expanding Burst Transition */}
      {isTransitioning && (
        <RadialEclipseTransition
          onComplete={handleTransitionComplete}
          themeAccent={currentTheme.accent}
        />
      )}
    </div>
  );
};

export default App;

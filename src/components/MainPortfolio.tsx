import React, { useState, useEffect } from 'react';
import type { Theme } from '../types';
import { Navigation } from './Navigation';
import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { FocusSection } from './FocusSection';
import { SkillsSection } from './SkillsSection';
import { ProjectsSection } from './ProjectsSection';
import { LearningJourney } from './LearningJourney';
import { ContactSection } from './ContactSection';
import { Footer } from './Footer';
import { EditorStatusBar } from './EditorStatusBar';

interface MainPortfolioProps {
  theme: Theme;
  onBackToIntro: () => void;
  onToggleTheme: () => void;
}

export const MainPortfolio: React.FC<MainPortfolioProps> = ({
  theme,
  onBackToIntro,
  onToggleTheme,
}) => {
  const [activeSection, setActiveSection] = useState('hero');

  // Track active section on scroll
  useEffect(() => {
    const sectionIds = ['hero', 'about', 'focus', 'skills', 'projects', 'journey', 'contact'];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle keyboard shortcut Esc to go back to intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBackToIntro();
      } else if (e.key === 't' || e.key === 'T') {
        // Only if not focused on input/textarea
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          onToggleTheme();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBackToIntro, onToggleTheme]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const handleCommand = (cmd: string) => {
    if (cmd === 'intro') {
      onBackToIntro();
    } else if (cmd === 'theme') {
      onToggleTheme();
    } else {
      scrollToSection(cmd);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection('hero');
  };

  return (
    <div
      className="portfolio-container"
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        background: 'color-mix(in srgb, var(--bg) 96%, transparent)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top sticky navigation */}
      <Navigation
        theme={theme}
        onBackToIntro={onBackToIntro}
        onToggleTheme={onToggleTheme}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      {/* Editor Subheader Tabline */}
      <div
        className="editor-tabline"
        style={{
          background: 'var(--line)',
          borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
          padding: '6px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '11px',
          color: 'var(--dim)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--chrome)' }}>~/karan.dev</span>
          <span>/</span>
          <span style={{ color: 'var(--fg)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '2px' }}>
            portfolio.cpp
          </span>
          <span style={{ color: 'var(--accent)' }}>●</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '10.5px' }}>press <kbd style={{ padding: '1px 4px', background: 'var(--bg)', borderRadius: '2px' }}>Esc</kbd> for intro</span>
          <span style={{ fontSize: '10.5px' }}>press <kbd style={{ padding: '1px 4px', background: 'var(--bg)', borderRadius: '2px' }}>T</kbd> for theme</span>
        </div>
      </div>

      {/* Main Content Sections */}
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
      <Footer onBackToTop={scrollToTop} onBackToIntro={onBackToIntro} />

      {/* Vim Bottom Status Bar */}
      <EditorStatusBar
        theme={theme}
        onCommand={handleCommand}
        activeSection={activeSection}
      />
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { PROFILE } from '../data/profile';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  onToggleTheme: () => void;
  onOpenTerminal: () => void;
  onOpenProjectDetail: (projectId: string) => void;
}

interface PaletteItem {
  id: string;
  category: 'Navigation' | 'Projects' | 'Actions';
  title: string;
  subtitle: string;
  shortcut?: string;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onToggleTheme,
  onOpenTerminal,
  onOpenProjectDetail,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: PaletteItem[] = [
    // Navigation items
    {
      id: 'nav-whoami',
      category: 'Navigation',
      title: 'whoami / Profile & Education',
      subtitle: 'Second-year B.Tech CSE student @ VIT-AP University',
      shortcut: '#about',
      action: () => onNavigate('about'),
    },
    {
      id: 'nav-focus',
      category: 'Navigation',
      title: 'Current Focus Areas',
      subtitle: 'DSA in C++, AI/ML fundamentals, Web development',
      shortcut: '#focus',
      action: () => onNavigate('focus'),
    },
    {
      id: 'nav-skills',
      category: 'Navigation',
      title: 'Technical Stack & Tools',
      subtitle: 'C++, Python, React, JavaScript, OpenCV, Git',
      shortcut: '#skills',
      action: () => onNavigate('skills'),
    },
    {
      id: 'nav-projects',
      category: 'Navigation',
      title: 'Projects & Repositories',
      subtitle: 'Browse all verified repositories & experiments',
      shortcut: '#projects',
      action: () => onNavigate('projects'),
    },
    {
      id: 'nav-dsa',
      category: 'Navigation',
      title: 'DSA Algorithm Playground',
      subtitle: 'Interactive step-by-step visualizations of searching & sorting',
      shortcut: '#dsa',
      action: () => onNavigate('dsa-playground'),
    },
    {
      id: 'nav-journey',
      category: 'Navigation',
      title: 'Engineering Learning Log',
      subtitle: 'Ongoing notes & daily technical progression',
      shortcut: '#journey',
      action: () => onNavigate('journey'),
    },
    {
      id: 'nav-contact',
      category: 'Navigation',
      title: 'Contact & Collaboration',
      subtitle: 'Email, GitHub, LinkedIn links',
      shortcut: '#contact',
      action: () => onNavigate('contact'),
    },

    // Featured Projects
    {
      id: 'proj-indstate',
      category: 'Projects',
      title: 'indstate — Property Marketplace (Featured)',
      subtitle: 'React 19, Supabase, Leaflet Maps, TypeScript',
      shortcut: 'React',
      action: () => onOpenProjectDetail('indstate'),
    },
    {
      id: 'proj-dsa-cpp',
      category: 'Projects',
      title: 'DSA_CPP — Algorithms in C++',
      subtitle: 'Binary Search Trees, Graph Traversals, STL, DP',
      shortcut: 'C++',
      action: () => onOpenProjectDetail('dsa-cpp'),
    },
    {
      id: 'proj-study',
      category: 'Projects',
      title: 'study_detection — Attention Tracker',
      subtitle: 'Python, OpenCV, Facial Landmark Heuristics',
      shortcut: 'Python',
      action: () => onOpenProjectDetail('study-detection'),
    },
    {
      id: 'proj-magic',
      category: 'Projects',
      title: 'magic_hand — 3D Hand Tracking',
      subtitle: 'Python, MediaPipe, 21 Landmark Gestures',
      shortcut: 'Python',
      action: () => onOpenProjectDetail('magic-hand'),
    },

    // Actions & Tools
    {
      id: 'act-terminal',
      category: 'Actions',
      title: 'Launch Interactive Terminal',
      subtitle: 'Command-line interface with history & commands',
      shortcut: ':term',
      action: () => {
        onClose();
        setTimeout(onOpenTerminal, 80);
      },
    },
    {
      id: 'act-theme',
      category: 'Actions',
      title: 'Switch Color Theme',
      subtitle: 'Cycle through curated editor color palettes',
      shortcut: ':theme',
      action: onToggleTheme,
    },
    {
      id: 'act-github',
      category: 'Actions',
      title: 'Open GitHub Profile',
      subtitle: 'https://github.com/Pradhan-07',
      shortcut: '↗',
      action: () => window.open(PROFILE.githubUrl, '_blank', 'noreferrer,noopener'),
    },
    {
      id: 'act-linkedin',
      category: 'Actions',
      title: 'Open LinkedIn Profile',
      subtitle: 'https://www.linkedin.com/in/karan-kumar-pradhan-510062396/',
      shortcut: '↗',
      action: () => window.open(PROFILE.linkedinUrl, '_blank', 'noreferrer,noopener'),
    },
    {
      id: 'act-email',
      category: 'Actions',
      title: 'Copy Email Address',
      subtitle: 'pradhankaran058@gmail.com',
      shortcut: 'copy',
      action: () => {
        navigator.clipboard.writeText(PROFILE.email);
        alert(`Copied ${PROFILE.email} to clipboard!`);
      },
    },
  ];

  const filteredItems = items.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'color-mix(in srgb, var(--bg) 98%, #0d0e0d)',
          border: '1px solid color-mix(in srgb, var(--fg) 18%, transparent)',
          borderRadius: '4px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          fontFamily: '"IBM Plex Mono", monospace',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '68vh',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderBottom: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
            background: 'color-mix(in srgb, var(--bg) 90%, var(--line))',
          }}
        >
          <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}>&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, project name, or section..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--fg)',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '13px',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              color: 'var(--dim)',
              padding: '2px 6px',
              border: '1px solid color-mix(in srgb, var(--fg) 14%, transparent)',
              borderRadius: '2px',
            }}
          >
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {filteredItems.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--dim)', fontSize: '12px' }}>
              No matches found for &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    borderRadius: '2px',
                    background: isSelected ? 'var(--line)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 80ms ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: isSelected ? 'var(--fg)' : 'var(--chrome)' }}>
                        {item.title}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          color: 'var(--dim)',
                          background: 'color-mix(in srgb, var(--bg) 60%, transparent)',
                          padding: '1px 5px',
                          borderRadius: '2px',
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--dim)', fontFamily: '"Archivo", sans-serif' }}>
                      {item.subtitle}
                    </span>
                  </div>

                  {item.shortcut && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        color: isSelected ? 'var(--accent)' : 'var(--dim)',
                        background: 'color-mix(in srgb, var(--bg) 80%, transparent)',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        border: '1px solid color-mix(in srgb, var(--fg) 6%, transparent)',
                      }}
                    >
                      {item.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            borderTop: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
            background: 'color-mix(in srgb, var(--bg) 95%, #050605)',
            fontSize: '10px',
            color: 'var(--dim)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>karan.dev quick navigator</span>
        </div>
      </div>
    </div>
  );
};

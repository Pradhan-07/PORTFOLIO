import React, { useState, useEffect } from 'react';

interface Snippet {
  path: string;
  mode: string;
  lines: { num: string; text: string; kind?: 'kw' | 'str' | 'fn' | 'ty' | 'com' | 'text' }[];
}

const SNIPPETS: Snippet[] = [
  {
    path: '~/Projects/karan-dev/src/portfolio.cpp',
    mode: 'INSERT',
    lines: [
      { num: '01', text: '// building with curiosity.', kind: 'com' },
      { num: '02', text: '#include <iostream>', kind: 'kw' },
      { num: '03', text: '#include <concepts>', kind: 'kw' },
      { num: '04', text: 'int main() {', kind: 'fn' },
      { num: '05', text: '    // solve. learn. build.', kind: 'com' },
      { num: '06', text: '    std::cout << "Karan Kumar Pradhan\\n";', kind: 'str' },
      { num: '07', text: '    return 0;', kind: 'kw' },
      { num: '08', text: '}', kind: 'text' },
    ],
  },
  {
    path: '~/Projects/dsa/graph_dijkstra.cpp',
    mode: 'NORMAL',
    lines: [
      { num: '01', text: '// Algorithmic Thinking in C++', kind: 'com' },
      { num: '02', text: 'template <typename Node>', kind: 'kw' },
      { num: '03', text: 'auto find_shortest_path(Node src) {', kind: 'fn' },
      { num: '04', text: '    std::priority_queue<std::pair<int, Node>> pq;', kind: 'ty' },
      { num: '05', text: '    dist[src] = 0;', kind: 'text' },
      { num: '06', text: '    // complexity: O((V + E) log V)', kind: 'com' },
      { num: '07', text: '    return dist;', kind: 'kw' },
      { num: '08', text: '}', kind: 'text' },
    ],
  },
  {
    path: '~/Projects/ai_ml/study_focus.py',
    mode: 'INSERT',
    lines: [
      { num: '01', text: '# Intelligent Study Detection', kind: 'com' },
      { num: '02', text: 'import cv2, mediapipe as mp', kind: 'kw' },
      { num: '03', text: 'class AttentionTracker:', kind: 'ty' },
      { num: '04', text: '    def detect_landmarks(self, frame):', kind: 'fn' },
      { num: '05', text: '        # Gaze & hand gesture evaluation', kind: 'com' },
      { num: '06', text: '        return {"status": "ACTIVE_STUDY"}', kind: 'str' },
      { num: '07', text: 'tracker = AttentionTracker()', kind: 'text' },
      { num: '08', text: '# verified in github.com/Pradhan-07', kind: 'com' },
    ],
  },
];

export const CodeTickerPanel: React.FC = () => {
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [revealedCount, setRevealedCount] = useState(2);

  const currentSnippet = SNIPPETS[snippetIdx];

  // Progressive typing / reveal ticker effect
  useEffect(() => {
    const lineTimer = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev < currentSnippet.lines.length) {
          return prev + 1;
        } else {
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(lineTimer);
  }, [currentSnippet.lines.length]);

  // Switch snippet every 7 seconds
  useEffect(() => {
    const switchTimer = setInterval(() => {
      setSnippetIdx((prev) => (prev + 1) % SNIPPETS.length);
      setRevealedCount(2);
    }, 7200);

    return () => clearInterval(switchTimer);
  }, []);

  return (
    <div
      className="code-ticker-panel"
      style={{
        width: '100%',
        maxWidth: '560px',
        margin: '0 auto 20px auto',
        background: 'color-mix(in srgb, var(--bg) 95%, #101010)',
        border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
        borderRadius: '3px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '12px',
        transition: 'border-color 200ms ease',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'var(--line)',
          borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
          fontSize: '10.5px',
          color: 'var(--chrome)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>●</span>
          <span style={{ color: 'var(--fg)', letterSpacing: '0.02em' }}>{currentSnippet.path}</span>
        </div>

        <span
          style={{
            fontSize: '9.5px',
            padding: '1px 5px',
            background: currentSnippet.mode === 'INSERT' ? 'var(--accent)' : 'color-mix(in srgb, var(--bg) 80%, transparent)',
            color: currentSnippet.mode === 'INSERT' ? 'var(--bg)' : 'var(--chrome)',
            fontWeight: 600,
            borderRadius: '2px',
            letterSpacing: '0.06em',
          }}
        >
          {currentSnippet.mode}
        </span>
      </div>

      {/* Code Lines Body */}
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {currentSnippet.lines.slice(0, revealedCount).map((l, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '14px',
              lineHeight: 1.5,
              animation: 'fadeIn 200ms ease',
            }}
          >
            <span style={{ color: 'var(--dim)', width: '20px', userSelect: 'none', textAlign: 'right' }}>
              {l.num}
            </span>
            <span
              style={{
                color:
                  l.kind === 'com'
                    ? 'var(--dim)'
                    : l.kind === 'kw'
                      ? 'var(--kw)'
                      : l.kind === 'str'
                        ? 'var(--str)'
                        : l.kind === 'ty'
                          ? 'var(--ty)'
                          : l.kind === 'fn'
                            ? 'var(--fn)'
                            : 'var(--fg)',
                whiteSpace: 'pre',
              }}
            >
              {l.text}
            </span>
          </div>
        ))}

        {/* Cursor line */}
        <div style={{ display: 'flex', gap: '14px', lineHeight: 1.5 }}>
          <span style={{ width: '20px' }} />
          <span
            className="cursor-blink"
            style={{
              display: 'inline-block',
              width: '7px',
              height: '13px',
              background: 'var(--accent)',
              verticalAlign: 'middle',
            }}
          />
        </div>
      </div>

      {/* Bottom Thin Status Readout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 12px',
          background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
          borderTop: '1px solid color-mix(in srgb, var(--fg) 6%, transparent)',
          fontSize: '9.5px',
          color: 'var(--dim)',
        }}
      >
        <span>utf-8</span>
        <span>c++20 / python</span>
        <span>{revealedCount}:{currentSnippet.lines[revealedCount - 1]?.text.length || 1}</span>
      </div>
    </div>
  );
};

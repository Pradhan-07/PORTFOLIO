import React, { useState, useEffect } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

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
  const reducedMotion = usePrefersReducedMotion();
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [revealedCount, setRevealedCount] = useState(2);

  const currentSnippet = SNIPPETS[snippetIdx];

  // Reduced motion (G9): no auto-cycling and no progressive reveal — the
  // current snippet is shown in full, statically.
  const visibleCount = reducedMotion ? currentSnippet.lines.length : revealedCount;

  // Progressive typing / reveal ticker effect
  useEffect(() => {
    if (reducedMotion) return;
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
  }, [currentSnippet.lines.length, reducedMotion]);

  // Switch snippet every 7 seconds
  useEffect(() => {
    if (reducedMotion) return;
    const switchTimer = setInterval(() => {
      setSnippetIdx((prev) => (prev + 1) % SNIPPETS.length);
      setRevealedCount(2);
    }, 7200);

    return () => clearInterval(switchTimer);
  }, [reducedMotion]);

  // Phase 5 (visual parity): NO window chrome. The reference landing is a
  // near-empty void where code floats borderless as faint ambience — no
  // frame, no title bar, no mode badge, no status bar, no line numbers.
  // The rotation / progressive-reveal behaviour above is unchanged; only
  // the presentation is frameless now. (The snippet `path`/`mode` fields
  // remain in the data above as documentation of each snippet's source.)
  return (
    <div
      className="code-ticker-panel"
      style={{
        width: '100%',
        maxWidth: '640px',
        margin: '0 auto',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '12px',
        textAlign: 'left',
        opacity: 0.92,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {currentSnippet.lines.slice(0, visibleCount).map((l, idx) => (
          <div
            key={idx}
            style={{
              lineHeight: 1.5,
              animation: 'fadeIn 200ms ease',
            }}
          >
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
        <div style={{ lineHeight: 1.5 }}>
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
    </div>
  );
};

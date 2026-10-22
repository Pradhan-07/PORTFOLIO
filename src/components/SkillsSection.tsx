import React, { useEffect, useState } from 'react';
import { PROFILE } from '../data/profile';

/** Shape of public/data/stack.json (build-time GitHub language snapshot). */
interface StackSnapshot {
  fetchedAt: string;
  reposAudited: number;
  languages: Array<{ name: string; bytes: number; share: number; repos: number }>;
}

const BAR_CELLS = 24;

/**
 * Phase 5 (visual parity): stack.ts renders the way the reference does —
 * languages as a monospace bar chart built from the REAL byte shares in
 * the snapshot (no fabricated percentages: the bars are the snapshot's
 * own numbers), then the tools as plain text rows. The bordered skill
 * cards, level pills and the inspector panel chrome are gone; the tech
 * selection still swaps the detail block below (role / repositories /
 * notes / sample as plain text lines), exactly as the pane did.
 */
export const SkillsSection: React.FC = () => {
  const [selectedTech, setSelectedTech] = useState<string>('C++');
  const [stack, setStack] = useState<StackSnapshot | null>(null);

  // Language byte shares from the local snapshot — same-origin JSON, no
  // runtime third-party calls. If it fails, the chart is omitted; the
  // tech rows below carry no numbers and nothing is invented.
  useEffect(() => {
    let cancelled = false;
    fetch('/data/stack.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: StackSnapshot | null) => {
        if (cancelled || !data?.languages) return;
        setStack(data);
      })
      .catch(() => {
        // Snapshot unavailable — no chart rendered.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const techDetails: Record<string, { role: string; repos: string; notes: string; snippet: string }> = {
    'C++': {
      role: 'Current Primary Language',
      repos: 'DSA_CPP, leetcode_question_answer',
      notes: 'Active daily focus on algorithmic problem solving, Standard Template Library (STL), memory management, and computational complexity.',
      snippet: `// C++ STL Monotonic Stack Pattern
#include <vector>
#include <stack>

std::vector<int> nextGreaterElements(const std::vector<int>& nums) {
    int n = nums.size();
    std::vector<int> res(n, -1);
    std::stack<int> s;
    for (int i = 0; i < n * 2; ++i) {
        while (!s.empty() && nums[s.top()] < nums[i % n]) {
            res[s.top()] = nums[i % n];
            s.pop();
        }
        if (i < n) s.push(i);
    }
    return res;
}`,
    },
    Python: {
      role: 'Exploring (AI & Computer Vision)',
      repos: 'study_detection, magic_hand, meme_gesture',
      notes: 'Used for machine learning prototypes, camera gesture tracking with MediaPipe, and OpenCV image processing pipelines.',
      snippet: `# Python Computer Vision Processing
import cv2

cap = cv2.VideoCapture(0)
while cap.isOpened():
    success, frame = cap.read()
    if not success: break
    # Flip frame for mirror view
    frame = cv2.flip(frame, 1)
    # Process gestures...`,
    },
    'JavaScript / TypeScript': {
      role: 'Web Development & Scripting',
      repos: 'PRADHAN-MUSIC, Clientele, flowerglow, karan-pradhan',
      notes: 'Writing interactive frontends, responsive UI state management, and HTML5 canvas animations.',
      snippet: `// Canvas Particle System
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
}`,
    },
    'HTML5 & CSS3': {
      role: 'Web Markup & Styling',
      repos: 'Resolutions_Tracker, SMOKE, Pradhan-website',
      notes: 'Responsive layout design, flexbox/grid architecture, semantic tags, and dark aesthetic themes.',
      snippet: `/* Minimal Dark Interface Styling */
:root {
  --bg: #050505;
  --ink: #ebe6db;
  --line: #181818;
}
body {
  background: var(--bg);
  color: var(--ink);
  font-family: monospace;
}`,
    },
    'Git & GitHub': {
      role: 'Version Control & Workflow',
      repos: 'All public repositories on github.com/Pradhan-07',
      notes: 'Commit versioning, feature branches, and maintaining public project archives.',
      snippet: `$ git status
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean`,
    },
  };

  const snapshotDate = stack
    ? new Date(stack.fetchedAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <section
      id="skills"
      className="skills-section file-section"
      style={{
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      <div className="section-container">
        {/* Section Header */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--dim)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          // 03 · TECHNICAL PROFILE
        </div>

        <h2
          style={{
            margin: '0 0 12px 0',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--fg)',
            letterSpacing: '0.01em',
            lineHeight: 1.5,
          }}
        >
          Languages & <span style={{ color: 'var(--chrome)' }}>technologies.</span>
        </h2>

        <p
          style={{
            margin: '0 0 32px 0',
            fontSize: '12.5px',
            color: 'var(--dim)',
            maxWidth: '76ch',
            lineHeight: 1.75,
          }}
        >
          Technologies used in my current academic studies and personal GitHub repositories. No fabricated percentages or arbitrary progress bars.
        </p>

        {/* Language byte-share chart — real snapshot shares as mono bars */}
        {stack && (
          <div style={{ marginBottom: '36px', fontSize: '12px', lineHeight: 1.9 }}>
            <div style={{ color: 'var(--dim)', marginBottom: '6px' }}>
              {'// language bytes — byte share across public repos, not a skill rating'}
            </div>
            {stack.languages.map((lang) => {
              const filled = Math.round(lang.share * BAR_CELLS);
              return (
                <div key={lang.name} style={{ display: 'flex', gap: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--fg)', minWidth: '96px', display: 'inline-block' }}>{lang.name}</span>
                  <span aria-hidden="true" style={{ letterSpacing: '1px' }}>
                    <span style={{ color: 'var(--str)' }}>{'█'.repeat(filled)}</span>
                    <span style={{ color: 'var(--dim)' }}>{'░'.repeat(BAR_CELLS - filled)}</span>
                  </span>
                  <span style={{ color: 'var(--chrome)' }}>{(lang.share * 100).toFixed(1)}%</span>
                  <span style={{ color: 'var(--dim)', fontSize: '11px' }}>· {lang.repos} repos</span>
                </div>
              );
            })}
            <div style={{ color: 'var(--dim)', fontSize: '10.5px', marginTop: '8px' }}>
              source: GitHub REST API · {stack.reposAudited} repos audited · snapshot {snapshotDate}
            </div>
          </div>
        )}

        {/* Tech rows — plain text, hairline-separated; selection swaps the
            detail block below (the skills-pane behaviour, unboxed). */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {PROFILE.techStack.map((tech) => {
            const isSelected = selectedTech === tech.name;
            return (
              <button
                key={tech.name}
                type="button"
                onClick={() => setSelectedTech(tech.name)}
                aria-pressed={isSelected}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '16px',
                  padding: '12px 2px',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid color-mix(in srgb, var(--fg) 7%, transparent)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  font: 'inherit',
                }}
              >
                <span>
                  <span style={{ color: isSelected ? 'var(--accent)' : 'var(--dim)', marginRight: '10px' }}>
                    {isSelected ? '▸' : ' '}
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: isSelected ? 'var(--fg)' : 'var(--chrome)',
                    }}
                  >
                    {tech.name}
                  </span>
                  <span style={{ display: 'block', marginTop: '3px', marginLeft: '22px', fontSize: '11.5px', color: 'var(--dim)', lineHeight: 1.6 }}>
                    {tech.note}
                  </span>
                </span>

                <span
                  style={{
                    fontSize: '10.5px',
                    color: isSelected ? 'var(--chrome)' : 'var(--dim)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.04em',
                  }}
                >
                  {tech.level}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected tech detail — text lines + the sample as plain text */}
        {techDetails[selectedTech] && (
          <div style={{ marginTop: '26px', fontSize: '12.5px', lineHeight: 1.75 }}>
            <div style={{ color: 'var(--dim)', marginBottom: '8px' }}>
              ~/inspect/{selectedTech.toLowerCase().replace(/[^a-z0-9]/g, '_')}.log
            </div>

            <div style={{ color: 'var(--chrome)' }}>
              <span style={{ color: 'var(--dim)' }}>ROLE: </span>
              {techDetails[selectedTech].role}
            </div>
            <div style={{ color: 'var(--chrome)' }}>
              <span style={{ color: 'var(--dim)' }}>REPOSITORIES: </span>
              {techDetails[selectedTech].repos}
            </div>
            <p
              style={{
                color: 'color-mix(in srgb, var(--fg) 82%, transparent)',
                margin: '10px 0 16px 0',
                maxWidth: '76ch',
              }}
            >
              {techDetails[selectedTech].notes}
            </p>

            {/* Code sample — plain text lines, no snippet panel */}
            <pre
              className="scroll-contain"
              style={{
                margin: 0,
                fontSize: '11.5px',
                lineHeight: 1.6,
                color: 'var(--chrome)',
                overflowX: 'auto',
                whiteSpace: 'pre',
                fontFamily: 'inherit',
              }}
            >
              <code>{techDetails[selectedTech].snippet}</code>
            </pre>

            <div style={{ marginTop: '16px', fontSize: '10.5px', color: 'var(--dim)' }}>
              // verified in github.com/{PROFILE.handle} · utf-8
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

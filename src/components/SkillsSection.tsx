import React, { useState } from 'react';
import { PROFILE } from '../data/profile';

export const SkillsSection: React.FC = () => {
  const [selectedTech, setSelectedTech] = useState<string>('C++');

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

  return (
    <section
      id="skills"
      className="skills-section"
      style={{
        padding: '72px 0',
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
      }}
    >
      <div className="section-container" style={{ maxWidth: '920px', margin: '0 auto', padding: '0 24px' }}>
        {/* Section Header */}
        <div
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '11px',
            color: 'var(--dim)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          // 03 · TECHNICAL PROFILE
        </div>

        <h2
          style={{
            margin: '0 0 16px 0',
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
            fontWeight: 400,
            color: 'var(--fg)',
            letterSpacing: '-0.02em',
          }}
        >
          Languages & <span style={{ fontStyle: 'italic', color: 'var(--chrome)' }}>technologies.</span>
        </h2>

        <p
          style={{
            margin: '0 0 36px 0',
            fontFamily: '"Archivo", sans-serif',
            fontSize: '15px',
            color: 'var(--dim)',
            maxWidth: '680px',
            lineHeight: 1.6,
          }}
        >
          Technologies used in my current academic studies and personal GitHub repositories. No fabricated percentages or arbitrary progress bars.
        </p>

        {/* Two Column Layout: Tech Selector on Left, Terminal Inspector on Right */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '24px',
            alignItems: 'stretch',
          }}
        >
          {/* Tech List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PROFILE.techStack.map((tech) => {
              const isSelected = selectedTech === tech.name;
              return (
                <button
                  key={tech.name}
                  type="button"
                  onClick={() => setSelectedTech(tech.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 18px',
                    background: isSelected ? 'var(--line)' : 'color-mix(in srgb, var(--line) 40%, transparent)',
                    border: isSelected
                      ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)'
                      : '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 180ms ease',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: '"Archivo", sans-serif',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: isSelected ? 'var(--fg)' : 'var(--chrome)',
                        marginBottom: '4px',
                      }}
                    >
                      {tech.name}
                    </div>
                    <div
                      style={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: '11px',
                        color: 'var(--dim)',
                      }}
                    >
                      {tech.note}
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '2px',
                      background: isSelected ? 'var(--accent)' : 'var(--line)',
                      color: isSelected ? 'var(--bg)' : 'var(--dim)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tech.level}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Code / Details Inspector */}
          {techDetails[selectedTech] && (
            <div
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '3px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: '"IBM Plex Mono", monospace',
              }}
            >
              <div>
                {/* Winbar / tab Header */}
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
                  <span>~/inspect/{selectedTech.toLowerCase().replace(/[^a-z0-9]/g, '_')}.log</span>
                  <span style={{ color: 'var(--accent)' }}>[INSPECT]</span>
                </div>

                <div style={{ fontSize: '11.5px', marginBottom: '14px', lineHeight: 1.6 }}>
                  <div style={{ color: 'var(--chrome)' }}>
                    <span style={{ color: 'var(--dim)' }}>ROLE: </span>
                    {techDetails[selectedTech].role}
                  </div>
                  <div style={{ color: 'var(--chrome)' }}>
                    <span style={{ color: 'var(--dim)' }}>REPOSITORIES: </span>
                    {techDetails[selectedTech].repos}
                  </div>
                  <div style={{ color: 'var(--fg)', marginTop: '8px' }}>
                    {techDetails[selectedTech].notes}
                  </div>
                </div>

                {/* Code Sample */}
                <pre
                  style={{
                    margin: 0,
                    padding: '12px',
                    background: 'color-mix(in srgb, var(--bg) 70%, transparent)',
                    borderRadius: '2px',
                    fontSize: '11px',
                    lineHeight: 1.5,
                    color: 'var(--chrome)',
                    overflowX: 'auto',
                    whiteSpace: 'pre',
                  }}
                >
                  <code>{techDetails[selectedTech].snippet}</code>
                </pre>
              </div>

              <div
                style={{
                  marginTop: '16px',
                  fontSize: '10px',
                  color: 'var(--dim)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
                  paddingTop: '10px',
                }}
              >
                <span>verified in github.com/{PROFILE.handle}</span>
                <span>utf-8</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

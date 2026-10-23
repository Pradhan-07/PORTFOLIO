import React, { useEffect, useMemo, useState } from 'react';
import { PROFILE } from '../data/profile';
import { PROJECTS } from '../data/projects';
import { GhostTranscript, type GhostBlock } from '../fx/GhostTranscript';
import {
  contributionLevelColor,
  useContributionsSnapshot,
  type ContributionDay,
} from '../hooks/useContributionsSnapshot';
import { fmtInt } from '../lib/format';

/** Shape of public/data/stack.json (build-time GitHub language snapshot). */
interface StackSnapshot {
  fetchedAt: string;
  reposAudited: number;
  languages: Array<{ name: string; bytes: number; share: number; repos: number }>;
}

interface MonthEntry {
  month: string;
  contributions: number;
}

const CHART_CELLS = 16;

/**
 * Tool counts, derived — never typed (DESIGN-SPEC §3.4.2). A tool's
 * count is the number of projects in projects.ts whose tech arrays
 * include it; when that derives to zero and the tool is also a
 * stack.json language, the language's public-repo count stands in.
 * A tool that still derives to nothing renders without a count.
 */
const TOOL_MATCH: Record<string, { projectTokens: string[]; languageNames: string[] }> = {
  'C++': { projectTokens: ['C++'], languageNames: ['C++'] },
  Python: { projectTokens: ['Python'], languageNames: ['Python'] },
  'JavaScript / TypeScript': {
    projectTokens: ['JavaScript', 'TypeScript'],
    languageNames: ['JavaScript', 'TypeScript'],
  },
  'HTML5 & CSS3': { projectTokens: ['HTML', 'CSS'], languageNames: ['HTML', 'CSS'] },
  'Git & GitHub': { projectTokens: [], languageNames: [] },
};

/** stack.json languages a tech-stack entry maps to, for the detail view. */
const DETAIL_LANGUAGES: Record<string, string[]> = {
  'C++': ['C++'],
  Python: ['Python'],
  'JavaScript / TypeScript': ['JavaScript', 'TypeScript'],
  'HTML5 & CSS3': ['HTML', 'CSS'],
  'Git & GitHub': [],
};

function deriveToolCount(toolName: string, stack: StackSnapshot | null): number {
  const match = TOOL_MATCH[toolName];
  if (!match) return 0;
  const fromProjects = PROJECTS.filter((project) =>
    project.tech.some((tech) => match.projectTokens.some((token) => tech.includes(token)))
  ).length;
  if (fromProjects > 0) return fromProjects;
  if (!stack) return 0;
  return match.languageNames.reduce(
    (sum, name) => sum + (stack.languages.find((lang) => lang.name === name)?.repos ?? 0),
    0
  );
}

/**
 * AI-tools renderer (DESIGN-SPEC §3.4.3): checkbox-glyph rows plus the
 * caption. It is only called when PROFILE actually carries an
 * aiTools list — it does not today, so nothing renders.
 */
function renderAiTools(list: string[]): React.ReactNode {
  return (
    <div style={{ fontSize: '12.5px', lineHeight: 1.9 }}>
      {list.map((name) => (
        <div key={name}>
          <span style={{ color: 'var(--kw)' }}>▣ </span>
          <span style={{ color: 'var(--fg)' }}>{name}</span>
        </div>
      ))}
      <div style={{ color: 'var(--dim)', fontSize: '10px', marginTop: '6px' }}>tools i actually use</div>
    </div>
  );
}

const SITE_ROWS: Array<{ name: string; file: string }> = [
  { name: 'React', file: 'package.json' },
  { name: 'TypeScript', file: 'tsconfig.json' },
  { name: 'Vite', file: 'vite.config.ts' },
];

/**
 * SkillsSection (DESIGN-SPEC §3.4) — stack.ts as a ghost transcript:
 * `stack --languages` (the exact 16-cell repos chart), `stack --tools`
 * (derived counts), `stack --ai-tools` (conditional — no data today),
 * `stack --site`, `node calendar.mjs <year>` (the contribution
 * heatmap), and finally the kept detail pane: the tech rows list with
 * the selected tech's role / repositories / notes / snippet, where the
 * byte-share context now lives as text.
 */
export const SkillsSection: React.FC<{ active?: boolean }> = ({ active }) => {
  const effectiveActive = active ?? true;
  const [selectedTech, setSelectedTech] = useState<string>('C++');
  const [stack, setStack] = useState<StackSnapshot | null>(null);
  const [months, setMonths] = useState<MonthEntry[]>([]);
  const [hoverLang, setHoverLang] = useState<string | null>(null);
  const snapshot = useContributionsSnapshot();

  // Language snapshot + monthly totals from the local same-origin
  // JSON. If a fetch fails, its block renders an honest omission —
  // nothing is invented.
  useEffect(() => {
    let cancelled = false;
    fetch('/data/stack.json')
      .then((r) => (r.ok ? (r.json() as Promise<StackSnapshot>) : null))
      .then((data) => {
        if (cancelled || !data?.languages) return;
        setStack(data);
      })
      .catch(() => {
        // Snapshot unavailable — no chart rendered.
      });
    fetch('/data/months.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { months?: MonthEntry[] } | null) => {
        if (cancelled || !data?.months) return;
        setMonths(data.months);
      })
      .catch(() => {
        // Months unavailable — the calendar line is omitted.
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

  /* ---------------- languages chart (§3.4.1) ---------------- */
  const sortedLanguages = stack ? [...stack.languages].sort((a, b) => b.repos - a.repos) : [];
  const maxRepos = sortedLanguages.reduce((max, lang) => Math.max(max, lang.repos), 0);

  const languagesOut = stack ? (
    <div style={{ position: 'relative' }}>
      <span
        data-eye-anchor="stack-chart"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '8px',
          height: '8px',
          border: '1px solid var(--dim)',
          display: 'inline-block',
        }}
      />
      <div className="scroll-contain" style={{ fontSize: '12px', lineHeight: 1.9, overflowX: 'auto' }}>
        {sortedLanguages.map((lang) => {
          const filled =
            hoverLang === lang.name
              ? CHART_CELLS
              : Math.max(1, Math.round((CHART_CELLS * lang.repos) / Math.max(1, maxRepos)));
          return (
            <div
              key={lang.name}
              tabIndex={0}
              onMouseEnter={() => setHoverLang(lang.name)}
              onMouseLeave={() => setHoverLang(null)}
              onFocus={() => setHoverLang(lang.name)}
              onBlur={() => setHoverLang(null)}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'baseline',
                flexWrap: 'nowrap',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: 'var(--fg)', minWidth: '96px', display: 'inline-block', flexShrink: 0 }}>
                {lang.name}
              </span>
              {/* The bar is 16 real cells, not █/░ glyph text: IBM Plex
                  Mono ships neither U+2588 nor U+2591 in any Google
                  Fonts subset, so glyph bars painted only via implicit
                  per-glyph fallback to an unnamed local font — and the
                  old aria-hidden wrapper dropped the bar from the
                  accessibility tree entirely ('HTML' read as followed
                  directly by its count). Solid cells (the same idiom
                  as the contribution heatmap) paint identically in
                  every environment; role="img" + label keeps the bar
                  present to assistive tech. Hover/focus fills all 16. */}
              <span
                role="img"
                aria-label={`${lang.name}: ${lang.repos} ${lang.repos === 1 ? 'repo' : 'repos'} — ${filled} of ${CHART_CELLS} cells`}
                style={{ display: 'inline-flex', gap: '1px', alignSelf: 'center', flexShrink: 0, lineHeight: 0 }}
              >
                {Array.from({ length: CHART_CELLS }, (_, cell) => (
                  <span
                    key={cell}
                    style={{
                      display: 'inline-block',
                      width: 'calc(1ch - 1px)',
                      height: '11px',
                      background:
                        cell < filled
                          ? 'var(--num)'
                          : 'color-mix(in srgb, var(--dim) 30%, transparent)',
                    }}
                  />
                ))}
              </span>
              <span style={{ color: 'var(--fg)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {lang.repos}
              </span>
              <span style={{ color: 'var(--dim)', flexShrink: 0 }}>{lang.repos === 1 ? 'repo' : 'repos'}</span>
            </div>
          );
        })}
      </div>
      <div style={{ color: 'var(--dim)', fontSize: '10px', marginTop: '8px' }}>
        counts: public repos per language · bytes are in the detail view
      </div>
      <div style={{ color: 'var(--dim)', fontSize: '10px', marginTop: '2px' }}>
        source: GitHub REST API · {stack.reposAudited} repos audited · snapshot {snapshotDate}
      </div>
    </div>
  ) : (
    <div style={{ color: 'var(--dim)', fontSize: '12px' }}>language snapshot unavailable</div>
  );

  /* ---------------- tools grid (§3.4.2) ---------------- */
  const toolsOut = (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '8px 18px',
          fontSize: '12.5px',
          lineHeight: 1.7,
        }}
      >
        {PROFILE.techStack.map((tool) => {
          const count = deriveToolCount(tool.name, stack);
          return (
            <div key={tool.name}>
              <span style={{ color: 'var(--fg)' }}>{tool.name}</span>
              {count > 0 && (
                <span style={{ color: 'var(--num)', marginLeft: '8px', fontVariantNumeric: 'tabular-nums' }}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ color: 'var(--dim)', fontSize: '10px', marginTop: '8px' }}>counts: projects using each</div>
    </div>
  );

  /* ---------------- site rows (§3.4.4) ---------------- */
  const siteOut = (
    <div>
      {SITE_ROWS.map((row) => (
        <div
          key={row.name}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '6px 0',
            borderBottom: '1px solid color-mix(in srgb, var(--fg) 7%, transparent)',
            fontSize: '12.5px',
          }}
        >
          <span style={{ color: 'var(--fg)' }}>{row.name}</span>
          <span style={{ color: 'var(--dim)' }}>{row.file}</span>
        </div>
      ))}
    </div>
  );

  /* ---------------- calendar (§3.4.5) ---------------- */
  const activeMonths = months.filter((m) => m.contributions > 0).length;
  const monthsTotal = months.reduce((sum, m) => sum + m.contributions, 0);
  const calendarTotal = snapshot.totalLastYear || monthsTotal;
  const latestYear =
    snapshot.days.length > 0
      ? Number(snapshot.days[snapshot.days.length - 1].date.slice(0, 4))
      : months.length > 0
        ? Number(months[months.length - 1].month.slice(0, 4))
        : stack?.fetchedAt
          ? Number(stack.fetchedAt.slice(0, 4))
          : snapshot.fetchedAt
            ? Number(snapshot.fetchedAt.slice(0, 4))
            : null;
  const calendarCmd = latestYear !== null ? `node calendar.mjs ${latestYear}` : 'node calendar.mjs';

  const heatmap = useMemo(() => {
    const days = snapshot.days.slice(-52 * 7);
    if (days.length === 0) return null;
    const cells: Array<ContributionDay | null> = [];
    const firstDow = (new Date(`${days[0].date}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
    for (let i = 0; i < firstDow; i += 1) cells.push(null);
    cells.push(...days);
    while (cells.length % 7 !== 0) cells.push(null);
    const columns: Array<Array<ContributionDay | null>> = [];
    for (let i = 0; i < cells.length; i += 7) columns.push(cells.slice(i, i + 7));
    const monthLabels: Array<{ col: number; label: string }> = [];
    let prevMonth = -1;
    columns.forEach((col, colIdx) => {
      const first = col.find((d) => d !== null);
      if (!first) return;
      const month = Number(first.date.slice(5, 7));
      if (month !== prevMonth) {
        prevMonth = month;
        monthLabels.push({
          col: colIdx,
          label: new Date(`${first.date}T00:00:00Z`).toLocaleDateString([], {
            month: 'short',
            timeZone: 'UTC',
          }),
        });
      }
    });
    return { columns, monthLabels };
  }, [snapshot.days]);

  const calendarOut = (
    <div>
      {months.length > 0 && (
        <div style={{ color: 'var(--chrome)', fontSize: '12.5px', marginBottom: '10px' }}>
          {'// done · '}
          {activeMonths} months · {calendarTotal} contributions
        </div>
      )}
      {heatmap ? (
        <div className="scroll-contain" style={{ overflowX: 'auto' }}>
          <div style={{ position: 'relative', height: '14px', minWidth: `${heatmap.columns.length * 10}px` }}>
            {heatmap.monthLabels.map((ml) => (
              <span
                key={`${ml.col}-${ml.label}`}
                style={{ position: 'absolute', left: `${ml.col * 10}px`, fontSize: '9px', color: 'var(--dim)' }}
              >
                {ml.label}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {heatmap.columns.map((col, colIdx) => (
              <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {col.map((day, rowIdx) => (
                  <span
                    key={rowIdx}
                    title={day ? `${day.count} contributions on ${day.date}` : undefined}
                    style={{
                      width: '8px',
                      height: '8px',
                      display: 'block',
                      background: day ? contributionLevelColor(day.level, day.count) : 'transparent',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '8px',
              fontSize: '9px',
              color: 'var(--dim)',
            }}
          >
            <span>none</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                style={{
                  width: '8px',
                  height: '8px',
                  display: 'inline-block',
                  background: contributionLevelColor(level, level === 0 ? 0 : 1),
                }}
              />
            ))}
            <span>more</span>
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--dim)', fontSize: '12px' }}>contribution data unavailable</div>
      )}
    </div>
  );

  /* ---------------- detail pane (kept behaviour) ---------------- */
  const detailLangNames = DETAIL_LANGUAGES[selectedTech] ?? [];
  const detailLang = stack
    ? detailLangNames
        .map((name) => stack.languages.find((lang) => lang.name === name))
        .filter((lang): lang is StackSnapshot['languages'][number] => Boolean(lang))
        .sort((a, b) => b.bytes - a.bytes)[0]
    : undefined;

  const detailOut = (
    <div>
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
                <span
                  style={{
                    display: 'block',
                    marginTop: '3px',
                    marginLeft: '22px',
                    fontSize: '11.5px',
                    color: 'var(--dim)',
                    lineHeight: 1.6,
                  }}
                >
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
          {detailLang && (
            <div style={{ color: 'var(--chrome)' }}>
              <span style={{ color: 'var(--dim)' }}>bytes </span>
              {fmtInt(detailLang.bytes)}
              <span style={{ color: 'var(--dim)' }}> · share </span>
              {(detailLang.share * 100).toFixed(1)}%
            </div>
          )}
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
            {'// verified in github.com/'}
            {PROFILE.handle} · utf-8
          </div>
        </div>
      )}
    </div>
  );

  /* ---------------- header / intro (kept copy) ---------------- */
  const headOut = (
    <>
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
        {'// 03 · TECHNICAL PROFILE'}
      </div>

      <h2
        style={{
          margin: '0 0 12px 0',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '13px',
          fontWeight: 400,
          color: 'var(--fg)',
          letterSpacing: '0.01em',
          lineHeight: 1.5,
        }}
      >
        Languages &amp; <span style={{ color: 'var(--chrome)' }}>technologies.</span>
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: '12.5px',
          color: 'var(--dim)',
          maxWidth: '76ch',
          lineHeight: 1.75,
        }}
      >
        Technologies used in my current academic studies and personal GitHub repositories. No fabricated
        percentages or arbitrary progress bars.
      </p>
    </>
  );

  const aiTools = (PROFILE as { aiTools?: string[] }).aiTools;

  const blocks: GhostBlock[] = [
    { id: 'head', out: headOut },
    { id: 'languages', cmd: 'stack --languages', out: languagesOut },
    { id: 'tools', cmd: 'stack --tools', out: toolsOut },
    ...(aiTools && aiTools.length > 0
      ? [{ id: 'ai-tools', cmd: 'stack --ai-tools', out: renderAiTools(aiTools) } as GhostBlock]
      : []),
    { id: 'site', cmd: 'stack --site', out: siteOut },
    { id: 'calendar', cmd: calendarCmd, out: calendarOut },
    { id: 'detail', out: detailOut },
  ];

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
        <GhostTranscript active={effectiveActive} fileBase="stack" blocks={blocks} />
      </div>
    </section>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CodeLineTokens, CodeTokenKind, WallFile } from '../../types';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/**
 * Landing Neovim demo (DESIGN-SPEC §2.1) — a staged, looping simulation
 * of an editing session over Karan's real wall files:
 *
 *   shell prompt types `nvim` → UI fades in → a file bursts in by
 *   glyph-scramble → simulated editing (teleporting block cursor, mode
 *   toggles, our own `:!./eye --track` / `:w` commands only) → write +
 *   diff line → vertical split opens with the next file bursting in →
 *   collapse → repeat. Once per cycle, after the 2nd rotation, the eye
 *   command also raises the ASCII-eye overlay + the face-blob.
 *
 * All per-frame data lives in refs inside one rAF driver; React state
 * only mirrors discrete snapshot changes. Reduced motion renders the
 * first file fully, statically, in NORMAL mode.
 */

interface CodeTickerPanelProps {
  wallFiles: WallFile[] | null;
}

/* ------------------------------------------------------------------ */
/* Fallback snippets — kept verbatim from the previous panel; used     */
/* only when wall.json is unavailable.                                 */
/* ------------------------------------------------------------------ */

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

const LEGACY_KIND: Record<NonNullable<Snippet['lines'][number]['kind']>, CodeTokenKind> = {
  kw: 'keyword',
  str: 'string',
  fn: 'function',
  ty: 'type',
  com: 'comment',
  text: 'text',
};

/** Token kind → theme CSS variable (App sets these on :root). */
const KIND_VAR: Record<CodeTokenKind, string> = {
  keyword: 'var(--kw)',
  string: 'var(--str)',
  number: 'var(--num)',
  function: 'var(--fn)',
  type: 'var(--ty)',
  comment: 'var(--dim)',
  member: 'var(--fn)',
  text: 'var(--fg)',
};

const LANG_LABELS: Record<string, string> = {
  cpp: 'C++',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  tsx: 'TSX',
  jsx: 'JSX',
  python: 'Python',
};

/**
 * Lines rendered per file. §2.1 says "the first ~40 lines"; capped at
 * 30 here so the pane + status/cmdline rows + hands strip still fit a
 * 100svh landing on shorter viewports.
 */
const MAX_LINES = 30;
/** Unresolved chars rendered as scramble glyphs ahead of the frontier. */
const SCRAMBLE_WINDOW = 24;
const SCRAMBLE_GLYPHS = '<>/\\|#$%&@+=~';
/** Target burst durations (s) — speed derives from the file's size. */
const BURST_SINGLE_S = 14;
const BURST_SPLIT_S = 9;
const EDIT_SINGLE_MS = 16000;
const EDIT_SPLIT_MS = 12000;
const EYE_COMMAND = ':!./eye --track';

/* ------------------------------------------------------------------ */
/* Demo file model — pre-tokenised lines with char-offset bookkeeping  */
/* so reveal happens by plain-text character count and markup never   */
/* breaks mid-token.                                                   */
/* ------------------------------------------------------------------ */

interface DemoFile {
  key: string;
  path: string;
  langLabel: string;
  lines: CodeLineTokens[];
  /** Full file line count (status-line percent denominator). */
  totalLines: number;
  lineStarts: number[];
  totalChars: number;
}

function makeDemoFile(
  key: string,
  path: string,
  langLabel: string,
  allLines: CodeLineTokens[],
  totalLines: number
): DemoFile {
  const lines = allLines.slice(0, MAX_LINES);
  const lineStarts: number[] = [];
  let acc = 0;
  for (const l of lines) {
    lineStarts.push(acc);
    acc += l.text.length;
  }
  return { key, path, langLabel, lines, totalLines, lineStarts, totalChars: acc };
}

function buildDemoFiles(wallFiles: WallFile[] | null): DemoFile[] {
  if (wallFiles && wallFiles.length > 0) {
    return wallFiles.map((f) =>
      makeDemoFile(
        `${f.repo}/${f.path}`,
        `${f.repo}/${f.path}`,
        LANG_LABELS[f.lang] ?? f.lang,
        f.tokens,
        Math.max(f.lines, f.tokens.length)
      )
    );
  }
  return SNIPPETS.map((s) =>
    makeDemoFile(
      s.path,
      s.path,
      s.path.endsWith('.py') ? 'Python' : 'C++',
      s.lines.map((l) => ({
        text: l.text,
        tokens: [{ text: l.text, kind: LEGACY_KIND[l.kind ?? 'text'] }],
      })),
      s.lines.length
    )
  );
}

/* ------------------------------------------------------------------ */
/* Small deterministic helpers                                         */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function scrambleChar(frame: number, globalIndex: number): string {
  const h = (Math.imul(frame + 1, 2654435761) ^ Math.imul(globalIndex + 1, 40503)) >>> 0;
  return SCRAMBLE_GLYPHS[h % SCRAMBLE_GLYPHS.length];
}

function posFromResolved(file: DemoFile, resolved: number): { line: number; col: number } {
  let line = 0;
  for (let i = 0; i < file.lines.length; i++) {
    if (file.lineStarts[i] <= resolved) line = i;
    else break;
  }
  const col = Math.min(
    Math.max(resolved - file.lineStarts[line], 0),
    file.lines[line]?.text.length ?? 0
  );
  return { line, col };
}

interface CursorStop {
  at: number;
  line: number;
  col: number;
  insert: boolean;
}

/** Pseudo-random (per-file seeded) cursor teleports for the edit phase. */
function cursorPlan(file: DemoFile, editMs: number): CursorStop[] {
  const rand = mulberry32(hashCode(file.path));
  const stops: CursorStop[] = [];
  let insert = false;
  for (let t = 600; t < editMs - 800; t += 1200) {
    const line = Math.floor(rand() * Math.max(file.lines.length, 1));
    const text = file.lines[line]?.text ?? '';
    const col = text.length === 0 ? 0 : Math.floor(rand() * (text.length + 1));
    if (rand() < 0.3) insert = !insert;
    stops.push({ at: t, line, col, insert });
  }
  return stops;
}

/* ------------------------------------------------------------------ */
/* ASCII eye — generated at runtime from an ellipse equation           */
/* (original parametric art; chars ' .:-=+*#%@').                      */
/* ------------------------------------------------------------------ */

const EYE_ART: string = (() => {
  const W = 34;
  const H = 15;
  const ramp = ' .:-=+*#%@';
  const rows: string[] = [];
  for (let y = 0; y < H; y++) {
    let row = '';
    for (let x = 0; x < W; x++) {
      const nx = (x - (W - 1) / 2) / ((W - 1) / 2);
      const ny = (y - (H - 1) / 2) / ((H - 1) / 2);
      const d = Math.sqrt(nx * nx + ny * ny * 3.1);
      let ch = ' ';
      if (d < 1) {
        if (d < 0.3) ch = ' ';
        else if (Math.abs(d - 0.52) < 0.07) ch = '#';
        else {
          const idx = Math.min(ramp.length - 1, Math.max(1, Math.floor((1 - d) * ramp.length)));
          ch = ramp[idx];
        }
      }
      row += ch;
    }
    rows.push(row);
  }
  return rows.join('\n');
})();

/* ------------------------------------------------------------------ */
/* Line / pane rendering                                               */
/* ------------------------------------------------------------------ */

function renderLineParts(
  line: CodeLineTokens,
  globalStart: number,
  resolvedInLine: number,
  scrambleEnd: number,
  cursorCol: number | null,
  frame: number
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let key = 0;
  let offset = 0;
  for (const tok of line.tokens) {
    const start = offset;
    const end = offset + tok.text.length;
    offset = end;
    const visEnd = Math.min(end, resolvedInLine);
    if (visEnd <= start) break;
    const visible = tok.text.slice(0, visEnd - start);
    if (cursorCol !== null && cursorCol >= start && cursorCol < visEnd) {
      const ci = cursorCol - start;
      if (ci > 0) {
        parts.push(
          <span key={key++} style={{ color: KIND_VAR[tok.kind] }}>
            {visible.slice(0, ci)}
          </span>
        );
      }
      parts.push(
        <span key={key++} style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
          {visible[ci]}
        </span>
      );
      if (ci + 1 < visible.length) {
        parts.push(
          <span key={key++} style={{ color: KIND_VAR[tok.kind] }}>
            {visible.slice(ci + 1)}
          </span>
        );
      }
    } else {
      parts.push(
        <span key={key++} style={{ color: KIND_VAR[tok.kind] }}>
          {visible}
        </span>
      );
    }
  }
  // Scramble window ahead of the resolved frontier.
  if (scrambleEnd > resolvedInLine) {
    let s = '';
    for (let gi = resolvedInLine; gi < scrambleEnd; gi++) {
      s += scrambleChar(frame, globalStart + gi);
    }
    const cursorInScramble =
      cursorCol !== null && cursorCol >= resolvedInLine && cursorCol < scrambleEnd
        ? cursorCol - resolvedInLine
        : -1;
    if (cursorInScramble >= 0) {
      if (cursorInScramble > 0) {
        parts.push(
          <span key="scr-a" style={{ color: 'var(--dim)' }}>
            {s.slice(0, cursorInScramble)}
          </span>
        );
      }
      parts.push(
        <span key="scr-c" style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
          {s[cursorInScramble]}
        </span>
      );
      if (cursorInScramble + 1 < s.length) {
        parts.push(
          <span key="scr-b" style={{ color: 'var(--dim)' }}>
            {s.slice(cursorInScramble + 1)}
          </span>
        );
      }
    } else {
      parts.push(
        <span key="scr" style={{ color: 'var(--dim)' }}>
          {s}
        </span>
      );
    }
  }
  // Block cursor at/past the end of a fully resolved line.
  if (cursorCol !== null && cursorCol >= line.text.length && scrambleEnd <= resolvedInLine) {
    parts.push(
      <span key="cur-eol" style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
        {' '}
      </span>
    );
  }
  return parts;
}

function renderPane(
  file: DemoFile,
  resolved: number,
  frame: number,
  cursor: { line: number; col: number } | null,
  dimmed: boolean
): React.ReactNode {
  const done = resolved >= file.totalChars;
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        opacity: dimmed ? 0.45 : 1,
      }}
    >
      {file.lines.map((line, i) => {
        const start = file.lineStarts[i];
        const len = line.text.length;
        const resolvedInLine = Math.min(Math.max(resolved - start, 0), len);
        let scrambleEnd = Math.min(Math.max(resolved + SCRAMBLE_WINDOW - start, 0), len);
        if (done || scrambleEnd < resolvedInLine) scrambleEnd = resolvedInLine;
        const hasNumber = done || start < resolved;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              height: '19.5px',
              lineHeight: '19.5px',
              whiteSpace: 'pre',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                width: '30px',
                flexShrink: 0,
                textAlign: 'right',
                paddingRight: '10px',
                color: 'var(--dim)',
                fontSize: '11px',
                userSelect: 'none',
              }}
            >
              {hasNumber ? String(i + 1).padStart(2, ' ') : '~'}
            </span>
            <span>
              {renderLineParts(
                line,
                start,
                resolvedInLine,
                scrambleEnd,
                cursor && cursor.line === i ? cursor.col : null,
                frame
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status line + command-line row (owned by the panel, §2.1)           */
/* ------------------------------------------------------------------ */

type Mode = 'NORMAL' | 'INSERT';

interface CmdState {
  kind: 'none' | 'insert' | 'cmd' | 'msg';
  text: string;
}

const BLOCK_CURSOR_STYLE: React.CSSProperties = {
  display: 'inline-block',
  width: '7px',
  height: '12px',
  marginLeft: '2px',
  background: 'var(--accent)',
  verticalAlign: '-2px',
};

function statusRow(file: DemoFile, mode: Mode, line: number, col: number): React.ReactNode {
  const path = file.path.length > 44 ? '</' + file.path.slice(-42) : file.path;
  const pct = file.totalLines > 0 ? Math.round(((line + 1) / file.totalLines) * 100) : 100;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginTop: '8px',
        fontSize: '10px',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          background: mode === 'INSERT' ? 'var(--accent)' : 'var(--kw)',
          color: 'var(--bg)',
          padding: '1px 6px',
          fontWeight: 600,
        }}
      >
        {mode}
      </span>
      <span style={{ color: 'var(--dim)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {path}
      </span>
      <span style={{ color: 'var(--chrome)' }}>{file.langLabel}</span>
      <span
        style={{
          marginLeft: 'auto',
          color: 'var(--chrome)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {line + 1}:{col + 1} {pct}%
      </span>
    </div>
  );
}

function cmdRow(cmd: CmdState): React.ReactNode {
  let content: React.ReactNode = ' ';
  if (cmd.kind === 'cmd') {
    content = (
      <>
        {cmd.text}
        <span className="cursor-blink" style={BLOCK_CURSOR_STYLE} />
      </>
    );
  } else if (cmd.kind === 'msg') {
    content = <span style={{ color: 'var(--dim)' }}>{cmd.text}</span>;
  } else if (cmd.kind === 'insert') {
    content = <span style={{ color: 'var(--dim)' }}>-- INSERT --</span>;
  }
  return (
    <div
      style={{
        minHeight: '16px',
        marginTop: '2px',
        fontSize: '11px',
        lineHeight: 1.5,
        color: 'var(--fg)',
        whiteSpace: 'pre',
        overflow: 'hidden',
        textAlign: 'left',
      }}
    >
      {content}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Face-blob — dense dot square with a wandering pupil void. Canvas    */
/* with its own rAF; pupil tracks the real cursor (lerp 0.14);         */
/* vanishes on fast cursor jumps and after 30s idle, returns ~15s      */
/* later. Procedural dots only.                                        */
/* ------------------------------------------------------------------ */

interface MouseNorm {
  x: number;
  y: number;
}

const FaceBlob: React.FC<{ mouseRef: { current: MouseNorm } }> = ({ mouseRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(true);
  const visRef = useRef(true);

  useEffect(() => {
    let showTimer = 0;
    let idleTimer = 0;
    let last = { x: 0, y: 0, t: 0 };
    const hide = (reappearMs: number) => {
      if (!visRef.current) return;
      visRef.current = false;
      setVisible(false);
      window.clearTimeout(showTimer);
      showTimer = window.setTimeout(() => {
        visRef.current = true;
        setVisible(true);
        resetIdle();
      }, reappearMs);
    };
    const resetIdle = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => hide(15000), 30000);
    };
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (last.t > 0 && now - last.t < 100) {
        const dist = Math.hypot(e.clientX - last.x, e.clientY - last.y);
        if (dist > 300) hide(15000);
      }
      last = { x: e.clientX, y: e.clientY, t: now };
      if (visRef.current) resetIdle();
    };
    window.addEventListener('mousemove', onMove);
    resetIdle();
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.clearTimeout(showTimer);
      window.clearTimeout(idleTimer);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let raf = 0;
    let frame = 0;
    const pupil = { x: 65, y: 65 };
    const anchors = [
      { x: 65, y: 65 },
      { x: 65, y: 38 },
      { x: 92, y: 38 },
    ];
    let anchorIdx = 0;
    let anchorAt = performance.now();
    const readFg = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#ebe6db';
    let fg = readFg();
    const draw = (now: number) => {
      frame++;
      if (frame % 30 === 0) fg = readFg();
      if (now - anchorAt > 2000) {
        anchorIdx = (anchorIdx + 1) % anchors.length;
        anchorAt = now;
      }
      const a = anchors[anchorIdx];
      const m = mouseRef.current;
      const tx = a.x + (m.x - 0.5) * 36;
      const ty = a.y + (m.y - 0.5) * 36;
      pupil.x += (tx - pupil.x) * 0.14;
      pupil.y += (ty - pupil.y) * 0.14;
      ctx.clearRect(0, 0, 130, 130);
      ctx.fillStyle = fg;
      for (let gy = 4; gy < 130; gy += 5) {
        for (let gx = 4; gx < 130; gx += 5) {
          if (Math.abs(gx - pupil.x) < 11 && Math.abs(gy - pupil.y) < 11) continue;
          ctx.fillRect(gx, gy, 1.6, 1.6);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [visible, mouseRef]);

  if (!visible) return null;
  return (
    <canvas
      ref={canvasRef}
      width={130}
      height={130}
      aria-hidden="true"
      style={{
        position: 'absolute',
        right: '-6px',
        top: '-26px',
        width: '130px',
        height: '130px',
        pointerEvents: 'none',
        zIndex: 6,
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* The demo state machine                                              */
/* ------------------------------------------------------------------ */

type Phase =
  | 'boot'
  | 'prompt'
  | 'uiIn'
  | 'burst'
  | 'edit'
  | 'write'
  | 'splitBurst'
  | 'splitEdit'
  | 'collapse';

interface UiSnap {
  phase: Phase;
  typed: number;
  uiOpacity: number;
  fileA: DemoFile;
  fileB: DemoFile | null;
  split: boolean;
  resolvedA: number;
  resolvedB: number;
  mode: Mode;
  cursorLine: number;
  cursorCol: number;
  cursorPane: 'A' | 'B';
  cmd: CmdState;
  eyeOn: boolean;
  eyeOpacity: number;
  blobOn: boolean;
  frame: number;
  /** Real cursor position, normalised — sampled by the driver per
   *  frame (drives the ASCII-eye readouts while the overlay is up). */
  mouseX: number;
  mouseY: number;
}

export const CodeTickerPanel: React.FC<CodeTickerPanelProps> = ({ wallFiles }) => {
  const reducedMotion = usePrefersReducedMotion();
  const demoFiles = useMemo(() => buildDemoFiles(wallFiles), [wallFiles]);
  const mouseRef = useRef<MouseNorm>({ x: 0.5, y: 0.5 });

  const [ui, setUi] = useState<UiSnap>(() => ({
    phase: 'boot',
    typed: 0,
    uiOpacity: 0,
    fileA: demoFiles[0],
    fileB: null,
    split: false,
    resolvedA: 0,
    resolvedB: 0,
    mode: 'NORMAL',
    cursorLine: 0,
    cursorCol: 0,
    cursorPane: 'A',
    cmd: { kind: 'none', text: '' },
    eyeOn: false,
    eyeOpacity: 0,
    blobOn: false,
    frame: 0,
    mouseX: 0.5,
    mouseY: 0.5,
  }));

  useEffect(() => {
    if (reducedMotion || demoFiles.length === 0) return;

    const onMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: window.innerWidth > 0 ? e.clientX / window.innerWidth : 0.5,
        y: window.innerHeight > 0 ? e.clientY / window.innerHeight : 0.5,
      };
    };
    window.addEventListener('mousemove', onMove);

    // Mutable demo state — refs only; React state mirrors snapshots.
    const queueInit = shuffle(demoFiles);
    const S = {
      phase: 'boot' as Phase,
      phaseStart: performance.now(),
      demoStart: performance.now(),
      typed: 0,
      uiOpacity: 0,
      queue: queueInit,
      qi: 0,
      fileA: queueInit[0],
      fileB: null as DemoFile | null,
      pendingNext: null as DemoFile | null,
      split: false,
      resolvedA: 0,
      resolvedB: 0,
      mode: 'NORMAL' as Mode,
      cursor: { line: 0, col: 0 },
      cursorPane: 'A' as 'A' | 'B',
      cmd: { kind: 'none', text: '' } as CmdState,
      stops: [] as CursorStop[],
      editMs: EDIT_SINGLE_MS,
      eyeAt: -1,
      eyeFired: false,
      eyeOn: false,
      eyeStart: 0,
      eyeOpacity: 0,
      blobOn: false,
      writeStage: 0,
      diffText: '',
      rotations: 0,
      cycleRotations: 0,
      eyeShown: false,
      frame: 0,
    };

    const advance = (): DemoFile => {
      S.qi++;
      if (S.qi >= S.queue.length) {
        S.queue = shuffle(demoFiles);
        S.qi = 0;
        S.cycleRotations = 0;
        S.eyeShown = false;
      }
      return S.queue[S.qi];
    };

    const setupEdit = (file: DemoFile, ms: number) => {
      S.stops = cursorPlan(file, ms);
      S.editMs = ms;
      S.eyeAt =
        !S.eyeShown && S.cycleRotations >= 2 ? 4500 + Math.random() * 1500 : -1;
      S.eyeFired = false;
      S.cursor = { line: 0, col: 0 };
      S.mode = 'NORMAL';
    };

    const go = (phase: Phase, now: number) => {
      S.phase = phase;
      S.phaseStart = now;
      if (phase === 'burst') {
        S.resolvedA = 0;
        S.mode = 'INSERT';
        S.cursorPane = 'A';
      } else if (phase === 'edit') {
        setupEdit(S.fileA, EDIT_SINGLE_MS);
        S.cursorPane = 'A';
      } else if (phase === 'write') {
        S.writeStage = 0;
        S.mode = 'NORMAL';
        S.cmd = { kind: 'none', text: '' };
      } else if (phase === 'splitBurst') {
        S.resolvedB = 0;
        S.mode = 'INSERT';
        S.cursorPane = 'B';
      } else if (phase === 'splitEdit') {
        if (S.fileB) setupEdit(S.fileB, EDIT_SPLIT_MS);
        S.cursorPane = 'B';
      }
    };

    const runEditStep = (el: number, now: number) => {
      // Cursor teleports + mode toggles.
      let stop: CursorStop | null = null;
      for (const st of S.stops) {
        if (st.at <= el) stop = st;
        else break;
      }
      if (stop) {
        S.cursor = { line: stop.line, col: stop.col };
        S.mode = stop.insert ? 'INSERT' : 'NORMAL';
      }
      // Eye command typing / firing.
      let cmdOverride: CmdState | null = null;
      if (S.eyeAt > 0) {
        if (el >= S.eyeAt && el < S.eyeAt + 400) {
          const chars = Math.floor((el - S.eyeAt) / 25);
          cmdOverride = { kind: 'cmd', text: EYE_COMMAND.slice(0, chars) };
        } else if (el >= S.eyeAt + 400 && !S.eyeFired) {
          S.eyeFired = true;
          S.eyeShown = true;
          S.eyeOn = true;
          S.eyeStart = now;
          S.blobOn = true;
        }
      }
      if (S.eyeOn) {
        const ee = now - S.eyeStart;
        S.eyeOpacity = ee < 400 ? ee / 400 : ee > 4600 ? Math.max(0, (5000 - ee) / 400) : 1;
        if (ee >= 5000) {
          S.eyeOn = false;
          S.eyeOpacity = 0;
        }
      }
      S.cmd =
        cmdOverride ??
        (S.mode === 'INSERT' ? { kind: 'insert', text: '' } : { kind: 'none', text: '' });
    };

    const step = (now: number) => {
      const el = now - S.phaseStart;
      switch (S.phase) {
        case 'boot':
          if (el >= 400) go('prompt', now);
          break;
        case 'prompt': {
          S.typed = Math.min(4, Math.floor(el / 80) + (el > 0 ? 1 : 0));
          if (el >= 4 * 80 + 180) go('uiIn', now);
          break;
        }
        case 'uiIn':
          S.uiOpacity = Math.min(1, el / 200);
          if (el >= 260) {
            S.uiOpacity = 1;
            go('burst', now);
          }
          break;
        case 'burst': {
          const speed = Math.max(40, S.fileA.totalChars / BURST_SINGLE_S);
          S.resolvedA = Math.min(S.fileA.totalChars, (el / 1000) * speed);
          S.cursor = posFromResolved(S.fileA, S.resolvedA);
          if (S.resolvedA >= S.fileA.totalChars) go('edit', now);
          break;
        }
        case 'edit':
          runEditStep(el, now);
          if (el >= S.editMs) go('write', now);
          break;
        case 'write': {
          if (S.writeStage === 0) {
            if (el < 100) {
              S.cmd = { kind: 'cmd', text: ':w'.slice(0, el < 50 ? 1 : 2) };
            } else {
              S.writeStage = 1;
            }
          }
          if (S.writeStage === 1) {
            S.cmd = { kind: 'msg', text: `${S.fileA.path} written` };
            if (el >= 1700) {
              const next = advance();
              S.pendingNext = next;
              S.rotations++;
              S.cycleRotations++;
              const n = Math.abs(S.fileA.lines.length - next.lines.length);
              const t = Math.max(1, Math.round((now - S.demoStart) / 1000));
              S.diffText =
                n > 0
                  ? `${n} fewer lines; compare #${S.rotations} from ${t}s ago`
                  : `same length; compare #${S.rotations} from ${t}s ago`;
              S.writeStage = 2;
            }
          } else if (S.writeStage === 2) {
            S.cmd = { kind: 'msg', text: S.diffText };
            if (el >= 3500) {
              const next = S.pendingNext ?? advance();
              if (window.innerWidth >= 900) {
                S.fileB = next;
                S.split = true;
                go('splitBurst', now);
              } else {
                S.fileA = next;
                S.split = false;
                go('burst', now);
              }
            }
          }
          break;
        }
        case 'splitBurst': {
          const fileB = S.fileB;
          if (!fileB) {
            go('burst', now);
            break;
          }
          const speed = Math.max(40, fileB.totalChars / BURST_SPLIT_S);
          S.resolvedB = Math.min(fileB.totalChars, (el / 1000) * speed);
          S.cursor = posFromResolved(fileB, S.resolvedB);
          if (S.resolvedB >= fileB.totalChars) go('splitEdit', now);
          break;
        }
        case 'splitEdit':
          runEditStep(el, now);
          if (el >= S.editMs) go('collapse', now);
          break;
        case 'collapse':
          if (el >= 350 && S.fileB) {
            S.fileA = S.fileB;
            S.fileB = null;
            S.split = false;
            S.resolvedA = S.fileA.totalChars;
            S.cursorPane = 'A';
            go('write', now);
          }
          break;
      }
    };

    let lastKey = '';
    const push = () => {
      const snap: UiSnap = {
        phase: S.phase,
        typed: S.typed,
        uiOpacity: S.uiOpacity,
        fileA: S.fileA,
        fileB: S.fileB,
        split: S.split,
        resolvedA: S.resolvedA,
        resolvedB: S.resolvedB,
        mode: S.mode,
        cursorLine: S.cursor.line,
        cursorCol: S.cursor.col,
        cursorPane: S.cursorPane,
        cmd: S.cmd,
        eyeOn: S.eyeOn,
        eyeOpacity: S.eyeOpacity,
        blobOn: S.blobOn,
        frame: S.frame,
        mouseX: mouseRef.current.x,
        mouseY: mouseRef.current.y,
      };
      const key = [
        snap.phase,
        snap.typed,
        Math.round(snap.uiOpacity * 20),
        snap.fileA.key,
        snap.fileB?.key ?? '',
        snap.split ? 1 : 0,
        Math.floor(snap.resolvedA),
        Math.floor(snap.resolvedB),
        snap.mode,
        snap.cursorLine,
        snap.cursorCol,
        snap.cursorPane,
        snap.cmd.kind,
        snap.cmd.text,
        snap.eyeOn ? 1 : 0,
        Math.round(snap.eyeOpacity * 20),
        snap.blobOn ? 1 : 0,
        snap.eyeOn ? snap.frame : 0,
      ].join('|');
      if (key !== lastKey) {
        lastKey = key;
        setUi(snap);
      }
    };

    let raf = 0;
    let cancelled = false;
    const tick = (now: number) => {
      if (cancelled) return;
      S.frame++;
      step(now);
      push();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, [demoFiles, reducedMotion]);

  /* Reduced motion: first file fully rendered, NORMAL, static. */
  if (reducedMotion) {
    const file = demoFiles[0];
    if (!file) return null;
    return (
      <div
        className="code-ticker-panel"
        aria-hidden="true"
        style={{
          width: '100%',
          maxWidth: '640px',
          margin: '0 auto',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '13px',
          textAlign: 'left',
        }}
      >
        {renderPane(file, file.totalChars, 0, { line: 0, col: 0 }, false)}
        {statusRow(file, 'NORMAL', 0, 0)}
        {cmdRow({ kind: 'none', text: '' })}
      </div>
    );
  }

  const activeFile = ui.cursorPane === 'B' && ui.fileB ? ui.fileB : ui.fileA;
  const cursor = { line: ui.cursorLine, col: ui.cursorCol };
  const showPanes = ui.phase !== 'boot' && ui.phase !== 'prompt';

  return (
    <div
      className="code-ticker-panel"
      aria-hidden="true"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: ui.split ? '815px' : '640px',
        margin: '0 auto',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '13px',
        textAlign: 'left',
        transition: 'max-width 300ms ease',
      }}
    >
      {!showPanes ? (
        /* First paint: shell prompt only, then `nvim` types at ghost speed. */
        <div style={{ height: '40px', fontSize: '13px', color: 'var(--fg)', lineHeight: 1.5 }}>
          <span style={{ color: 'var(--dim)' }}>~ &gt;</span>{' '}
          <span>{'nvim'.slice(0, ui.typed)}</span>
          <span className="cursor-blink" style={BLOCK_CURSOR_STYLE} />
        </div>
      ) : (
        <div style={{ opacity: ui.uiOpacity }}>
          <div style={{ display: 'flex', gap: '14px', position: 'relative' }}>
            {renderPane(
              ui.fileA,
              ui.split ? ui.fileA.totalChars : ui.resolvedA,
              ui.frame,
              ui.cursorPane === 'A' ? cursor : null,
              ui.split
            )}
            {ui.split &&
              ui.fileB &&
              renderPane(
                ui.fileB,
                ui.resolvedB,
                ui.frame,
                ui.cursorPane === 'B' ? cursor : null,
                false
              )}
            {ui.eyeOn && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'color-mix(in srgb, var(--bg) 55%, transparent)',
                  opacity: ui.eyeOpacity,
                  zIndex: 5,
                  pointerEvents: 'none',
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    lineHeight: 1.1,
                    color: 'var(--fg)',
                    whiteSpace: 'pre',
                    letterSpacing: 0,
                  }}
                >
                  {EYE_ART}
                </pre>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--dim)',
                    marginTop: '6px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {`['pupil:u'] ${ui.mouseX.toFixed(3)} / ${ui.mouseY.toFixed(3)} / None`}
                </div>
              </div>
            )}
          </div>
          {statusRow(activeFile, ui.mode, ui.cursorLine, ui.cursorCol)}
          {cmdRow(ui.cmd)}
        </div>
      )}
      {ui.blobOn && <FaceBlob mouseRef={mouseRef} />}
    </div>
  );
};

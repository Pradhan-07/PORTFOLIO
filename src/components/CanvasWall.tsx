import React, { useEffect, useRef } from 'react';
import type { Theme } from '../types';
import { CODE_WALL_SNIPPETS } from '../data/codeSnippets';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface CanvasWallProps {
  theme: Theme;
  interactive?: boolean;
}

export const CanvasWall: React.FC<CanvasWallProps> = ({ theme, interactive = true }) => {
  const reducedMotion = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -100, y: -100, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let drawFrame: () => void = () => undefined;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const CELL_W = 7.5;
    const CELL_H = 14;
    const FONT_SIZE = 11;
    const FONT_FAMILY = '"IBM Plex Mono", ui-monospace, monospace';

    const cols = Math.ceil(width / CELL_W) + 2;
    const rows = Math.ceil(height / CELL_H) + 2;

    // Generate repeated code matrix grid
    const codeLines = CODE_WALL_SNIPPETS;
    const grid: {
      char: string;
      kind: 'keyword' | 'string' | 'number' | 'function' | 'type' | 'comment' | 'text' | 'member';
      baseAlpha: number;
    }[][] = [];

    let lineIdx = 0;
    for (let r = 0; r < rows; r++) {
      const lineData = codeLines[lineIdx % codeLines.length];
      lineIdx++;

      const rowChars: {
        char: string;
        kind: 'keyword' | 'string' | 'number' | 'function' | 'type' | 'comment' | 'text' | 'member';
        baseAlpha: number;
      }[] = [];

      let charCount = 0;
      let tokIdx = 0;

      while (charCount < cols) {
        if (tokIdx >= lineData.tokens.length) {
          // Fill rest of row with subtle space or comment indentation
          rowChars.push({ char: ' ', kind: 'text', baseAlpha: 0.1 });
          charCount++;
        } else {
          const token = lineData.tokens[tokIdx];
          tokIdx++;
          for (let i = 0; i < token.text.length && charCount < cols; i++) {
            const ch = token.text[i];
            const isComment = token.kind === 'comment';
            rowChars.push({
              char: ch,
              kind: token.kind,
              baseAlpha: isComment ? 0.22 : 0.42,
            });
            charCount++;
          }
        }
      }
      grid.push(rowChars);
    }

    // Interactive flux state
    let frame = 0;
    const cursor = { row: 3, col: 12, blink: true };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      // In reduced-motion mode there is no loop; keep the static frame fresh.
      if (reducedMotion) drawFrame();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    const render = () => {
      frame++;
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, height);

      ctx.font = `400 ${FONT_SIZE}px ${FONT_FAMILY}`;
      ctx.textBaseline = 'top';

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const mouseActive = mouseRef.current.active;

      // Draw subtle grid characters
      for (let r = 0; r < rows; r++) {
        const row = grid[r];
        if (!row) continue;
        const y = r * CELL_H;

        for (let c = 0; c < cols; c++) {
          const item = row[c];
          if (!item || item.char === ' ') continue;

          const x = c * CELL_W;

          // Distance from mouse for interactive glow
          let alpha = item.baseAlpha;
          if (mouseActive) {
            const dx = x - mouseX;
            const dy = y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 140) {
              const boost = (1 - dist / 140) * 0.55;
              alpha = Math.min(1.0, alpha + boost);
            }
          }

          // Subtle rhythmic breathing in background
          if ((r + c + frame) % 180 === 0) {
            alpha = Math.min(0.9, alpha + 0.3);
          }

          // Color selection based on token kind
          let color = theme.kinds[item.kind] || theme.fg;

          ctx.fillStyle = color;
          ctx.globalAlpha = alpha;
          ctx.fillText(item.char, x, y + 1);
        }
      }

      // Blinking terminal cursor at row 3, col 28
      if (frame % 60 < 35) {
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(cursor.col * CELL_W, cursor.row * CELL_H + 2, CELL_W, CELL_H - 2);
      }

      ctx.globalAlpha = 1.0;
    };

    drawFrame = render;

    if (reducedMotion) {
      // Calm state (G9): draw a single static frame — no breathing, no
      // blinking cursor loop, no mouse-glow animation. Content is identical.
      render();
    } else {
      const loop = () => {
        render();
        animId = requestAnimationFrame(loop);
      };
      loop();
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, interactive, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="wall-canvas"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
};

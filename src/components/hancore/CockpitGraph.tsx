import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface CockpitGraphProps {
  /** Legacy section navigation shared with the header/terminal/palette. */
  onNavigate: (sectionId: string) => void;
}

type GraphMode = 'dsa' | 'ai' | 'web';

/**
 * The cockpit's animated pointer-reactive graph, absorbed into the
 * about.tsx buffer as its header visual (G5 absorption, item 1). All three
 * modes (DSA / AI-ML / Web), the mode switcher, pointer reactivity and the
 * reduced-motion static frame are preserved from the cockpit original.
 * Height is grid-snapped: 14 cells (196px) on desktop bands, 10 cells
 * (140px) in the ≤640 band — driven by the .cockpit-graph-canvas CSS rule.
 */
export const CockpitGraph: React.FC<CockpitGraphProps> = ({ onNavigate }) => {
  const [graphMode, setGraphMode] = useState<GraphMode>('dsa');
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const reducedMotion = usePrefersReducedMotion();
  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Evolving interactive mathematical contour graph
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 520;
    const height = canvas.clientHeight || 196;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Grid background markings
      ctx.strokeStyle = 'color-mix(in srgb, var(--fg) 6%, transparent)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const midY = height / 2;

      // MODE 1: DSA / C++ — Asymptotic algorithmic curves & partitions
      if (graphMode === 'dsa') {
        const curves = [
          { color: 'var(--accent)', alpha: 0.9, amp: 26, freq: 0.018, speed: 0.032 },
          { color: 'var(--chrome)', alpha: 0.5, amp: 18, freq: 0.024, speed: 0.02 },
          { color: 'var(--dim)', alpha: 0.35, amp: 12, freq: 0.038, speed: 0.04 },
        ];

        curves.forEach((c) => {
          ctx.strokeStyle = c.color;
          ctx.globalAlpha = c.alpha;
          ctx.lineWidth = 1;
          ctx.beginPath();

          for (let x = 0; x < width; x += 4) {
            let perturbation = 0;
            if (pointerPos.active) {
              const dist = Math.abs(x - pointerPos.x);
              if (dist < 80) {
                perturbation = Math.sin((80 - dist) * 0.08) * 16;
              }
            }
            const y = midY + Math.sin(x * c.freq + frame * c.speed) * c.amp + perturbation;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });

        // Pointer pivot highlight
        if (pointerPos.active) {
          ctx.strokeStyle = '#66cc6a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pointerPos.x, pointerPos.y, 14, 0, Math.PI * 2);
          ctx.stroke();
        }

        const scanX = (frame * 1.5) % width;
        ctx.strokeStyle = 'color-mix(in srgb, var(--accent) 40%, transparent)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(scanX, 0);
        ctx.lineTo(scanX, height);
        ctx.stroke();

        ctx.font = '8.5px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'var(--dim)';
        ctx.globalAlpha = 1;
        ctx.fillText(`f(x) = O(N log N) · STL RED-BLACK TREE PARTITIONS · PIVOT x:${Math.round(scanX)}`, 10, height - 8);
      }
      // MODE 2: AI / ML — Gradient descent, activation heuristics
      else if (graphMode === 'ai') {
        ctx.strokeStyle = 'var(--accent)';
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 1.2;
        ctx.beginPath();

        for (let x = 0; x < width; x += 3) {
          // Sigmoid & gradient descent convergence curve
          const normX = (x / width) * 10 - 5;
          const sigmoid = 1 / (1 + Math.exp(-normX));
          const lossDescent = Math.exp(-x / 140) * Math.sin(x * 0.05 + frame * 0.04) * 28;
          const y = midY + (sigmoid - 0.5) * 45 + lossDescent;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Pulsing Neural Nodes
        const nodePositions = [width * 0.2, width * 0.45, width * 0.7, width * 0.9];
        nodePositions.forEach((nx, nIdx) => {
          const ny = midY + Math.sin(frame * 0.05 + nIdx) * 18;
          ctx.fillStyle = '#66cc6a';
          ctx.beginPath();
          ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.font = '8.5px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'var(--dim)';
        ctx.globalAlpha = 1;
        ctx.fillText(`∇L(θ) = -η·dL/dθ · LOSS CONVERGENCE: 0.034 · TENSOR INFERENCE`, 10, height - 8);
      }
      // MODE 3: Web Dev — 60fps Event Loop & Hydration Stream
      else {
        // Frame rate square wave & telemetry packets
        ctx.strokeStyle = 'var(--chrome)';
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 0; x < width; x += 4) {
          const tick = Math.sin(x * 0.08 + frame * 0.08) > 0 ? 18 : -18;
          const ripple = pointerPos.active && Math.abs(x - pointerPos.x) < 60 ? Math.sin((frame + x) * 0.2) * 12 : 0;
          const y = midY + tick + ripple;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.font = '8.5px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'var(--dim)';
        ctx.globalAlpha = 1;
        ctx.fillText(`EVENT LOOP: 60FPS · REACT 19 HYDRATION · SUPABASE STREAMING TICK`, 10, height - 8);
      }

    };

    if (reducedMotion) {
      // Calm state (G9): one static frame of the current graph mode.
      // Pointer moves still redraw a single frame per move (the effect
      // re-runs), but nothing animates autonomously.
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
    };
  }, [graphMode, pointerPos, reducedMotion]);

  return (
    <div
      className="cockpit-graph"
      style={{
        background: 'color-mix(in srgb, var(--bg) 95%, #101010)',
        border: '1px solid color-mix(in srgb, var(--fg) 14%, transparent)',
        borderRadius: 'var(--radius)',
        padding: 'var(--sp-3)',
        fontFamily: '"IBM Plex Mono", monospace',
        boxShadow: 'var(--ring)',
      }}
    >
      {/* Terminal Header & Mode Switcher */}
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
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span>fish ~ · KARAN-DEV</span>

        {/* Interactive Graph Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {(['dsa', 'ai', 'web'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setGraphMode(m)}
              style={{
                background: graphMode === m ? 'var(--accent)' : 'transparent',
                color: graphMode === m ? 'var(--bg)' : 'var(--dim)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: 'var(--radius)',
                padding: '2px 6px',
                fontSize: '9.5px',
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              {m === 'dsa' ? 'DSA / C++' : m === 'ai' ? 'AI / ML' : 'WEB DEV'}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Graph Canvas with pointer tracking */}
      <div
        style={{ position: 'relative', marginBottom: '20px', width: '100%', touchAction: 'pan-y' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setPointerPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
        }}
        onMouseLeave={() => setPointerPos((prev) => ({ ...prev, active: false }))}
        onTouchMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const touch = e.touches[0];
          if (touch) {
            setPointerPos({ x: touch.clientX - rect.left, y: touch.clientY - rect.top, active: true });
          }
        }}
        onTouchEnd={() => setPointerPos((prev) => ({ ...prev, active: false }))}
      >
        <canvas
          ref={graphCanvasRef}
          className="cockpit-graph-canvas"
          style={{
            width: '100%',
            display: 'block',
            background: 'color-mix(in srgb, var(--bg) 90%, #060806)',
            borderRadius: 'var(--radius)',
            border: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
            cursor: 'crosshair',
          }}
        />
      </div>

      {/* Telemetry Summary Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          fontSize: '10px',
        }}
      >
        <div
          onClick={() => onNavigate('focus')}
          style={{ background: 'var(--line)', padding: '8px 10px', borderRadius: 'var(--radius)', cursor: 'pointer' }}
        >
          <div style={{ color: 'var(--dim)', fontSize: '8.5px' }}>CURRENT FOCUS</div>
          <div style={{ color: 'var(--fg)', fontWeight: 600, marginTop: '2px' }}>DSA / C++ ↗</div>
        </div>
        <div
          onClick={() => onNavigate('focus')}
          style={{ background: 'var(--line)', padding: '8px 10px', borderRadius: 'var(--radius)', cursor: 'pointer' }}
        >
          <div style={{ color: 'var(--dim)', fontSize: '8.5px' }}>EXPLORING</div>
          <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}>AI / ML ↗</div>
        </div>
        <div
          onClick={() => onNavigate('projects')}
          style={{ background: 'var(--line)', padding: '8px 10px', borderRadius: 'var(--radius)', cursor: 'pointer' }}
        >
          <div style={{ color: 'var(--dim)', fontSize: '8.5px' }}>BUILDING</div>
          <div style={{ color: 'var(--chrome)', fontWeight: 600, marginTop: '2px' }}>WEB DEVELOPMENT ↗</div>
        </div>
      </div>
    </div>
  );
};

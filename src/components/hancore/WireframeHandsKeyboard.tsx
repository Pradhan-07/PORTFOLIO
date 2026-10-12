import React, { useEffect, useRef } from 'react';

interface WireframeHandsKeyboardProps {
  themeFg?: string;
  themeAccent?: string;
}

export const WireframeHandsKeyboard: React.FC<WireframeHandsKeyboardProps> = ({
  themeFg = '#ebe6db',
  themeAccent = '#ebe6db',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = 380);
    const height = (canvas.height = 140);

    // Standard 21 MediaPipe hand landmark topology links
    const HAND_LINKS: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [5, 9], [9, 10], [10, 11], [11, 12], // Middle
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring
      [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [0, 17], // Palm base
    ];

    // Normalized template coordinates for left hand (wrist at 0, palm, fingers spreading)
    const baseHandTemplate = [
      [0.50, 0.90], // 0: Wrist
      [0.32, 0.78], [0.22, 0.62], [0.15, 0.48], [0.10, 0.38], // 1-4: Thumb
      [0.36, 0.52], [0.32, 0.36], [0.29, 0.24], [0.26, 0.14], // 5-8: Index
      [0.50, 0.50], [0.50, 0.32], [0.50, 0.18], [0.50, 0.08], // 9-12: Middle
      [0.64, 0.54], [0.66, 0.38], [0.69, 0.26], [0.71, 0.16], // 13-16: Ring
      [0.76, 0.62], [0.82, 0.48], [0.86, 0.38], [0.90, 0.28], // 17-20: Pinky
    ];

    // Minimal Keyboard layout rows
    const keyRows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    ];

    let frame = 0;
    let pointerX = width / 2;
    let pointerY = height / 2;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = e.clientX - rect.left;
      pointerY = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', handlePointerMove);

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw faint minimalist keyboard layout above wireframe hands
      const kw = 16;
      const kh = 12;
      const gap = 3;
      const kTop = 8;

      ctx.font = '8px "IBM Plex Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      keyRows.forEach((row, rIdx) => {
        const rowWidth = row.length * (kw + gap) - gap;
        const startX = (width - rowWidth) / 2 + (rIdx === 1 ? 4 : rIdx === 2 ? 10 : 0);
        const y = kTop + rIdx * (kh + gap);

        row.forEach((key, kIdx) => {
          const x = startX + kIdx * (kw + gap);
          // Highlight key near pointer
          const dist = Math.hypot(x + kw / 2 - pointerX, y + kh / 2 - pointerY);
          const isNear = dist < 25;

          ctx.strokeStyle = isNear
            ? `color-mix(in srgb, ${themeAccent} 60%, transparent)`
            : `color-mix(in srgb, ${themeFg} 14%, transparent)`;
          ctx.strokeRect(x, y, kw, kh);

          ctx.fillStyle = isNear ? themeAccent : `color-mix(in srgb, ${themeFg} 35%, transparent)`;
          ctx.fillText(key, x + kw / 2, y + kh / 2);
        });
      });

      // 2. Draw two wireframe hands (Left: side=0, Right: side=1)
      const handBoxes = [
        { side: 0, x0: 36, y0: 54, w: 130, h: 78, label: "['hand0:u'] 0.142857" },
        { side: 1, x0: 214, y0: 54, w: 130, h: 78, label: "['hand1:u'] 0.857143" },
      ];

      handBoxes.forEach((box) => {
        const { side, x0, y0, w, h, label } = box;

        // Subtle box boundary
        ctx.strokeStyle = `color-mix(in srgb, ${themeFg} 12%, transparent)`;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x0, y0, w, h);

        // Micro label
        ctx.textAlign = 'left';
        ctx.font = '7.5px "IBM Plex Mono", monospace';
        ctx.fillStyle = `color-mix(in srgb, ${themeFg} 40%, transparent)`;
        ctx.fillText(label, x0 + 4, y0 - 3);

        // Calculate 21 points with slight natural idle oscillation
        const points = baseHandTemplate.map(([u, v], idx) => {
          // Mirror horizontally for right hand
          const posX = side === 0 ? u : 1 - u;
          const sway = Math.sin(frame * 0.04 + idx * 0.5 + side * Math.PI) * 1.5;
          const tipSway = idx % 4 === 0 && idx > 0 ? Math.sin(frame * 0.08 + idx) * 2.5 : 0;

          return [
            x0 + 12 + posX * (w - 24) + sway,
            y0 + 8 + v * (h - 16) + tipSway,
          ];
        });

        // Draw bone links
        ctx.strokeStyle = `color-mix(in srgb, ${themeFg} 25%, transparent)`;
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        for (const [a, b] of HAND_LINKS) {
          ctx.moveTo(points[a][0], points[a][1]);
          ctx.lineTo(points[b][0], points[b][1]);
        }
        ctx.stroke();

        // Draw landmark nodes
        points.forEach(([px, py], k) => {
          const isFingertip = k > 0 && k % 4 === 0;
          const r = isFingertip ? 2 : 1.25;

          ctx.fillStyle = isFingertip ? themeAccent : `color-mix(in srgb, ${themeFg} 65%, transparent)`;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handlePointerMove);
    };
  }, [themeFg, themeAccent]);

  return (
    <div
      className="wireframe-hands-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: 0.9,
        pointerEvents: 'auto',
      }}
    >
      <canvas
        ref={canvasRef}
        width={380}
        height={140}
        style={{
          display: 'block',
          width: '380px',
          height: '140px',
          maxWidth: '100%',
        }}
      />
    </div>
  );
};

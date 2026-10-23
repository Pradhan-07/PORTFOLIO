import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Theme } from '../../types';

/**
 * `:colorscheme` picker (DESIGN-SPEC §2.1) — a centred dialog over the
 * landing, opened by the `:theme` button or the `T` key. Typing in the
 * command row filters the 8 themes by name; ↑/↓ and hover move the
 * highlight; Enter applies instantly (App state + localStorage) and
 * closes. The vertical strip previews the HIGHLIGHTED theme's palette.
 *
 * State (query / highlight) initialises from props at mount — the
 * parent remounts the picker on every open (key change), so no
 * reset-on-open effect is needed.
 */

interface ColorschemePickerProps {
  open: boolean;
  themes: Theme[];
  activeIndex: number;
  onSelect: (i: number) => void;
  onClose: () => void;
}

export const ColorschemePicker: React.FC<ColorschemePickerProps> = ({
  open,
  themes,
  activeIndex,
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(() =>
    Math.min(Math.max(activeIndex, 0), Math.max(themes.length - 1, 0))
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(
    () =>
      themes
        .map((theme, index) => ({ theme, index }))
        .filter(({ theme }) =>
          theme.name.toLowerCase().includes(query.trim().toLowerCase())
        ),
    [themes, query]
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open ]);

  // Keep the highlighted row in view while stepping through the list.
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-highlight="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight, query]);

  if (!open) return null;

  const highlighted = filtered[highlight] ?? filtered[0];

  const select = (index: number) => {
    onSelect(index);
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (highlighted) select(highlighted.index);
    }
  };

  const hl = highlighted?.theme;
  const swatches = hl
    ? [
        hl.bg,
        hl.fg,
        hl.accent,
        hl.chrome,
        hl.line,
        hl.kinds.keyword,
        hl.kinds.string,
        hl.kinds.number,
        hl.kinds.function,
        hl.kinds.type,
        hl.kinds.member ?? hl.accent,
      ]
    : [];

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'color-mix(in srgb, var(--bg) 70%, transparent)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="colorscheme picker"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
        style={{
          width: 'min(460px, 92vw)',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          padding: '14px 16px',
          fontFamily: '"IBM Plex Mono", monospace',
          color: 'var(--fg)',
          textAlign: 'left',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--dim)', letterSpacing: '0.06em' }}>
          :colorscheme
        </div>

        {/* Command input row — typing filters the list. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            borderBottom: '1px solid var(--line)',
            padding: '4px 0',
            margin: '8px 0',
          }}
        >
          <span style={{ color: 'var(--dim)', fontSize: '12px' }}>:</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            aria-label="filter colorschemes"
            autoComplete="off"
            spellCheck={false}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--fg)',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '12px',
              flex: 1,
              minWidth: 0,
              padding: 0,
            }}
          />
          {query === '' && (
            <span
              className="cursor-blink"
              style={{
                display: 'inline-block',
                width: '7px',
                height: '13px',
                background: 'var(--accent)',
                flexShrink: 0,
              }}
            />
          )}
        </div>

        {/* List + palette-preview strip for the highlighted theme. */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div ref={listRef} style={{ flex: 1, maxHeight: '176px', overflowY: 'auto' }}>
            {filtered.map(({ theme, index }, pos) => (
              <div
                key={theme.name}
                data-highlight={pos === highlight}
                onMouseEnter={() => setHighlight(pos)}
                onClick={() => select(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '3px 6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  background:
                    pos === highlight
                      ? 'color-mix(in srgb, var(--fg) 10%, transparent)'
                      : 'transparent',
                  color: pos === highlight ? 'var(--fg)' : 'var(--chrome)',
                }}
              >
                <span style={{ width: '10px', flexShrink: 0, color: 'var(--accent)' }}>
                  {index === activeIndex ? '►' : ''}
                </span>
                <span>{theme.name}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ color: 'var(--dim)', fontSize: '12px', padding: '3px 6px' }}>
                no matches
              </div>
            )}
          </div>
          <div
            aria-hidden="true"
            style={{ display: 'flex', flexDirection: 'column', width: '14px', gap: '2px' }}
          >
            {swatches.map((c, i) => (
              <div
                key={i}
                style={{
                  width: '14px',
                  height: '12px',
                  background: c,
                  border: '1px solid var(--line)',
                  boxSizing: 'border-box',
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '10px',
            fontSize: '10px',
            color: 'var(--dim)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>
            {filtered.length > 0 ? highlight + 1 : 0}/{filtered.length}
          </span>
          <span>{themes.length} schemes · stored locally</span>
        </div>
      </div>
    </div>
  );
};

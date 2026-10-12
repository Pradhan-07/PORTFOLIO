import React, { useState } from 'react';
import type { Theme } from '../types';

interface EditorStatusBarProps {
  theme: Theme;
  onCommand: (cmd: string) => void;
  activeSection: string;
}

export const EditorStatusBar: React.FC<EditorStatusBarProps> = ({
  theme,
  onCommand,
  activeSection,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim().toLowerCase();
    setInputVal('');
    setIsTyping(false);

    if (!cmd) return;

    if (cmd === ':help') {
      setCommandFeedback('Commands: :theme, :whoami, :about, :focus, :stack, :experiments, :journey, :contact, :intro, :q');
    } else if (cmd === ':intro' || cmd === ':cinematic' || cmd === ':replay' || cmd === ':q') {
      onCommand('intro');
      setCommandFeedback(':launched cinematic sequence');
    } else if (cmd === ':theme') {
      onCommand('theme');
      setCommandFeedback(':theme switched');
    } else if ([':whoami', ':about', ':focus', ':stack', ':skills', ':experiments', ':projects', ':journey', ':contact'].includes(cmd)) {
      const section = cmd.replace(':', '').replace('skills', 'skills').replace('experiments', 'projects');
      onCommand(section);
      setCommandFeedback(`:jumped to ${section}`);
    } else {
      setCommandFeedback(`Unknown command: ${cmd}. Type :help for commands.`);
    }

    setTimeout(() => setCommandFeedback(''), 4000);
  };

  return (
    <aside
      className="editor-status-bar"
      aria-label="Editor Status"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        background: 'var(--bg)',
        borderTop: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        height: '28px',
        color: 'var(--chrome)',
        userSelect: 'none',
      }}
    >
      {/* Left Vim Elements */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
        <span
          style={{
            background: 'var(--accent)',
            color: 'var(--bg)',
            padding: '2px 8px',
            fontWeight: 600,
            fontSize: '10.5px',
            letterSpacing: '0.06em',
          }}
        >
          NORMAL
        </span>

        <span style={{ color: 'var(--fg)', whiteSpace: 'nowrap' }}>
          ~/portfolio/{activeSection}.cpp
        </span>

        <span style={{ color: 'var(--dim)', display: 'none' }} className="bar-git-branch">
          [git:main@Pradhan-07]
        </span>

        {/* Command Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '6px' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>:</span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onFocus={() => setIsTyping(true)}
            onBlur={() => setIsTyping(false)}
            placeholder="type command (:help, :theme, :q)..."
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--fg)',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '11px',
              padding: '0 4px',
              outline: 'none',
              width: isTyping || inputVal ? '220px' : '150px',
              transition: 'width 200ms ease',
            }}
          />
        </form>

        {commandFeedback && (
          <span style={{ color: 'var(--accent)', fontSize: '10.5px' }}>
            {commandFeedback}
          </span>
        )}
      </div>

      {/* Right Vim Elements */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        <span style={{ color: 'var(--dim)', fontSize: '10px' }}>
          theme: <strong style={{ color: 'var(--chrome)' }}>{theme.label}</strong>
        </span>

        <span style={{ color: 'var(--dim)', fontSize: '10.5px' }}>
          utf-8
        </span>

        <span style={{ color: 'var(--dim)', fontSize: '10.5px' }}>
          [c++20]
        </span>

        <span style={{ color: 'var(--chrome)', fontSize: '10.5px' }}>
          100% 42:1
        </span>
      </div>
    </aside>
  );
};

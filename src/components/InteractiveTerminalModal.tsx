import React, { useState, useRef, useEffect } from 'react';
import { PROFILE } from '../data/profile';
import { PROJECTS } from '../data/projects';
import { LEARNING_LOG } from '../data/learningLog';

interface InteractiveTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  onToggleTheme?: () => void;
  onOpenProject?: (projectId: string) => void;
}

interface CommandOutput {
  command: string;
  output: React.ReactNode;
  timestamp: string;
}

export const InteractiveTerminalModal: React.FC<InteractiveTerminalModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onToggleTheme,
  onOpenProject,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [outputs, setOutputs] = useState<CommandOutput[]>([
    {
      command: 'welcome',
      output: (
        <div>
          <div style={{ color: 'var(--fg)', fontWeight: 600, marginBottom: '4px' }}>
            karan.dev Interactive Terminal v2.4 [fish shell]
          </div>
          <div style={{ color: 'var(--dim)', fontSize: '11px', marginBottom: '8px' }}>
            Connected to Karan Kumar Pradhan · VIT-AP University (Second Year CSE)
          </div>
          <div style={{ color: 'var(--accent)', fontSize: '11px' }}>
            Type <span style={{ textDecoration: 'underline' }}>help</span> to view available commands. Press [Esc] to exit.
          </div>
        </div>
      ),
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll to bottom on new output
  useEffect(() => {
    if (isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [outputs, isOpen]);

  // Global key listener for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const executeCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    // Add to history
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').toLowerCase();

    let resultNode: React.ReactNode = null;

    switch (cmd) {
      case 'help':
        resultNode = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ color: 'var(--chrome)', fontWeight: 600 }}>Available Commands:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 12px', fontSize: '11px' }}>
              <span style={{ color: 'var(--accent)' }}>whoami / about</span>
              <span>Display profile, education, and engineering goals</span>
              <span style={{ color: 'var(--accent)' }}>projects</span>
              <span>List verified public repositories & featured indstate</span>
              <span style={{ color: 'var(--accent)' }}>skills / stack</span>
              <span>List primary technologies (C++, Python, Web)</span>
              <span style={{ color: 'var(--accent)' }}>learning</span>
              <span>View ongoing learning logs & current focus</span>
              <span style={{ color: 'var(--accent)' }}>dsa</span>
              <span>View Data Structures & Algorithms focus in C++</span>
              <span style={{ color: 'var(--accent)' }}>contact</span>
              <span>Display email, GitHub, and LinkedIn details</span>
              <span style={{ color: 'var(--accent)' }}>github</span>
              <span>Open https://github.com/Pradhan-07</span>
              <span style={{ color: 'var(--accent)' }}>linkedin</span>
              <span>Open LinkedIn profile</span>
              <span style={{ color: 'var(--accent)' }}>theme</span>
              <span>Toggle website color palette</span>
              <span style={{ color: 'var(--accent)' }}>clear</span>
              <span>Clear terminal buffer</span>
              <span style={{ color: 'var(--accent)' }}>exit / q</span>
              <span>Close terminal</span>
            </div>
          </div>
        );
        break;

      case 'about':
      case 'whoami':
        resultNode = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ color: 'var(--fg)', fontWeight: 600 }}>{PROFILE.name}</div>
            <div style={{ color: 'var(--chrome)' }}>{PROFILE.education} · {PROFILE.university}</div>
            <div style={{ color: 'var(--dim)', lineHeight: 1.5 }}>
              Currently strengthening Data Structures and Algorithms using C++, while exploring Artificial Intelligence, Machine Learning, and Web Development.
            </div>
            <div style={{ color: 'var(--accent)', marginTop: '4px' }}>
              &gt; Navigating to #about section...
            </div>
          </div>
        );
        onNavigate('about');
        break;

      case 'projects':
        resultNode = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ color: 'var(--chrome)', fontWeight: 600 }}>Verified Repositories ({PROJECTS.length}):</div>
            {PROJECTS.map((p, idx) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', fontSize: '11px' }}>
                <span style={{ color: 'var(--dim)' }}>0{idx + 1}.</span>
                <span style={{ color: p.featured ? '#66cc6a' : 'var(--fg)', fontWeight: 500 }}>{p.name}</span>
                <span style={{ color: 'var(--dim)', fontSize: '10px' }}>[{p.language}]</span>
                <span style={{ color: 'var(--chrome)' }}>— {p.description.slice(0, 60)}...</span>
              </div>
            ))}
            <div style={{ color: 'var(--accent)', marginTop: '4px' }}>
              &gt; Navigating to #projects section...
            </div>
          </div>
        );
        onNavigate('projects');
        break;

      case 'project':
        if (arg) {
          const found = PROJECTS.find((p) => p.name.toLowerCase() === arg || p.id.toLowerCase() === arg);
          if (found) {
            if (onOpenProject) onOpenProject(found.id);
            resultNode = <div style={{ color: '#66cc6a' }}>Inspecting project: {found.name} [{found.language}]</div>;
          } else {
            resultNode = <div style={{ color: '#ef4444' }}>Project not found: &apos;{arg}&apos;. Type &apos;projects&apos; to view all.</div>;
          }
        } else {
          resultNode = <div style={{ color: 'var(--dim)' }}>Usage: project &lt;name&gt; (e.g. &apos;project indstate&apos;, &apos;project dsa_cpp&apos;)</div>;
        }
        break;

      case 'skills':
      case 'stack':
        resultNode = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ color: 'var(--chrome)', fontWeight: 600 }}>Technical Stack:</div>
            {PROFILE.techStack.map((t, idx) => (
              <div key={idx} style={{ fontSize: '11px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{t.name}</span>
                <span style={{ color: 'var(--dim)' }}> ({t.category})</span>: {t.note}
              </div>
            ))}
            <div style={{ color: 'var(--accent)', marginTop: '4px' }}>
              &gt; Navigating to #skills section...
            </div>
          </div>
        );
        onNavigate('skills');
        break;

      case 'learning':
        resultNode = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ color: 'var(--chrome)', fontWeight: 600 }}>Current Learning Log:</div>
            {LEARNING_LOG.map((log) => (
              <div key={log.id} style={{ fontSize: '11px' }}>
                <div style={{ color: 'var(--fg)', fontWeight: 500 }}>● {log.title} [{log.status}]</div>
                <div style={{ color: 'var(--dim)', paddingLeft: '12px' }}>{log.description}</div>
              </div>
            ))}
            <div style={{ color: 'var(--accent)', marginTop: '4px' }}>
              &gt; Navigating to #journey section...
            </div>
          </div>
        );
        onNavigate('journey');
        break;

      case 'dsa':
        resultNode = (
          <div style={{ color: 'var(--accent)' }}>
            &gt; Navigating to Data Structures & Algorithms (C++) focus section...
          </div>
        );
        onNavigate('focus');
        break;

      case 'contact':
        resultNode = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
            <div style={{ color: 'var(--chrome)', fontWeight: 600 }}>Contact Information:</div>
            <div>Email: <a href={`mailto:${PROFILE.email}`} style={{ color: 'var(--accent)' }}>{PROFILE.email}</a></div>
            <div>GitHub: <a href={PROFILE.githubUrl} target="_blank" rel="noreferrer noopener" style={{ color: 'var(--accent)' }}>{PROFILE.githubUrl}</a></div>
            <div>LinkedIn: <a href={PROFILE.linkedinUrl} target="_blank" rel="noreferrer noopener" style={{ color: 'var(--accent)' }}>{PROFILE.linkedinUrl}</a></div>
          </div>
        );
        onNavigate('contact');
        break;

      case 'github':
        window.open(PROFILE.githubUrl, '_blank', 'noreferrer,noopener');
        resultNode = <div style={{ color: 'var(--accent)' }}>Opened GitHub profile in new tab: {PROFILE.githubUrl}</div>;
        break;

      case 'linkedin':
        window.open(PROFILE.linkedinUrl, '_blank', 'noreferrer,noopener');
        resultNode = <div style={{ color: 'var(--accent)' }}>Opened LinkedIn profile in new tab: {PROFILE.linkedinUrl}</div>;
        break;

      case 'indstate':
        if (onOpenProject) onOpenProject('indstate');
        else window.open('https://github.com/Pradhan-07/indstate', '_blank', 'noreferrer,noopener');
        resultNode = <div style={{ color: '#66cc6a' }}>Inspecting featured project: indstate (Trusted Property Marketplace)</div>;
        break;

      case 'theme':
        if (onToggleTheme) {
          onToggleTheme();
          resultNode = <div style={{ color: 'var(--accent)' }}>Toggled portfolio theme palette.</div>;
        }
        break;

      case 'clear':
        setOutputs([]);
        setInputVal('');
        return;

      case 'exit':
      case 'q':
        onClose();
        return;

      default:
        resultNode = (
          <div style={{ color: '#ef4444' }}>
            zsh: command not found: {cmd}. Type <span style={{ textDecoration: 'underline' }}>help</span> to view all commands.
          </div>
        );
        break;
    }

    setOutputs((prev) => [
      ...prev,
      {
        command: trimmed,
        output: resultNode,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(history[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= history.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Command Terminal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          height: '520px',
          background: 'color-mix(in srgb, var(--bg) 98%, #080a08)',
          border: '1px solid color-mix(in srgb, var(--fg) 18%, transparent)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
          fontFamily: '"IBM Plex Mono", monospace',
          overflow: 'hidden',
        }}
      >
        {/* Terminal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'color-mix(in srgb, var(--bg) 85%, var(--line))',
            borderBottom: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
            fontSize: '11px',
            color: 'var(--chrome)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ff5f56' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ffbd2e' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#27c93f' }} />
            <span style={{ marginLeft: '8px', color: 'var(--fg)', fontWeight: 500 }}>
              karan@vit-ap:~ (interactive terminal)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '10px', color: 'var(--dim)' }}>[Tab / ↑↓ History]</span>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--dim)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '12px',
              }}
            >
              ✕ [Esc]
            </button>
          </div>
        </div>

        {/* Terminal Output Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            fontSize: '12px',
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {outputs.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dim)', fontSize: '11px' }}>
                <span style={{ color: 'var(--accent)' }}>karan@dev:~$</span>
                <span style={{ color: 'var(--fg)' }}>{item.command}</span>
                <span style={{ marginLeft: 'auto', fontSize: '9.5px' }}>{item.timestamp}</span>
              </div>
              <div style={{ paddingLeft: '16px', color: 'var(--chrome)' }}>{item.output}</div>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Command Input Prompt */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderTop: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
            background: 'color-mix(in srgb, var(--bg) 95%, #050605)',
            fontSize: '12px',
          }}
        >
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>karan@dev:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command (try 'help', 'projects', 'dsa', 'about')..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--fg)',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '12px',
            }}
          />
          <button
            type="button"
            onClick={() => executeCommand(inputVal)}
            style={{
              background: 'var(--line)',
              border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
              color: 'var(--fg)',
              padding: '4px 10px',
              borderRadius: '2px',
              fontSize: '10.5px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Enter ↵
          </button>
        </div>
      </div>
    </div>
  );
};

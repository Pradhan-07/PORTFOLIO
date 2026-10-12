import React, { useState } from 'react';
import { Mail, ExternalLink, Copy, Check, Send } from 'lucide-react';
import { PROFILE } from '../data/profile';

const GitHubIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedInIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

export const ContactSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'validating' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(PROFILE.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Please provide your name or handle.');
      setFormStatus('error');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      setFormStatus('error');
      return;
    }
    if (!formData.message.trim()) {
      setErrorMessage('Please include a message or inquiry.');
      setFormStatus('error');
      return;
    }

    setErrorMessage('');
    setFormStatus('validating');

    setTimeout(() => {
      setFormStatus('sent');
      const subject = encodeURIComponent(`Message from ${formData.name} via karan.dev`);
      const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);
      window.location.href = `mailto:${PROFILE.email}?subject=${subject}&body=${body}`;
    }, 500);
  };

  const contactLinks = [
    {
      id: 'email',
      label: 'Email',
      display: PROFILE.email,
      url: `mailto:${PROFILE.email}`,
      isExternal: false,
      icon: <Mail size={16} />,
      copyable: true,
      tag: 'DIRECT CONTACT',
    },
    {
      id: 'github',
      label: 'GitHub',
      display: PROFILE.handle,
      url: PROFILE.githubUrl,
      isExternal: true,
      icon: <GitHubIcon size={16} />,
      copyable: false,
      tag: 'SOURCE CODE',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      display: PROFILE.linkedinDisplay,
      url: PROFILE.linkedinUrl,
      isExternal: true,
      icon: <LinkedInIcon size={16} />,
      copyable: false,
      tag: 'PROFESSIONAL NETWORK',
    },
  ];

  return (
    <section
      id="contact"
      className="contact-section"
      style={{
        padding: '72px 0 96px 0',
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
      }}
    >
      <div className="section-container" style={{ maxWidth: '920px', margin: '0 auto', padding: '0 24px' }}>
        {/* Section Tag */}
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
          // 06 · INQUIRIES & COLLABORATION
        </div>

        {/* Primary Heading */}
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
          Let's <span style={{ fontStyle: 'italic', color: 'var(--chrome)' }}>connect.</span>
        </h2>

        {/* Description */}
        <p
          style={{
            margin: '0 0 40px 0',
            fontFamily: '"Archivo", sans-serif',
            fontSize: '16px',
            color: 'var(--dim)',
            maxWidth: '700px',
            lineHeight: 1.6,
          }}
        >
          {PROFILE.contactDescription}
        </p>

        {/* Three Clearly Visible Contact Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '36px',
          }}
        >
          {contactLinks.map((item) => (
            <div
              key={item.id}
              className="contact-card"
              style={{
                background: 'var(--line)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '3px',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 200ms ease, transform 200ms ease',
                position: 'relative',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--chrome)' }}>
                    <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
                    <span style={{ fontWeight: 500, letterSpacing: '0.04em' }}>{item.label}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '9.5px',
                      color: 'var(--dim)',
                      padding: '2px 6px',
                      background: 'color-mix(in srgb, var(--bg) 60%, transparent)',
                      borderRadius: '2px',
                    }}
                  >
                    {item.tag}
                  </span>
                </div>

                <a
                  href={item.url}
                  target={item.isExternal ? '_blank' : undefined}
                  rel={item.isExternal ? 'noreferrer noopener' : undefined}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '13.5px',
                    color: 'var(--fg)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    wordBreak: 'break-all',
                    transition: 'color 180ms ease',
                  }}
                >
                  <span>{item.display}</span>
                  {item.isExternal ? <ExternalLink size={13} style={{ color: 'var(--dim)', flexShrink: 0 }} /> : null}
                </a>
              </div>

              {/* Action row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '18px',
                  paddingTop: '12px',
                  borderTop: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '11px',
                }}
              >
                <a
                  href={item.url}
                  target={item.isExternal ? '_blank' : undefined}
                  rel={item.isExternal ? 'noreferrer noopener' : undefined}
                  style={{
                    color: 'var(--chrome)',
                    textDecoration: 'none',
                    letterSpacing: '0.04em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{item.id === 'email' ? 'Compose mail ↗' : 'Visit profile ↗'}</span>
                </a>

                {item.copyable && (
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    title="Copy email address"
                    style={{
                      marginLeft: 'auto',
                      background: 'none',
                      border: 'none',
                      color: copied ? 'var(--accent)' : 'var(--dim)',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      font: 'inherit',
                      fontSize: '10.5px',
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Dispatch Buffer Container */}
        <div
          style={{
            background: 'var(--line)',
            border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
            borderRadius: '3px',
            padding: '28px',
            fontFamily: '"IBM Plex Mono", monospace',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--dim)',
              borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
              paddingBottom: '12px',
              marginBottom: '20px',
            }}
          >
            <span>// DISPATCH MESSAGE BUFFER [karan@vit-ap]</span>
            <span style={{ color: 'var(--accent)' }}>ACTIVE</span>
          </div>

          {formStatus === 'sent' ? (
            <div style={{ padding: '28px 0', textAlign: 'center' }}>
              <div style={{ color: 'var(--accent)', fontSize: '14.5px', fontWeight: 600, marginBottom: '8px' }}>
                [SUCCESS: MESSAGE PAYLOAD PREPARED]
              </div>
              <p style={{ color: 'var(--dim)', fontSize: '12px', lineHeight: 1.6, margin: '0 0 18px 0' }}>
                Email dispatch initialized for {PROFILE.email}. You can also email directly from any client.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormData({ name: '', email: '', message: '' });
                  setFormStatus('idle');
                }}
                style={{
                  background: 'var(--fg)',
                  color: 'var(--bg)',
                  border: 'none',
                  padding: '9px 18px',
                  fontSize: '11.5px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--chrome)', marginBottom: '6px' }}>
                    YOUR NAME / IDENTIFIER:
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Fellow Engineer"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'color-mix(in srgb, var(--bg) 70%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
                      borderRadius: '2px',
                      padding: '10px 12px',
                      color: 'var(--fg)',
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '12px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--chrome)', marginBottom: '6px' }}>
                    YOUR EMAIL ADDRESS:
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@domain.com"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'color-mix(in srgb, var(--bg) 70%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
                      borderRadius: '2px',
                      padding: '10px 12px',
                      color: 'var(--fg)',
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '12px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--chrome)', marginBottom: '6px' }}>
                  MESSAGE / TOPIC / COLLABORATION:
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Share a thought, discuss algorithms, AI/ML, or web development..."
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'color-mix(in srgb, var(--bg) 70%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
                    borderRadius: '2px',
                    padding: '10px 12px',
                    color: 'var(--fg)',
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '12px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {errorMessage && (
                <div style={{ color: '#ef4444', fontSize: '11px' }}>
                  ! ERROR: {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={formStatus === 'validating'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  background: 'var(--fg)',
                  color: 'var(--bg)',
                  border: 'none',
                  borderRadius: '2px',
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  cursor: formStatus === 'validating' ? 'wait' : 'pointer',
                  transition: 'filter 180ms ease',
                  alignSelf: 'flex-start',
                }}
              >
                <Send size={13} />
                <span>{formStatus === 'validating' ? 'PREPARING DISPATCH...' : 'SEND MESSAGE ↵'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

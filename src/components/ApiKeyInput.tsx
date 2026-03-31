'use client';

import { useState } from 'react';

interface Props {
  apiKey: string;
  onChange: (key: string) => void;
}

export default function ApiKeyInput({ apiKey, onChange }: Props) {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(!apiKey);

  if (!expanded && apiKey) {
    return (
      <div className="flex items-center gap-3 text-sm animate-fade-in">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: '#34d39915', color: '#34d399', border: '1px solid #34d39930' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          API key set
        </span>
        <button onClick={() => setExpanded(true)} className="underline text-xs" style={{ color: 'var(--text-dim)' }}>
          change
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Gemini API Key
          </label>
          <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
            Get a free key at{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
              className="underline" style={{ color: 'var(--accent)' }}>
              aistudio.google.com/apikey
            </a>
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={show ? 'text' : 'password'}
                value={apiKey}
                onChange={e => onChange(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent-dim)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              <button
                onClick={() => setShow(!show)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded"
                style={{ color: 'var(--text-dim)' }}
              >
                {show ? 'hide' : 'show'}
              </button>
            </div>
            {apiKey && (
              <button
                onClick={() => setExpanded(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

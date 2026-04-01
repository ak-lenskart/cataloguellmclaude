'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'lk_judge_gemini_key';

interface Props {
  apiKey: string;
  onChange: (key: string) => void;
}

export default function ApiKeyInput({ apiKey, onChange }: Props) {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // On mount: load saved key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      onChange(saved);
      setExpanded(false);
    } else {
      setExpanded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    if (apiKey) {
      localStorage.setItem(STORAGE_KEY, apiKey);
      setExpanded(false);
    }
  };

  const handleChange = (val: string) => {
    onChange(val);
    // Auto-save as user types so they don't need to click Save
    if (val) localStorage.setItem(STORAGE_KEY, val);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const handleClear = () => {
    onChange('');
    localStorage.removeItem(STORAGE_KEY);
    setExpanded(true);
  };

  if (!expanded && apiKey) {
    return (
      <div className="flex items-center gap-3 text-sm animate-fade-in">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: '#34d39915', color: '#34d399', border: '1px solid #34d39930' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Gemini API key saved
        </span>
        <button onClick={() => setExpanded(true)} className="underline text-xs" style={{ color: 'var(--text-dim)' }}>
          change
        </button>
        <button onClick={handleClear} className="underline text-xs" style={{ color: 'var(--text-dim)' }}>
          clear
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Gemini API Key
        </label>
        <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
          Free key at{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
            className="underline" style={{ color: 'var(--accent)' }}>
            aistudio.google.com/apikey
          </a>
          {' '}· Saved automatically in your browser
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={show ? 'text' : 'password'}
              value={apiKey}
              onChange={e => handleChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="AIzaSy..."
              autoFocus
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent-dim)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <button
              onClick={() => setShow(s => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded"
              style={{ color: 'var(--text-dim)' }}
            >
              {show ? 'hide' : 'show'}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={!apiKey}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

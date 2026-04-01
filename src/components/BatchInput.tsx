'use client';

import { useState } from 'react';

interface Props {
  onStart: (pids: string[]) => void;
  disabled: boolean;
}

export default function BatchInput({ onStart, disabled }: Props) {
  const [text, setText] = useState('');

  const pids = text
    .split(/[\n,\s]+/)
    .map(s => s.trim())
    .filter(s => /^\d{4,}$/.test(s));

  const uniquePids = [...new Set(pids)];

  const handleStart = () => {
    if (uniquePids.length === 0) return;
    onStart(uniquePids.slice(0, 500));
  };

  return (
    <div className="rounded-xl overflow-hidden animate-slide-up"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Batch Analysis
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Paste up to 500 PIDs (comma, space, or newline separated)
            </p>
          </div>
          {uniquePids.length > 0 && (
            <span className="text-xs font-mono px-2 py-1 rounded-lg"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent-dim)' }}>
              {uniquePids.length} PID{uniquePids.length !== 1 ? 's' : ''} detected
            </span>
          )}
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={"131500\n220643\n145200\n...\n\nOr paste comma-separated: 131500, 220643, 145200"}
          rows={8}
          className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y font-mono"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />

        {uniquePids.length > 500 && (
          <p className="text-xs mt-2" style={{ color: 'var(--orange)' }}>
            Only the first 500 PIDs will be processed.
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            ~{Math.ceil(uniquePids.length * 25 / 60)} min estimated (free tier: ~25s/PID)
          </p>
          <button
            onClick={handleStart}
            disabled={uniquePids.length === 0 || disabled}
            className="px-8 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            Analyse {uniquePids.length} PIDs
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { FREE_TIER } from '@/lib/key-manager';

interface Props {
  onStart: (pids: string[]) => void;
  disabled: boolean;
  keyCount: number;
}

export default function BatchInput({ onStart, disabled, keyCount }: Props) {
  const [text, setText] = useState('');

  const pids = text
    .split(/[\n,\s]+/)
    .map(s => s.trim())
    .filter(s => /^\d{4,}$/.test(s));

  const uniquePids = [...new Set(pids)].slice(0, 500);
  const totalDailyCapacity = keyCount * FREE_TIER.RPD;
  const estMinutes = Math.ceil(uniquePids.length * 25 / 60);

  const handleStart = () => {
    if (uniquePids.length === 0 || keyCount === 0) return;
    onStart(uniquePids);
  };

  return (
    <div className="rounded-xl overflow-hidden animate-slide-up"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Batch Analysis
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Paste up to 500 PIDs — comma, space, or newline separated
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Key capacity pill */}
            <span className="text-xs font-mono px-2 py-1 rounded-lg"
              style={{ background: 'var(--bg-input)', color: keyCount > 1 ? 'var(--green)' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {keyCount} key{keyCount !== 1 ? 's' : ''} · {totalDailyCapacity.toLocaleString()} req/day capacity
            </span>
            {uniquePids.length > 0 && (
              <span className="text-xs font-mono px-2 py-1 rounded-lg"
                style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent-dim)' }}>
                {uniquePids.length} PIDs
              </span>
            )}
          </div>
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

        {pids.length > 500 && (
          <p className="text-xs mt-2" style={{ color: 'var(--orange)' }}>
            Only the first 500 PIDs will be processed.
          </p>
        )}

        <div className="flex items-center justify-between mt-4 gap-4 flex-wrap">
          <div className="text-xs space-y-0.5" style={{ color: 'var(--text-dim)' }}>
            {uniquePids.length > 0 && (
              <>
                <p>~{estMinutes} min · 8s between PIDs · keys auto-rotate on rate limit</p>
                {keyCount > 1 && (
                  <p style={{ color: 'var(--green)' }}>
                    {keyCount} keys = {keyCount * FREE_TIER.RPD} req/day total capacity
                  </p>
                )}
              </>
            )}
          </div>
          <button
            onClick={handleStart}
            disabled={uniquePids.length === 0 || disabled || keyCount === 0}
            className="px-8 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            {keyCount === 0 ? 'Add API key first' : `Analyse ${uniquePids.length} PIDs`}
          </button>
        </div>
      </div>
    </div>
  );
}

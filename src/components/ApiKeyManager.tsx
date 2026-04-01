'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  loadKeys, saveKeys, makeKey,
  estimatedRequestsRemaining, cooldownSecondsLeft, totalRemainingAcrossKeys,
  FREE_TIER,
  type ManagedKey,
} from '@/lib/key-manager';

interface Props {
  onKeysChange: (keys: ManagedKey[]) => void;
}

export default function ApiKeyManager({ onKeysChange }: Props) {
  const [keys, setKeys] = useState<ManagedKey[]>([]);
  const [input, setInput] = useState('');
  const [label, setLabel] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [tick, setTick] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadKeys();
    setKeys(loaded);
    onKeysChange(loaded);
    setExpanded(loaded.length === 0);
    setShowInput(loaded.length === 0);
    // Tick every second to update cooldown timers
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh RPM cooldown status every second
  useEffect(() => {
    if (keys.length === 0) return;
    const refreshed = loadKeys();
    // Only update if a key changed from rpm_limited → active
    const changed = refreshed.some((k, i) => keys[i]?.status !== k.status);
    if (changed) {
      setKeys(refreshed);
      onKeysChange(refreshed);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const updateKeys = useCallback((next: ManagedKey[]) => {
    setKeys(next);
    saveKeys(next);
    onKeysChange(next);
  }, [onKeysChange]);

  const addKey = () => {
    const trimmed = input.trim();
    if (!trimmed || keys.some(k => k.key === trimmed)) return;
    const next = [...keys, makeKey(trimmed, label.trim() || `Key ${keys.length + 1}`)];
    updateKeys(next);
    setInput('');
    setLabel('');
    setShowInput(false);
    if (next.length > 0) setExpanded(true);
  };

  const removeKey = (id: string) => {
    updateKeys(keys.filter(k => k.id !== id));
  };

  const totalRemaining = totalRemainingAcrossKeys(keys);
  const activeCount = keys.filter(k => k.status === 'active').length;

  // ─── Collapsed summary ───────────────────────────────────────────────────
  if (keys.length > 0 && !expanded) {
    return (
      <div className="flex items-center gap-3 text-sm animate-fade-in flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: activeCount > 0 ? '#34d39915' : '#ff9f4315', color: activeCount > 0 ? '#34d399' : '#ff9f43', border: `1px solid ${activeCount > 0 ? '#34d39930' : '#ff9f4330'}` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          {keys.length} API key{keys.length > 1 ? 's' : ''} · {activeCount} active
        </span>
        <span className="text-xs font-mono px-2 py-1 rounded-lg"
          style={{ background: 'var(--bg-card)', color: totalRemaining > 100 ? 'var(--accent)' : 'var(--orange)', border: '1px solid var(--border)' }}>
          ~{totalRemaining} req remaining today
        </span>
        <button onClick={() => setExpanded(true)} className="underline text-xs" style={{ color: 'var(--text-dim)' }}>
          manage keys
        </button>
      </div>
    );
  }

  // ─── Expanded panel ──────────────────────────────────────────────────────
  return (
    <div className="rounded-xl animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Gemini API Keys
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            Add up to 10 free keys to multiply your daily quota · Keys auto-rotate on rate limit
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalRemaining > 0 && (
            <span className="text-xs font-mono px-2 py-1 rounded-lg"
              style={{ background: 'var(--bg-input)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
              ~{totalRemaining} req left today
            </span>
          )}
          {keys.length > 0 && (
            <button onClick={() => setExpanded(false)} className="text-xs px-2 py-1 rounded-lg"
              style={{ color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
              collapse
            </button>
          )}
        </div>
      </div>

      {/* Free tier info bar */}
      <div className="px-5 py-2.5 flex items-center gap-4 text-xs border-b flex-wrap"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-input)', color: 'var(--text-dim)' }}>
        <span>Free tier per key:</span>
        <span><b style={{ color: 'var(--text-secondary)' }}>{FREE_TIER.RPD.toLocaleString()}</b> req/day</span>
        <span><b style={{ color: 'var(--text-secondary)' }}>{FREE_TIER.RPM}</b> req/min</span>
        <span><b style={{ color: 'var(--text-secondary)' }}>{(FREE_TIER.TPM / 1000).toFixed(0)}K</b> tokens/min</span>
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
          className="underline ml-auto" style={{ color: 'var(--accent)' }}>
          Get free keys →
        </a>
      </div>

      {/* Keys list */}
      {keys.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {keys.map(k => (
            <KeyRow key={k.id} k={k} onRemove={() => removeKey(k.id)} />
          ))}
        </div>
      )}

      {/* Add key form */}
      {keys.length < 10 && (
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="w-full py-2 rounded-lg text-sm border-dashed border-2 transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--border-bright)', color: 'var(--text-dim)' }}>
              + Add API Key {keys.length > 0 ? `(${keys.length}/10)` : ''}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder={`Key ${keys.length + 1} (label optional)`}
                  className="w-32 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <input
                  type="password"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addKey()}
                  placeholder="AIzaSy..."
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <button onClick={addKey} disabled={!input.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
                  Add
                </button>
                <button onClick={() => setShowInput(false)}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {keys.length === 0 && !showInput && (
        <div className="px-5 pb-4 pt-2 text-xs text-center" style={{ color: 'var(--text-dim)' }}>
          No keys yet. Add one above to get started.
        </div>
      )}
    </div>
  );
}

function KeyRow({ k, onRemove }: { k: ManagedKey; onRemove: () => void }) {
  const remaining = estimatedRequestsRemaining(k);
  const cooldown = cooldownSecondsLeft(k);
  const pct = Math.round((k.requestsToday / FREE_TIER.RPD) * 100);

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    active:      { color: '#34d399', bg: '#34d39918', label: 'Active' },
    rpm_limited: { color: '#ff9f43', bg: '#ff9f4318', label: cooldown > 0 ? `Cool down ${cooldown}s` : 'Recovering' },
    exhausted:   { color: '#ff4d6a', bg: '#ff4d6a18', label: 'Daily quota used' },
    invalid:     { color: '#ff4d6a', bg: '#ff4d6a18', label: 'Invalid key' },
  };
  const s = statusConfig[k.status];

  return (
    <div className="px-5 py-3 flex items-center gap-3">
      {/* Label + masked key */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {k.label || 'Key'}
          </span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
            {k.key.slice(0, 8)}…{k.key.slice(-4)}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: s.bg, color: s.color }}>
            {s.label}
          </span>
        </div>
        {/* Usage bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(pct, 100)}%`,
                background: pct > 90 ? '#ff4d6a' : pct > 70 ? '#ff9f43' : 'var(--accent)',
              }} />
          </div>
          <span className="text-[10px] font-mono whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>
            {k.requestsToday}/{FREE_TIER.RPD} · {remaining} left
          </span>
        </div>
        {k.errorMessage && (
          <p className="text-[10px] mt-0.5" style={{ color: '#ff9f43' }}>{k.errorMessage}</p>
        )}
      </div>

      {/* Remove */}
      <button onClick={onRemove} className="text-xs px-2 py-1 rounded-lg flex-shrink-0 hover:opacity-80"
        style={{ color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
        Remove
      </button>
    </div>
  );
}

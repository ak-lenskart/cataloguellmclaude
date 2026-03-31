'use client';

import { useState } from 'react';

interface Props {
  pid: string;
  onPidChange: (pid: string) => void;
  onScrape: (pid: string) => void;
  onManualUrls: (urls: string[], pid: string) => void;
}

type Tab = 'scrape' | 'paste';

export default function InputPanel({ pid, onPidChange, onScrape, onManualUrls }: Props) {
  const [tab, setTab] = useState<Tab>('scrape');
  const [urlText, setUrlText] = useState('');
  const [manualPid, setManualPid] = useState('');

  const handleScrape = () => {
    const cleanPid = pid.trim();
    if (!cleanPid) return;
    // Extract PID from URL if full URL pasted
    const match = cleanPid.match(/(\d{4,})/);
    if (match) onScrape(match[1]);
  };

  const handlePaste = () => {
    const urls = urlText
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.startsWith('http') && /\.(jpg|jpeg|png|webp)/i.test(u));
    if (urls.length === 0) return;
    onManualUrls(urls, manualPid || 'manual');
  };

  const tabs: { id: Tab; label: string; desc: string }[] = [
    { id: 'scrape', label: 'Scrape PID', desc: 'Enter a Lenskart Product ID to auto-fetch images' },
    { id: 'paste', label: 'Paste URLs', desc: 'Manually paste image URLs (one per line)' },
  ];

  return (
    <div className="rounded-xl overflow-hidden animate-slide-up"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 px-4 py-3 text-sm font-medium transition-colors relative"
            style={{
              color: tab === t.id ? 'var(--accent)' : 'var(--text-dim)',
              background: tab === t.id ? 'var(--accent-glow)' : 'transparent',
            }}
          >
            {t.label}
            {tab === t.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--accent)' }} />
            )}
          </button>
        ))}
      </div>

      <div className="p-5">
        <p className="text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
          {tabs.find(t => t.id === tab)?.desc}
        </p>

        {tab === 'scrape' && (
          <div className="flex gap-3">
            <input
              type="text"
              value={pid}
              onChange={e => onPidChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScrape()}
              placeholder="Enter PID (e.g. 220643) or product URL"
              className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleScrape}
              disabled={!pid.trim()}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              Fetch Images
            </button>
          </div>
        )}

        {tab === 'paste' && (
          <div className="space-y-3">
            <input
              type="text"
              value={manualPid}
              onChange={e => setManualPid(e.target.value)}
              placeholder="PID (optional, e.g. 220643)"
              className="w-full px-4 py-2 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <textarea
              value={urlText}
              onChange={e => setUrlText(e.target.value)}
              placeholder={"Paste image URLs, one per line:\nhttps://static5.lenskart.com/media/catalog/product/...jpg\nhttps://static5.lenskart.com/media/catalog/product/...jpg"}
              rows={6}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y font-mono"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {urlText.split('\n').filter(u => u.trim().startsWith('http')).length} URLs detected
              </span>
              <button
                onClick={handlePaste}
                disabled={!urlText.trim()}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Load Images
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

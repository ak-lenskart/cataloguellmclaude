'use client';

import { useState } from 'react';

interface Props {
  images: string[];
  selected: string[];
  onSelectionChange: (urls: string[]) => void;
  onJudge: () => void;
  onBack: () => void;
  pid: string;
}

export default function ImagePreview({ images, selected, onSelectionChange, onJudge, onBack, pid }: Props) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const toggle = (url: string) => {
    if (selected.includes(url)) {
      onSelectionChange(selected.filter(u => u !== url));
    } else {
      onSelectionChange([...selected, url]);
    }
  };

  const selectAll = () => onSelectionChange([...images]);
  const deselectAll = () => onSelectionChange([]);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Product Images
            <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-dim)' }}>
              PID: {pid}
            </span>
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {selected.length} of {images.length} selected for judging
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={selectAll} className="px-3 py-1.5 rounded-lg text-xs"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Select All
          </button>
          <button onClick={deselectAll} className="px-3 py-1.5 rounded-lg text-xs"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Deselect All
          </button>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.map((url, i) => {
          const isSelected = selected.includes(url);
          const failed = failedImages.has(url);
          return (
            <button
              key={i}
              onClick={() => toggle(url)}
              className="relative rounded-xl overflow-hidden aspect-square group transition-all"
              style={{
                border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border)',
                background: 'var(--bg-input)',
                boxShadow: isSelected ? '0 0 16px var(--accent-glow)' : 'none',
              }}
            >
              {!failed ? (
                <img
                  src={url}
                  alt={`Image ${i + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={() => setFailedImages(prev => new Set([...prev, url]))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs"
                  style={{ color: 'var(--text-dim)' }}>
                  Failed to load
                </div>
              )}

              {/* Selection overlay */}
              <div className="absolute inset-0 transition-opacity"
                style={{
                  background: isSelected ? 'transparent' : 'rgba(0,13,36,0.5)',
                  opacity: isSelected ? 0 : 0.6,
                }}
              />

              {/* Checkbox */}
              <div className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                style={{
                  background: isSelected ? 'var(--accent)' : 'rgba(0,13,36,0.7)',
                  color: isSelected ? 'var(--bg-primary)' : 'var(--text-dim)',
                  border: isSelected ? 'none' : '1px solid var(--border-bright)',
                }}>
                {isSelected ? '\u2713' : ''}
              </div>

              {/* Index */}
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{ background: 'rgba(0,13,36,0.8)', color: 'var(--text-dim)' }}>
                #{i + 1}
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="px-4 py-2 rounded-lg text-sm"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          Back
        </button>
        <button
          onClick={onJudge}
          disabled={selected.length === 0}
          className="px-8 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          Judge {selected.length} Images
        </button>
      </div>
    </div>
  );
}

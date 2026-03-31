'use client';

import { useState } from 'react';
import type { JudgeResult } from '@/lib/types';
import ScoreCard from './ScoreCard';
import ImageAnalysis from './ImageAnalysis';
import GapsTable from './GapsTable';
import ProductionBrief from './ProductionBrief';

interface Props {
  result: JudgeResult;
  images: string[];
  onReset: () => void;
}

type ResultTab = 'overview' | 'images' | 'gaps' | 'brief';

export default function ResultsDashboard({ result, images, onReset }: Props) {
  const [tab, setTab] = useState<ResultTab>('overview');

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lenskart_judge_${result.pid}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: ResultTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'images', label: `Images (${result.images?.length || 0})` },
    { id: 'gaps', label: `Gaps (${result.gaps?.length || 0})` },
    { id: 'brief', label: 'Production Brief' },
  ];

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Results for PID: {result.pid}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {result.verdict}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Export JSON
          </button>
          <button onClick={onReset} className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
            New Analysis
          </button>
        </div>
      </div>

      {/* Score Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreCard
          label="Portfolio Score"
          value={result.portfolio_score}
          maxValue={10}
          tier={result.portfolio_tier}
          primary
        />
        <ScoreCard
          label="Completeness"
          value={result.completeness_score}
          maxValue={100}
          suffix="%"
        />
        <ScoreCard
          label="Quality Avg"
          value={result.quality_average}
          maxValue={10}
        />
        <ScoreCard
          label="Total Images"
          value={result.asset_summary?.total_images || 0}
          maxValue={0}
          isCount
        />
      </div>

      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium transition-colors relative"
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

      {/* Tab content */}
      <div className="animate-fade-in">
        {tab === 'overview' && (
          <OverviewTab result={result} />
        )}
        {tab === 'images' && (
          <ImageAnalysis images={result.images || []} imageUrls={images} />
        )}
        {tab === 'gaps' && (
          <GapsTable gaps={result.gaps || []} />
        )}
        {tab === 'brief' && (
          <ProductionBrief brief={result.production_brief} hero={result.hero_image_recommendation} />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ result }: { result: JudgeResult }) {
  const byType = result.asset_summary?.by_type || {};
  const qualifying = result.asset_summary?.qualifying_by_type || {};
  const types = Object.keys(byType);

  return (
    <div className="space-y-4">
      {/* Asset type breakdown */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Asset Type Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {types.map(type => {
            const total = byType[type] || 0;
            const qual = qualifying[type] || 0;
            return (
              <div key={type} className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                <span className="text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                  {type}
                </span>
                <span className="text-xs font-mono ml-2" style={{
                  color: total > 0 ? (qual > 0 ? 'var(--green)' : 'var(--orange)') : 'var(--text-dim)',
                }}>
                  {qual}/{total}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score formula */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Score Calculation
        </h3>
        <div className="font-mono text-sm space-y-1" style={{ color: 'var(--text-primary)' }}>
          <p>Completeness: <span style={{ color: 'var(--cyan)' }}>{result.completeness_score?.toFixed(1)}</span> / 100</p>
          <p>Quality Avg:  <span style={{ color: 'var(--cyan)' }}>{result.quality_average?.toFixed(1)}</span> / 10.0</p>
          <p className="pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            Final = ({result.completeness_score?.toFixed(1)} x 0.40) + ({result.quality_average?.toFixed(1)} x 0.60)
            = <span style={{ color: 'var(--accent)' }}>{result.portfolio_score?.toFixed(1)}</span>
          </p>
        </div>
      </div>

      {/* Tier badges */}
      {result.hero_image_recommendation && (
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            Hero Image Recommendation
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            <span className="font-mono" style={{ color: 'var(--accent)' }}>{result.hero_image_recommendation.image_id}</span>
            {' '}&mdash; {result.hero_image_recommendation.reason}
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import type { BatchJob, JudgeResult } from '@/lib/types';
import ResultsDashboard from './ResultsDashboard';

interface Props {
  jobs: BatchJob[];
  onReset: () => void;
  onStop: () => void;
  isRunning: boolean;
}

type FilterTier = 'ALL' | 'COMPLETE & HIGH QUALITY' | 'STRONG' | 'ADEQUATE' | 'WEAK' | 'INADEQUATE' | 'ERROR';

function tierColor(tier: string): { bg: string; text: string; border: string } {
  const t = tier.toUpperCase();
  if (t.includes('HIGH') || t.includes('COMPLETE')) return { bg: '#34d39912', text: '#34d399', border: '#34d39930' };
  if (t.includes('STRONG')) return { bg: '#00c8e812', text: '#00c8e8', border: '#00c8e830' };
  if (t.includes('ADEQUATE')) return { bg: '#ffd93d12', text: '#ffd93d', border: '#ffd93d30' };
  if (t.includes('WEAK')) return { bg: '#ff9f4312', text: '#ff9f43', border: '#ff9f4330' };
  return { bg: '#ff4d6a12', text: '#ff4d6a', border: '#ff4d6a30' };
}

function scoreColor(score: number): string {
  if (score >= 8.5) return '#34d399';
  if (score >= 7.0) return '#00c8e8';
  if (score >= 5.5) return '#ffd93d';
  if (score >= 4.0) return '#ff9f43';
  return '#ff4d6a';
}

export default function BatchDashboard({ jobs, onReset, onStop, isRunning }: Props) {
  const [filter, setFilter] = useState<FilterTier>('ALL');
  const [search, setSearch] = useState('');
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'pid' | 'score' | 'tier'>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const doneJobs = jobs.filter(j => j.status === 'done' && j.result);
  const errorJobs = jobs.filter(j => j.status === 'error');
  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'scraping' || j.status === 'judging');
  const progress = jobs.length > 0 ? ((doneJobs.length + errorJobs.length) / jobs.length) * 100 : 0;

  // Stat counts by tier
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { 'COMPLETE & HIGH QUALITY': 0, STRONG: 0, ADEQUATE: 0, WEAK: 0, INADEQUATE: 0 };
    doneJobs.forEach(j => {
      const tier = j.result!.portfolio_tier?.toUpperCase() || '';
      for (const key of Object.keys(counts)) {
        if (tier.includes(key) || key.includes(tier)) { counts[key]++; break; }
      }
    });
    return counts;
  }, [doneJobs]);

  // Filter and search
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];
    if (search) {
      filtered = filtered.filter(j => j.pid.includes(search));
    }
    if (filter === 'ERROR') {
      filtered = filtered.filter(j => j.status === 'error');
    } else if (filter !== 'ALL') {
      filtered = filtered.filter(j => j.result?.portfolio_tier?.toUpperCase().includes(filter));
    }
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'pid') {
        return sortDir === 'asc' ? a.pid.localeCompare(b.pid) : b.pid.localeCompare(a.pid);
      }
      if (sortBy === 'score') {
        const sa = a.result?.portfolio_score ?? (a.status === 'error' ? -1 : 999);
        const sb = b.result?.portfolio_score ?? (b.status === 'error' ? -1 : 999);
        return sortDir === 'asc' ? sa - sb : sb - sa;
      }
      return 0;
    });
    return filtered;
  }, [jobs, search, filter, sortBy, sortDir]);

  // Drill-down view
  if (selectedPid) {
    const job = jobs.find(j => j.pid === selectedPid);
    if (job?.result) {
      return (
        <div className="space-y-4 animate-fade-in">
          <button onClick={() => setSelectedPid(null)} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--accent)', border: '1px solid var(--accent-dim)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Batch Results
          </button>
          <ResultsDashboard result={job.result} images={job.imageUrls || []} onReset={() => setSelectedPid(null)} />
        </div>
      );
    }
  }

  const handleSort = (col: 'pid' | 'score' | 'tier') => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir(col === 'score' ? 'asc' : 'asc'); }
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Progress bar (while running) */}
      {isRunning && (
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Processing {doneJobs.length + errorJobs.length} / {jobs.length} PIDs...
            </p>
            <button onClick={onStop} className="text-xs px-3 py-1 rounded-lg"
              style={{ color: 'var(--red)', border: '1px solid #ff4d6a40' }}>
              Stop
            </button>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
          </div>
          {pendingJobs.length > 0 && pendingJobs[0].status !== 'pending' && (
            <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-dim)' }}>
              {pendingJobs[0].status === 'scraping' ? 'Scraping' : 'Judging'} PID: {pendingJobs[0].pid}
            </p>
          )}
        </div>
      )}

      {/* Stat Cards — MoEngage style */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
        <StatCard label="ALL" count={jobs.length} active={filter === 'ALL'} color="#00c8e8" onClick={() => setFilter('ALL')} />
        <StatCard label="HIGH QUALITY" count={tierCounts['COMPLETE & HIGH QUALITY']} active={filter === 'COMPLETE & HIGH QUALITY'} color="#34d399" onClick={() => setFilter('COMPLETE & HIGH QUALITY')} />
        <StatCard label="STRONG" count={tierCounts.STRONG} active={filter === 'STRONG'} color="#00c8e8" onClick={() => setFilter('STRONG')} />
        <StatCard label="ADEQUATE" count={tierCounts.ADEQUATE} active={filter === 'ADEQUATE'} color="#ffd93d" onClick={() => setFilter('ADEQUATE')} />
        <StatCard label="WEAK" count={tierCounts.WEAK} active={filter === 'WEAK'} color="#ff9f43" onClick={() => setFilter('WEAK')} />
        <StatCard label="INADEQUATE" count={tierCounts.INADEQUATE} active={filter === 'INADEQUATE'} color="#ff4d6a" onClick={() => setFilter('INADEQUATE')} />
        <StatCard label="ERRORS" count={errorJobs.length} active={filter === 'ERROR'} color="#ff4d6a" onClick={() => setFilter('ERROR')} />
      </div>

      {/* Toolbar — search, export, reset */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search PIDs..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          Showing {filteredJobs.length} of {jobs.length}
        </span>
        <div className="flex-1" />
        <button onClick={() => exportBatchCSV(jobs)} className="px-3 py-2 rounded-lg text-xs font-medium"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          Export CSV
        </button>
        <button onClick={() => exportBatchJSON(jobs)} className="px-3 py-2 rounded-lg text-xs font-medium"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          Export JSON
        </button>
        <button onClick={onReset} className="px-4 py-2 rounded-lg text-xs font-medium"
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
          New Batch
        </button>
      </div>

      {/* Results Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)' }}>
                <Th label="PID" sortable onClick={() => handleSort('pid')} active={sortBy === 'pid'} dir={sortDir} />
                <Th label="Status" />
                <Th label="Images" />
                <Th label="Score" sortable onClick={() => handleSort('score')} active={sortBy === 'score'} dir={sortDir} />
                <Th label="Tier" />
                <Th label="Completeness" />
                <Th label="Quality Avg" />
                <Th label="Gaps" />
                <Th label="" />
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map(job => (
                <JobRow key={job.pid} job={job} onDrillDown={() => setSelectedPid(job.pid)} />
              ))}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-sm" style={{ color: 'var(--text-dim)' }}>
                    {search ? 'No PIDs match your search' : 'No results yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, count, active, color, onClick }: {
  label: string; count: number; active: boolean; color: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="rounded-xl px-3 py-3 text-center transition-all"
      style={{
        background: active ? `${color}18` : 'var(--bg-card)',
        border: active ? `2px solid ${color}` : '1px solid var(--border)',
      }}>
      <p className="text-xl font-bold font-mono" style={{ color }}>{count}</p>
      <p className="text-[10px] font-medium mt-0.5 uppercase tracking-wide" style={{ color: active ? color : 'var(--text-dim)' }}>
        {label}
      </p>
    </button>
  );
}

function Th({ label, sortable, onClick, active, dir }: {
  label: string; sortable?: boolean; onClick?: () => void; active?: boolean; dir?: 'asc' | 'desc';
}) {
  return (
    <th className={`text-left px-4 py-3 text-xs font-medium whitespace-nowrap ${sortable ? 'cursor-pointer select-none hover:opacity-80' : ''}`}
      style={{ color: active ? 'var(--accent)' : 'var(--text-dim)' }}
      onClick={onClick}>
      {label}
      {active && <span className="ml-1">{dir === 'asc' ? '\u2191' : '\u2193'}</span>}
    </th>
  );
}

function JobRow({ job, onDrillDown }: { job: BatchJob; onDrillDown: () => void }) {
  const r = job.result;
  const tc = r ? tierColor(r.portfolio_tier) : null;

  return (
    <tr className="border-t transition-colors hover:brightness-110 cursor-pointer"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-input)' }}
      onClick={r ? onDrillDown : undefined}>
      <td className="px-4 py-3 font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{job.pid}</td>
      <td className="px-4 py-3">
        <StatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
        {job.imageCount ?? '-'}
      </td>
      <td className="px-4 py-3">
        {r ? (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono" style={{ color: scoreColor(r.portfolio_score) }}>
              {r.portfolio_score.toFixed(1)}
            </span>
            <ScoreBar value={r.portfolio_score} max={10} />
          </div>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>-</span>
        )}
      </td>
      <td className="px-4 py-3">
        {r && tc ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
            style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>
            {r.portfolio_tier}
          </span>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>-</span>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-xs" style={{ color: r ? scoreColor(r.completeness_score / 10) : 'var(--text-dim)' }}>
        {r ? `${r.completeness_score.toFixed(0)}%` : '-'}
      </td>
      <td className="px-4 py-3 font-mono text-xs" style={{ color: r ? scoreColor(r.quality_average) : 'var(--text-dim)' }}>
        {r ? r.quality_average.toFixed(1) : '-'}
      </td>
      <td className="px-4 py-3 font-mono text-xs" style={{ color: r?.gaps?.length ? 'var(--orange)' : 'var(--text-dim)' }}>
        {r ? r.gaps?.length || 0 : '-'}
      </td>
      <td className="px-4 py-3">
        {r && (
          <span className="text-xs" style={{ color: 'var(--accent)' }}>
            View &rarr;
          </span>
        )}
        {job.status === 'error' && (
          <span className="text-[10px] truncate max-w-[120px] block" style={{ color: 'var(--red)' }}>
            {job.error}
          </span>
        )}
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: '#506080', text: '#8899b8', label: 'Pending' },
    scraping: { bg: '#00c8e820', text: '#00c8e8', label: 'Scraping' },
    judging: { bg: '#d5ff5320', text: '#d5ff53', label: 'Judging' },
    done: { bg: '#34d39920', text: '#34d399', label: 'Done' },
    error: { bg: '#ff4d6a20', text: '#ff4d6a', label: 'Error' },
  };
  const s = map[status] || map.pending;
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
      style={{ background: s.bg, color: s.text }}>
      {(status === 'scraping' || status === 'judging') && (
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.text }} />
      )}
      {s.label}
    </span>
  );
}

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: scoreColor(value) }} />
    </div>
  );
}

function exportBatchCSV(jobs: BatchJob[]) {
  const header = 'PID,Status,Score,Tier,Completeness,Quality Avg,Images,Gaps,Verdict';
  const rows = jobs.map(j => {
    const r = j.result;
    return [
      j.pid,
      j.status,
      r?.portfolio_score?.toFixed(1) || '',
      r?.portfolio_tier || '',
      r?.completeness_score?.toFixed(0) || '',
      r?.quality_average?.toFixed(1) || '',
      r?.asset_summary?.total_images || j.imageCount || '',
      r?.gaps?.length || '',
      `"${(r?.verdict || j.error || '').replace(/"/g, '""')}"`,
    ].join(',');
  });
  const csv = [header, ...rows].join('\n');
  download(csv, 'batch_results.csv', 'text/csv');
}

function exportBatchJSON(jobs: BatchJob[]) {
  const data = jobs.filter(j => j.result).map(j => j.result);
  download(JSON.stringify(data, null, 2), 'batch_results.json', 'application/json');
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

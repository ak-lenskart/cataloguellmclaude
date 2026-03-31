'use client';

interface Props {
  label: string;
  value: number;
  maxValue: number;
  tier?: string;
  suffix?: string;
  primary?: boolean;
  isCount?: boolean;
}

function getScoreColor(value: number, max: number): string {
  if (max === 0) return 'var(--text-primary)';
  const pct = max === 100 ? value / 100 : value / max;
  if (pct >= 0.85) return 'var(--green)';
  if (pct >= 0.7) return 'var(--cyan)';
  if (pct >= 0.55) return 'var(--yellow)';
  if (pct >= 0.4) return 'var(--orange)';
  return 'var(--red)';
}

function getTierBadgeColor(tier: string): { bg: string; text: string } {
  const t = tier.toUpperCase();
  if (t.includes('HIGH QUALITY') || t.includes('COMPLETE')) return { bg: '#34d39920', text: '#34d399' };
  if (t.includes('STRONG')) return { bg: '#00c8e820', text: '#00c8e8' };
  if (t.includes('ADEQUATE')) return { bg: '#ffd93d20', text: '#ffd93d' };
  if (t.includes('WEAK')) return { bg: '#ff9f4320', text: '#ff9f43' };
  return { bg: '#ff4d6a20', text: '#ff4d6a' };
}

export default function ScoreCard({ label, value, maxValue, tier, suffix = '', primary, isCount }: Props) {
  const color = isCount ? 'var(--text-primary)' : getScoreColor(value, maxValue);
  const tierColors = tier ? getTierBadgeColor(tier) : null;

  return (
    <div className="rounded-xl p-4 transition-colors"
      style={{
        background: primary ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        border: primary ? '1px solid var(--accent-dim)' : '1px solid var(--border)',
        boxShadow: primary ? '0 0 24px var(--accent-glow)' : 'none',
      }}>
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>
        {label}
      </p>
      <p className="text-3xl font-bold font-mono" style={{ color }}>
        {typeof value === 'number' ? (isCount ? value : value.toFixed(1)) : value}{suffix}
        {maxValue > 0 && !isCount && (
          <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-dim)' }}>
            /{maxValue}
          </span>
        )}
      </p>
      {tier && tierColors && (
        <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: tierColors.bg, color: tierColors.text }}>
          {tier}
        </span>
      )}
    </div>
  );
}

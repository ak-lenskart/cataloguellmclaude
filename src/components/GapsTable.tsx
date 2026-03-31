'use client';

import type { Gap } from '@/lib/types';

interface Props {
  gaps: Gap[];
}

function priorityColor(priority: string): { bg: string; text: string } {
  switch (priority) {
    case 'Critical': return { bg: '#ff4d6a20', text: '#ff4d6a' };
    case 'High': return { bg: '#ff9f4320', text: '#ff9f43' };
    default: return { bg: '#ffd93d20', text: '#ffd93d' };
  }
}

export default function GapsTable({ gaps }: Props) {
  if (!gaps.length) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: 'var(--green)' }}>No gaps detected — all slots are filled!</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'var(--bg-card)' }}>
            <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-dim)' }}>Missing Slot</th>
            <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-dim)' }}>Asset Type</th>
            <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-dim)' }}>Impact</th>
            <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--text-dim)' }}>Priority</th>
          </tr>
        </thead>
        <tbody>
          {gaps.map((gap, i) => {
            const pc = priorityColor(gap.priority);
            return (
              <tr key={i} className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-input)' }}>
                <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{gap.missing_slot}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--cyan)' }}>{gap.asset_type_needed}</td>
                <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--orange)' }}>
                  +{gap.impact_on_completeness}pts
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: pc.bg, color: pc.text }}>
                    {gap.priority}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

'use client';

interface Props {
  brief: {
    next_shoot_priority: string[];
    quick_wins: string[];
    do_not_reuse: string[];
  } | null;
  hero: {
    image_id: string;
    reason: string;
  } | null;
}

export default function ProductionBrief({ brief, hero }: Props) {
  if (!brief) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>No production brief generated</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Next Shoot Priority */}
      {brief.next_shoot_priority?.length > 0 && (
        <Section title="Next Shoot Priority" icon="priority" color="var(--red)">
          <ol className="list-decimal list-inside space-y-1">
            {brief.next_shoot_priority.map((item, i) => (
              <li key={i} className="text-sm" style={{ color: 'var(--text-primary)' }}>{item}</li>
            ))}
          </ol>
        </Section>
      )}

      {/* Quick Wins */}
      {brief.quick_wins?.length > 0 && (
        <Section title="Quick Wins" icon="quick" color="var(--green)">
          <ul className="space-y-1">
            {brief.quick_wins.map((item, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--green)' }}>+</span> {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Do Not Reuse */}
      {brief.do_not_reuse?.length > 0 && (
        <Section title="Do Not Reuse" icon="reject" color="var(--red)">
          <div className="flex flex-wrap gap-2">
            {brief.do_not_reuse.map((item, i) => (
              <span key={i} className="text-xs font-mono px-2 py-1 rounded-lg"
                style={{ background: '#ff4d6a15', color: 'var(--red)', border: '1px solid #ff4d6a30' }}>
                {item}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Hero Recommendation */}
      {hero && (
        <Section title="Hero Image" icon="hero" color="var(--accent)">
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            <span className="font-mono" style={{ color: 'var(--accent)' }}>{hero.image_id}</span>
            {' '}&mdash; {hero.reason}
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, color, children }: {
  title: string;
  icon: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span style={{ color: 'var(--text-secondary)' }}>{title}</span>
      </h3>
      {children}
    </div>
  );
}

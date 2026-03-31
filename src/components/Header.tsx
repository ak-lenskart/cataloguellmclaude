'use client';

export default function Header() {
  return (
    <header className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
            LJ
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Lenskart Portfolio Judge
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              AI-Powered Image Quality Evaluator &middot; v3.0
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent-dim)' }}>
            Gemini Flash
          </span>
        </div>
      </div>
    </header>
  );
}

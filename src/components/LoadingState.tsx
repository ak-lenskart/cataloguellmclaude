'use client';

interface Props {
  message: string;
}

export default function LoadingState({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      {/* Spinner */}
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{ borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <div className="absolute inset-2 rounded-full border-2 border-transparent"
          style={{ borderTopColor: 'var(--cyan)', animation: 'spin 1.5s linear infinite reverse' }} />
        <div className="absolute inset-4 rounded-full"
          style={{ background: 'var(--accent-glow)' }} />
      </div>

      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {message}
      </p>
      <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
        This may take 15-30 seconds
      </p>

      {/* Shimmer bars */}
      <div className="mt-8 w-full max-w-md space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-3 rounded-full animate-shimmer"
            style={{ width: `${80 - i * 15}%`, animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

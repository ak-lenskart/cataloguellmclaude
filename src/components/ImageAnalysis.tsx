'use client';

import type { ImageResult } from '@/lib/types';

interface Props {
  images: ImageResult[];
  imageUrls: string[];
}

function tierColor(tier: string): string {
  switch (tier) {
    case 'HERO': return 'var(--green)';
    case 'GOOD': return 'var(--cyan)';
    case 'ACCEPTABLE': return 'var(--yellow)';
    case 'POOR': return 'var(--orange)';
    case 'REJECT': return 'var(--red)';
    default: return 'var(--text-secondary)';
  }
}

export default function ImageAnalysis({ images, imageUrls }: Props) {
  if (!images.length) {
    return <p className="text-sm py-8 text-center" style={{ color: 'var(--text-dim)' }}>No image analysis data</p>;
  }

  return (
    <div className="space-y-3">
      {images.map((img, i) => {
        const url = imageUrls[i] || imageUrls[img.position - 1];
        return (
          <div key={img.image_id} className="rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex">
              {/* Thumbnail */}
              {url && (
                <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                  <img src={url} alt={img.image_id}
                    className="w-full h-full object-cover" />
                </div>
              )}

              {/* Details */}
              <div className="flex-1 p-3 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>
                      {img.image_id}
                    </span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-mono"
                      style={{ background: 'var(--bg-input)', color: 'var(--cyan)', border: '1px solid var(--border)' }}>
                      {img.classified_type}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono" style={{ color: tierColor(img.tier) }}>
                      {img.score?.toFixed(1)}
                    </span>
                    <span className="block text-[10px] font-medium" style={{ color: tierColor(img.tier) }}>
                      {img.tier}
                    </span>
                  </div>
                </div>

                {/* Checkpoint badges */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {img.shadow_anchoring && img.shadow_anchoring !== 'N/A' && (
                    <Badge label="Shadow" value={img.shadow_anchoring} />
                  )}
                  {img.biological_authenticity && img.biological_authenticity !== 'N/A' && (
                    <Badge label="BAI" value={img.biological_authenticity} />
                  )}
                  {img.hardware_integrity && (
                    <Badge label="Hardware" value={img.hardware_integrity} />
                  )}
                  {img.wardrobe_compliance && img.wardrobe_compliance !== 'N/A' && (
                    <Badge label="Wardrobe" value={img.wardrobe_compliance} />
                  )}
                </div>

                {/* Penalties */}
                {img.penalties && img.penalties.length > 0 && (
                  <div className="space-y-0.5">
                    {img.penalties.map((p, pi) => (
                      <p key={pi} className="text-[11px] font-mono" style={{ color: 'var(--red)' }}>
                        CP{p.checkpoint} -{p.deduction}: {p.reason}
                      </p>
                    ))}
                  </div>
                )}

                {/* Flags */}
                {img.flags && img.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {img.flags.map((f, fi) => (
                      <span key={fi} className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-dim)' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  const isGood = ['Anchored', 'High', 'Sharp', 'Pass'].includes(value);
  const isBad = ['Floating', 'Low', 'Melted', 'Major violation'].includes(value);
  const color = isGood ? 'var(--green)' : isBad ? 'var(--red)' : 'var(--yellow)';

  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      {label}: {value}
    </span>
  );
}

export interface ImagePenalty {
  checkpoint: string;
  deduction: number;
  reason: string;
}

export interface ImageResult {
  image_id: string;
  position: number;
  classified_type: string;
  score: number;
  tier: 'HERO' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'REJECT';
  shadow_anchoring: string;
  biological_authenticity: string;
  hardware_integrity: string;
  wardrobe_compliance: string;
  penalties: ImagePenalty[];
  flags: string[];
}

export interface Gap {
  missing_slot: string;
  asset_type_needed: string;
  impact_on_completeness: number;
  priority: 'Critical' | 'High' | 'Medium';
}

export interface JudgeResult {
  pid: string;
  portfolio_score: number;
  portfolio_tier: string;
  completeness_score: number;
  quality_average: number;
  asset_summary: {
    total_images: number;
    by_type: Record<string, number>;
    qualifying_by_type: Record<string, number>;
  };
  images: ImageResult[];
  gaps: Gap[];
  hero_image_recommendation: {
    image_id: string;
    reason: string;
  };
  production_brief: {
    next_shoot_priority: string[];
    quick_wins: string[];
    do_not_reuse: string[];
  };
  verdict: string;
}

export type AppStep = 'input' | 'loading' | 'preview' | 'judging' | 'results';

export interface ScrapeResponse {
  pid: string;
  images: string[];
  count: number;
  error?: string;
}

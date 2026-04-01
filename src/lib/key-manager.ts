// Gemini free tier limits
export const FREE_TIER = {
  RPD: 1500,        // requests per day
  RPM: 15,          // requests per minute
  TPM: 1_000_000,   // tokens per minute
  TOKENS_PER_PID: 75_000, // ~estimated tokens per judge call (12 images)
};

export type KeyStatus = 'active' | 'rpm_limited' | 'exhausted' | 'invalid';

export interface ManagedKey {
  id: string;
  key: string;
  label: string;           // e.g. "Key 1"
  addedAt: number;
  requestsToday: number;
  lastRequestAt: number;
  last429At: number;       // 0 if never
  status: KeyStatus;
  errorMessage?: string;
}

const STORAGE_KEY = 'lk_judge_api_keys';
const LEGACY_KEY   = 'lk_judge_gemini_key';

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // "2026-04-01"
}

function storageKey(): string {
  return `${STORAGE_KEY}_${todayUTC()}`;
}

// ─── Persistence ────────────────────────────────────────────────────────────

export function loadKeys(): ManagedKey[] {
  if (typeof window === 'undefined') return [];

  // Migrate legacy single key
  const legacy = localStorage.getItem(LEGACY_KEY);

  const raw = localStorage.getItem(storageKey());
  let keys: ManagedKey[] = raw ? JSON.parse(raw) : [];

  if (legacy && !keys.some(k => k.key === legacy)) {
    keys = [makeKey(legacy, 'Key 1'), ...keys];
    localStorage.removeItem(LEGACY_KEY);
    saveKeys(keys);
  }

  // Reset RPM limit if >60s have passed
  const now = Date.now();
  keys = keys.map(k => {
    if (k.status === 'rpm_limited' && now - k.last429At > 65_000) {
      return { ...k, status: 'active' };
    }
    return k;
  });

  return keys;
}

export function saveKeys(keys: ManagedKey[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(), JSON.stringify(keys));
  // Also clear old day keys (keep storage tidy)
}

export function makeKey(apiKey: string, label?: string): ManagedKey {
  return {
    id: Math.random().toString(36).slice(2),
    key: apiKey.trim(),
    label: label || '',
    addedAt: Date.now(),
    requestsToday: 0,
    lastRequestAt: 0,
    last429At: 0,
    status: 'active',
  };
}

// ─── Rotation ────────────────────────────────────────────────────────────────

/** Returns the best available key, or null if all are exhausted/invalid */
export function getNextKey(keys: ManagedKey[]): ManagedKey | null {
  const now = Date.now();

  // Refresh RPM-limited keys that have cooled down
  const refreshed = keys.map(k => {
    if (k.status === 'rpm_limited' && now - k.last429At > 65_000) {
      return { ...k, status: 'active' as KeyStatus };
    }
    return k;
  });

  // Prefer keys with fewest requests today that are active and under daily limit
  const candidates = refreshed.filter(
    k => k.status === 'active' && k.requestsToday < FREE_TIER.RPD
  );

  if (candidates.length === 0) return null;

  // Pick the one with fewest requests today (load-balance)
  return candidates.sort((a, b) => a.requestsToday - b.requestsToday)[0];
}

/** Record a successful request against a key */
export function recordRequest(keys: ManagedKey[], keyId: string): ManagedKey[] {
  return keys.map(k =>
    k.id === keyId
      ? { ...k, requestsToday: k.requestsToday + 1, lastRequestAt: Date.now() }
      : k
  );
}

/** Record a 429 against a key */
export function record429(keys: ManagedKey[], keyId: string, isDaily = false): ManagedKey[] {
  return keys.map(k =>
    k.id === keyId
      ? {
          ...k,
          last429At: Date.now(),
          status: (isDaily ? 'exhausted' : 'rpm_limited') as KeyStatus,
          errorMessage: isDaily
            ? 'Daily quota exhausted — resets at midnight UTC'
            : 'RPM limit hit — cooling down for 60s',
        }
      : k
  );
}

/** Record an invalid key (401/403) */
export function recordInvalid(keys: ManagedKey[], keyId: string): ManagedKey[] {
  return keys.map(k =>
    k.id === keyId
      ? { ...k, status: 'invalid' as KeyStatus, errorMessage: 'Invalid API key' }
      : k
  );
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export function estimatedRequestsRemaining(k: ManagedKey): number {
  return Math.max(0, FREE_TIER.RPD - k.requestsToday);
}

export function cooldownSecondsLeft(k: ManagedKey): number {
  if (k.status !== 'rpm_limited') return 0;
  return Math.max(0, Math.ceil((65_000 - (Date.now() - k.last429At)) / 1000));
}

export function totalRemainingAcrossKeys(keys: ManagedKey[]): number {
  return keys.reduce((sum, k) => sum + estimatedRequestsRemaining(k), 0);
}

interface CacheEntry<T> {
  data: T;
  expiry: number; // ms timestamp
}

const memoryCache = new Map<string, CacheEntry<any>>();
const CACHE_PREFIX = 'sgt_cache_';
const DEFAULT_TTL = 30_000; // 30 seconds

export function getCached<T>(key: string): T | null {
  const mem = memoryCache.get(key);
  if (mem && Date.now() < mem.expiry) return mem.data as T;

  // Try localStorage
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (raw) {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() < entry.expiry) {
        memoryCache.set(key, entry); // restore to memory
        return entry.data;
      }
      localStorage.removeItem(CACHE_PREFIX + key);
    }
  } catch { /* ignore */ }

  return null;
}

export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void {
  const entry: CacheEntry<T> = { data, expiry: Date.now() + ttlMs };
  memoryCache.set(key, entry);

  // Only persist query results to localStorage (not mutation results)
  if (!key.startsWith('mut_')) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch { /* quota exceeded — silently skip */ }
  }
}

export function invalidateCache(keyPrefix: string): void {
  // Clear from memory
  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) memoryCache.delete(key);
  }
  // Clear from localStorage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX + keyPrefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

export function clearAllCache(): void {
  memoryCache.clear();
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

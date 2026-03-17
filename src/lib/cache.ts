interface CacheEntry<T> {
  readonly data: T
  readonly mtime: number
  readonly cachedAt: number
}

class DataCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private readonly maxAge: number

  constructor(maxAgeMs: number = 5 * 60 * 1000) {
    this.maxAge = maxAgeMs
  }

  get<T>(key: string, currentMtime?: number): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (currentMtime !== undefined && entry.mtime !== currentMtime) {
      this.store.delete(key)
      return null
    }

    if (Date.now() - entry.cachedAt > this.maxAge) {
      this.store.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T, mtime: number = 0): void {
    this.store.set(key, {
      data,
      mtime,
      cachedAt: Date.now(),
    })
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  get size(): number {
    return this.store.size
  }
}

export const dataCache = new DataCache()
export const activeSessionCache = new DataCache(5_000)

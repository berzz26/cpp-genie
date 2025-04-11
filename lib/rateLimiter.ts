interface RateLimitInfo {
  requests: number;
  lastReset: number;
}

class RateLimiter {
  private store: Map<string, RateLimitInfo>;
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number = 3, windowMs: number = 60000) {
    this.store = new Map();
    this.limit = limit;
    this.windowMs = windowMs;
  }

  isRateLimited(sessionId: string): boolean {
    const now = Date.now();
    const info = this.store.get(sessionId) || { requests: 0, lastReset: now };

    // Reset count if window has expired
    if (now - info.lastReset > this.windowMs) {
      info.requests = 0;
      info.lastReset = now;
    }

    // Check if limit is exceeded
    if (info.requests >= this.limit) {
      return true;
    }

    // Increment request count
    info.requests++;
    this.store.set(sessionId, info);
    return false;
  }

  getRemainingRequests(sessionId: string): number {
    const info = this.store.get(sessionId);
    if (!info) return this.limit;
    return Math.max(0, this.limit - info.requests);
  }

  getTimeToReset(sessionId: string): number {
    const info = this.store.get(sessionId);
    if (!info) return 0;
    const timeElapsed = Date.now() - info.lastReset;
    return Math.max(0, this.windowMs - timeElapsed);
  }
}

export const rateLimiter = new RateLimiter();

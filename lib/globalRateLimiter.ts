class GlobalRateLimiter {
  private timestamps: number[] = [];
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number = 14, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  isRateLimited(): boolean {
    const now = Date.now();
    // Remove timestamps older than the window
    this.timestamps = this.timestamps.filter(time => now - time < this.windowMs);
    
    if (this.timestamps.length >= this.limit) {
      return true;
    }

    this.timestamps.push(now);
    return false;
  }

  getTimeToReset(): number {
    if (this.timestamps.length === 0) return 0;
    const oldestTimestamp = Math.min(...this.timestamps);
    return Math.max(0, this.windowMs - (Date.now() - oldestTimestamp));
  }
}

// Export a singleton instance
export const globalRateLimiter = new GlobalRateLimiter();

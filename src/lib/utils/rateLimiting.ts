// lib/utils/rateLimiting.ts

// Use localStorage to track invite code attempts
// In a production app, you might want to store this on the server
// to prevent users from clearing their localStorage

interface RateLimitData {
  attempts: number;
  blockedUntil: string | null; // ISO date string
  consecutiveBlocks: number;
}

export class InviteCodeRateLimiter {
  private readonly STORAGE_KEY = 'nocena_invite_attempts';
  private readonly MAX_ATTEMPTS = 3;
  private readonly FIRST_BLOCK_MINUTES = 30;
  private readonly EXTENDED_BLOCK_HOURS = 24;

  /**
   * Checks if the user is currently rate limited
   *
   * @returns Object containing blocked status and time remaining
   */
  public checkRateLimit(): { blocked: boolean; timeRemaining: number | null } {
    const data = this.getRateLimitData();

    // If blocked, check if the block period has expired
    if (data.blockedUntil) {
      const blockedUntil = new Date(data.blockedUntil);
      const now = new Date();

      if (now < blockedUntil) {
        // Still blocked
        const timeRemaining = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000 / 60); // in minutes
        return { blocked: true, timeRemaining };
      } else {
        // Block period expired, reset attempts
        this.resetAttempts();
        return { blocked: false, timeRemaining: null };
      }
    }

    // Not blocked
    return { blocked: false, timeRemaining: null };
  }

  /**
   * Records a failed attempt and applies rate limiting if necessary
   *
   * @returns Object containing new blocked status and time remaining
   */
  public recordFailedAttempt(): { blocked: boolean; timeRemaining: number | null } {
    const data = this.getRateLimitData();
    data.attempts += 1;

    // Check if we should block
    if (data.attempts >= this.MAX_ATTEMPTS) {
      // Apply block
      const now = new Date();

      if (data.consecutiveBlocks > 0) {
        // Extended block (24 hours)
        const blockedUntil = new Date(now);
        blockedUntil.setHours(now.getHours() + this.EXTENDED_BLOCK_HOURS);
        data.blockedUntil = blockedUntil.toISOString();
      } else {
        // First block (30 minutes)
        const blockedUntil = new Date(now);
        blockedUntil.setMinutes(now.getMinutes() + this.FIRST_BLOCK_MINUTES);
        data.blockedUntil = blockedUntil.toISOString();
      }

      data.consecutiveBlocks += 1;
      data.attempts = 0;

      this.saveRateLimitData(data);

      // Calculate time remaining
      const blockedUntil = new Date(data.blockedUntil);
      const timeRemaining = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000 / 60); // in minutes

      return { blocked: true, timeRemaining };
    }

    this.saveRateLimitData(data);
    return { blocked: false, timeRemaining: null };
  }

  /**
   * Resets the rate limit tracking after a successful validation
   */
  public resetOnSuccess(): void {
    const data = this.getRateLimitData();
    data.attempts = 0;
    // Keep consecutiveBlocks to track repeat offenders
    this.saveRateLimitData(data);
  }

  /**
   * Resets attempts but keeps track of consecutive blocks
   */
  private resetAttempts(): void {
    const data = this.getRateLimitData();
    data.attempts = 0;
    data.blockedUntil = null;
    this.saveRateLimitData(data);
  }

  /**
   * Gets the current rate limit data from localStorage
   */
  public getRateLimitData(): RateLimitData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading rate limit data:', error);
    }

    // Default data if none exists
    return {
      attempts: 0,
      blockedUntil: null,
      consecutiveBlocks: 0,
    };
  }

  /**
   * Saves rate limit data to localStorage
   */
  private saveRateLimitData(data: RateLimitData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving rate limit data:', error);
    }
  }
}

// Export a singleton instance
export const inviteCodeRateLimiter = new InviteCodeRateLimiter();

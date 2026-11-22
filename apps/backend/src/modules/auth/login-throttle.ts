/**
 * In-memory sign-in throttle (single API instance; a modular monolith has no shared store).
 * Same policy as Laravel's LoginRequest: 5 attempts per minute per email address.
 */
export class LoginThrottle {
  private readonly attempts = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly maxAttempts = 5,
    private readonly windowMs = 60_000,
    private readonly now: () => number = Date.now,
  ) {}

  /** Seconds until the key may try again, or 0 when it is allowed. */
  retryAfter(key: string): number {
    const entry = this.attempts.get(key);
    if (!entry || entry.resetAt <= this.now()) return 0;
    return entry.count >= this.maxAttempts ? Math.ceil((entry.resetAt - this.now()) / 1000) : 0;
  }

  hit(key: string): void {
    const now = this.now();
    const entry = this.attempts.get(key);
    if (!entry || entry.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
    } else {
      entry.count++;
    }
    if (this.attempts.size > 10_000) this.prune();
  }

  clear(key: string): void {
    this.attempts.delete(key);
  }

  private prune(): void {
    const now = this.now();
    for (const [key, entry] of this.attempts) if (entry.resetAt <= now) this.attempts.delete(key);
  }
}

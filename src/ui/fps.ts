/** Smoothed frames-per-second counter based on a sliding time window. */
export class FpsCounter {
  private stamps: number[] = [];

  constructor(private readonly windowMs = 1000) {}

  /** Register a frame at time `now` (ms) and return the current FPS. */
  tick(now: number): number {
    this.stamps.push(now);
    const cutoff = now - this.windowMs;
    while (this.stamps.length > 0 && this.stamps[0] < cutoff) {
      this.stamps.shift();
    }
    if (this.stamps.length < 2) return 0;
    const span = this.stamps[this.stamps.length - 1] - this.stamps[0];
    return span > 0 ? ((this.stamps.length - 1) * 1000) / span : 0;
  }

  reset(): void {
    this.stamps = [];
  }
}

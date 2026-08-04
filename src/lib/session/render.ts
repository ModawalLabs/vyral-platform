/** Two scenes render at once; the rest wait. */
export const RENDER_CONCURRENCY = 2;

/** Per-scene wall clock, so the queue is watchable without being tedious. */
export const RENDER_MS_MIN = 6_000;
export const RENDER_MS_MAX = 10_000;

/**
 * Progress that does not read as fake.
 *
 * Real renders sprint through setup, grind through the work, then finish all at
 * once. A linear bar is the tell that nothing is actually happening, so this
 * moves fast to 70, crawls to 95, and holds there until the job reports done.
 */
export function nextProgress(current: number) {
  if (current < 70) return Math.min(70, current + 6 + Math.random() * 6);
  if (current < 95) return Math.min(95, current + 0.6 + Math.random() * 1.2);
  return current;
}

/** Which scene is rigged to fail, so the failure state is always in the demo. */
export const FAILING_SCENE_INDEX = 2;

export const RENDER_ERROR = "Upstream model timed out at 94%.";

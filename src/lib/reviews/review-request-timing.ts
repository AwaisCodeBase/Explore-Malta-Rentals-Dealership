const DEFAULT_DELAY_MINUTES = 2;
const MIN_DELAY_MINUTES = 1;
const MAX_DELAY_MINUTES = 5;

/** A claimed send that never finished can be retried after this. */
export const REVIEW_REQUEST_STALE_MS = 5 * 60 * 1000;

export const REVIEW_REQUEST_MAX_ATTEMPTS = 3;

export const REVIEW_REQUEST_POLL_MS = 30 * 1000;

export function reviewRequestDelayMs(envValue = process.env.REVIEW_REQUEST_DELAY_MINUTES): number {
  const trimmed = envValue?.trim() ?? "";
  const parsed = trimmed === "" ? Number.NaN : Number(trimmed);
  const minutes = Number.isFinite(parsed)
    ? Math.min(MAX_DELAY_MINUTES, Math.max(MIN_DELAY_MINUTES, Math.round(parsed)))
    : DEFAULT_DELAY_MINUTES;
  return minutes * 60 * 1000;
}

export function reviewRequestScheduledAt(now = new Date(), envValue = process.env.REVIEW_REQUEST_DELAY_MINUTES): Date {
  return new Date(now.getTime() + reviewRequestDelayMs(envValue));
}

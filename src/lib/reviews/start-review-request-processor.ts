import { processDueReviewRequests } from "@/lib/reviews/process-due-review-requests";
import { REVIEW_REQUEST_POLL_MS } from "@/lib/reviews/review-request-timing";

const globalForReview = globalThis as typeof globalThis & {
  reviewRequestProcessorTimer?: ReturnType<typeof setInterval>;
};

let tickInFlight = false;

/**
 * Polls the database for due review requests on a long-running Node server.
 * This is not a timer attached to the return request. The job itself is a database row,
 * so a restart continues from scheduledAt. Vercel cron calls the same processor.
 */
export function startReviewRequestProcessor(): void {
  if (process.env.VERCEL === "1" || process.env.REVIEW_REQUEST_PROCESSOR === "disabled") {
    return;
  }
  if (globalForReview.reviewRequestProcessorTimer) return;

  const tick = () => {
    if (tickInFlight) return;
    tickInFlight = true;
    void processDueReviewRequests()
      .catch((error: unknown) => {
        console.error("[review-request] processor tick failed", error);
      })
      .finally(() => {
        tickInFlight = false;
      });
  };

  globalForReview.reviewRequestProcessorTimer = setInterval(tick, REVIEW_REQUEST_POLL_MS);
  globalForReview.reviewRequestProcessorTimer.unref?.();
  tick();
  console.log("[review-request] database processor started");
}

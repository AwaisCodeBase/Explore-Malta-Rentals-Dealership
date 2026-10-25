export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { startReviewRequestProcessor } = await import("@/lib/reviews/start-review-request-processor");
  startReviewRequestProcessor();
}

import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { processDueReviewRequests } from "../src/lib/reviews/process-due-review-requests";

async function main(): Promise<void> {
  const result = await processDueReviewRequests();
  console.log("[review-request] processed", result);
  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});

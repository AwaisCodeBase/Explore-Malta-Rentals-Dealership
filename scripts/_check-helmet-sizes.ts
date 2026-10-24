import "dotenv/config";

import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
  const labels = await prisma.$queryRaw<{ enumlabel: string }[]>`
    SELECT e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'HelmetSize'
    ORDER BY e.enumsortorder
  `;
  const counts = await prisma.$queryRaw<{ size: string | null; count: bigint }[]>`
    SELECT "helmetSize1"::text AS size, COUNT(*)::bigint AS count
    FROM "Booking"
    GROUP BY 1
    ORDER BY 1
  `;
  const counts2 = await prisma.$queryRaw<{ size: string | null; count: bigint }[]>`
    SELECT "helmetSize2"::text AS size, COUNT(*)::bigint AS count
    FROM "Booking"
    GROUP BY 1
    ORDER BY 1
  `;
  console.log(
    JSON.stringify(
      {
        labels: labels.map((row) => row.enumlabel),
        helmetSize1: counts.map((row) => ({ size: row.size, count: Number(row.count) })),
        helmetSize2: counts2.map((row) => ({ size: row.size, count: Number(row.count) })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

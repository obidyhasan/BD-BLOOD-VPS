import assert from "node:assert/strict";
import test from "node:test";
import {
  createTestPrismaClient,
  disconnectTestPrisma,
  hasTestDatabase,
} from "./helpers/database";

test(
  "disposable PostgreSQL database accepts Prisma queries",
  { skip: !hasTestDatabase() && "TEST_DATABASE_URL is not configured" },
  async () => {
    const prisma = createTestPrismaClient();

    try {
      const result = await prisma.$queryRaw<Array<{ value: number }>>`
        SELECT 1::integer AS value
      `;
      assert.equal(result[0]?.value, 1);
    } finally {
      await disconnectTestPrisma(prisma);
    }
  },
);

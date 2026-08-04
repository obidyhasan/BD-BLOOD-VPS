import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const TEST_DATABASE_ENV = "TEST_DATABASE_URL";

export const getTestDatabaseUrl = (): string | null => {
  const value = process.env[TEST_DATABASE_ENV]?.trim();
  return value ? value : null;
};

export const hasTestDatabase = (): boolean => getTestDatabaseUrl() !== null;

export const createTestPrismaClient = (): PrismaClient => {
  const connectionString = getTestDatabaseUrl();

  if (!connectionString) {
    throw new Error(
      `${TEST_DATABASE_ENV} is required for database integration tests. ` +
        "Use a disposable PostgreSQL database; production DATABASE_URL is intentionally ignored.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};

export const disconnectTestPrisma = async (
  prisma: PrismaClient,
): Promise<void> => {
  await prisma.$disconnect();
};

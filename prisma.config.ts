import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: "apps/api/.env" });

export default defineConfig({
  schema: "apps/api/prisma/schema",
  migrations: {
    path: "apps/api/prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

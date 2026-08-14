import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export async function loadAllMigrationSql(): Promise<string> {
  const root = path.resolve(process.cwd(), "prisma/migrations");
  const entries = await readdir(root, { withFileTypes: true });
  const migrationFiles = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name, "migration.sql"))
    .sort();
  return (await Promise.all(migrationFiles.map((file) => readFile(file, "utf8")))).join("\n");
}

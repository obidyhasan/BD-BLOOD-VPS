import assert from "node:assert/strict";
import test from "node:test";
import { getTestDatabaseUrl, hasTestDatabase } from "./helpers/database";

test("database tests never fall back to DATABASE_URL", () => {
  const previousTestUrl = process.env.TEST_DATABASE_URL;
  const previousDatabaseUrl = process.env.DATABASE_URL;

  try {
    delete process.env.TEST_DATABASE_URL;
    process.env.DATABASE_URL =
      "postgresql://application:secret@localhost:5432/application";

    assert.equal(getTestDatabaseUrl(), null);
    assert.equal(hasTestDatabase(), false);
  } finally {
    if (previousTestUrl === undefined) delete process.env.TEST_DATABASE_URL;
    else process.env.TEST_DATABASE_URL = previousTestUrl;

    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  }
});

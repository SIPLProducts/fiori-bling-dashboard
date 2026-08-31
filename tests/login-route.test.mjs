import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the login route remains client-only", async () => {
  const source = await readFile(new URL("../src/routes/auth.tsx", import.meta.url), "utf8");
  const routeOptions = source.match(
    /createFileRoute\(["']\/auth["']\)\(\{([\s\S]*?)\n\}\);/,
  );

  assert.ok(routeOptions, "the /auth file route should exist");
  assert.match(routeOptions[1], /\bssr\s*:\s*false\b/);
});

test("a rejected server-entry import is not cached", async () => {
  const source = await readFile(new URL("../src/server.ts", import.meta.url), "utf8");

  assert.match(
    source,
    /\.catch\(\(error: unknown\) => \{[\s\S]*?serverEntryPromise = undefined;[\s\S]*?throw error;/,
  );
});
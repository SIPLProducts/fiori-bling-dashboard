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

test("safe document requests retry once without retrying mutations or APIs", async () => {
  const source = await readFile(new URL("../src/server.ts", import.meta.url), "utf8");

  assert.match(source, /request\.method !== "GET" && request\.method !== "HEAD"/);
  assert.match(source, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(source, /accept\.includes\("text\/html"\)/);
  assert.match(source, /maxAttempts = isSafeDocumentRequest\(request\) \? 2 : 1/);
  assert.match(source, /renderErrorPage\(incident\)/);
});

test("login session restoration cannot crash the sign-in route", async () => {
  const source = await readFile(new URL("../src/routes/auth.tsx", import.meta.url), "utf8");

  assert.match(source, /supabase\.auth[\s\S]*?\.getUser\(\)[\s\S]*?\.catch\(/);
  assert.match(source, /Unable to initialize login session restoration/);
});

test("protected-route auth failures return to login instead of the error page", async () => {
  const source = await readFile(
    new URL("../src/routes/_authenticated/route.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /try \{[\s\S]*?supabase\.auth\.getUser\(\)[\s\S]*?catch \(error\)/);
  assert.match(source, /throw redirect\(\{ to: "\/auth" \}\)/);
});
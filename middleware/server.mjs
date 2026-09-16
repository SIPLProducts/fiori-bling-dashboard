/**
 * SAP middleware for the MIS portal.
 *
 * The portal is a static SPA, so it must never hold SAP credentials. This
 * service is the only component that knows them: they live in its own .env
 * file. The portal backend calls this service with a shared secret; browsers
 * never receive that secret or call SAP directly.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { Agent } from "undici";
import WebSocket from "ws";
import { createScheduler } from "./scheduler.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load `.env` sitting next to this file so `node server.mjs` behaves the same
 * as `npm start` and `docker run --env-file`. A non-empty process env value
 * wins, but a stale blank value inherited by PM2 must not hide `.env`.
 */
function loadEnvFile(file = path.join(HERE, ".env")) {
  if (!fs.existsSync(file)) return false;
  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key]?.trim() === "") {
      process.env[key] = value;
    }
  }
  return true;
}

const ENV_LOADED = loadEnvFile();

const PORT = Number(process.env.PORT || 3008);
const SHARED_SECRET = (process.env.MIDDLEWARE_SHARED_SECRET || "").trim();
/** Public address this service is reachable on (ngrok URL, LAN URL, nginx path). */
const APP_BASE_URL = (process.env.APP_BASE_URL || "").trim().replace(/\/+$/, "");
// Wide posting-date windows return multi-MB payloads that take minutes.
// Large report windows (80k+ rows) can take several minutes to stream back.
const REQUEST_TIMEOUT_MS = Number(process.env.SAP_TIMEOUT_MS || 600000);
const VERSION = "1.6.0";
const STARTED_AT = Date.now();

const SAP_DISPATCHERS = new Map();

function envFlag(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

/**
 * SAP systems, keyed by the `key` column of the portal's sap_systems table.
 * Add one block per environment; the password never leaves this file/env.
 */
const SYSTEMS = {
  dev: {
    baseUrl: process.env.SAP_DEV_BASE_URL || "",
    client: process.env.SAP_DEV_CLIENT || "",
    username: process.env.SAP_DEV_USER || "",
    password: process.env.SAP_DEV_PASSWORD || "",
    caCertPath: process.env.SAP_DEV_CA_CERT_PATH || "",
    tlsInsecure: envFlag(process.env.SAP_DEV_TLS_INSECURE),
  },
  quality: {
    baseUrl: process.env.SAP_QUALITY_BASE_URL || "",
    client: process.env.SAP_QUALITY_CLIENT || "",
    username: process.env.SAP_QUALITY_USER || "",
    password: process.env.SAP_QUALITY_PASSWORD || "",
    caCertPath: process.env.SAP_QUALITY_CA_CERT_PATH || "",
    tlsInsecure: envFlag(process.env.SAP_QUALITY_TLS_INSECURE),
  },
  prod: {
    baseUrl: process.env.SAP_PROD_BASE_URL || "",
    client: process.env.SAP_PROD_CLIENT || "",
    username: process.env.SAP_PROD_USER || "",
    password: process.env.SAP_PROD_PASSWORD || "",
    caCertPath: process.env.SAP_PROD_CA_CERT_PATH || "",
    tlsInsecure: envFlag(process.env.SAP_PROD_TLS_INSECURE),
  },
};

const SYSTEM_ENV_PREFIXES = {
  dev: "SAP_DEV",
  quality: "SAP_QUALITY",
  prod: "SAP_PROD",
};

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));

/* --------------------------------- logging -------------------------------- */

const LOG_DIR = path.join(HERE, "logs");
const LOG_MAX_BYTES = 5 * 1024 * 1024;
/** In-memory ring buffer so the portal can read recent activity over HTTP. */
const RECENT = [];
const RECENT_MAX = 400;

function logLine(text) {
  const stamp = new Date().toISOString();
  const line = `${stamp} ${text}`;
  console.log(`[mis-sap-middleware] ${text}`);
  RECENT.push(line);
  if (RECENT.length > RECENT_MAX) RECENT.shift();
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const file = path.join(LOG_DIR, `sap-${stamp.slice(0, 10)}.log`);
    if (fs.existsSync(file) && fs.statSync(file).size > LOG_MAX_BYTES) {
      fs.renameSync(file, `${file}.1`);
    }
    fs.appendFileSync(file, `${line}\n`);
  } catch {
    /* logging must never break a request */
  }
}

function newTraceId() {
  return Math.random().toString(16).slice(2, 8);
}

app.use((req, _res, next) => {
  logLine(`${req.method} ${req.path}`);
  next();
});

function sameSecret(received) {
  if (!SHARED_SECRET || !received) return false;
  const expected = Buffer.from(SHARED_SECRET);
  const actual = Buffer.from(String(received));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function requireSharedSecret(req, res, next) {
  if (!sameSecret(req.header("x-shared-secret"))) {
    logLine("secret-rejected: invalid or missing x-shared-secret — SAP was NOT called");
    return res.status(401).json({
      stage: "secret-rejected",
      error: "Invalid or missing x-shared-secret",
      message: "Middleware authentication failed. SAP was not contacted.",
    });
  }
  logLine("portal -> middleware accepted");
  return next();
}

function portalAdminClient() {
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) throw new Error("Portal database credentials are not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: WebSocket },
  });
}

async function requirePortalUserManagement(req, res, next) {
  try {
    const authHeader = String(req.header("authorization") || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return res.status(401).json({ message: "Your session has expired. Please sign in again." });

    const db = portalAdminClient();
    const { data: authData, error: authError } = await db.auth.getUser(token);
    if (authError || !authData.user) {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }

    const { data: roles, error: rolesError } = await db
      .from("user_role_assignments")
      .select("role_key")
      .eq("user_id", authData.user.id);
    if (rolesError) throw rolesError;
    const roleKeys = (roles || []).map((row) => row.role_key);
    let allowed = roleKeys.includes("super_admin");
    if (!allowed && roleKeys.length) {
      const { data: grants, error: grantsError } = await db
        .from("role_screens")
        .select("screen_key")
        .in("role_key", roleKeys)
        .eq("screen_key", "admin.users")
        .limit(1);
      if (grantsError) throw grantsError;
      allowed = Boolean(grants?.length);
    }
    if (!allowed) return res.status(403).json({ message: "User Management access required" });

    req.portalAdmin = db;
    req.portalUserId = authData.user.id;
    return next();
  } catch (error) {
    logLine(`test-login authorization failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return res.status(500).json({ message: "Could not verify User Management access" });
  }
}

function resolveSystem(body = {}) {
  const key = String(body.systemKey || "dev").toLowerCase();
  const requestedEnvironment = String(body.environment || "").trim().toLowerCase();
  const credentialKey =
    requestedEnvironment === "production"
      ? "prod"
      : requestedEnvironment === "quality" || requestedEnvironment === "dev" || requestedEnvironment === "prod"
        ? requestedEnvironment
        : key;
  const configured = SYSTEMS[credentialKey] || {};
  return {
    key,
    credentialKey,
    // Base URL / client / user may be overridden by the portal config; the
    // password only ever comes from this service's environment.
    baseUrl: (body.baseUrl || configured.baseUrl || "").replace(/\/+$/, ""),
    client: body.sapClient || configured.client || "",
    username: body.username || configured.username || "",
    password: configured.password || "",
    caCertPath: configured.caCertPath || "",
    tlsInsecure: configured.tlsInsecure === true,
  };
}

/**
 * Use a private CA only for the matching SAP HTTPS system. HTTP and publicly
 * trusted HTTPS continue through the normal fetch path and default trust store.
 */
function sapFetchOptions(system, url) {
  if (url.protocol !== "https:") return {};
  if (!system.caCertPath && system.tlsInsecure) {
    const cacheKey = `insecure:${system.credentialKey}`;
    let dispatcher = SAP_DISPATCHERS.get(cacheKey);
    if (!dispatcher) {
      dispatcher = new Agent({ connect: { rejectUnauthorized: false } });
      SAP_DISPATCHERS.set(cacheKey, dispatcher);
    }
    logLine(
      `WARNING: SAP ${system.credentialKey} HTTPS certificate verification is DISABLED for this request`,
    );
    return { dispatcher };
  }
  if (!system.caCertPath) return {};
  const certPath = path.isAbsolute(system.caCertPath)
    ? system.caCertPath
    : path.resolve(HERE, system.caCertPath);
  const cached = SAP_DISPATCHERS.get(certPath);
  if (cached) return { dispatcher: cached };

  let ca;
  try {
    ca = fs.readFileSync(certPath, "utf8");
  } catch (error) {
    throw new Error(
      `SAP CA certificate for system "${system.key}" could not be read at ${certPath}: ${error?.message ?? error}`,
    );
  }
  if (!ca.includes("-----BEGIN CERTIFICATE-----")) {
    throw new Error(`SAP CA certificate for system "${system.key}" is not a valid PEM certificate: ${certPath}`);
  }

  const dispatcher = new Agent({ connect: { ca, rejectUnauthorized: true } });
  SAP_DISPATCHERS.set(certPath, dispatcher);
  return { dispatcher };
}

function buildUrl(system, path, query = {}) {
  const raw = String(path || "").trim();
  const isAbsolute = /^https?:\/\//i.test(raw);
  // The stored path may already carry its own query string
  // (e.g. /report?sap-client=234) — parse it instead of concatenating, so
  // sap-client is never appended a second time.
  const base = isAbsolute ? raw : `${system.baseUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
  const url = new URL(base);
  if (system.client && !url.searchParams.has("sap-client")) {
    url.searchParams.set("sap-client", system.client);
  }
  for (const [key, value] of Object.entries(query)) {
    if (key) url.searchParams.set(key, String(value ?? ""));
  }
  return url.toString();
}

async function callSap({ traceId, system, path, method = "GET", query, headers = {}, body }) {
  const envPrefix = SYSTEM_ENV_PREFIXES[system.credentialKey];
  if (!envPrefix) {
    throw new Error(
      `SAP environment "${system.credentialKey}" has no middleware configuration. Use DEV, QUALITY, or PRODUCTION.`,
    );
  }
  if (!system.baseUrl && !/^https?:\/\//i.test(String(path || ""))) {
    throw new Error("No SAP base URL configured for this system");
  }
  if (!system.username) {
    throw new Error(
      `SAP username is not configured for system "${system.key}" in SAP Systems or ${envPrefix}_USER in middleware .env`,
    );
  }
  if (!system.password) {
    throw new Error(
      `SAP password is not configured for system "${system.key}". Set ${envPrefix}_PASSWORD in middleware .env, then restart PM2.`,
    );
  }
  const url = new URL(buildUrl(system, path, query || {}));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = Date.now();
  logLine(`[${traceId}] -> SAP ${method} ${url.toString()}`);
  logLine(
    `[${traceId}]    system=${system.key} environment=${system.credentialKey} auth=${system.username ? "basic" : "none"} user=${
      system.username || "-"
    } password=${system.password ? "set" : "MISSING"} timeout=${REQUEST_TIMEOUT_MS}ms`,
  );
  if (body) {
    const payload = typeof body === "string" ? body : JSON.stringify(body);
    logLine(`[${traceId}]    payload: ${payload.slice(0, 500).replace(/\s+/g, " ")}`);
  }
  try {
    const auth = Buffer.from(`${system.username}:${system.password}`).toString("base64");
    const res = await fetch(url, {
      ...sapFetchOptions(system, url),
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(system.username ? { Authorization: `Basic ${auth}` } : {}),
        ...headers,
      },
      ...(body && method !== "GET" && method !== "HEAD"
        ? { body: typeof body === "string" ? body : JSON.stringify(body) }
        : {}),
    });
    const text = await res.text();
    const durationMs = Date.now() - started;
    logLine(
      `[${traceId}] <- ${res.status} in ${durationMs}ms, ${text.length} bytes, content-type ${
        res.headers.get("content-type") ?? "-"
      }`,
    );
    logLine(`[${traceId}]    body[0..300]: ${text.slice(0, 300).replace(/\s+/g, " ")}`);
    try {
      const parsed = JSON.parse(text);
      const rows = Array.isArray(parsed)
        ? parsed.length
        : Array.isArray(parsed?.d?.results)
          ? parsed.d.results.length
          : Array.isArray(parsed?.results)
            ? parsed.results.length
            : Array.isArray(parsed?.data)
              ? parsed.data.length
              : null;
      logLine(`[${traceId}]    rows parsed: ${rows === null ? "n/a (not an array payload)" : rows}`);
    } catch {
      logLine(`[${traceId}]    rows parsed: response is not valid JSON`);
    }
    return {
      status: res.status,
      ok: res.ok,
      url: url.toString(),
      durationMs,
      body: text,
      contentType: res.headers.get("content-type") ?? null,
    };
  } catch (err) {
    const durationMs = Date.now() - started;
    const cause = err?.cause?.code || err?.code || err?.name || "";
    logLine(
      `[${traceId}] xx SAP NOT reachable after ${durationMs}ms: ${err?.message ?? err} ${
        cause ? `(${cause})` : ""
      }`,
    );
    const wrapped = new Error(
      `${err?.message ?? "Request failed"}${cause ? ` (${cause})` : ""} — target ${url.toString()}`,
    );
    wrapped.url = url.toString();
    wrapped.durationMs = durationMs;
    throw wrapped;
  } finally {
    clearTimeout(timer);
  }
}

app.get("/health", requireSharedSecret, (_req, res) => {
  res.json({
    ok: true,
    stage: "ok",
    service: "mis-sap-middleware",
    version: VERSION,
    port: PORT,
    baseUrl: APP_BASE_URL || null,
    uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
    systems: Object.entries(SYSTEMS)
      .map(([key, cfg]) => ({
        key,
        baseUrl: cfg.baseUrl,
        credentials: Boolean(cfg.password),
        customCaConfigured: Boolean(cfg.caCertPath),
        insecureTls: cfg.tlsInsecure === true,
      })),
  });
});

/** Recent activity, so the SAP round trips can be read from the portal. */
app.get("/logs/recent", requireSharedSecret, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, RECENT_MAX);
  res.json({ ok: true, stage: "ok", lines: RECENT.slice(-limit) });
});

/** Bare reachability probe of the SAP host — no report call, no payload. */
app.get("/diag/sap", requireSharedSecret, async (req, res) => {
  const traceId = newTraceId();
  const system = resolveSystem({
    systemKey: req.query.system,
    environment: req.query.environment,
    baseUrl: req.query.baseUrl,
    sapClient: req.query.sapClient,
    username: req.query.username,
  });
  if (!system.baseUrl) {
    return res.status(400).json({
      ok: false,
      stage: "sap-unreachable",
      message: `No base URL configured for SAP system "${system.key}".`,
    });
  }
  let url;
  try {
    url = new URL(system.baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsupported protocol");
  } catch {
    return res.status(400).json({
      ok: false,
      stage: "sap-unreachable",
      message: `The Base URL configured for SAP system "${system.key}" is invalid. Use a complete http:// or https:// address.`,
    });
  }
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(REQUEST_TIMEOUT_MS, 10000));
  logLine(`[${traceId}] -> ping ${url.origin}`);
  try {
    const probe = await fetch(url.origin, {
      ...sapFetchOptions(system, url),
      method: "GET",
      signal: controller.signal,
    });
    const durationMs = Date.now() - started;
    logLine(`[${traceId}] <- ping ${probe.status} in ${durationMs}ms`);
    res.json({
      ok: true,
      stage: "ok",
      traceId,
      host: url.hostname,
      port: url.port || (url.protocol === "https:" ? "443" : "80"),
      status: probe.status,
      durationMs,
      message: `SAP host answered HTTP ${probe.status} in ${durationMs} ms — the host is reachable from the middleware.`,
    });
  } catch (err) {
    const durationMs = Date.now() - started;
    const cause = err?.cause?.code || err?.code || err?.name || "";
    logLine(`[${traceId}] xx ping failed after ${durationMs}ms: ${err?.message ?? err} ${cause}`);
    res.status(502).json({
      ok: false,
      stage: "sap-unreachable",
      traceId,
      host: url.hostname,
      port: url.port || "",
      durationMs,
      message: `SAP host ${url.host} could not be reached from the middleware: ${
        err?.message ?? err
      }${cause ? ` (${cause})` : ""}`,
    });
  } finally {
    clearTimeout(timer);
  }
});

app.post("/sap/test", requireSharedSecret, async (req, res) => {
  const traceId = newTraceId();
  const system = resolveSystem(req.body);
  try {
    const result = await callSap({
      traceId,
      system,
      path: req.body.path || "/sap/public/ping",
      method: "GET",
    });
    res.status(result.ok ? 200 : 502).json({
      ok: result.ok,
      stage: result.ok ? "ok" : "sap-http-error",
      traceId,
      status: result.status,
      url: result.url,
      durationMs: result.durationMs,
      message: result.ok
        ? `SAP reachable — HTTP 200 in ${result.durationMs} ms`
        : `SAP was reached and answered HTTP ${result.status} in ${result.durationMs} ms`,
    });
  } catch (err) {
    res.status(502).json({
      ok: false,
      stage: "sap-unreachable",
      traceId,
      message: `SAP was never contacted: ${err.message}`,
    });
  }
});

app.post("/sap/call", requireSharedSecret, async (req, res) => {
  const traceId = newTraceId();
  const system = resolveSystem(req.body);
  const { path, method = "GET", query, headers, body, dryRun } = req.body || {};
  try {
    const result = await callSap({
      traceId,
      system,
      path,
      method: dryRun ? "GET" : String(method).toUpperCase(),
      query,
      headers,
      body,
    });
    res.status(result.ok ? 200 : 502).json({
      ok: result.ok,
      stage: result.ok ? "ok" : "sap-http-error",
      traceId,
      status: result.status,
      url: result.url,
      durationMs: result.durationMs,
      message: result.ok
        ? `SAP responded HTTP ${result.status} in ${result.durationMs} ms`
        : `SAP was reached and answered HTTP ${result.status} in ${result.durationMs} ms`,
      // Never truncate: the portal parses this body to sync rows.
      contentType: result.contentType ?? null,
      bytes: Buffer.byteLength(result.body ?? "", "utf8"),
      body: result.body,
    });
  } catch (err) {
    res.status(502).json({
      ok: false,
      stage: "sap-unreachable",
      traceId,
      durationMs: err.durationMs ?? 0,
      message: `SAP was never contacted: ${err.message}`,
    });
  }
});

/* -------------------------- on-prem sync scheduler ------------------------- */

const scheduler = createScheduler({ callSap, resolveSystem, logLine, newTraceId });

/** Force one sync now (same code path the scheduler uses). */
app.post("/sync/run", requireSharedSecret, async (req, res) => {
  const endpoint = String(req.body?.endpoint || "").trim();
  if (!endpoint) return res.status(400).json({ ok: false, message: "endpoint is required" });
  const result = await scheduler.runEndpoint(endpoint, { manual: true });
  res.status(result.status === "error" ? 502 : 200).json({ ok: result.status !== "error", ...result });
});

/** What the scheduler currently believes is configured — for troubleshooting. */
app.get("/sync/status", requireSharedSecret, async (_req, res) => {
  res.json({ ok: true, enabled: scheduler.enabled });
});

/** Create a one-use login token for an active Admin account. */
app.post("/admin/test-login", requireSharedSecret, requirePortalUserManagement, async (req, res) => {
  try {
    const userId = String(req.body?.userId || "").trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({ message: "Invalid user" });
    }
    if (userId === req.portalUserId) {
      return res.status(400).json({ message: "You are already signed in as this user" });
    }

    const db = req.portalAdmin;
    const [{ data: profile, error: profileError }, { data: assignments, error: roleError }] =
      await Promise.all([
        db.from("profiles").select("email, status").eq("id", userId).maybeSingle(),
        db
          .from("user_role_assignments")
          .select("role_key")
          .eq("user_id", userId)
          .order("role_key"),
      ]);
    if (profileError) throw profileError;
    if (roleError) throw roleError;
    const isAdminOnly = assignments?.length === 1 && assignments[0]?.role_key === "admin";
    if (!profile || profile.status !== "active" || !profile.email || !isAdminOnly) {
      return res.status(400).json({ message: "Test login is available only for active Admin users" });
    }

    const { data: link, error: linkError } = await db.auth.admin.generateLink({
      type: "magiclink",
      email: profile.email,
    });
    if (linkError) throw linkError;
    logLine(`test-login token issued by ${req.portalUserId} for ${userId}`);
    return res.json({ tokenHash: link.properties.hashed_token, email: profile.email });
  } catch (error) {
    logLine(`test-login failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return res.status(500).json({ message: "Could not create the test login" });
  }
});

app.use((_req, res) => res.status(404).json({ stage: "not-found", error: "Not found" }));


app.listen(PORT, () => {
  // Startup diagnostics — configured / not configured only, never any secret.
  console.log(`[mis-sap-middleware] v${VERSION} listening on :${PORT}`);
  console.log(`[mis-sap-middleware] .env file            : ${ENV_LOADED ? "loaded" : "NOT FOUND"}`);
  console.log(`[mis-sap-middleware] public base URL      : ${APP_BASE_URL || "NOT SET (set APP_BASE_URL)"}`);
  console.log(`[mis-sap-middleware] shared secret        : ${SHARED_SECRET ? "configured" : "MISSING"}`);
  for (const [key, cfg] of Object.entries(SYSTEMS)) {
    console.log(
      `[mis-sap-middleware] SAP ${key.padEnd(8)}        : fallback-url=${cfg.baseUrl ? "configured" : "not set"} client=${
        cfg.client ? "configured" : "not set"
      } user=${cfg.username ? "configured" : "not set"} password=${cfg.password ? "configured" : "MISSING"} CA=${
        cfg.caCertPath ? "configured" : "not set"
      } insecure-TLS=${cfg.tlsInsecure ? "ENABLED" : "off"}`,
    );
    if (cfg.tlsInsecure) {
      console.warn(
        `[mis-sap-middleware] WARNING: SAP ${key} certificate verification is disabled. Use only temporarily on a trusted internal network.`,
      );
    }
  }
  if (!SHARED_SECRET) {
    console.warn("[mis-sap-middleware] WARNING: MIDDLEWARE_SHARED_SECRET is missing — all protected calls will return 401.");
  }
  console.log(
    `[mis-sap-middleware] portal database      : ${process.env.SUPABASE_URL ? process.env.SUPABASE_URL : "NOT SET (scheduler off)"}`,
  );
  console.log(
    `[mis-sap-middleware] service role key     : ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "configured" : "MISSING (scheduler off)"}`,
  );
  scheduler.start();
});

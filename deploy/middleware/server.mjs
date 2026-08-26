/**
 * SAP middleware for the MIS portal.
 *
 * The portal is a static SPA, so it must never hold SAP credentials. This
 * service is the only component that knows them: they live in its own .env
 * file. Every request must carry the caller's portal access token, which is
 * verified against the Supabase JWT secret before any SAP call is made.
 */
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";

const PORT = Number(process.env.PORT || 3008);
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const REQUEST_TIMEOUT_MS = Number(process.env.SAP_TIMEOUT_MS || 30000);
const VERSION = "1.0.0";
const STARTED_AT = Date.now();

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
  },
  quality: {
    baseUrl: process.env.SAP_QUALITY_BASE_URL || "",
    client: process.env.SAP_QUALITY_CLIENT || "",
    username: process.env.SAP_QUALITY_USER || "",
    password: process.env.SAP_QUALITY_PASSWORD || "",
  },
  prod: {
    baseUrl: process.env.SAP_PROD_BASE_URL || "",
    client: process.env.SAP_PROD_CLIENT || "",
    username: process.env.SAP_PROD_USER || "",
    password: process.env.SAP_PROD_PASSWORD || "",
  },
};

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(
  cors({
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

function requirePortalToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Missing bearer token" });
  if (!JWT_SECRET) return res.status(500).json({ error: "SUPABASE_JWT_SECRET not configured" });
  try {
    req.claims = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function resolveSystem(body = {}) {
  const key = String(body.systemKey || "dev").toLowerCase();
  const configured = SYSTEMS[key] || {};
  return {
    key,
    // Base URL / client / user may be overridden by the portal config; the
    // password only ever comes from this service's environment.
    baseUrl: (body.baseUrl || configured.baseUrl || "").replace(/\/+$/, ""),
    client: body.sapClient || configured.client || "",
    username: configured.username || body.username || "",
    password: configured.password || "",
  };
}

function buildUrl(system, path, query = {}) {
  const raw = String(path || "");
  const isAbsolute = /^https?:\/\//i.test(raw);
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

async function callSap({ system, path, method = "GET", query, headers = {}, body }) {
  if (!system.baseUrl && !/^https?:\/\//i.test(String(path || ""))) {
    throw new Error("No SAP base URL configured for this system");
  }
  const url = buildUrl(system, path, query || {});
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = Date.now();
  try {
    const auth = Buffer.from(`${system.username}:${system.password}`).toString("base64");
    const res = await fetch(url, {
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
    return { status: res.status, ok: res.ok, url, durationMs: Date.now() - started, body: text };
  } finally {
    clearTimeout(timer);
  }
}

app.get("/health", requirePortalToken, (_req, res) => {
  res.json({
    ok: true,
    service: "mis-sap-middleware",
    version: VERSION,
    uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
    systems: Object.entries(SYSTEMS)
      .filter(([, cfg]) => cfg.baseUrl)
      .map(([key, cfg]) => ({ key, baseUrl: cfg.baseUrl, credentials: Boolean(cfg.password) })),
  });
});

app.post("/sap/test", requirePortalToken, async (req, res) => {
  const system = resolveSystem(req.body);
  try {
    const result = await callSap({
      system,
      path: req.body.path || "/sap/public/ping",
      method: "GET",
    });
    res.status(result.ok ? 200 : 502).json({
      ok: result.ok,
      status: result.status,
      url: result.url,
      durationMs: result.durationMs,
      message: result.ok ? "SAP reachable" : `SAP responded with HTTP ${result.status}`,
    });
  } catch (err) {
    res.status(502).json({ ok: false, message: err.message });
  }
});

app.post("/sap/call", requirePortalToken, async (req, res) => {
  const system = resolveSystem(req.body);
  const { path, method = "GET", query, headers, body, dryRun } = req.body || {};
  try {
    const result = await callSap({
      system,
      path,
      method: dryRun ? "GET" : String(method).toUpperCase(),
      query,
      headers,
      body,
    });
    res.status(result.ok ? 200 : 502).json({
      ok: result.ok,
      status: result.status,
      url: result.url,
      durationMs: result.durationMs,
      body: result.body.slice(0, 200000),
    });
  } catch (err) {
    res.status(502).json({ ok: false, message: err.message });
  }
});

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`[mis-sap-middleware] listening on :${PORT}`);
});

/**
 * SAP API Settings data access.
 *
 * Stores non-secret configuration (URLs, paths, headers, mappings) plus
 * write-only credentials: SAP passwords and the proxy secret are encrypted by
 * a security-definer database function and can never be read back by the UI.
 */
import { supabase } from "@/integrations/supabase/client";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { accessForUser } from "./access";
import { isValidCron, normalizeCron } from "./cron";
import {
  extractEmbeddedBody,
  formatBytes,
  IS_STATIC_BUILD,
  keyValueObject,
  salvageTruncatedArray,
  STATIC_MIDDLEWARE_BASE,
  withPostingDates,
} from "./sap-pull-shared";
import { mapPayload } from "./zfisales-map";

export type KeyValue = { key: string; value: string };

export type SapSystem = {
  id: string;
  key: string;
  label: string;
  environment: string;
  base_url: string;
  sap_client: string | null;
  username: string | null;
  is_active: boolean;
  last_test_status: string | null;
  last_test_message: string | null;
  last_test_at: string | null;
  sort_order: number;
};

export type SapEndpoint = {
  id: string;
  name: string;
  module_key: string;
  description: string | null;
  endpoint_path: string;
  system_key: string | null;
  http_method: string;
  auth_type: string;
  query_params: KeyValue[];
  headers: KeyValue[];
  body_template: string | null;
  response_root: string | null;
  response_notes: string | null;
  sample_response: string | null;
  scheduler_enabled: boolean;
  schedule_expression: string | null;
  last_run_at: string | null;
  last_run_status: string | null;
  is_active: boolean;
  last_test_status: string | null;
  last_test_message: string | null;
  last_test_duration_ms: number | null;
  last_synced_at: string | null;
};

export type MiddlewareConfig = {
  id: string;
  connection_mode: string;
  deployment_mode: string;
  middleware_port: number;
  middleware_url: string;
  last_test_status: string | null;
  last_test_message: string | null;
  last_test_at: string | null;
};

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export const AUTH_TYPES = [
  { value: "basic", label: "Basic (via middleware)" },
  { value: "proxy", label: "Proxy / Middleware" },
  { value: "none", label: "None" },
] as const;
export const ENVIRONMENTS = ["DEV", "QUALITY", "PROD"] as const;
export const CONNECTION_MODES = [
  { value: "proxy", label: "Via Proxy Server" },
  { value: "direct", label: "Direct to SAP" },
] as const;
export const DEPLOYMENT_MODES = [
  { value: "self_hosted", label: "Self-hosted (on-prem)" },
  { value: "cloud", label: "Cloud" },
] as const;

async function requireSuperAdmin(): Promise<void> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("NOT_AUTHENTICATED");
  const access = await accessForUser(data.user.id);
  if (!access.isSuperAdmin) throw new Error("Forbidden: Sharvi Admin role required");
}

function kv(raw: unknown): KeyValue[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row): row is KeyValue => !!row && typeof row === "object" && "key" in row)
    .map((row) => ({ key: String(row.key ?? ""), value: String(row.value ?? "") }));
}

/* ------------------------------- endpoints ------------------------------- */

export async function listSapEndpoints(): Promise<SapEndpoint[]> {
  await requireSuperAdmin();
  const { data, error } = await supabase.from("sap_endpoints").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as unknown as SapEndpoint),
    query_params: kv((row as { query_params: unknown }).query_params),
    headers: kv((row as { headers: unknown }).headers),
  }));
}

export type EndpointInput = {
  name: string;
  module_key: string;
  description: string;
  endpoint_path: string;
  system_key: string;
  http_method: string;
  auth_type: string;
  query_params: KeyValue[];
  headers: KeyValue[];
  body_template: string;
  response_root: string;
  response_notes: string;
  scheduler_enabled: boolean;
  schedule_expression: string;
  is_active: boolean;
};

/**
 * Applies the endpoint's own interval to the real background scheduler.
 * Nothing about the schedule is hard-coded — whatever is saved here runs.
 */
async function applySchedule(input: EndpointInput): Promise<void> {
  const expression = normalizeCron(input.schedule_expression);
  if (input.scheduler_enabled && !isValidCron(expression)) {
    throw new Error(
      `"${input.schedule_expression}" is not a valid cron expression — use 5 fields, e.g. */5 * * * *`,
    );
  }
  const { error } = await supabase.rpc("apply_sap_sync_schedule", {
    _endpoint: input.name.trim(),
    _enabled: input.scheduler_enabled,
    _cron: expression,
  });
  if (error) throw new Error(`Schedule could not be applied: ${error.message}`);
}

function endpointPayload(input: EndpointInput) {
  return {
    name: input.name.trim(),
    module_key: input.module_key,
    description: input.description.trim() || null,
    endpoint_path: input.endpoint_path.trim(),
    system_key: input.system_key || null,
    http_method: input.http_method,
    auth_type: input.auth_type,
    query_params: input.query_params.filter((row) => row.key.trim()),
    headers: input.headers.filter((row) => row.key.trim()),
    body_template: input.body_template.trim() || null,
    response_root: input.response_root.trim() || null,
    response_notes: input.response_notes.trim() || null,
    scheduler_enabled: input.scheduler_enabled,
    schedule_expression: input.schedule_expression.trim() || null,
    is_active: input.is_active,
  };
}

export async function createSapEndpoint(input: EndpointInput): Promise<string> {
  await requireSuperAdmin();
  if (!input.name.trim()) throw new Error("Name is required");
  if (!input.endpoint_path.trim()) throw new Error("Endpoint path or URL is required");
  const { data, error } = await supabase
    .from("sap_endpoints")
    .insert(endpointPayload(input))
    .select("id")
    .single();
  if (error) throw error;
  await applySchedule(input);
  return data.id;
}

export async function updateSapEndpoint(id: string, input: EndpointInput): Promise<void> {
  await requireSuperAdmin();
  const { error } = await supabase.from("sap_endpoints").update(endpointPayload(input)).eq("id", id);
  if (error) throw error;
  await applySchedule(input);
}

export async function deleteSapEndpoint(id: string): Promise<void> {
  await requireSuperAdmin();
  const { data: existing } = await supabase.from("sap_endpoints").select("name").eq("id", id).maybeSingle();
  const { error } = await supabase.from("sap_endpoints").delete().eq("id", id);
  if (error) throw error;
  if (existing?.name) {
    await supabase.rpc("apply_sap_sync_schedule", {
      _endpoint: existing.name,
      _enabled: false,
      _cron: "",
    });
  }
}

/* -------------------------------- systems -------------------------------- */

export async function listSapSystems(): Promise<SapSystem[]> {
  await requireSuperAdmin();
  const { data, error } = await supabase.from("sap_systems").select("*").order("sort_order").order("label");
  if (error) throw error;
  return (data ?? []) as unknown as SapSystem[];
}

export type SystemInput = {
  key: string;
  label: string;
  environment: string;
  base_url: string;
  sap_client: string;
  username: string;
  password: string;
  is_active: boolean;
};

/** Credential keys that currently have a stored (encrypted) secret. */
export const MIDDLEWARE_CREDENTIAL_KEY = "__middleware__";

export async function listStoredCredentialKeys(): Promise<string[]> {
  await requireSuperAdmin();
  const { data, error } = await supabase.rpc("list_sap_credential_keys");
  if (error) throw error;
  return (data ?? []) as string[];
}

async function saveCredential(credKey: string, secret: string): Promise<void> {
  const { error } = await supabase.rpc("set_sap_credential", {
    _cred_key: credKey,
    _secret: secret,
  });
  if (error) throw error;
}

export async function saveSapSystem(id: string | null, input: SystemInput): Promise<void> {
  await requireSuperAdmin();
  if (!input.label.trim()) throw new Error("Label is required");
  const payload = {
    key: (input.key || input.label).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label: input.label.trim(),
    environment: input.environment,
    base_url: input.base_url.trim(),
    sap_client: input.sap_client.trim() || null,
    username: input.username.trim() || null,
    is_active: input.is_active,
  };
  const { error } = id
    ? await supabase.from("sap_systems").update(payload).eq("id", id)
    : await supabase.from("sap_systems").insert(payload);
  if (error) throw error;
  if (input.password.trim()) await saveCredential(payload.key, input.password);
  if (input.is_active) {
    await supabase.from("sap_systems").update({ is_active: false }).neq("key", payload.key);
  }
}

export async function deleteSapSystem(id: string): Promise<void> {
  await requireSuperAdmin();
  const { error } = await supabase.from("sap_systems").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------ middleware ------------------------------ */

export async function getMiddlewareConfig(): Promise<MiddlewareConfig> {
  await requireSuperAdmin();
  const { data, error } = await supabase.from("sap_middleware_config").select("*").limit(1).maybeSingle();
  if (error) throw error;
  if (data) return data as unknown as MiddlewareConfig;
  const created = await supabase.from("sap_middleware_config").insert({}).select("*").single();
  if (created.error) throw created.error;
  return created.data as unknown as MiddlewareConfig;
}

export type MiddlewareInput = {
  connection_mode: string;
  deployment_mode: string;
  middleware_port: number;
  middleware_url: string;
  proxy_secret: string;
};

export async function saveMiddlewareConfig(id: string, input: MiddlewareInput): Promise<void> {
  await requireSuperAdmin();
  if (input.connection_mode === "proxy" && !input.middleware_url.trim()) {
    throw new Error("Node.js middleware URL is required in proxy mode");
  }
  const { error } = await supabase
    .from("sap_middleware_config")
    .update({
      connection_mode: input.connection_mode,
      deployment_mode: input.deployment_mode,
      middleware_port: input.middleware_port,
      middleware_url: input.middleware_url.trim().replace(/\/+$/, ""),
    })
    .eq("id", id);
  if (error) throw error;
  if (input.proxy_secret.trim()) await saveCredential(MIDDLEWARE_CREDENTIAL_KEY, input.proxy_secret);
}

/* ----------------------------- connectivity ----------------------------- */

export type TestStage =
  | "secret-rejected"
  | "sap-unreachable"
  | "sap-http-error"
  | "ok"
  | "unknown";

export type TestResult = {
  ok: boolean;
  status: number | null;
  message: string;
  durationMs: number;
  body?: string;
  /** Which leg of browser -> middleware -> SAP the call reached. */
  stage: TestStage;
  /** HTTP status SAP itself returned, when SAP was actually reached. */
  sapStatus?: number | null;
  traceId?: string | null;
  /** True only when the middleware actually issued the SAP request. */
  sapContacted: boolean;
  /** Exact payload the portal sent to the middleware (for console/diagnostics). */
  request?: OutboundRequest;
  /** SAP answered successfully but the selected request returned no rows. */
  noData?: boolean;
};

export type OutboundRequest = {
  url: string;
  method: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: unknown;
};


function describe(stage: TestStage, payload: Record<string, unknown>, fallback: string): string {
  const msg = typeof payload["message"] === "string" ? (payload["message"] as string) : "";
  if (msg) return msg;
  if (stage === "secret-rejected") return "The middleware shared secret does not match — SAP was not contacted.";
  return fallback;
}

type MiddlewareRequest = { path: string; body?: unknown };

const callMiddlewareServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: MiddlewareRequest) => data)
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_super_admin", {
      _user_id: context.userId,
    });
    if (roleError || !isAdmin) throw new Error("Forbidden: Sharvi Admin role required");

    const sharedSecret = process.env["MIDDLEWARE_SHARED_SECRET"];
    if (!sharedSecret) throw new Error("MIDDLEWARE_SHARED_SECRET is not configured in Lovable Cloud");

    const { data: config, error: configError } = await context.supabase
      .from("sap_middleware_config")
      .select("middleware_url")
      .limit(1)
      .maybeSingle();
    if (configError) throw configError;
    const base = config?.middleware_url?.trim().replace(/\/+$/, "");
    if (!base) throw new Error("Set the Node.js middleware URL under Middleware Configuration first");
    if (!data.path.startsWith("/")) throw new Error("Invalid middleware path");

    const response = await fetch(`${base}${data.path}`, {
      method: data.body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        "x-shared-secret": sharedSecret,
      },
      ...(data.body === undefined ? {} : { body: JSON.stringify(data.body) }),
      signal: AbortSignal.timeout(120000),
    });
    return { status: response.status, text: await response.text() };
  });

/**
 * Static build: the browser talks to the same-origin `/sap-mw/` Nginx bridge,
 * which adds the shared secret server-side. Hosted build: the server function.
 */
async function middlewareRoundTrip(
  path: string,
  body?: unknown,
): Promise<{ status: number; text: string }> {
  if (!IS_STATIC_BUILD) return callMiddlewareServer({ data: { path, body } });
  const res = await fetch(`${STATIC_MIDDLEWARE_BASE}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(600000),
  });
  return { status: res.status, text: await res.text() };
}

async function callMiddleware(path: string, body?: unknown): Promise<TestResult> {
  const started = Date.now();
  try {
    const res = await middlewareRoundTrip(path, body);
    const text = res.text;
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      payload = {};
    }
    const responseOk = res.status >= 200 && res.status < 300;
    const stage = (typeof payload["stage"] === "string" ? payload["stage"] : responseOk ? "ok" : "unknown") as TestStage;
    const sapStatus = typeof payload["status"] === "number" ? (payload["status"] as number) : null;
    return {
      ok: responseOk,
      status: res.status,
      message: describe(stage, payload, responseOk ? "Reachable" : `HTTP ${res.status}`),
      durationMs:
        typeof payload["durationMs"] === "number" ? (payload["durationMs"] as number) : Date.now() - started,
      body: typeof payload["body"] === "string" ? (payload["body"] as string).slice(0, 200000) : text.slice(0, 4000),
      stage,
      sapStatus,
      traceId: typeof payload["traceId"] === "string" ? (payload["traceId"] as string) : null,
      sapContacted: stage === "ok" || stage === "sap-http-error",
    };
  } catch (err) {
    return {
      ok: false,
      status: null,
      message: `${
        err instanceof Error ? err.message : "Request failed"
      } — the portal server could not reach the middleware, so SAP was not contacted.`,
      durationMs: Date.now() - started,
      stage: "unknown",
      sapContacted: false,
    };
  }
}

/** Recent middleware activity lines (newest last). */
export async function fetchMiddlewareLogs(limit = 80): Promise<string[]> {
  await requireSuperAdmin();
  const result = await callMiddleware(`/logs/recent?limit=${limit}`);
  if (!result.ok) throw new Error(result.message);
  try {
    const parsed = JSON.parse(result.body ?? "{}") as { lines?: string[] };
    return parsed.lines ?? [];
  } catch {
    return [];
  }
}

/** Bare reachability probe of the SAP host from the middleware machine. */
export async function pingSapHost(systemKey: string | null): Promise<TestResult> {
  await requireSuperAdmin();
  return callMiddleware(`/diag/sap?system=${encodeURIComponent(systemKey ?? "dev")}`);
}


export async function testMiddleware(): Promise<TestResult> {
  await requireSuperAdmin();
  const result = await callMiddleware("/health");
  const config = await getMiddlewareConfig();
  await supabase
    .from("sap_middleware_config")
    .update({
      last_test_status: result.ok ? "ok" : "error",
      last_test_message: result.message,
      last_test_at: new Date().toISOString(),
    })
    .eq("id", config.id);
  return result;
}

export async function testSapSystem(system: SapSystem): Promise<TestResult> {
  await requireSuperAdmin();
  const result = await callMiddleware("/sap/test", {
    systemKey: system.key,
    baseUrl: system.base_url,
    sapClient: system.sap_client,
    username: system.username,
  });
  await supabase
    .from("sap_systems")
    .update({
      last_test_status: result.ok ? "ok" : "error",
      last_test_message: result.message,
      last_test_at: new Date().toISOString(),
    })
    .eq("id", system.id);
  return result;
}

/** Resolve the final URL an endpoint will hit, given the systems list. */
export function resolveEndpointUrl(endpoint: {
  endpoint_path: string;
  system_key: string | null;
}, systems: SapSystem[]): string {
  const path = endpoint.endpoint_path.trim();
  if (/^https?:\/\//i.test(path)) return path;
  const system =
    systems.find((s) => s.key === endpoint.system_key) ?? systems.find((s) => s.is_active) ?? systems[0];
  if (!system) return path || "—";
  const base = system.base_url.replace(/\/+$/, "");
  const resolved = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (system.sap_client && !resolved.searchParams.has("sap-client")) {
    resolved.searchParams.set("sap-client", system.sap_client);
  }
  return resolved.toString();
}

type SyncRunResult = {
  status: "synced" | "skipped" | "error";
  message: string;
  received: number;
  inserted: number;
  updated: number;
  skipped: number;
  durationMs: number;
  httpStatus: number | null;
  preview: string | null;
};

const UPSERT_BATCH = 500;
const EXISTING_KEY_BATCH = 40;

/**
 * Static build only: the call -> parse -> upsert round trip runs in the
 * browser, hitting the middleware through the same-origin `/sap-mw/` bridge.
 * Mirrors the server pull, including the truncated-payload salvage.
 */
async function runEndpointSyncBrowser(endpointName: string): Promise<SyncRunResult> {
  const empty = { received: 0, inserted: 0, updated: 0, skipped: 0, preview: null, httpStatus: null };
  const started = Date.now();
  const fail = (message: string, extra: Partial<SyncRunResult> = {}): SyncRunResult => ({
    status: "error",
    message,
    ...empty,
    durationMs: Date.now() - started,
    ...extra,
  });

  const { data: endpoint } = await supabase
    .from("sap_endpoints")
    .select("name, endpoint_path, system_key, http_method, auth_type, query_params, headers, body_template, is_active")
    .eq("name", endpointName)
    .maybeSingle();
  if (!endpoint) return fail(`Endpoint ${endpointName} is not configured`);
  if (!endpoint.is_active) {
    return { status: "skipped", message: "Endpoint is inactive", ...empty, durationMs: 0 };
  }

  const { data: system } = endpoint.system_key
    ? await supabase.from("sap_systems").select("key, base_url, sap_client").eq("key", endpoint.system_key).maybeSingle()
    : await supabase.from("sap_systems").select("key, base_url, sap_client").eq("is_active", true).limit(1).maybeSingle();

  const outbound = {
    systemKey: system?.key ?? null,
    baseUrl: system?.base_url ?? null,
    sapClient: system?.sap_client ?? null,
    path: endpoint.endpoint_path,
    method: endpoint.http_method,
    authType: endpoint.auth_type,
    query: keyValueObject(endpoint.query_params),
    headers: keyValueObject(endpoint.headers),
    body: withPostingDates(endpoint.body_template),
  };

  const startedAt = new Date(started).toISOString();
  const { data: openedRun, error: openRunError } = await supabase.rpc(
    "start_sync_run",
    {
      _endpoint: endpointName,
      _started_at: startedAt,
      _request_snapshot: outbound,
    },
  );
  if (openRunError) return fail(`Could not record sync run: ${openRunError.message}`);
  const runId = openedRun;
  const finish = async (values: {
    status: "success" | "error" | "skipped";
    received?: number;
    inserted?: number;
    updated?: number;
    skipped?: number;
    bytes?: number;
    durationMs?: number;
    httpStatus?: number | null;
    message?: string | null;
  }) => {
    if (!runId) return;
    const { error } = await supabase.rpc("finish_sync_run", {
      _run_id: runId,
      _status: values.status,
      _records_received: values.received ?? 0,
      _records_inserted: values.inserted ?? 0,
      _records_updated: values.updated ?? 0,
      _records_skipped: values.skipped ?? 0,
      _response_bytes: values.bytes ?? 0,
      _duration_ms: values.durationMs ?? Date.now() - started,
      _http_status: values.httpStatus ?? null,
      _message: values.message ?? null,
    });
    if (error) throw new Error(`Could not finish sync run: ${error.message}`);
  };

  let response: Response;
  try {
    response = await fetch(`${STATIC_MIDDLEWARE_BASE}/sap/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(outbound),
      signal: AbortSignal.timeout(600000),
    });
  } catch (err) {
    const message = `Middleware unreachable (${err instanceof Error ? err.message : "fetch failed"}) — SAP was not contacted`;
    await finish({ status: "error", message });
    return fail(message);
  }

  const text = await response.text();
  const bytes = new TextEncoder().encode(text).length;
  const durationMs = Date.now() - started;
  let envelope: Record<string, unknown> = {};
  try {
    envelope = JSON.parse(text) as Record<string, unknown>;
  } catch {
    envelope = {};
  }

  if (!response.ok) {
    const detail = typeof envelope["message"] === "string" ? (envelope["message"] as string) : "";
    const hop = `Middleware returned HTTP ${response.status}`;
    const message = detail ? `${hop}: ${detail}` : hop;
    await finish({ status: "error", message, bytes, durationMs, httpStatus: response.status });
    return fail(message, { durationMs, httpStatus: response.status });
  }

  const bodyText =
    (typeof envelope["body"] === "string" ? (envelope["body"] as string) : extractEmbeddedBody(text)) ?? text;
  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    const salvaged = salvageTruncatedArray(bodyText);
    if (!salvaged) {
      const preview = bodyText.slice(0, 200).replace(/\s+/g, " ");
      const message = `SAP returned ${formatBytes(bytes)} that could not be parsed as JSON — starts with: ${preview}`;
      await finish({ status: "error", message, bytes, durationMs, httpStatus: response.status });
      return fail(message, {
        durationMs,
        httpStatus: response.status,
        preview,
      });
    }
    payload = salvaged;
  }

  const { received, rows, skipped } = mapPayload(payload, endpointName);
  const preview = bodyText.slice(0, 4000);
  if (!rows.length) {
    let from = "";
    let to = "";
    try {
      const requestBody = JSON.parse(outbound.body ?? "{}") as Record<string, unknown>;
      from = String(requestBody["BUDAT_F"] ?? "");
      to = String(requestBody["BUDAT_T"] ?? "");
    } catch {
      // Preserve a useful no-data message for non-JSON request bodies.
    }
    const displayDate = (value: string) =>
      /^\d{8}$/.test(value) ? `${value.slice(6, 8)}-${value.slice(4, 6)}-${value.slice(0, 4)}` : value;
    const range = from && to ? ` (${displayDate(from)} to ${displayDate(to)})` : "";
    const message = received
      ? "No mappable rows in the SAP response — existing data left unchanged"
      : `No data available for this selection${range}`;
    await finish({ status: "success", received, skipped, bytes, durationMs, httpStatus: response.status, message });
    return {
      status: "synced",
      message,
      received,
      inserted: 0,
      updated: 0,
      skipped,
      durationMs,
      httpStatus: response.status,
      preview,
    };
  }

  try {
    const keys = rows.map((r) => r.record_key);
    const existing = new Set<string>();
    for (let i = 0; i < keys.length; i += EXISTING_KEY_BATCH) {
      const { data, error } = await supabase
        .from("zfisales_detail")
        .select("record_key")
        .in("record_key", keys.slice(i, i + EXISTING_KEY_BATCH));
      if (error) throw error;
      for (const r of data ?? []) existing.add(r.record_key);
    }
    for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
      const { error } = await supabase
        .from("zfisales_detail")
        .upsert(rows.slice(i, i + UPSERT_BATCH) as never, { onConflict: "record_key" });
      if (error) throw error;
    }
    const updated = rows.filter((r) => existing.has(r.record_key)).length;
    const inserted = rows.length - updated;
    const message = `Data synced successfully — ${received.toLocaleString()} records (${inserted.toLocaleString()} new, ${updated.toLocaleString()} updated)`;
    await finish({
      status: "success",
      received,
      inserted,
      updated,
      skipped,
      bytes,
      durationMs,
      httpStatus: response.status,
      message,
    });
    const now = new Date().toISOString();
    await supabase
      .from("sap_endpoints")
      .update({
        ...(inserted + updated > 0 ? { last_synced_at: now } : {}),
        last_run_at: now,
        last_run_status: "success",
      })
      .eq("name", endpointName);
    return {
      status: "synced",
      message,
      received,
      inserted,
      updated,
      skipped,
      durationMs,
      httpStatus: response.status,
      preview,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upsert failed";
    await finish({ status: "error", received, skipped, bytes, durationMs, httpStatus: response.status, message });
    return fail(message, { durationMs, httpStatus: response.status, preview });
  }
}

export async function testSapEndpoint(endpoint: SapEndpoint, systems: SapSystem[]): Promise<TestResult> {
  await requireSuperAdmin();
  const query = Object.fromEntries(endpoint.query_params.map((row) => [row.key, row.value]));
  const headers = Object.fromEntries(endpoint.headers.map((row) => [row.key, row.value]));
  let parsedBody: unknown = endpoint.body_template ?? undefined;
  try {
    if (endpoint.body_template) parsedBody = JSON.parse(endpoint.body_template);
  } catch {
    parsedBody = endpoint.body_template;
  }
  const outbound: OutboundRequest = {
    url: resolveEndpointUrl(endpoint, systems),
    method: endpoint.http_method,
    query,
    headers,
    body: parsedBody,
  };
  // Visible in the browser console so the exact payload can be inspected.
  console.info("[SAP request]", endpoint.name, outbound);

  // The whole round trip runs on the portal server: middleware -> parse ->
  // upsert. Multi-MB SAP responses never travel through the browser.
  const started = Date.now();
  const run = IS_STATIC_BUILD
    ? await runEndpointSyncBrowser(endpoint.name)
    : await runEndpointSyncServer({ data: { endpointName: endpoint.name } });
  console.info("[SAP response]", endpoint.name, { status: run.status, durationMs: run.durationMs });

  const durationMs = run.durationMs ?? Date.now() - started;
  const ok = run.status === "synced";
  const noData = ok && run.received === 0;
  const message = ok
    ? run.message || `Data synced successfully — ${run.received.toLocaleString()} records (${run.inserted.toLocaleString()} new, ${run.updated.toLocaleString()} updated)`
    : run.message;

  await supabase
    .from("sap_endpoints")
    .update({
      last_test_status: ok ? "ok" : "error",
      last_test_message: message,
      last_test_duration_ms: durationMs,
      ...(run.preview ? { sample_response: run.preview } : {}),
    })
    .eq("id", endpoint.id);

  return {
    ok,
    status: run.httpStatus ?? null,
    message,
    durationMs,
    stage: ok ? "ok" : "unknown",
    sapStatus: run.httpStatus ?? null,
    sapContacted: run.httpStatus != null && run.httpStatus !== 404,
    request: outbound,
    noData,
    ...(run.preview ? { body: run.preview } : {}),
  };
}


export type SyncRun = {
  id: string;
  endpoint: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  records_received: number;
  records_inserted: number;
  records_updated: number;
  records_skipped: number;
  response_bytes: number;
  duration_ms: number;
  http_status: number | null;
  error_message: string | null;
  request_snapshot: unknown;
};

/** Newest run per endpoint, keyed by endpoint name — drives the card badges. */
export async function listLatestRuns(): Promise<Record<string, SyncRun>> {
  const { data, error } = await supabase
    .from("sap_sync_runs")
    .select(
      "id, endpoint, status, started_at, finished_at, records_received, records_inserted, records_updated, records_skipped, response_bytes, duration_ms, http_status, error_message, request_snapshot",
    )
    .order("started_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const latest: Record<string, SyncRun> = {};
  for (const row of (data ?? []) as SyncRun[]) {
    if (!latest[row.endpoint]) latest[row.endpoint] = row;
  }
  return latest;
}

/** Recent sync runs for an endpoint — used for the Scheduler health panel. */

export async function listSyncRuns(endpointName: string, limit = 10): Promise<SyncRun[]> {
  const { data, error } = await supabase
    .from("sap_sync_runs")
    .select(
      "id, endpoint, status, started_at, finished_at, records_received, records_inserted, records_updated, records_skipped, response_bytes, duration_ms, http_status, error_message, request_snapshot",
    )
    .eq("endpoint", endpointName)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SyncRun[];
}


/**
 * Runs one full sync for an endpoint on the server (Sharvi Admin only):
 * middleware call, JSON parse and batched upsert. Only a small preview of the
 * response is returned, so large payloads never cross the RPC boundary.
 */
const runEndpointSyncServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { endpointName: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
    if (error || !isAdmin) throw new Error("Forbidden: Sharvi Admin role required");

    const { pullSapEndpoint } = await import("@/lib/sap-pull.server");
    const result = await pullSapEndpoint(data.endpointName);

    if (result.status === "synced") {
      return {
        status: "synced" as const,
        message: "",
        received: result.received,
        inserted: result.inserted,
        updated: result.updated,
        skipped: result.skipped,
        durationMs: result.durationMs ?? 0,
        httpStatus: result.httpStatus ?? null,
        preview: result.preview ?? null,
      };
    }
    if (result.status === "skipped") {
      return {
        status: "skipped" as const,
        message: result.reason,
        received: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        durationMs: 0,
        httpStatus: null,
        preview: null,
      };
    }
    return {
      status: "error" as const,
      message: result.message,
      received: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      durationMs: result.durationMs ?? 0,
      httpStatus: result.httpStatus ?? null,
      preview: result.preview ?? null,
    };
  });


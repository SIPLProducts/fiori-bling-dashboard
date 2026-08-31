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
  return data.id;
}

export async function updateSapEndpoint(id: string, input: EndpointInput): Promise<void> {
  await requireSuperAdmin();
  const { error } = await supabase.from("sap_endpoints").update(endpointPayload(input)).eq("id", id);
  if (error) throw error;
}

export async function deleteSapEndpoint(id: string): Promise<void> {
  await requireSuperAdmin();
  const { error } = await supabase.from("sap_endpoints").delete().eq("id", id);
  if (error) throw error;
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

async function callMiddleware(path: string, body?: unknown): Promise<TestResult> {
  const started = Date.now();
  try {
    const res = await callMiddlewareServer({ data: { path, body } });
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

export async function testSapEndpoint(endpoint: SapEndpoint, systems: SapSystem[]): Promise<TestResult> {
  await requireSuperAdmin();
  const system = systems.find((s) => s.key === endpoint.system_key) ?? systems.find((s) => s.is_active);
  const result = await callMiddleware("/sap/call", {
    systemKey: system?.key ?? null,
    baseUrl: system?.base_url ?? null,
    sapClient: system?.sap_client ?? null,
    path: endpoint.endpoint_path,
    method: endpoint.http_method,
    authType: endpoint.auth_type,
    query: Object.fromEntries(endpoint.query_params.map((row) => [row.key, row.value])),
    headers: Object.fromEntries(endpoint.headers.map((row) => [row.key, row.value])),
    body: endpoint.body_template ?? undefined,
  });

  await supabase
    .from("sap_endpoints")
    .update({
      last_test_status: result.ok ? "ok" : "error",
      last_test_message: result.message,
      last_test_duration_ms: result.durationMs,
      last_synced_at: result.ok ? new Date().toISOString() : endpoint.last_synced_at,
      sample_response: result.body ?? endpoint.sample_response,
    })
    .eq("id", endpoint.id);
  return result;
}

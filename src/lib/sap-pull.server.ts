/**
 * Server-only: pull a SAP endpoint through the Node.js middleware and upsert
 * the rows into `zfisales_detail`. Shared by the manual fetch on the SAP API
 * screen and by the scheduled 10-minute job.
 */
import { mapPayload } from "./zfisales-sync.server";

const BATCH = 500;

/**
 * Recovers the complete objects of a JSON array that was cut mid-document
 * (an older middleware build truncates responses). Returns null when the text
 * is not a truncated array or nothing usable survives.
 */
function salvageTruncatedArray(text: string): unknown[] | null {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("[")) return null;
  const cut = trimmed.lastIndexOf("},");
  if (cut < 0) return null;
  try {
    const rows = JSON.parse(`${trimmed.slice(0, cut + 1)}]`) as unknown[];
    return Array.isArray(rows) && rows.length ? rows : null;
  } catch {
    return null;
  }
}


/** How many sync runs are kept per endpoint; older rows are deleted. */
const RUN_HISTORY_LIMIT = 6;

export type SyncCounts = { received: number; inserted: number; updated: number; skipped: number };

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type RunMetrics = { responseBytes?: number; durationMs?: number; httpStatus?: number };

/** Maps a SAP payload and upserts it into zfisales_detail, logging the run. */
export async function storeZfisalesPayload(
  payload: unknown,
  endpointName: string,
  requestSnapshot?: unknown,
  metrics: RunMetrics = {},
): Promise<SyncCounts> {
  const db = await admin();
  const startedAt = new Date().toISOString();
  const { received, rows, skipped } = mapPayload(payload, endpointName);

  const { data: run } = await db
    .from("sap_sync_runs")
    .insert({
      endpoint: endpointName,
      status: "running",
      started_at: startedAt,
      records_received: received,
      records_skipped: skipped,
      response_bytes: metrics.responseBytes ?? 0,
      duration_ms: metrics.durationMs ?? 0,
      ...(metrics.httpStatus === undefined ? {} : { http_status: metrics.httpStatus }),
      ...(requestSnapshot === undefined ? {} : { request_snapshot: requestSnapshot as never }),
    })
    .select("id")
    .single();


  const finish = async (patch: Record<string, unknown>) => {
    if (run?.id) {
      await db
        .from("sap_sync_runs")
        .update({ finished_at: new Date().toISOString(), ...patch })
        .eq("id", run.id);
    }
    await pruneRuns(endpointName);
  };


  try {
    if (!rows.length) {
      // Nothing usable came back — existing rows are left untouched, never deleted.
      await finish({
        status: "success",
        error_message: received
          ? "No mappable rows in the SAP response — existing data left unchanged"
          : "No data returned — existing data left unchanged",
      });
      return { received, inserted: 0, updated: 0, skipped };
    }


    const keys = rows.map((r) => r.record_key);
    const existing = new Set<string>();
    for (let i = 0; i < keys.length; i += BATCH) {
      const { data, error } = await db
        .from("zfisales_detail")
        .select("record_key")
        .in("record_key", keys.slice(i, i + BATCH));
      if (error) throw error;
      for (const r of data ?? []) existing.add(r.record_key);
    }

    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await db
        .from("zfisales_detail")
        .upsert(rows.slice(i, i + BATCH) as never, { onConflict: "record_key" });
      if (error) throw error;
    }

    const updated = rows.filter((r) => existing.has(r.record_key)).length;
    const inserted = rows.length - updated;
    await finish({ status: "success", records_inserted: inserted, records_updated: updated });
    return { received, inserted, updated, skipped };
  } catch (err) {
    await finish({ status: "error", error_message: err instanceof Error ? err.message : "Upsert failed" });
    throw err;
  }
}

/** True when another run is still in flight (single-flight guard). */
async function runInProgress(endpointName: string): Promise<boolean> {
  const db = await admin();
  const since = new Date(Date.now() - 9 * 60 * 1000).toISOString();
  const { data } = await db
    .from("sap_sync_runs")
    .select("id")
    .eq("endpoint", endpointName)
    .eq("status", "running")
    .gte("started_at", since)
    .limit(1);
  return (data ?? []).length > 0;
}

/** Keeps only the newest `keep` runs for an endpoint; older rows are deleted. */
async function pruneRuns(endpointName: string, keep = RUN_HISTORY_LIMIT): Promise<void> {
  try {
    const db = await admin();
    const { data } = await db
      .from("sap_sync_runs")
      .select("id")
      .eq("endpoint", endpointName)
      .order("started_at", { ascending: false })
      .range(keep, keep + 500);
    const stale = (data ?? []).map((r) => r.id);
    if (stale.length) await db.from("sap_sync_runs").delete().in("id", stale);
  } catch {
    // History pruning must never break a sync.
  }
}

export type RunOutcome = { httpStatus?: number; durationMs?: number; bytes?: number; preview?: string };

export type PullResult =
  | ({ status: "synced" } & SyncCounts & RunOutcome)
  | { status: "skipped"; reason: string }
  | ({ status: "error"; message: string } & RunOutcome);


/** Calls the middleware for the given endpoint and stores the response. */
export async function pullSapEndpoint(endpointName: string): Promise<PullResult> {
  if (await runInProgress(endpointName)) {
    const reason = "A sync is already running — this scheduled attempt was skipped";
    await logSkipped(endpointName, reason);
    return { status: "skipped", reason };
  }

  const db = await admin();
  const secret = process.env["MIDDLEWARE_SHARED_SECRET"];
  if (!secret) return { status: "error", message: "MIDDLEWARE_SHARED_SECRET is not configured" };

  const { data: endpoint } = await db
    .from("sap_endpoints")
    .select("name, endpoint_path, system_key, http_method, auth_type, query_params, headers, body_template, is_active")
    .eq("name", endpointName)
    .maybeSingle();
  if (!endpoint) return { status: "error", message: `Endpoint ${endpointName} is not configured` };
  if (!endpoint.is_active) return { status: "skipped", reason: "Endpoint is inactive" };

  const { data: config } = await db.from("sap_middleware_config").select("middleware_url").limit(1).maybeSingle();
  const base = config?.middleware_url?.trim().replace(/\/+$/, "");
  if (!base) return { status: "error", message: "Middleware URL is not configured" };

  const { data: system } = endpoint.system_key
    ? await db.from("sap_systems").select("key, base_url, sap_client").eq("key", endpoint.system_key).maybeSingle()
    : await db.from("sap_systems").select("key, base_url, sap_client").eq("is_active", true).limit(1).maybeSingle();

  /** Never send an empty posting-date window: default To = today, From = today − 7 days. */
  const withPostingDates = (raw: string | null | undefined): string | undefined => {
    if (!raw || !raw.trim()) return raw ?? undefined;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return raw;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
    const obj = parsed as Record<string, unknown>;
    const sapDate = (daysAgo: number) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    };
    const valid = (v: unknown) => /^\d{8}$/.test(String(v ?? "").trim());
    if ("BUDAT_F" in obj && !valid(obj["BUDAT_F"])) obj["BUDAT_F"] = sapDate(7);
    if ("BUDAT_T" in obj && !valid(obj["BUDAT_T"])) obj["BUDAT_T"] = sapDate(0);
    return JSON.stringify(obj);
  };

  const toObject = (raw: unknown) =>
    Array.isArray(raw)
      ? Object.fromEntries(
          (raw as { key?: unknown; value?: unknown }[])
            .filter((r) => r && typeof r === "object" && String(r.key ?? "").trim())
            .map((r) => [String(r.key), String(r.value ?? "")]),
        )
      : {};

  const outbound = {
    middlewareUrl: `${base}/sap/call`,
    systemKey: system?.key ?? null,
    baseUrl: system?.base_url ?? null,
    sapClient: system?.sap_client ?? null,
    path: endpoint.endpoint_path,
    method: endpoint.http_method,
    authType: endpoint.auth_type,
    query: toObject(endpoint.query_params),
    headers: toObject(endpoint.headers),
    body: withPostingDates(endpoint.body_template),
  };

  const startedMs = Date.now();
  const size = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

  /** One call to the middleware, returning the raw text plus metrics. */
  const callMiddleware = async (): Promise<
    | { ok: true; response: Response; text: string; bytes: number }
    | { ok: false; message: string; retryable: boolean }
  > => {
    let response: Response;
    try {
      response = await fetch(`${base}/sap/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-shared-secret": secret },
        body: JSON.stringify(outbound),
        // Large report windows can take minutes to stream back from SAP.
        signal: AbortSignal.timeout(300000),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "fetch failed";
      return {
        ok: false,
        retryable: true,
        message: `Middleware/tunnel unreachable (${reason}) — SAP was not contacted`,
      };
    }

    // Read as a stream so multi-MB SAP responses are not truncated.
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    return { ok: true, response, text, bytes: buffer.byteLength };
  };

  let attempt = await callMiddleware();
  if (!attempt.ok && attempt.retryable) {
    await new Promise((r) => setTimeout(r, 3000));
    attempt = await callMiddleware();
  }
  if (!attempt.ok) {
    const durationMs = Date.now() - startedMs;
    await logFailure(endpointName, attempt.message, outbound, { durationMs });
    return { status: "error", message: attempt.message, durationMs, bytes: 0 };
  }


  let { response, text, bytes } = attempt;

  // A 404/502 here is the tunnel or middleware, never SAP — retry once for reconnects.
  if (!response.ok && [404, 502, 503, 504].includes(response.status)) {
    await new Promise((r) => setTimeout(r, 3000));
    const retry = await callMiddleware();
    if (retry.ok) ({ response, text, bytes } = retry);
  }

  const durationMs = Date.now() - startedMs;
  let envelope: Record<string, unknown> = {};
  try {
    envelope = JSON.parse(text) as Record<string, unknown>;
  } catch {
    envelope = {};
  }

  if (!response.ok) {
    const detail = typeof envelope["message"] === "string" ? (envelope["message"] as string) : "";
    const hop = [404, 502, 503, 504].includes(response.status)
      ? `Middleware/tunnel returned ${response.status} at ${base}/sap/call — SAP was not contacted (tunnel URL may be stale or the middleware is not running)`
      : `Middleware returned HTTP ${response.status} at ${base}/sap/call`;
    const message = detail ? `${hop}: ${detail}` : hop;
    await logFailure(endpointName, message, outbound, {
      durationMs,
      responseBytes: bytes,
      httpStatus: response.status,
    });
    return { status: "error", message, durationMs, bytes, httpStatus: response.status };
  }

  const bodyText = typeof envelope["body"] === "string" ? (envelope["body"] as string) : text;
  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    // An older middleware build cuts the body mid-document. Salvage every
    // complete object of a truncated JSON array instead of losing the run.
    const salvaged = salvageTruncatedArray(bodyText);
    if (salvaged) {
      payload = salvaged;
    } else {
      const ctype = typeof envelope["contentType"] === "string" ? ` (content-type ${envelope["contentType"]})` : "";
      const preview = bodyText.slice(0, 200).replace(/\s+/g, " ");
      const message = `SAP returned ${size(bytes)}${ctype} that could not be parsed as JSON — starts with: ${preview}`;
      await logFailure(endpointName, message, outbound, {
        durationMs,
        responseBytes: bytes,
        httpStatus: response.status,
      });
      return { status: "error", message, durationMs, bytes, httpStatus: response.status, preview };
    }
  }


  const counts = await storeZfisalesPayload(payload, endpointName, outbound, {
    durationMs,
    responseBytes: bytes,
    httpStatus: response.status,
  });
  const now = new Date().toISOString();
  await db
    .from("sap_endpoints")
    .update({
      // Only move the synced stamp when rows were actually written.
      ...(counts.inserted + counts.updated > 0 ? { last_synced_at: now } : {}),
      last_run_at: now,
      last_run_status: "success",
    })
    .eq("name", endpointName);
  return {
    status: "synced",
    ...counts,
    durationMs,
    bytes,
    httpStatus: response.status,
    // Small excerpt only — the full body is never returned to the browser.
    preview: bodyText.slice(0, 4000),
  };
}


async function logFailure(
  endpointName: string,
  message: string,
  requestSnapshot?: unknown,
  metrics: RunMetrics = {},
) {
  const db = await admin();
  const now = new Date().toISOString();
  await db.from("sap_sync_runs").insert({
    endpoint: endpointName,
    status: "error",
    started_at: now,
    finished_at: now,
    error_message: message,
    response_bytes: metrics.responseBytes ?? 0,
    duration_ms: metrics.durationMs ?? 0,
    ...(metrics.httpStatus === undefined ? {} : { http_status: metrics.httpStatus }),
    ...(requestSnapshot === undefined ? {} : { request_snapshot: requestSnapshot as never }),
  });

  await db
    .from("sap_endpoints")
    .update({ last_run_at: now, last_run_status: "error" })
    .eq("name", endpointName);

  await pruneRuns(endpointName);
}

/** Records a scheduled attempt that could not start, so the history stays honest. */
async function logSkipped(endpointName: string, message: string) {
  const db = await admin();
  const now = new Date().toISOString();
  await db.from("sap_sync_runs").insert({
    endpoint: endpointName,
    status: "skipped",
    started_at: now,
    finished_at: now,
    error_message: message,
  });
  await pruneRuns(endpointName);
}

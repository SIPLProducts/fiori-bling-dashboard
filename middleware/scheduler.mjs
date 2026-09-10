/**
 * On-prem scheduler for the MIS portal.
 *
 * The self-hosted portal is a static SPA behind Nginx, so there is no always
 * running app server to receive a database timer. This module gives the
 * middleware (which does run 24/7 under PM2) its own scheduler.
 *
 * Everything it does is driven by what is saved in the portal screens:
 * endpoint path, method, payload, SAP system/client, active flag, the
 * "Enable scheduled sync" switch and the cron expression are all re-read from
 * the database on every tick. Nothing about the schedule is fixed in code.
 */
import { createClient } from "@supabase/supabase-js";
import {
  mapPayload,
  extractEmbeddedBody,
  salvageTruncatedArray,
  withPostingDates,
  keyValueObject,
  formatBytes,
} from "./sync-core.mjs";

const BATCH = 500;
const RUN_HISTORY_LIMIT = 6;
/** A run older than this is treated as dead, so a crash cannot block forever. */
const STALE_RUN_MS = 30 * 60 * 1000;

/* ------------------------------ cron matching ----------------------------- */

/** Matches one cron field (`*`, `5`, `1-5`, `*\/10`, `1,3,5`) against a value. */
function fieldMatches(field, value) {
  return String(field)
    .split(",")
    .some((part) => {
      const [rangePart, stepPart] = part.split("/");
      const step = stepPart ? Number(stepPart) : 1;
      if (!Number.isFinite(step) || step < 1) return false;
      if (rangePart === "*" || rangePart === "") return value % step === 0;
      const [fromRaw, toRaw] = rangePart.split("-");
      const from = Number(fromRaw);
      const to = toRaw === undefined ? from : Number(toRaw);
      if (!Number.isFinite(from) || !Number.isFinite(to)) return false;
      if (value < Math.min(from, to) || value > Math.max(from, to)) return false;
      return (value - Math.min(from, to)) % step === 0;
    });
}

/** True when a 5-field cron expression is due at the given local time. */
export function cronMatches(expression, date = new Date()) {
  const fields = String(expression || "")
    .trim()
    .split(/\s+/);
  if (fields.length !== 5) return false;
  const [min, hour, dom, mon, dow] = fields;
  const weekday = date.getDay();
  return (
    fieldMatches(min, date.getMinutes()) &&
    fieldMatches(hour, date.getHours()) &&
    fieldMatches(dom, date.getDate()) &&
    fieldMatches(mon, date.getMonth() + 1) &&
    (fieldMatches(dow, weekday) || (weekday === 0 && fieldMatches(dow, 7)))
  );
}

/* --------------------------------- helpers -------------------------------- */

function minuteKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
}

/* -------------------------------- scheduler ------------------------------- */

export function createScheduler({ callSap, resolveSystem, logLine, newTraceId }) {
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const enabled = Boolean(url && key);
  const db = enabled
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

  /** Endpoint names currently being synced by this process. */
  const inFlight = new Set();
  /** Last minute an endpoint was fired, so one tick cannot double-fire it. */
  const lastFired = new Map();

  async function pruneRuns(endpoint) {
    try {
      const { data } = await db
        .from("sap_sync_runs")
        .select("id")
        .eq("endpoint", endpoint)
        .order("started_at", { ascending: false })
        .range(RUN_HISTORY_LIMIT, RUN_HISTORY_LIMIT + 500);
      const stale = (data ?? []).map((r) => r.id);
      if (stale.length) await db.from("sap_sync_runs").delete().in("id", stale);
    } catch {
      /* history pruning must never break a sync */
    }
  }

  async function startRun(endpoint, snapshot) {
    const { data } = await db
      .from("sap_sync_runs")
      .insert({
        endpoint,
        status: "running",
        started_at: new Date().toISOString(),
        request_snapshot: snapshot ?? null,
      })
      .select("id")
      .single();
    return data?.id ?? null;
  }

  async function finishRun(runId, endpoint, patch) {
    if (runId) {
      await db
        .from("sap_sync_runs")
        .update({ finished_at: new Date().toISOString(), ...patch })
        .eq("id", runId);
    }
    await db
      .from("sap_endpoints")
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: patch.status === "success" ? "success" : patch.status,
      })
      .eq("name", endpoint);
    await pruneRuns(endpoint);
  }

  /** True when another run for this endpoint is still marked running. */
  async function runInProgress(endpoint) {
    const since = new Date(Date.now() - STALE_RUN_MS).toISOString();
    const { data } = await db
      .from("sap_sync_runs")
      .select("id")
      .eq("endpoint", endpoint)
      .eq("status", "running")
      .gte("started_at", since)
      .limit(1);
    return (data ?? []).length > 0;
  }

  /** Maps the SAP payload and writes it to zfisales_detail. */
  async function storeRows(payload, endpoint) {
    const { received, rows, skipped } = mapPayload(payload, endpoint);
    if (!rows.length) return { received, inserted: 0, updated: 0, skipped };

    const keys = rows.map((r) => r.record_key);
    const existing = new Set();
    for (let i = 0; i < keys.length; i += BATCH) {
      const { data, error } = await db
        .from("zfisales_detail")
        .select("record_key")
        .in("record_key", keys.slice(i, i + BATCH));
      if (error) throw new Error(error.message);
      for (const r of data ?? []) existing.add(r.record_key);
    }
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await db
        .from("zfisales_detail")
        .upsert(rows.slice(i, i + BATCH), { onConflict: "record_key" });
      if (error) throw new Error(error.message);
    }
    const updated = rows.filter((r) => existing.has(r.record_key)).length;
    return { received, inserted: rows.length - updated, updated, skipped };
  }

  /**
   * Runs one endpoint end to end: reads its saved configuration, calls SAP,
   * stores the rows and records the run. Used by the tick and by the manual
   * trigger endpoint.
   */
  async function runEndpoint(endpointName, { manual = false } = {}) {
    if (!enabled) return { status: "error", message: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured" };
    if (inFlight.has(endpointName)) return { status: "skipped", reason: "Already running in this process" };
    inFlight.add(endpointName);
    const traceId = newTraceId();
    const startedMs = Date.now();
    let runId = null;
    let snapshot = null;
    try {
      const { data: endpoint, error } = await db
        .from("sap_endpoints")
        .select(
          "name, endpoint_path, system_key, http_method, query_params, headers, body_template, is_active",
        )
        .eq("name", endpointName)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!endpoint) return { status: "error", message: `Endpoint ${endpointName} is not configured` };
      if (!endpoint.is_active) return { status: "skipped", reason: "Endpoint is inactive" };

      if (!manual && (await runInProgress(endpointName))) {
        return { status: "skipped", reason: "A previous run is still in progress" };
      }

      const { data: systemRow } = endpoint.system_key
        ? await db
            .from("sap_systems")
            .select("key, base_url, sap_client")
            .eq("key", endpoint.system_key)
            .maybeSingle()
        : await db
            .from("sap_systems")
            .select("key, base_url, sap_client")
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();

      const system = resolveSystem({
        systemKey: systemRow?.key ?? endpoint.system_key ?? "dev",
        baseUrl: systemRow?.base_url ?? undefined,
        sapClient: systemRow?.sap_client ?? undefined,
      });

      const bodyText = withPostingDates(endpoint.body_template);
      snapshot = {
        source: manual ? "middleware-manual" : "middleware-scheduler",
        systemKey: system.key,
        baseUrl: system.baseUrl,
        sapClient: system.client,
        path: endpoint.endpoint_path,
        method: endpoint.http_method,
        query: keyValueObject(endpoint.query_params),
        headers: keyValueObject(endpoint.headers),
        body: bodyText ?? null,
      };
      runId = await startRun(endpointName, snapshot);

      const result = await callSap({
        traceId,
        system,
        path: endpoint.endpoint_path,
        method: String(endpoint.http_method || "GET").toUpperCase(),
        query: snapshot.query,
        headers: snapshot.headers,
        body: bodyText,
      });

      const bytes = Buffer.byteLength(result.body ?? "", "utf8");
      const durationMs = Date.now() - startedMs;

      if (!result.ok) {
        const message = `SAP answered HTTP ${result.status} — no data was stored`;
        await finishRun(runId, endpointName, {
          status: "error",
          error_message: message,
          response_bytes: bytes,
          duration_ms: durationMs,
          http_status: result.status,
        });
        return { status: "error", message, httpStatus: result.status };
      }

      const text = result.body ?? "";
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = salvageTruncatedArray(text) ?? salvageTruncatedArray(extractEmbeddedBody(text) ?? "");
        if (!payload) {
          const preview = text.slice(0, 200).replace(/\s+/g, " ");
          const message = `SAP returned ${formatBytes(bytes)} that could not be parsed as JSON — starts with: ${preview}`;
          await finishRun(runId, endpointName, {
            status: "error",
            error_message: message,
            response_bytes: bytes,
            duration_ms: durationMs,
            http_status: result.status,
          });
          return { status: "error", message };
        }
      }

      const counts = await storeRows(payload, endpointName);
      await finishRun(runId, endpointName, {
        status: "success",
        records_received: counts.received,
        records_inserted: counts.inserted,
        records_updated: counts.updated,
        records_skipped: counts.skipped,
        response_bytes: bytes,
        duration_ms: Date.now() - startedMs,
        http_status: result.status,
        error_message: counts.received
          ? null
          : "No data returned — existing data left unchanged",
      });
      if (counts.inserted + counts.updated > 0) {
        await db
          .from("sap_endpoints")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("name", endpointName);
      }
      logLine(
        `[${traceId}] sync ${endpointName}: received ${counts.received}, new ${counts.inserted}, updated ${counts.updated}`,
      );
      return { status: "synced", ...counts };
    } catch (err) {
      const message = err?.message ?? String(err);
      logLine(`[${traceId}] sync ${endpointName} failed: ${message}`);
      try {
        await finishRun(runId, endpointName, {
          status: "error",
          error_message: message,
          duration_ms: Date.now() - startedMs,
        });
      } catch {
        /* the failure itself must not throw */
      }
      return { status: "error", message };
    } finally {
      inFlight.delete(endpointName);
    }
  }

  /** One minute tick: re-reads the saved schedules and fires the due ones. */
  async function tick() {
    if (!enabled) return;
    const now = new Date();
    const stamp = minuteKey(now);
    try {
      const { data, error } = await db
        .from("sap_endpoints")
        .select("name, schedule_expression, scheduler_enabled, is_active");
      if (error) throw new Error(error.message);
      for (const row of data ?? []) {
        if (!row.scheduler_enabled || !row.is_active) continue;
        const expression = String(row.schedule_expression || "").trim();
        if (!expression || !cronMatches(expression, now)) continue;
        if (lastFired.get(row.name) === stamp) continue;
        lastFired.set(row.name, stamp);
        logLine(`scheduler: ${row.name} is due (${expression})`);
        runEndpoint(row.name).catch((err) => logLine(`scheduler error: ${err?.message ?? err}`));
      }
    } catch (err) {
      logLine(`scheduler tick failed: ${err?.message ?? err}`);
    }
  }

  function start() {
    if (!enabled) {
      logLine(
        "scheduler DISABLED — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in middleware/.env to enable automatic syncing",
      );
      return;
    }
    logLine("scheduler started — schedules are read from the portal every minute");
    void tick();
    // Align to the top of the next minute, then run once per minute.
    const delay = 60000 - (Date.now() % 60000);
    setTimeout(() => {
      void tick();
      setInterval(() => void tick(), 60000);
    }, delay);
  }

  return { start, tick, runEndpoint, enabled };
}

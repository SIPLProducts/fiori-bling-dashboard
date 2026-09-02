import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDateTimeISTLabel } from "@/lib/format";
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  Pencil,
  Plug,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Server,
  ShieldCheck,
  Trash2,
  CalendarClock,
} from "lucide-react";
import { CRON_PRESETS, describeCron, isValidCron, nextCronRuns } from "@/lib/cron";

/** Plain-English schedule read-out plus the next three run times in IST. */
function SchedulePreview({ expression, enabled }: { expression: string; enabled: boolean }) {
  const valid = isValidCron(expression);
  const runs = valid && enabled ? nextCronRuns(expression, 3) : [];
  return (
    <div className="rounded-sm border border-border bg-muted/40 p-3 text-xs">
      <p className={valid ? "font-medium text-card-foreground" : "font-medium text-destructive"}>
        {expression.trim() ? describeCron(expression) : "No interval set"}
      </p>
      {!enabled ? (
        <p className="mt-1 text-muted-foreground">Scheduled sync is switched off.</p>
      ) : runs.length ? (
        <ol className="mt-2 space-y-0.5 text-muted-foreground">
          {runs.map((d, i) => (
            <li key={d.toISOString()}>
              {i + 1}. {formatDateTimeISTLabel(d.toISOString())}
            </li>
          ))}
        </ol>
      ) : null}
      <p className="mt-2 text-muted-foreground">
        Saved here and applied to the background scheduler immediately — nothing is fixed in code.
      </p>
    </div>
  );
}

import { AccessDenied, ReportShell } from "@/components/report-shell";
import { useLaunchpad } from "@/lib/use-launchpad";
import {
  AUTH_TYPES,
  CONNECTION_MODES,
  DEPLOYMENT_MODES,
  ENVIRONMENTS,
  HTTP_METHODS,
  createSapEndpoint,
  deleteSapEndpoint,
  deleteSapSystem,
  fetchMiddlewareLogs,
  getMiddlewareConfig,
  listSapEndpoints,
  listSapSystems,
  listSyncRuns,
  listLatestRuns,


  listStoredCredentialKeys,
  pingSapHost,
  resolveEndpointUrl,
  saveMiddlewareConfig,
  saveSapSystem,
  testMiddleware,
  testSapEndpoint,
  testSapSystem,
  updateSapEndpoint,
  type EndpointInput,
  type KeyValue,
  type SapEndpoint,
  type SapSystem,
  type TestResult,
} from "@/lib/sap-api.functions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * One toast that says which leg of portal -> middleware -> SAP was reached,
 * so a failure can never be confused with "SAP rejected us".
 */
function reportTest(result: TestResult) {
  const trace = result.traceId ? ` · trace ${result.traceId}` : "";
  if (result.ok) {
    toast.success(`Middleware reached — SAP returned ${result.sapStatus ?? 200} in ${result.durationMs} ms${trace}`);
    return;
  }
  if (result.sapContacted) {
    toast.error(
      `SAP was reached — it answered HTTP ${result.sapStatus ?? "?"} in ${result.durationMs} ms${trace}`,
    );
    return;
  }
  toast.error(`SAP was NOT contacted — ${result.message}${trace}`);
}

/** Recent middleware activity, read straight from the service. */
function MiddlewareActivity() {
  const logsQuery = useQuery({
    queryKey: ["middleware-logs"],
    queryFn: () => fetchMiddlewareLogs(80),
    retry: false,
  });
  const lines = logsQuery.data ?? [];

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground">Recent middleware activity</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={logsQuery.isFetching}
            onClick={() => logsQuery.refetch()}
          >
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={!lines.length}
            onClick={() => {
              navigator.clipboard.writeText(lines.join("\n"));
              toast.success("Log copied");
            }}
          >
            <Copy className="size-3.5" /> Copy
          </Button>
        </div>
      </div>
      {logsQuery.isError ? (
        <p className="text-xs text-destructive">{(logsQuery.error as Error).message}</p>
      ) : (
        <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {lines.length ? lines.join("\n") : "No activity recorded yet — run Test connection."}
        </pre>
      )}
      <p className="text-xs text-muted-foreground">
        Lines starting with <span className="font-mono">-&gt; SAP</span> mean the request left the
        middleware; <span className="font-mono">&lt;-</span> is SAP&apos;s answer;{" "}
        <span className="font-mono">xx</span> means SAP was never contacted.
      </p>
    </div>
  );
}

const formatBytes = (bytes: number) => {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const formatDuration = (ms: number) => (ms ? `${(ms / 1000).toFixed(1)}s` : "—");

/** Last runs of the 10-minute scheduled sync, straight from the run log. */
function SchedulerHealth({ endpointName }: { endpointName: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const runsQuery = useQuery({
    queryKey: ["sync-runs", endpointName],
    queryFn: () => listSyncRuns(endpointName, 10),
    enabled: Boolean(endpointName),
    retry: false,
  });
  const runs = runsQuery.data ?? [];

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Scheduler health — last 10 runs</p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          disabled={runsQuery.isFetching}
          onClick={() => runsQuery.refetch()}
        >
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>
      {runs.length === 0 ? (
        <p className="text-xs text-muted-foreground">No sync run recorded yet.</p>
      ) : (
        <div className="overflow-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/70 text-left">
              <tr>
                <th className="w-8 px-2 py-2" />
                <th className="px-3 py-2 font-semibold">Started</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold text-right">Received</th>
                <th className="px-3 py-2 font-semibold text-right">New</th>
                <th className="px-3 py-2 font-semibold text-right">Updated</th>
                <th className="px-3 py-2 font-semibold text-right">Skipped</th>
                <th className="px-3 py-2 font-semibold text-right">Size</th>
                <th className="px-3 py-2 font-semibold text-right">Time</th>
                <th className="px-3 py-2 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const open = expanded === run.id;
                return (
                  <>
                    <tr
                      key={run.id}
                      className="cursor-pointer border-t border-border hover:bg-muted/40"
                      onClick={() => setExpanded(open ? null : run.id)}
                    >
                      <td className="px-2 py-2 text-muted-foreground">
                        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDateTimeISTLabel(run.started_at)}</td>
                      <td
                        className={`px-3 py-2 font-medium ${
                          run.status === "error" ? "text-destructive" : "text-card-foreground"
                        }`}
                      >
                        {run.status}
                      </td>
                      <td className="px-3 py-2 text-right">{run.records_received}</td>
                      <td className="px-3 py-2 text-right">{run.records_inserted}</td>
                      <td className="px-3 py-2 text-right">{run.records_updated}</td>
                      <td className="px-3 py-2 text-right">{run.records_skipped ?? 0}</td>
                      <td className="px-3 py-2 text-right">{formatBytes(run.response_bytes ?? 0)}</td>
                      <td className="px-3 py-2 text-right">{formatDuration(run.duration_ms ?? 0)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{run.error_message ?? "—"}</td>
                    </tr>
                    {open ? (
                      <tr key={`${run.id}-detail`} className="border-t border-border bg-muted/30">
                        <td colSpan={10} className="px-3 py-3">
                          <div className="grid gap-1 pb-2 text-[11px] text-muted-foreground sm:grid-cols-4">
                            <span>
                              HTTP status: <strong>{run.http_status ?? "—"}</strong>
                            </span>
                            <span>
                              Response size: <strong>{formatBytes(run.response_bytes ?? 0)}</strong>
                            </span>
                            <span>
                              Duration: <strong>{formatDuration(run.duration_ms ?? 0)}</strong>
                            </span>
                            <span>
                              Finished:{" "}
                              <strong>{run.finished_at ? formatDateTimeISTLabel(run.finished_at) : "—"}</strong>
                            </span>
                          </div>
                          <p className="pb-1 text-[11px] font-medium text-card-foreground">Payload sent on this run</p>
                          <pre className="max-h-56 overflow-auto rounded-md bg-background p-3 font-mono text-[11px] text-muted-foreground">
                            {run.request_snapshot
                              ? JSON.stringify(run.request_snapshot, null, 2)
                              : "No payload recorded for this run."}
                          </pre>
                        </td>
                      </tr>
                    ) : null}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Click a row to see the exact payload, response size and which hop failed. A 404/502 means the
        middleware/tunnel answered — SAP was never contacted.
      </p>
    </div>
  );
}


export const Route = createFileRoute("/_authenticated/admin/sap-api")({

  head: () => ({
    meta: [
      { title: "SAP API Settings — Nexus Analytics" },
      {
        name: "description",
        content:
          "Register dynamic SAP/REST endpoints, maintain SAP systems and configure the shared Node.js middleware.",
      },
      { property: "og:title", content: "SAP API Settings — Nexus Analytics" },
      {
        property: "og:description",
        content: "Manage SAP integration endpoints, systems and middleware connectivity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SapApiSettings,
});

/* ------------------------- posting date helpers ------------------------- */

/** `YYYY-MM-DD` (date input) -> `YYYYMMDD` (SAP payload). */
function toSapDate(iso: string): string {
  return iso.replace(/-/g, "");
}

/** `YYYYMMDD` (SAP payload) -> `YYYY-MM-DD` (date input). */
function fromSapDate(sap: string): string {
  const value = (sap ?? "").trim();
  if (!/^\d{8}$/.test(value)) return "";
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/** Parse a payload string into a flat string map; null when it is not a JSON object. */
function parsePayload(raw: string): Record<string, string> | null {
  const text = (raw ?? "").trim();
  if (!text) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [
        key,
        value === null || value === undefined ? "" : String(value),
      ]),
    );
  } catch {
    return null;
  }
}




function defaultEndpoint(): EndpointInput {
  const payload = { BUDAT_F: toSapDate(isoDaysAgo(7)), BUDAT_T: toSapDate(isoDaysAgo(0)) };
  return {
    name: "",
    module_key: "common",
    description: "",
    endpoint_path: "",
    system_key: "",
    http_method: "GET",
    auth_type: "basic",
    query_params: [],
    headers: [],
    body_template: JSON.stringify(payload, null, 2),
    response_root: "",
    response_notes: "",
    scheduler_enabled: false,
    schedule_expression: "",
    is_active: true,
  };
}


function SapApiSettings() {
  const { data: launchpad } = useLaunchpad();
  const screens = launchpad?.screens;
  const allowed = launchpad?.isSuperAdmin || (screens ?? []).includes("admin.sap-api");

  const [editing, setEditing] = useState<{ id: string | null; input: EndpointInput } | null>(null);

  return (
    <ReportShell
      title="SAP API Settings"
      description="Register dynamic SAP/REST endpoints and configure the shared Node.js middleware."
    >
      {!launchpad ? (
        <Skeleton className="h-64 w-full" />
      ) : !allowed ? (
        <AccessDenied area="SAP API Settings" />
      ) : editing ? (
        <EndpointDetail
          id={editing.id}
          input={editing.input}
          onClose={() => setEditing(null)}
        />
      ) : (
        <Tabs defaultValue="apis" className="space-y-5">
          <TabsList>
            <TabsTrigger value="apis" className="gap-2">
              <Plug className="size-4" /> APIs
            </TabsTrigger>
            <TabsTrigger value="systems" className="gap-2">
              <Database className="size-4" /> SAP Systems
            </TabsTrigger>
            <TabsTrigger value="middleware" className="gap-2">
              <Server className="size-4" /> Middleware Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apis">
            <ApiList onNew={() => setEditing({ id: null, input: defaultEndpoint() })} onEdit={setEditing} />
          </TabsContent>
          <TabsContent value="systems">
            <SystemsTab />
          </TabsContent>
          <TabsContent value="middleware">
            <MiddlewareTab />
          </TabsContent>
        </Tabs>
      )}
    </ReportShell>
  );
}

function toInput(endpoint: SapEndpoint): EndpointInput {
  const base: EndpointInput = {
    name: endpoint.name,
    module_key: endpoint.module_key,
    description: endpoint.description ?? "",
    endpoint_path: endpoint.endpoint_path,
    system_key: endpoint.system_key ?? "",
    http_method: endpoint.http_method,
    auth_type: endpoint.auth_type,
    query_params: endpoint.query_params,
    headers: endpoint.headers,
    body_template: endpoint.body_template ?? "",
    response_root: endpoint.response_root ?? "",
    response_notes: endpoint.response_notes ?? "",
    scheduler_enabled: endpoint.scheduler_enabled,
    schedule_expression: endpoint.schedule_expression ?? "",
    is_active: endpoint.is_active,
  };
  return withDefaultDates(base);
}

/**
 * Backfill BUDAT_F / BUDAT_T when a saved endpoint has none (or an invalid
 * value): To = today, From = today minus 7 days. Valid saved dates are kept.
 */
function withDefaultDates(input: EndpointInput): EndpointInput {
  const payload = parsePayload(input.body_template) ?? {};
  const headerValue = (key: string) => input.headers.find((row) => row.key === key)?.value ?? "";
  const current = {
    BUDAT_F: payload["BUDAT_F"] || headerValue("BUDAT_F"),
    BUDAT_T: payload["BUDAT_T"] || headerValue("BUDAT_T"),
  };
  const fixes: Record<string, string> = {};
  if (!/^\d{8}$/.test(current.BUDAT_F ?? "")) fixes["BUDAT_F"] = toSapDate(isoDaysAgo(7));
  if (!/^\d{8}$/.test(current.BUDAT_T ?? "")) fixes["BUDAT_T"] = toSapDate(isoDaysAgo(0));
  if (!Object.keys(fixes).length) return input;
  const nextPayload: Record<string, string> = { ...payload, ...current, ...fixes };

  return {
    ...input,
    body_template: JSON.stringify(nextPayload, null, 2),
    headers: input.headers,
  };
}


function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
      }`}
    >
      <ShieldCheck className="size-3" /> {label}
    </span>
  );
}

/* ---------------------------------- APIs ---------------------------------- */

/** Truthful outcome of the newest run for an endpoint (scheduled or manual). */
function LastRunLine({
  run,
}: {
  run?: {
    status: string;
    started_at: string;
    records_received: number;
    records_inserted: number;
    records_updated: number;
    error_message: string | null;
  };
}) {
  if (!run) {
    return <p className="mt-2 text-xs text-muted-foreground">No sync run recorded yet</p>;
  }
  const ok = run.status === "success";
  const when = formatDateTimeISTLabel(run.started_at);
  return (
    <div
      className={`mt-2 rounded-md border px-2 py-1.5 text-xs ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : run.status === "skipped"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-destructive/30 bg-destructive/5 text-destructive"
      }`}
    >
      <span className="font-semibold">
        {ok ? "Success" : run.status === "skipped" ? "Skipped" : "Failed"} — {when}
      </span>
      <span className="ml-1">
        {ok
          ? `${run.records_received} records (${run.records_inserted} new, ${run.records_updated} updated)`
          : (run.error_message ?? "")}
      </span>
    </div>
  );
}


function ApiList({
  onNew,
  onEdit,
}: {
  onNew: () => void;
  onEdit: (value: { id: string; input: EndpointInput }) => void;
}) {
  const queryClient = useQueryClient();
  const endpointsQuery = useQuery({ queryKey: ["sap-endpoints"], queryFn: listSapEndpoints });
  const systemsQuery = useQuery({ queryKey: ["sap-systems"], queryFn: listSapSystems });
  const runsQuery = useQuery({
    queryKey: ["sync-runs-latest"],
    queryFn: listLatestRuns,
    refetchInterval: 60000,
  });
  const systems = systemsQuery.data ?? [];
  const latestRuns = runsQuery.data ?? {};

  const testMutation = useMutation({
    mutationFn: (endpoint: SapEndpoint) => testSapEndpoint(endpoint, systems),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["sap-endpoints"] });
      queryClient.invalidateQueries({ queryKey: ["middleware-logs"] });
      queryClient.invalidateQueries({ queryKey: ["sync-runs"] });
      queryClient.invalidateQueries({ queryKey: ["sync-runs-latest"] });
      reportTest(result);
    },
    onError: (err: Error) => toast.error(err.message),
  });



  const deleteMutation = useMutation({
    mutationFn: deleteSapEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sap-endpoints"] });
      toast.success("Endpoint deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (endpointsQuery.isLoading) return <Skeleton className="h-56 w-full" />;
  const endpoints = endpointsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onNew} className="gap-2">
          <Plus className="size-4" /> New endpoint
        </Button>
      </div>

      {endpoints.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No endpoints registered yet. Create one to connect a report to SAP.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {endpoints.map((endpoint) => (
            <article
              key={endpoint.id}
              className="rounded-md border border-border bg-card p-4 shadow-tile"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-card-foreground">{endpoint.name}</h3>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline">{endpoint.auth_type}</Badge>
                </div>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {endpoint.description || "—"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <StatusPill ok={endpoint.is_active} label={endpoint.is_active ? "Active" : "Inactive"} />
                <span>
                  {endpoint.last_synced_at
                    ? `Last data ${formatDateTimeISTLabel(endpoint.last_synced_at)}`
                    : "No data synced yet"}
                </span>
              </div>
              <LastRunLine run={latestRuns[endpoint.name]} />

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => onEdit({ id: endpoint.id, input: toInput(endpoint) })}
                  >
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={testMutation.isPending}
                    onClick={() => testMutation.mutate(endpoint)}
                  >
                    <Activity className="size-3.5" /> Test
                  </Button>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate(endpoint.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="mt-2 truncate text-[11px] text-muted-foreground">
                {resolveEndpointUrl(endpoint, systems)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function KeyValueRows({
  rows,
  onChange,
  keyLabel,
}: {
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
  keyLabel: string;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder={keyLabel}
            value={row.key}
            onChange={(e) =>
              onChange(rows.map((r, i) => (i === index ? { ...r, key: e.target.value } : r)))
            }
          />
          <Input
            placeholder="Value"
            value={row.value}
            onChange={(e) =>
              onChange(rows.map((r, i) => (i === index ? { ...r, value: e.target.value } : r)))
            }
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-destructive"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1"
        onClick={() => onChange([...rows, { key: "", value: "" }])}
      >
        <Plus className="size-3.5" /> Add row
      </Button>
    </div>
  );
}

/** Pick a .json file and load its contents into the request payload editor. */
function PayloadFileInput({ onLoad }: { onLoad: (raw: string) => void }) {
  const [error, setError] = useState("");

  return (
    <div className="mt-2 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="file"
          accept="application/json,.json"
          className="h-9 max-w-xs cursor-pointer text-xs"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const raw = await file.text();
            const parsed = parsePayload(raw);
            if (!parsed) {
              setError("That is not a valid JSON object — nothing was changed.");
              return;
            }
            setError("");
            onLoad(JSON.stringify(parsed, null, 2));
            toast.success(`Loaded ${Object.keys(parsed).length} field(s) into the request payload`);
          }}
        />
        <span className="text-xs text-muted-foreground">Upload a .json payload file</span>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}


function EndpointDetail({

  id,
  input,
  onClose,
}: {
  id: string | null;
  input: EndpointInput;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EndpointInput>(input);
  const systemsQuery = useQuery({ queryKey: ["sap-systems"], queryFn: listSapSystems });
  const endpointsQuery = useQuery({ queryKey: ["sap-endpoints"], queryFn: listSapEndpoints });
  const systems = systemsQuery.data ?? [];
  const stored = useMemo(
    () => (endpointsQuery.data ?? []).find((row) => row.id === id) ?? null,
    [endpointsQuery.data, id],
  );

  const payload = useMemo(() => parsePayload(form.body_template), [form.body_template]);

  function payloadValue(key: string): string {
    return payload?.[key] ?? form.headers.find((row) => row.key === key)?.value ?? "";
  }

  /** Write values into both the payload body and the matching header rows. */
  function applyPayloadValues(values: Record<string, string>) {
    setForm((prev) => {
      const base = parsePayload(prev.body_template) ?? {};
      const next = { ...base, ...values };
      return {
        ...prev,
        body_template: JSON.stringify(next, null, 2),
        headers: prev.headers,
      };
    });
  }

  function set<K extends keyof EndpointInput>(key: K, value: EndpointInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }


  const saveMutation = useMutation({
    mutationFn: async () => (id ? updateSapEndpoint(id, form) : createSapEndpoint(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sap-endpoints"] });
      toast.success(id ? "Endpoint updated" : "Endpoint created");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const [lastTest, setLastTest] = useState<TestResult | null>(null);

  const testMutation = useMutation({
    mutationFn: async () => {
      if (!stored) throw new Error("Save the endpoint before testing it");
      return testSapEndpoint(stored, systems);
    },
    onSuccess: (result) => {
      setLastTest(result);
      queryClient.invalidateQueries({ queryKey: ["sap-endpoints"] });
      queryClient.invalidateQueries({ queryKey: ["middleware-logs"] });
      queryClient.invalidateQueries({ queryKey: ["sync-runs"] });

      reportTest(result);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pingMutation = useMutation({
    mutationFn: async () =>
      pingSapHost(
        form.system_key || systems.find((s) => s.is_active)?.key || null,
      ),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["middleware-logs"] });
      result.ok ? toast.success(result.message) : toast.error(result.message);
    },
    onError: (err: Error) => toast.error(err.message),
  });


  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" className="gap-1" onClick={onClose}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          <div>
            <h2 className="text-2xl font-light text-foreground">{form.name || "New endpoint"}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            disabled={pingMutation.isPending}
            onClick={() => pingMutation.mutate()}
          >
            <Radio className="size-4" /> Ping SAP host
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled={testMutation.isPending}
            onClick={() => testMutation.mutate()}
          >
            <Activity className="size-4" /> Test connection
          </Button>
          <Button className="gap-2" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save className="size-4" /> Save
          </Button>
        </div>

      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="request">Request</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
          
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid gap-4 rounded-md border border-border bg-card p-5 shadow-tile md:grid-cols-2">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <Field
              label="Endpoint Path or URL"
              className="md:col-span-2"
              hint="Use a relative path (starting with /) to inherit the host from the selected SAP system — the SAP client is appended automatically. A full http(s):// URL is also accepted."
            >
              <Input
                value={form.endpoint_path}
                placeholder="/sap/opu/odata/sap/ZFISALES_SRV/Items"
                onChange={(e) => set("endpoint_path", e.target.value)}
              />
            </Field>
            <Field label="SAP system">
              <Select
                value={form.system_key || "__active"}
                onValueChange={(v) => set("system_key", v === "__active" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__active">Use active system</SelectItem>
                  {systems.map((system) => (
                    <SelectItem key={system.key} value={system.key}>
                      {system.label} ({system.environment})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="HTTP method">
              <Select value={form.http_method} onValueChange={(v) => set("http_method", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Auth type">
              <Select value={form.auth_type} onValueChange={(v) => set("auth_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTH_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
              <Label>Active</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="request">
          <div className="space-y-5 rounded-md border border-border bg-card p-5 shadow-tile">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Posting From Date" hint="Sent as BUDAT_F (YYYYMMDD).">
                <Input
                  type="date"
                  value={fromSapDate(payloadValue("BUDAT_F"))}
                  onChange={(e) => applyPayloadValues({ BUDAT_F: toSapDate(e.target.value) })}
                />
              </Field>
              <Field label="Posting To Date" hint="Sent as BUDAT_T (YYYYMMDD).">
                <Input
                  type="date"
                  value={fromSapDate(payloadValue("BUDAT_T"))}
                  onChange={(e) => applyPayloadValues({ BUDAT_T: toSapDate(e.target.value) })}
                />
              </Field>
            </div>

            <Field label="Headers" hint="Optional HTTP headers sent with the request.">
              <KeyValueRows rows={form.headers} keyLabel="Header" onChange={(rows) => set("headers", rows)} />
            </Field>

            <Field
              label="Request payload"
              hint="Sent as the request body. BUDAT_F / BUDAT_T stay in sync with the date pickers above."
            >
              <Textarea
                rows={10}
                className="font-mono text-xs"
                value={form.body_template}
                onChange={(e) => set("body_template", e.target.value)}
              />
              <PayloadFileInput onLoad={(raw) => set("body_template", raw)} />
            </Field>

            <Field label="Query parameters">
              <KeyValueRows
                rows={form.query_params}
                keyLabel="Parameter"
                onChange={(rows) => set("query_params", rows)}
              />
            </Field>

          </div>
        </TabsContent>


        <TabsContent value="response">
          <div className="space-y-5 rounded-md border border-border bg-card p-5 shadow-tile">
            <Field label="Records path" hint="Where the row array lives in the payload, e.g. d.results.">
              <Input value={form.response_root} onChange={(e) => set("response_root", e.target.value)} />
            </Field>
            <Field label="Field mapping notes">
              <Textarea
                rows={4}
                value={form.response_notes}
                onChange={(e) => set("response_notes", e.target.value)}
              />
            </Field>
            <Field label="Sample response (last test)">
              <pre className="max-h-64 overflow-auto rounded-sm bg-muted p-3 text-xs">
                {stored?.sample_response || "No response captured yet — run Test connection."}
              </pre>
            </Field>
          </div>
        </TabsContent>


        <TabsContent value="scheduler">
          <div className="space-y-5 rounded-md border border-border bg-card p-5 shadow-tile">
            <div className="flex items-center gap-3">
              <Switch
                checked={form.scheduler_enabled}
                onCheckedChange={(v) => set("scheduler_enabled", v)}
              />
              <Label>Enable scheduled sync</Label>
            </div>
            <Field
              label="Interval / cron expression"
              hint="Pick a preset from the icon on the right, or type your own 5-field expression."
            >
              <div className="relative">
                <Input
                  value={form.schedule_expression}
                  onChange={(e) => set("schedule_expression", e.target.value)}
                  className="pr-10"
                />
                <Select value="" onValueChange={(v) => set("schedule_expression", v)}>
                  <SelectTrigger
                    aria-label="Choose an interval"
                    className="absolute right-0 top-0 h-full w-10 justify-center border-0 bg-transparent px-0 shadow-none [&>svg:last-child]:hidden"
                  >
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {CRON_PRESETS.map((p) => (
                      <SelectItem key={p.expression} value={p.expression}>
                        {p.label} — {p.expression}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Field>
            <SchedulePreview
              expression={form.schedule_expression}
              enabled={form.scheduler_enabled}
            />
            <p className="text-xs text-muted-foreground">
              Last run:{" "}
              {stored?.last_run_at ? formatDateTimeISTLabel(stored.last_run_at) : "never"} — status{" "}
              {stored?.last_run_status ?? "—"}
            </p>
            {stored?.name ? <SchedulerHealth endpointName={stored.name} /> : null}
          </div>

        </TabsContent>

        <TabsContent value="connectivity">
          <div className="space-y-3 rounded-md border border-border bg-card p-5 text-sm shadow-tile">
            <p className="text-muted-foreground">Resolved URL</p>
            <p className="break-all font-mono text-xs text-card-foreground">
              {resolveEndpointUrl(
                { endpoint_path: form.endpoint_path, system_key: form.system_key || null },
                systems,
              )}
            </p>
            <p className="border-t border-border pt-3 text-muted-foreground">
              SAP user:{" "}
              <span className="font-medium text-card-foreground">
                {(systems.find((s) => s.key === form.system_key) ?? systems.find((s) => s.is_active))
                  ?.username ?? "not configured"}
              </span>{" "}
              — username and password are maintained per system in the SAP Systems tab.
            </p>
            <div className="grid gap-2 border-t border-border pt-3 md:grid-cols-3">
              <Meta label="Last test" value={stored?.last_test_status ?? "—"} />
              <Meta
                label="Response time"
                value={stored?.last_test_duration_ms ? `${stored.last_test_duration_ms} ms` : "—"}
              />
              <Meta label="Message" value={stored?.last_test_message ?? "—"} />
            </div>

            {lastTest?.request ? (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-muted-foreground">
                  Outbound request of the last test (also printed in the browser console)
                </p>
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 font-mono text-[11px] text-muted-foreground">
                  {JSON.stringify(lastTest.request, null, 2)}
                </pre>
              </div>
            ) : null}

            <MiddlewareActivity />

          </div>

        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-card-foreground">{value}</p>
    </div>
  );
}

/* ------------------------------- SAP systems ------------------------------ */

const emptySystem = {
  key: "",
  label: "",
  environment: "DEV",
  base_url: "",
  sap_client: "",
  username: "",
  password: "",
  is_active: false,
};

function SystemsTab() {
  const queryClient = useQueryClient();
  const systemsQuery = useQuery({ queryKey: ["sap-systems"], queryFn: listSapSystems });
  const credentialsQuery = useQuery({
    queryKey: ["sap-credential-keys"],
    queryFn: listStoredCredentialKeys,
  });
  const storedKeys = credentialsQuery.data ?? [];
  const [drafts, setDrafts] = useState<Record<string, typeof emptySystem>>({});
  const [adding, setAdding] = useState<typeof emptySystem | null>(null);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["sap-systems"] });
    queryClient.invalidateQueries({ queryKey: ["sap-credential-keys"] });
  }

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: typeof emptySystem }) =>
      saveSapSystem(id, input),
    onSuccess: () => {
      refresh();
      setAdding(null);
      toast.success("SAP connection saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSapSystem,
    onSuccess: () => {
      refresh();
      toast.success("System removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const testMutation = useMutation({
    mutationFn: (system: SapSystem) => testSapSystem(system),
    onSuccess: (result) => {
      refresh();
      result.ok ? toast.success("SAP reachable") : toast.error(`Test failed: ${result.message}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (systemsQuery.isLoading) return <Skeleton className="h-56 w-full" />;
  const systems = systemsQuery.data ?? [];

  function draftFor(system: SapSystem) {
    return (
      drafts[system.id] ?? {
        key: system.key,
        label: system.label,
        environment: system.environment,
        base_url: system.base_url,
        sap_client: system.sap_client ?? "",
        username: system.username ?? "",
        password: "",
        is_active: system.is_active,
      }
    );
  }

  return (
    <div className="space-y-4">
      {systems.map((system) => {
        const draft = draftFor(system);
        return (
          <section key={system.id} className="rounded-md border border-border bg-card p-5 shadow-tile">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-card-foreground">
                  <Database className="size-4" /> {system.label}
                  {system.is_active ? <Badge variant="secondary">Active</Badge> : null}
                </h3>
                <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                  Base URL, client and technical user for this SAP system. Endpoints that store a
                  relative path inherit this Base URL automatically — switching DEV → Quality is a
                  one-field change. The password is stored encrypted and never shown again.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={testMutation.isPending}
                  onClick={() => testMutation.mutate(system)}
                >
                  <Activity className="size-4" /> Test connection
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate(system.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <SystemFields
              value={draft}
              hasStoredPassword={storedKeys.includes(system.key)}
              onChange={(next) => setDrafts((prev) => ({ ...prev, [system.id]: next }))}
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Last test: {system.last_test_status ?? "—"}
                {system.last_test_at ? ` · ${formatDateTimeISTLabel(system.last_test_at)}` : ""}
              </p>
              <Button
                className="gap-2"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate({ id: system.id, input: draft })}
              >
                <Save className="size-4" /> Save SAP connection
              </Button>
            </div>
          </section>
        );
      })}

      {adding ? (
        <section className="rounded-md border border-border bg-card p-5 shadow-tile">
          <h3 className="mb-4 text-base font-semibold text-card-foreground">New SAP system</h3>
          <SystemFields value={adding} onChange={setAdding} />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAdding(null)}>
              Cancel
            </Button>
            <Button
              className="gap-2"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate({ id: null, input: adding })}
            >
              <Save className="size-4" /> Save SAP connection
            </Button>
          </div>
        </section>
      ) : (
        <Button variant="outline" className="gap-2" onClick={() => setAdding({ ...emptySystem })}>
          <Plus className="size-4" /> Add another system
        </Button>
      )}
    </div>
  );
}

function SystemFields({
  value,
  onChange,
  hasStoredPassword = false,
}: {
  value: typeof emptySystem;
  onChange: (next: typeof emptySystem) => void;
  hasStoredPassword?: boolean;
}) {
  function set<K extends keyof typeof emptySystem>(key: K, next: (typeof emptySystem)[K]) {
    onChange({ ...value, [key]: next });
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Label">
        <Input value={value.label} onChange={(e) => set("label", e.target.value)} />
      </Field>
      <Field label="Environment">
        <Select value={value.environment} onValueChange={(v) => set("environment", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENVIRONMENTS.map((env) => (
              <SelectItem key={env} value={env}>
                {env}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="SAP Base URL">
        <Input
          value={value.base_url}
          placeholder="http://10.200.1.2:8000"
          onChange={(e) => set("base_url", e.target.value)}
        />
      </Field>
      <Field label="SAP client">
        <Input value={value.sap_client} placeholder="100" onChange={(e) => set("sap_client", e.target.value)} />
      </Field>
      <Field label="SAP username">
        <Input value={value.username} onChange={(e) => set("username", e.target.value)} />
      </Field>
      <Field label="SAP password">
        <Input
          type="password"
          autoComplete="new-password"
          value={value.password}
          placeholder={
            hasStoredPassword ? "Password saved — leave blank to keep" : "Enter SAP password"
          }
          onChange={(e) => set("password", e.target.value)}
        />
      </Field>
      <div className="flex items-center gap-3">
        <Switch checked={value.is_active} onCheckedChange={(v) => set("is_active", v)} />
        <Label>Use as active system</Label>
      </div>
    </div>
  );
}

/* ------------------------------- middleware ------------------------------ */

type MiddlewareForm = {
  connection_mode: string;
  deployment_mode: string;
  middleware_port: number;
  middleware_url: string;
  proxy_secret: string;
};

function MiddlewareTab() {
  const queryClient = useQueryClient();
  const configQuery = useQuery({ queryKey: ["sap-middleware"], queryFn: getMiddlewareConfig });
  const [form, setForm] = useState<MiddlewareForm | null>(null);

  const current =
    form ??
    (configQuery.data
      ? {
          connection_mode: configQuery.data.connection_mode,
          deployment_mode: configQuery.data.deployment_mode,
          middleware_port: configQuery.data.middleware_port,
          middleware_url: configQuery.data.middleware_url,
          proxy_secret: "",
        }
      : null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!configQuery.data || !current) throw new Error("Configuration not loaded");
      return saveMiddlewareConfig(configQuery.data.id, current);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sap-middleware"] });
      setForm((prev) => (prev ? { ...prev, proxy_secret: "" } : prev));
      toast.success("Middleware settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const testMutation = useMutation({
    mutationFn: testMiddleware,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["sap-middleware"] });
      result.ok
        ? toast.success(`Middleware reachable (${result.durationMs} ms)`)
        : toast.error(`Middleware test failed: ${result.message}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!current) return <Skeleton className="h-56 w-full" />;

  const active: MiddlewareForm = current;
  function set<K extends keyof MiddlewareForm>(key: K, value: MiddlewareForm[K]) {
    setForm({ ...active, [key]: value });
  }

  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-tile">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Server className="size-4" /> Node.js Middleware
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            These settings are shared by every SAP API integration whose auth type is Basic or Proxy /
             Middleware. The portal server authenticates to this service with a protected shared secret before calling SAP.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          disabled={testMutation.isPending}
          onClick={() => testMutation.mutate()}
        >
          <Activity className="size-4" /> Test middleware
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Connection mode">
          <Select value={current.connection_mode} onValueChange={(v) => set("connection_mode", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONNECTION_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Deployment mode">
          <Select value={current.deployment_mode} onValueChange={(v) => set("deployment_mode", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPLOYMENT_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Middleware port">
          <Input
            type="number"
            value={current.middleware_port}
            onChange={(e) => set("middleware_port", Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Node.js middleware URL">
          <Input
            value={current.middleware_url}
            placeholder="http://10.200.1.5:3008"
            onChange={(e) => set("middleware_url", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Last test: {configQuery.data?.last_test_status ?? "—"}
          {configQuery.data?.last_test_at
            ? ` · ${formatDateTimeISTLabel(configQuery.data.last_test_at)}`
            : ""}
          {configQuery.data?.last_test_message ? ` · ${configQuery.data.last_test_message}` : ""}
        </p>
        <Button className="gap-2" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          <Save className="size-4" /> Save middleware settings
        </Button>
      </div>
    </section>
  );
}

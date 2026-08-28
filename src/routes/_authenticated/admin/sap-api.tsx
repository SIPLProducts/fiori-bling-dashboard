import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  ArrowLeft,
  Database,
  Pencil,
  Plug,
  Plus,
  Save,
  Server,
  ShieldCheck,
  Trash2,
} from "lucide-react";
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
  getMiddlewareConfig,
  listSapEndpoints,
  listSapSystems,
  listStoredCredentialKeys,
  MIDDLEWARE_CREDENTIAL_KEY,
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

/** Replace matching header rows and append the ones that do not exist yet. */
function mergeHeaders(rows: KeyValue[], values: Record<string, string>): KeyValue[] {
  const next = rows.map((row) =>
    row.key in values ? { key: row.key, value: values[row.key] as string } : row,
  );
  for (const [key, value] of Object.entries(values)) {
    if (!next.some((row) => row.key === key)) next.push({ key, value });
  }
  return next;
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
    headers: mergeHeaders([], payload),
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
  return {
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
  const systems = systemsQuery.data ?? [];

  const testMutation = useMutation({
    mutationFn: (endpoint: SapEndpoint) => testSapEndpoint(endpoint, systems),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["sap-endpoints"] });
      result.ok
        ? toast.success(`Connection OK (${result.durationMs} ms)`)
        : toast.error(`Test failed: ${result.message}`);
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
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <StatusPill ok={endpoint.is_active} label={endpoint.is_active ? "Active" : "Inactive"} />
                <span>
                  {endpoint.last_synced_at
                    ? `Synced ${new Date(endpoint.last_synced_at).toLocaleString()}`
                    : "Never synced"}
                </span>
              </div>
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

  const testMutation = useMutation({
    mutationFn: async () => {
      if (!stored) throw new Error("Save the endpoint before testing it");
      return testSapEndpoint(stored, systems);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["sap-endpoints"] });
      result.ok
        ? toast.success(`Connection OK (${result.durationMs} ms)`)
        : toast.error(`Test failed: ${result.message}`);
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
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
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
            <Field label="Query parameters">
              <KeyValueRows
                rows={form.query_params}
                keyLabel="Parameter"
                onChange={(rows) => set("query_params", rows)}
              />
            </Field>
            <Field label="Headers">
              <KeyValueRows rows={form.headers} keyLabel="Header" onChange={(rows) => set("headers", rows)} />
            </Field>
            <Field label="Request body template" hint="Sent for POST/PUT/PATCH requests.">
              <Textarea
                rows={6}
                className="font-mono text-xs"
                value={form.body_template}
                onChange={(e) => set("body_template", e.target.value)}
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

        <TabsContent value="credentials">
          <div className="space-y-3 rounded-md border border-border bg-card p-5 text-sm shadow-tile">
            <p className="font-medium text-card-foreground">
              Technical user:{" "}
              {(systems.find((s) => s.key === form.system_key) ?? systems.find((s) => s.is_active))
                ?.username ?? "not configured"}
            </p>
            <p className="text-muted-foreground">
              SAP passwords and the proxy secret are stored encrypted and used only by the middleware
              file (<code>deploy/middleware/.env</code>) — they are never stored in this portal or sent
              to the browser. Change them on the middleware server and restart the service.
            </p>
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
            <Field label="Interval / cron expression" hint="Stored for the middleware scheduler, e.g. */15 * * * *">
              <Input
                value={form.schedule_expression}
                onChange={(e) => set("schedule_expression", e.target.value)}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              Last run:{" "}
              {stored?.last_run_at ? new Date(stored.last_run_at).toLocaleString() : "never"} — status{" "}
              {stored?.last_run_status ?? "—"}
            </p>
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
            <div className="grid gap-2 border-t border-border pt-3 md:grid-cols-3">
              <Meta label="Last test" value={stored?.last_test_status ?? "—"} />
              <Meta
                label="Response time"
                value={stored?.last_test_duration_ms ? `${stored.last_test_duration_ms} ms` : "—"}
              />
              <Meta label="Message" value={stored?.last_test_message ?? "—"} />
            </div>
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
                {system.last_test_at ? ` · ${new Date(system.last_test_at).toLocaleString()}` : ""}
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
  const credentialsQuery = useQuery({
    queryKey: ["sap-credential-keys"],
    queryFn: listStoredCredentialKeys,
  });
  const hasStoredSecret = (credentialsQuery.data ?? []).includes(MIDDLEWARE_CREDENTIAL_KEY);
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
      queryClient.invalidateQueries({ queryKey: ["sap-credential-keys"] });
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
            Middleware. The service verifies the signed-in user's portal token before calling SAP.
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
        <Field label="Proxy secret / SAP password" className="md:col-span-2">
          <Input
            type="password"
            autoComplete="new-password"
            value={current.proxy_secret}
            placeholder={hasStoredSecret ? "Secret saved — leave blank to keep" : "Enter proxy secret"}
            onChange={(e) => set("proxy_secret", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Last test: {configQuery.data?.last_test_status ?? "—"}
          {configQuery.data?.last_test_at
            ? ` · ${new Date(configQuery.data.last_test_at).toLocaleString()}`
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

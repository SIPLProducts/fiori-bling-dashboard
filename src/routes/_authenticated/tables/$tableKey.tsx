import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AccessDenied, Panel, ReportShell } from "@/components/report-shell";
import { useLaunchpad } from "@/lib/use-launchpad";
import {
  SCHEDULE_PRESETS,
  countTableRows,
  getTableMapping,
  listSyncRuns,
  saveTableMapping,
  scheduleLabel,
  type TableMappingInput,
} from "@/lib/table-master";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/tables/$tableKey")({
  head: () => ({
    meta: [
      { title: "Table Master — Nexus Analytics" },
      {
        name: "description",
        content:
          "Configure which SAP API feeds a portal table, the sync schedule, the owner and the last sync result.",
      },
      { property: "og:title", content: "Table Master — Nexus Analytics" },
      {
        property: "og:description",
        content: "Map SAP APIs to portal tables and control their sync schedule.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TableMasterPage,
});

function fmt(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function TableMasterPage() {
  const { tableKey } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: launchpad, isLoading: accessLoading } = useLaunchpad();
  const isSuperAdmin = launchpad?.isSuperAdmin ?? false;
  const allowed =
    isSuperAdmin || (launchpad?.screens ?? []).includes(`tables.${tableKey}`);

  const mappingQuery = useQuery({
    queryKey: ["table-mapping", tableKey],
    queryFn: () => getTableMapping(tableKey),
    enabled: allowed,
  });
  const mapping = mappingQuery.data ?? null;

  const runsQuery = useQuery({
    queryKey: ["sync-runs"],
    queryFn: () => listSyncRuns(10),
    enabled: allowed,
  });
  const countQuery = useQuery({
    queryKey: ["table-count", mapping?.table_name],
    queryFn: () => countTableRows(mapping!.table_name),
    enabled: allowed && !!mapping?.table_name,
  });

  const [form, setForm] = useState<TableMappingInput>({
    api_name: null,
    table_name: "",
    schedule_expression: "*/5 * * * *",
    sync_enabled: true,
    description: null,
  });
  const [errors, setErrors] = useState<{
    api_name?: string | undefined;
    table_name?: string | undefined;
  }>({});

  // SAP API names look like ZFISALES_MIS, ZVF05/FIN_N — start with a letter,
  // then letters, digits, underscore, hyphen, slash or dot.
  function validateApiName(value: string | null): string | undefined {
    const name = value?.trim() ?? "";
    if (!name) return "SAP API is required — map this table to an SAP API before saving";
    if (name.length < 3) return "SAP API must be at least 3 characters";
    if (name.length > 100) return "SAP API must be less than 100 characters";
    if (!/^[A-Za-z][A-Za-z0-9_\-/.]*$/.test(name))
      return "SAP API must start with a letter and contain only letters, digits, _ - / .";
    return undefined;
  }

  function validateTableName(value: string): string | undefined {
    const name = value.trim();
    if (!name) return "Table name is required";
    if (!/^[a-z][a-z0-9_]*$/.test(name))
      return "Table name must be lowercase letters, digits and underscores (e.g. zfisales_detail)";
    return undefined;
  }

  useEffect(() => {
    if (!mapping) return;
    setForm({
      api_name: mapping.api_name,
      table_name: mapping.table_name,
      schedule_expression: mapping.schedule_expression,
      sync_enabled: mapping.sync_enabled,
      description: mapping.description,
    });
  }, [mapping]);

  const save = useMutation({
    mutationFn: async () => {
      if (!mapping) throw new Error("No mapping");
      const nextErrors = {
        api_name: validateApiName(form.api_name),
        table_name: validateTableName(form.table_name),
      };
      setErrors(nextErrors);
      if (nextErrors.api_name || nextErrors.table_name)
        throw new Error(nextErrors.api_name ?? nextErrors.table_name!);
      await saveTableMapping(mapping.id, {
        ...form,
        table_name: form.table_name.trim(),
        api_name: form.api_name?.trim() || null,
      });
    },
    onSuccess: () => {
      toast.success("Table configuration saved");
      queryClient.invalidateQueries({ queryKey: ["table-mapping", tableKey] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not save configuration"),
  });

  if (accessLoading) {
    return (
      <ReportShell title="Table Master" description="Loading configuration…">
        <Skeleton className="h-64 w-full" />
      </ReportShell>
    );
  }

  if (!allowed) {
    return (
      <ReportShell title="Table Master" description="SAP API to table mapping">
        <AccessDenied area="this table configuration" />
      </ReportShell>
    );
  }

  if (mappingQuery.isLoading) {
    return (
      <ReportShell title="Table Master" description="SAP API to table mapping">
        <Skeleton className="h-64 w-full" />
      </ReportShell>
    );
  }

  if (!mapping) {
    return (
      <ReportShell title="Table Master" description="SAP API to table mapping">
        <Panel title="Not configured">
          <p className="text-sm text-muted-foreground">
            No table mapping exists for <span className="font-mono">{tableKey}</span> yet. A Sharvi
            Admin can add it from the Table Master configuration.
          </p>
        </Panel>
      </ReportShell>
    );
  }

  return (
    <ReportShell
      title={mapping.display_name}
      description={mapping.description ?? "SAP API to table mapping"}
      tcode={mapping.table_name}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Database table" value={mapping.table_name} mono />
        <StatCard label="Linked SAP API" value={mapping.api_name ?? "Not linked"} />
        <StatCard label="Sync frequency" value={scheduleLabel(mapping.schedule_expression)} />
        <StatCard label="Records stored" value={(countQuery.data ?? 0).toLocaleString("en-IN")} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="API & sync configuration" className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>SAP API</Label>
              <Input
                value={form.api_name ?? ""}
                placeholder="Enter SAP API name"
                onChange={(event) => {
                  setForm((f) => ({ ...f, api_name: event.target.value || null }));
                  setErrors((e) => ({ ...e, api_name: undefined }));
                }}
                disabled={!isSuperAdmin}
                className={errors.api_name ? "border-destructive" : undefined}
              />
              {errors.api_name ? (
                <p className="text-[11px] text-destructive">{errors.api_name}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  SAP API that feeds this table (e.g. ZFISALES_MIS).
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Table name</Label>
              <Input
                value={form.table_name}
                placeholder="Enter Table name"
                onChange={(event) => setForm((f) => ({ ...f, table_name: event.target.value }))}
                disabled={!isSuperAdmin}
                className={errors.table_name ? "border-destructive font-mono" : "font-mono"}
                onChange={(event) => {
                  setForm((f) => ({ ...f, table_name: event.target.value }));
                  setErrors((e) => ({ ...e, table_name: undefined }));
                }}
              />
              {errors.table_name ? (
                <p className="text-[11px] text-destructive">{errors.table_name}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Database table where this API's data is stored.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Sync frequency</Label>
              <Select
                value={form.schedule_expression}
                onValueChange={(value) => setForm((f) => ({ ...f, schedule_expression: value }))}
                disabled={!isSuperAdmin}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description ?? ""}
                placeholder="Enter Description"
                onChange={(event) =>
                  setForm((f) => ({ ...f, description: event.target.value || null }))
                }
                disabled={!isSuperAdmin}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 md:col-span-2">
              <div>
                <p className="text-sm font-medium text-card-foreground">Scheduled sync</p>
                <p className="text-xs text-muted-foreground">
                  When enabled, the linked SAP API is pulled into this table on the selected
                  frequency.
                </p>
              </div>
              <Switch
                checked={form.sync_enabled}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, sync_enabled: checked }))}
                disabled={!isSuperAdmin}
              />
            </div>
          </div>

          {isSuperAdmin ? (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save configuration"}
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Only a Sharvi Admin can change this configuration.
            </p>
          )}
        </Panel>

        <Panel title="Sync status">
          <dl className="space-y-3 text-sm">
            <Row label="Status">
              <Badge variant={mapping.sync_enabled ? "default" : "secondary"}>
                {mapping.sync_enabled ? "Scheduled" : "Paused"}
              </Badge>
            </Row>
            <Row label="Last sync">{fmt(mapping.last_synced_at)}</Row>
            <Row label="Last result">{mapping.last_sync_status ?? "Never synced"}</Row>
            <Row label="Records in last run">
              {mapping.last_sync_records.toLocaleString("en-IN")}
            </Row>
            <Row label="Configuration updated">{fmt(mapping.updated_at)}</Row>
          </dl>
        </Panel>
      </div>

      <Panel title="Recent sync runs" className="mt-4">
        {runsQuery.data && runsQuery.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>API</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Inserted</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runsQuery.data.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>{fmt(run.started_at)}</TableCell>
                  <TableCell className="font-mono text-xs">{run.endpoint}</TableCell>
                  <TableCell>{run.error_message ? run.error_message : run.status}</TableCell>
                  <TableCell className="text-right">{run.records_received}</TableCell>
                  <TableCell className="text-right">{run.records_inserted}</TableCell>
                  <TableCell className="text-right">{run.records_updated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            No sync runs recorded yet for this table.
          </p>
        )}
      </Panel>
    </ReportShell>
  );
}

function StatCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-tile">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg text-card-foreground ${mono ? "font-mono text-base" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-card-foreground">{children}</dd>
    </div>
  );
}

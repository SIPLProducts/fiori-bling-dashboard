import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AccessDenied, Panel, ReportShell } from "@/components/report-shell";
import { useLaunchpad } from "@/lib/use-launchpad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  SCHEDULE_PRESETS,
  createTableMapping,
  listTableMappings,
  scheduleLabel,
} from "@/lib/table-master";

export const Route = createFileRoute("/_authenticated/tables/")({
  head: () => ({
    meta: [
      { title: "Tables Master — Nexus Analytics" },
      {
        name: "description",
        content:
          "Create portal tables, define their fields, UI labels and SAP field names, and link each table to the SAP API that feeds it.",
      },
      { property: "og:title", content: "Tables Master — Nexus Analytics" },
      {
        property: "og:description",
        content: "Define portal tables and their SAP field mapping.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TablesMasterIndex,
});

const EMPTY = {
  display_name: "",
  table_key: "",
  table_name: "",
  api_name: "",
  description: "",
  schedule_expression: "*/5 * * * *",
  sync_enabled: true,
};

function TablesMasterIndex() {
  const queryClient = useQueryClient();
  const { data: launchpad, isLoading: accessLoading } = useLaunchpad();
  const isSuperAdmin = launchpad?.isSuperAdmin ?? false;
  const allowed =
    isSuperAdmin || (launchpad?.screens ?? []).some((screen) => screen.startsWith("tables."));

  const mappingsQuery = useQuery({
    queryKey: ["table-mappings"],
    queryFn: listTableMappings,
    enabled: allowed,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const create = useMutation({
    mutationFn: async () => {
      const next: Record<string, string | undefined> = {};
      if (!form.display_name.trim()) next['display_name'] = "Display name is required";
      if (!/^[a-z][a-z0-9-]*$/.test(form.table_key.trim()))
        next['table_key'] = "Lowercase letters, digits and hyphens (e.g. zfisales-detail)";
      if (!/^[a-z][a-z0-9_]*$/.test(form.table_name.trim()))
        next['table_name'] = "Lowercase letters, digits and underscores (e.g. zfisales_detail)";
      if (form.api_name.trim() && !/^[A-Za-z][A-Za-z0-9_\-/.]*$/.test(form.api_name.trim()))
        next['api_name'] = "SAP API must start with a letter (e.g. ZFISALES_MIS)";
      setErrors(next);
      if (Object.values(next).some(Boolean)) throw new Error("Please correct the highlighted fields");
      await createTableMapping({
        table_key: form.table_key.trim(),
        table_name: form.table_name.trim(),
        display_name: form.display_name.trim(),
        description: form.description.trim() || null,
        api_name: form.api_name.trim() || null,
        schedule_expression: form.schedule_expression,
        sync_enabled: form.sync_enabled,
      });
    },
    onSuccess: () => {
      toast.success("Table created");
      setOpen(false);
      setForm(EMPTY);
      queryClient.invalidateQueries({ queryKey: ["table-mappings"] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not create table"),
  });

  if (accessLoading) {
    return (
      <ReportShell title="Tables Master" description="Loading…">
        <Skeleton className="h-64 w-full" />
      </ReportShell>
    );
  }

  if (!allowed) {
    return (
      <ReportShell title="Tables Master" description="SAP API to table mapping">
        <AccessDenied area="Tables Master" />
      </ReportShell>
    );
  }

  const mappings = mappingsQuery.data ?? [];

  return (
    <ReportShell
      title="Tables Master"
      description="Create portal tables and define their fields, UI labels and SAP field names."
    >
      <Panel
        title="Tables"
        actions={
          isSuperAdmin ? (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1 size-3.5" /> Create table
            </Button>
          ) : undefined
        }
      >
        {mappingsQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : mappings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tables defined yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display name</TableHead>
                <TableHead>Database table</TableHead>
                <TableHead>SAP API</TableHead>
                <TableHead>Sync</TableHead>
                <TableHead className="w-24 text-right">Fields</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>{mapping.display_name}</TableCell>
                  <TableCell className="font-mono text-xs">{mapping.table_name}</TableCell>
                  <TableCell className="font-mono text-xs">{mapping.api_name ?? "—"}</TableCell>
                  <TableCell className="text-xs">
                    {scheduleLabel(mapping.schedule_expression)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/tables/$tableKey"
                      params={{ tableKey: mapping.table_key }}
                      className="text-sm text-primary hover:underline"
                    >
                      Configure
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create table</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input
                placeholder="Enter Display Name"
                value={form.display_name}
                onChange={(event) => setForm((f) => ({ ...f, display_name: event.target.value }))}
              />
              {errors['display_name'] ? (
                <p className="text-[11px] text-destructive">{errors['display_name']}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Table key</Label>
              <Input
                className="font-mono"
                placeholder="Enter Table Key"
                value={form.table_key}
                onChange={(event) => setForm((f) => ({ ...f, table_key: event.target.value }))}
              />
              {errors['table_key'] ? (
                <p className="text-[11px] text-destructive">{errors['table_key']}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Table name</Label>
              <Input
                className="font-mono"
                placeholder="Enter Table Name"
                value={form.table_name}
                onChange={(event) => setForm((f) => ({ ...f, table_name: event.target.value }))}
              />
              {errors['table_name'] ? (
                <p className="text-[11px] text-destructive">{errors['table_name']}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>SAP API</Label>
              <Input
                placeholder="Enter SAP API"
                value={form.api_name}
                onChange={(event) => setForm((f) => ({ ...f, api_name: event.target.value }))}
              />
              {errors['api_name'] ? (
                <p className="text-[11px] text-destructive">{errors['api_name']}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Sync frequency</Label>
              <Select
                value={form.schedule_expression}
                onValueChange={(value) => setForm((f) => ({ ...f, schedule_expression: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
            <div className="flex items-end gap-2 pb-2">
              <Switch
                checked={form.sync_enabled}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, sync_enabled: checked }))}
              />
              <span className="text-sm">Scheduled sync</span>
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label>Description</Label>
              <Input
                placeholder="Enter Description"
                value={form.description}
                onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create table"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ReportShell>
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createRole, deleteRole, updateRole } from "@/lib/admin.functions";
import { listRoles, visibleRoles, type RoleRecord } from "@/lib/access";
import { useLaunchpad } from "@/lib/use-launchpad";
import { AccessDenied, Panel, ReportShell } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  head: () => ({
    meta: [
      { title: "Roles — Nexus Analytics" },
      {
        name: "description",
        content: "Maintain portal roles that drive user assignments and screen permissions.",
      },
      { property: "og:title", content: "Roles — Nexus Analytics" },
      { property: "og:description", content: "Create and maintain the roles used across the portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminRoles;
});

function AdminRoles() {
  const queryClient = useQueryClient();
  const { data: launchpad } = useLaunchpad();
  const isSuperAdmin = launchpad?.isSuperAdmin ?? false;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRecord | null>(null);
  const [form, setForm] = useState({ key: "", name: "", description: "" });

  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: () => listRoles() });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["roles"] });
    queryClient.invalidateQueries({ queryKey: ["role-screens"] });
    queryClient.invalidateQueries({ queryKey: ["launchpad"] });
  }

  const saveMutation = useMutation({
    mutationFn: () => (editing ? updateRole({ data: form }) : createRole({ data: form })),
    onSuccess: () => {
      toast.success(editing ? "Role updated" : "Role created");
      setOpen(false);
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteRole({ data: { key } }),
    onSuccess: () => {
      toast.success("Role deleted");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (launchpad && !isSuperAdmin) {
    return (
      <ReportShell title="Roles" description="Maintain portal roles.">
        <AccessDenied area="role management" />
      </ReportShell>
    );
  }

  return (
    <ReportShell title="Roles" description="Roles available when assigning users and permissions.">
      {rolesQuery.isLoading ? (
        <Skeleton className="h-64 rounded-md" />
      ) : (
        <Panel
          title={`${rolesQuery.data?.length ?? 0} roles`}
          actions={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setForm({ key: "", name: "", description: "" });
                setOpen(true);
              }}
            >
              Create role
            </Button>
          }
        >
          <div className="overflow-auto rounded-sm border border-border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRoles(rolesQuery.data ?? [], isSuperAdmin).map((role) => (
                  <TableRow key={role.key}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{role.key}</TableCell>
                    <TableCell className="text-muted-foreground">{role.description ?? "—"}</TableCell>
                    <TableCell className="text-xs">{role.is_system ? "System" : "Custom"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(role);
                          setForm({
                            key: role.key,
                            name: role.name,
                            description: role.description ?? "",
                          });
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      {role.is_system ? null : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(role.key)}
                        >
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit role" : "Create role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Role key *</Label>
              <Input
                value={form.key}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="plant_manager"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Plant Manager"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ReportShell>
  );
}

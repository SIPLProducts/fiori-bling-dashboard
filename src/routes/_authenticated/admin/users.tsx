import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createPortalUser,
  listPortalUsers,
  setUserStatus,
  updatePortalUser,
  type PortalUser,
  type UserFormInput,
  type UserStatus,
} from "@/lib/admin.functions";
import { listRoles, visibleRoles } from "@/lib/access";
import { useLaunchpad } from "@/lib/use-launchpad";
import { AccessDenied, Panel, ReportShell } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — Nexus Analytics" },
      {
        name: "description",
        content: "Create portal users, capture employee details and assign one or more roles.",
      },
      { property: "og:title", content: "User Management — Nexus Analytics" },
      { property: "og:description", content: "Administer portal users and their role assignments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminUsers,
});

const EMPTY_FORM: UserFormInput = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  contact: "",
  status: "active",
  employee_id: "",
  department: "",
  password: "",
  confirmPassword: "",
  roles: [],
};

function AdminUsers() {
  const queryClient = useQueryClient();
  const { data: launchpad } = useLaunchpad();
  const isSuperAdmin = launchpad?.isSuperAdmin ?? false;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PortalUser | null>(null);
  const [form, setForm] = useState<UserFormInput>(EMPTY_FORM);

  const usersQuery = useQuery({ queryKey: ["portal-users"], queryFn: () => listPortalUsers() });
  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: () => listRoles() });

  const assignableRoles = useMemo(
    () => visibleRoles(rolesQuery.data ?? [], isSuperAdmin),
    [rolesQuery.data, isSuperAdmin],
  );

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["portal-users"] });
    queryClient.invalidateQueries({ queryKey: ["launchpad"] });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { password: _p, confirmPassword: _c, email: _e, ...rest } = form;
        return updatePortalUser({ data: { id: editing.id, ...rest } });
      }
      return createPortalUser({ data: form });
    },
    onSuccess: () => {
      toast.success(editing ? "User updated" : "User created");
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: UserStatus }) => setUserStatus({ data: input }),
    onSuccess: () => {
      toast.success("Status updated");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(user: PortalUser) {
    setEditing(user);
    setForm({
      username: user.username ?? "",
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? "",
      contact: user.contact ?? "",
      status: user.status,
      employee_id: user.employee_id ?? "",
      department: user.department ?? "",
      password: "",
      confirmPassword: "",
      roles: user.roles,
    });
    setOpen(true);
  }

  function toggleRole(key: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      roles: checked ? [...new Set([...prev.roles, key])] : prev.roles.filter((r) => r !== key),
    }));
  }

  if (launchpad && !isSuperAdmin) {
    return (
      <ReportShell title="User Management" description="Administer portal users.">
        <AccessDenied area="user management" />
      </ReportShell>
    );
  }

  return (
    <ReportShell
      title="User Management"
      description="Create users, capture employee details and assign roles."
    >
      {usersQuery.error ? (
        <p className="text-sm text-destructive">
          You need the Sharvi Admin role to manage users.
        </p>
      ) : usersQuery.isLoading ? (
        <Skeleton className="h-72 rounded-md" />
      ) : (
        <Panel
          title={`${usersQuery.data?.length ?? 0} users`}
          actions={<Button size="sm" onClick={openCreate}>Create user</Button>}
        >
          <div className="overflow-auto rounded-sm border border-border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usersQuery.data ?? []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                        user.display_name ||
                        "—"}
                    </TableCell>
                    <TableCell>{user.username ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email ?? "—"}</TableCell>
                    <TableCell>{user.contact ?? "—"}</TableCell>
                    <TableCell>{user.employee_id ?? "—"}</TableCell>
                    <TableCell>{user.department ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {user.roles.length
                        ? user.roles
                            .map(
                              (key) =>
                                (rolesQuery.data ?? []).find((role) => role.key === key)?.name ?? key,
                            )
                            .join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.status === "active"}
                        disabled={statusMutation.isPending}
                        aria-label={`Active status for ${user.username ?? user.id}`}
                        onCheckedChange={(checked) =>
                          statusMutation.mutate({
                            id: user.id,
                            status: checked ? "active" : "inactive",
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(user)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "Create user"}</DialogTitle>
            <DialogDescription>
              Fields marked * are mandatory. Roles are maintained on the Roles screen.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username">
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="jdoe"
              />
            </Field>
            <Field label="Employee ID">
              <Input
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              />
            </Field>
            <Field label="First Name *">
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </Field>
            <Field label="Last Name *">
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </Field>
            <Field label="Email *">
              <Input
                type="email"
                value={form.email}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Contact *">
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </Field>
            <Field label="Department">
              <Input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </Field>
            <Field label="Status *">
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value as UserStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {editing ? null : (
              <>
                <Field label="Password *">
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </Field>
                <Field label="Confirm Password *">
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                </Field>
              </>
            )}
          </div>

          <div>
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">Roles</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {assignableRoles.map((role) => (
                <label key={role.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.roles.includes(role.key)}
                    onCheckedChange={(checked) => toggleRole(role.key, checked === true)}
                  />
                  <span>{role.name}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? "Saving…" : editing ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ReportShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

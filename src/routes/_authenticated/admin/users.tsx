import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, UserPlus } from "lucide-react";
import {
  createPortalUser,
  listPortalUsers,
  updatePortalUser,
  type PortalUser,
  type UserFormInput,
  type UserStatus,
} from "@/lib/admin.functions";
import { listRoles, visibleRoles } from "@/lib/access";
import { useLaunchpad } from "@/lib/use-launchpad";
import { AccessDenied, Panel, ReportShell } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
import { PasswordMatchHint, PasswordStrength } from "@/components/password-strength";
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
        content: "Create portal users, capture employee details and assign a single role.",
      },
      { property: "og:title", content: "User Management — Nexus Analytics" },
      { property: "og:description", content: "Administer portal users and their role assignment." },
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
  department: "",
  plant: "",
  purchase_group: "",
  distribution_channel: "",
  info1: "",
  info2: "",
  password: "",
  confirmPassword: "",
  roleKey: "",
};

function AdminUsers() {
  const queryClient = useQueryClient();
  const { data: launchpad } = useLaunchpad();
  const isSuperAdmin = launchpad?.isSuperAdmin ?? false;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PortalUser | null>(null);
  const [form, setForm] = useState<UserFormInput>(EMPTY_FORM);
  const [search, setSearch] = useState("");

  const usersQuery = useQuery({ queryKey: ["portal-users"], queryFn: () => listPortalUsers() });
  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: () => listRoles() });

  const assignableRoles = useMemo(
    () => visibleRoles(rolesQuery.data ?? [], isSuperAdmin),
    [rolesQuery.data, isSuperAdmin],
  );

  const roleName = (key: string) =>
    (rolesQuery.data ?? []).find((role) => role.key === key)?.name ?? key;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = usersQuery.data ?? [];
    if (!term) return all;
    return all.filter((user) =>
      [
        user.first_name,
        user.last_name,
        user.display_name,
        user.username,
        user.email,
        user.department,
        user.plant,
        ...user.roles.map(roleName),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [usersQuery.data, search, rolesQuery.data]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["portal-users"] });
    queryClient.invalidateQueries({ queryKey: ["launchpad"] });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { email: _email, ...rest } = form;
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

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, roleKey: assignableRoles[0]?.key ?? "" });
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
      department: user.department ?? "",
      plant: user.plant ?? "",
      purchase_group: user.purchase_group ?? "",
      distribution_channel: user.distribution_channel ?? "",
      info1: user.info1 ?? "",
      info2: user.info2 ?? "",

      password: "",
      confirmPassword: "",
      roleKey: user.roles[0] ?? "",
    });
    setOpen(true);
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
      description="Create users, capture employee details and assign a role."
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
          actions={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users…"
                  className="h-8 w-52 pl-8 text-xs"
                />
              </div>
              <Button size="sm" onClick={openCreate}>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Create user
              </Button>
            </div>
          }
        >
          <div className="overflow-auto rounded-md border border-border bg-card">
            <Table>
              <TableHeader className="bg-muted/70">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold tracking-wide uppercase">
                    User
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-wide uppercase">
                    Username
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-wide uppercase">
                    Contact
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-wide uppercase">
                    Plant
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-wide uppercase">
                    Department
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-wide uppercase">
                    Role
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-wide uppercase">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-semibold tracking-wide uppercase">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No users match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((user) => (
                    <TableRow key={user.id} className="transition-colors hover:bg-accent/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                            {initials(user)}
                          </span>
                          <div className="leading-tight">
                            <div className="font-medium">
                              {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                                user.display_name ||
                                "—"}
                            </div>
                            <div className="text-xs text-muted-foreground">{user.email ?? "—"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.username ?? "—"}</TableCell>
                      <TableCell className="text-sm">{user.contact ?? "—"}</TableCell>
                      <TableCell className="text-sm">{user.plant ?? "—"}</TableCell>
                      <TableCell className="text-sm">{user.department ?? "—"}</TableCell>
                      <TableCell>
                        {user.roles.length ? (
                          <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {roleName(user.roles[0]!)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusText status={user.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Panel>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border bg-muted/40 px-6 py-4">
            <DialogTitle className="text-base">{editing ? "Edit user" : "Create user"}</DialogTitle>
            <DialogDescription className="text-xs">
              Fields marked * are mandatory. Roles are maintained on the Roles screen and each user
              holds exactly one role.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[62vh] space-y-6 overflow-auto px-6 py-5">
            <Section title="Identity">
              <Field label="First Name *">
                <Input
                  value={form.first_name}
                  placeholder="Enter First Name"
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </Field>
              <Field label="Last Name *">
                <Input
                  value={form.last_name}
                  placeholder="Enter Last Name"
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </Field>
              <Field label="Username *">
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Enter Username"
                  disabled={!!editing}
                />
              </Field>
              <Field label="Email *">
                <Input
                  type="email"
                  value={form.email}
                  placeholder="Enter Email"
                  disabled={!!editing}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Info 1">
                <Input
                  value={form.info1}
                  placeholder="Enter Info 1"
                  onChange={(e) => setForm({ ...form, info1: e.target.value })}
                />
              </Field>
              <Field label="Info 2">
                <Input
                  value={form.info2}
                  placeholder="Enter Info 2"
                  onChange={(e) => setForm({ ...form, info2: e.target.value })}
                />
              </Field>
            </Section>

            <Section title="Contact & organisation">
              <Field label="Contact *">
                <Input
                  value={form.contact}
                  placeholder="Enter Contact"
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </Field>
              <Field label="Department">
                <Input
                  value={form.department}
                  placeholder="Enter Department"
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </Field>
              <Field label="Plant">
                <Input
                  value={form.plant}
                  placeholder="Enter Plant"
                  onChange={(e) => setForm({ ...form, plant: e.target.value })}
                />
              </Field>
              <Field label="Purchase Group">
                <Input
                  value={form.purchase_group}
                  placeholder="Enter Purchase Group"
                  onChange={(e) => setForm({ ...form, purchase_group: e.target.value })}
                />
              </Field>
              <Field label="Distribution Channel">
                <Input
                  value={form.distribution_channel}
                  placeholder="Enter Distribution Channel"
                  onChange={(e) => setForm({ ...form, distribution_channel: e.target.value })}
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
            </Section>

            <Section
              title="Access"
              hint={
                editing
                  ? "Leave both password fields blank to keep the current password."
                  : "Password must be at least 8 characters."
              }
            >
              <Field label="Role *">
                <Select
                  value={form.roleKey}
                  onValueChange={(value) => setForm({ ...form, roleKey: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role.key} value={role.key}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={editing ? "New Password" : "Password *"}>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  placeholder="Enter Password"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <PasswordStrength password={form.password} />
              </Field>
              <Field label={editing ? "Confirm New Password" : "Confirm Password *"}>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  placeholder="Enter Confirm Password"
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
                <PasswordMatchHint
                  password={form.password}
                  confirmPassword={form.confirmPassword}
                />
              </Field>
            </Section>
          </div>

          <DialogFooter className="border-t border-border bg-muted/40 px-6 py-3">
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

function initials(user: PortalUser) {
  const source =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.display_name ||
    user.username ||
    user.email ||
    "?";
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function StatusText({ status }: { status: UserStatus }) {
  const active = status === "active";
  return (
    <span
      className={
        active
          ? "inline-flex items-center gap-1.5 text-sm font-medium text-success"
          : "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-success" : "bg-muted-foreground"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </h3>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
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

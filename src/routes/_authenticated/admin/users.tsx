import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listPortalUsers, setUserRole } from "@/lib/admin.functions";
import type { AppRole } from "@/lib/sap.functions";
import { Panel, ReportShell } from "@/components/report-shell";
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
      { title: "Users & Roles — Nexus Analytics" },
      {
        name: "description",
        content: "Administer portal users and grant buyer, approver, viewer or admin roles.",
      },
      { property: "og:title", content: "Users & Roles — Nexus Analytics" },
      { property: "og:description", content: "Manage role-based access to procurement analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminUsers,
});

const ROLES: AppRole[] = ["admin", "buyer", "approver", "viewer"];

function AdminUsers() {
  const fetchUsers = useServerFn(listPortalUsers);
  const updateRole = useServerFn(setUserRole);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["portal-users"],
    queryFn: () => fetchUsers(),
  });

  const mutation = useMutation({
    mutationFn: (input: { userId: string; role: AppRole; enabled: boolean }) =>
      updateRole({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-users"] });
      queryClient.invalidateQueries({ queryKey: ["launchpad"] });
      toast.success("Role updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <ReportShell title="Users & Roles" description="Grant access to launchpad tiles and analytics reports.">
      {error ? (
        <p className="text-sm text-destructive">
          You need the admin role to manage users.
        </p>
      ) : isLoading ? (
        <Skeleton className="h-72 rounded-md" />
      ) : (
        <Panel title={`${data?.length ?? 0} users`}>
          <div className="overflow-auto rounded-sm border border-border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  {ROLES.map((role) => (
                    <TableHead key={role} className="capitalize">
                      {role}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.display_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{user.company ?? "—"}</TableCell>
                    {ROLES.map((role) => (
                      <TableCell key={role}>
                        <Switch
                          checked={user.roles.includes(role)}
                          disabled={mutation.isPending}
                          onCheckedChange={(checked) =>
                            mutation.mutate({ userId: user.id, role, enabled: checked })
                          }
                          aria-label={`${role} role for ${user.display_name ?? user.id}`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      )}
    </ReportShell>
  );
}

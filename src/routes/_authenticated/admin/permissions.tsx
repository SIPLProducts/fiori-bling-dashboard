import { Fragment, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listRoleScreens, setRoleScreen } from "@/lib/admin.functions";
import { listRoles } from "@/lib/access";
import { SCREEN_GROUPS, SCREENS, SUPER_ADMIN_ROLE_KEY } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";
import { AccessDenied, Panel, ReportShell } from "@/components/report-shell";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/permissions")({
  head: () => ({
    meta: [
      { title: "Screen Permissions — Nexus Analytics" },
      {
        name: "description",
        content: "Assign screen and module permissions to each portal role.",
      },
      { property: "og:title", content: "Screen Permissions — Nexus Analytics" },
      {
        property: "og:description",
        content: "Control which screens and SAP modules each role can open.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPermissions,
});

function AdminPermissions() {
  const queryClient = useQueryClient();
  const { data: launchpad } = useLaunchpad();
  const isSuperAdmin = launchpad?.isSuperAdmin ?? false;
  const canOpen = isSuperAdmin || (launchpad?.screens ?? []).includes("admin.permissions");

  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: () => listRoles() });
  const grantsQuery = useQuery({ queryKey: ["role-screens"], queryFn: () => listRoleScreens() });

  const roles = useMemo(
    () => (rolesQuery.data ?? []).filter((role) => role.key !== SUPER_ADMIN_ROLE_KEY),
    [rolesQuery.data],
  );

  const granted = useMemo(() => {
    const set = new Set<string>();
    for (const row of grantsQuery.data ?? []) set.add(`${row.role_key}::${row.screen_key}`);
    return set;
  }, [grantsQuery.data]);

  const mutation = useMutation({
    mutationFn: (input: { roleKey: string; screenKey: string; enabled: boolean }) =>
      setRoleScreen({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-screens"] });
      queryClient.invalidateQueries({ queryKey: ["launchpad"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (launchpad && !canOpen) {
    return (
      <ReportShell title="Screen Permissions" description="Assign screens to roles.">
        <AccessDenied area="screen permissions" />
      </ReportShell>
    );
  }

  const loading = rolesQuery.isLoading || grantsQuery.isLoading;

  return (
    <ReportShell
      title="Screen Permissions"
      description="Tick the screens and SAP modules each role may open. Sharvi Admin always has full access."
    >
      {loading ? (
        <Skeleton className="h-96 rounded-md" />
      ) : (
        <Panel title="Role / screen matrix">
          <div className="overflow-auto rounded-sm border border-border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="min-w-[240px]">Screen</TableHead>
                  {roles.map((role) => (
                    <TableHead key={role.key} className="text-center">
                      {role.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {SCREEN_GROUPS.map((group) => {
                  const screens = SCREENS.filter((screen) => screen.group === group);
                  if (!screens.length) return null;
                  return (
                    <Fragment key={group}>
                      <TableRow className="bg-muted/50">
                        <TableCell
                          colSpan={roles.length + 1}
                          className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                        >
                          {group}
                        </TableCell>
                      </TableRow>
                      {screens.map((screen) => (
                        <TableRow key={screen.key}>
                          <TableCell className="font-medium">{screen.label}</TableCell>
                          {roles.map((role) => {
                            const checked = granted.has(`${role.key}::${screen.key}`);
                            return (
                              <TableCell key={role.key} className="text-center">
                                <Checkbox
                                  checked={checked}
                                  disabled={mutation.isPending}
                                  aria-label={`${screen.label} for ${role.name}`}
                                  onCheckedChange={(value) =>
                                    mutation.mutate({
                                      roleKey: role.key,
                                      screenKey: screen.key,
                                      enabled: value === true,
                                    })
                                  }
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Panel>
      )}
    </ReportShell>
  );
}

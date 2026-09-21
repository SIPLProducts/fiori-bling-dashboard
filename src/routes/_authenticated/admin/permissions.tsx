import { Fragment, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { listRoleScreens, setRoleScreen, setRoleScreens } from "@/lib/admin.functions";
import { listRoles } from "@/lib/access";
import {
  MODULE_CHILD_SCREENS,
  PERMISSION_MODULES,
  SCREEN_GROUPS,
  SCREENS,
  SUPER_ADMIN_ROLE_KEY,
} from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";
import { AccessDenied, Panel, ReportShell } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
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
  const [expanded, setExpanded] = useState(() => new Set(PERMISSION_MODULES.map((module) => module.key)));

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

  const batchMutation = useMutation({
    mutationFn: (input: { roleKey: string; screenKeys: string[]; enabled: boolean }) =>
      setRoleScreens({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-screens"] });
      queryClient.invalidateQueries({ queryKey: ["launchpad"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pending = mutation.isPending || batchMutation.isPending;
  const childKeys = new Set(MODULE_CHILD_SCREENS.map((screen) => screen.key));
  const standaloneGroups = SCREEN_GROUPS.filter(
    (group) => group !== "SAP modules" && group !== "Tables Master",
  );

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
      description="Grant a complete module or choose its individual screens. Sharvi Admin always has full access."
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
                <TableRow className="bg-muted/50">
                  <TableCell
                    colSpan={roles.length + 1}
                    className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                  >
                    Modules and screens
                  </TableCell>
                </TableRow>
                {PERMISSION_MODULES.map((module) => {
                  const isExpanded = expanded.has(module.key);
                  return (
                    <Fragment key={module.key}>
                      <TableRow className="bg-muted/20">
                        <TableCell className="font-semibold">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="-ml-2 h-8 gap-2 px-2"
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${module.label}`}
                            onClick={() =>
                              setExpanded((current) => {
                                const next = new Set(current);
                                if (next.has(module.key)) next.delete(module.key);
                                else next.add(module.key);
                                return next;
                              })
                            }
                          >
                            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            {module.label}
                          </Button>
                        </TableCell>
                        {roles.map((role) => {
                          const count = module.children.filter((child) =>
                            granted.has(`${role.key}::${child.key}`),
                          ).length;
                          const state = count === module.children.length ? true : count > 0 ? "indeterminate" : false;
                          return (
                            <TableCell key={role.key} className="text-center">
                              <Checkbox
                                checked={state}
                                disabled={pending}
                                aria-label={`${module.label} for ${role.name}`}
                                onCheckedChange={() =>
                                  batchMutation.mutate({
                                    roleKey: role.key,
                                    screenKeys: module.children.map((child) => child.key),
                                    enabled: count !== module.children.length,
                                  })
                                }
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {isExpanded
                        ? module.children.map((screen) => (
                            <TableRow key={screen.key}>
                              <TableCell className="pl-12 text-sm text-muted-foreground">
                                {screen.label}
                              </TableCell>
                              {roles.map((role) => {
                                const checked = granted.has(`${role.key}::${screen.key}`);
                                return (
                                  <TableCell key={role.key} className="text-center">
                                    <Checkbox
                                      checked={checked}
                                      disabled={pending}
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
                          ))
                        : null}
                    </Fragment>
                  );
                })}
                {standaloneGroups.map((group) => {
                  const screens = SCREENS.filter(
                    (screen) => screen.group === group && !childKeys.has(screen.key),
                  );
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
                                   disabled={pending}
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

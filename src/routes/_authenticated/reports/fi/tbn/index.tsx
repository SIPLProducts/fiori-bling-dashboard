import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { TbnDashboard } from "@/components/tbn-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";
import { listAllZtbnRows, listZtbnColumns, subscribeZtbn } from "@/lib/ztbn";

export const Route = createFileRoute("/_authenticated/reports/fi/tbn/")({
  head: () => ({ meta: [
    { title: "TBN Management Dashboard — Financial Accounting" },
    { name: "description", content: "Live ZTBN debit, credit, balance, GL, and profit-centre analysis." },
    { property: "og:title", content: "TBN Management Dashboard — Financial Accounting" },
    { property: "og:description", content: "Live ZTBN debit, credit, balance, GL, and profit-centre analysis." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: TbnDashboardRoute,
});

function TbnDashboardRoute() {
  const queryClient = useQueryClient();
  const { data: launchpad, isLoading: accessLoading } = useLaunchpad();
  const allowed = launchpad?.isSuperAdmin || hasScreen(launchpad?.screens, "fi.tbn");
  const columns = useQuery({ queryKey: ["ztbn-columns"], queryFn: listZtbnColumns, enabled: Boolean(allowed), staleTime: 300_000 });
  const rows = useQuery({
    queryKey: ["ztbn-dashboard-rows"],
    queryFn: listAllZtbnRows,
    enabled: Boolean(allowed),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!allowed) return;
    let refreshTimer: number | undefined;
    const unsubscribe = subscribeZtbn(() => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["ztbn-dashboard-rows"] });
        void queryClient.invalidateQueries({ queryKey: ["ztbn-rows"] });
      }, 300);
    });
    return () => {
      window.clearTimeout(refreshTimer);
      unsubscribe();
    };
  }, [allowed, queryClient]);
  if (accessLoading) return <ReportShell title="TBN" description="Loading management dashboard…"><Skeleton className="h-[650px] w-full" /></ReportShell>;
  if (!allowed) return <ReportShell title="TBN" description="ZTBN management dashboard"><AccessDenied area="TBN" /></ReportShell>;
  if (columns.error || rows.error) return <ReportShell title="TBN" description="ZTBN management dashboard"><p className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">Unable to load TBN dashboard data. Please refresh.</p></ReportShell>;
  if (columns.isLoading || rows.isLoading) return <ReportShell title="TBN" description="Loading management dashboard…"><Skeleton className="h-[650px] w-full" /></ReportShell>;
  return <ReportShell title="TBN" description="Financial accounting management dashboard" tcode="ZTBN"><TbnDashboard rows={rows.data ?? []} columns={columns.data ?? []} /></ReportShell>;
}
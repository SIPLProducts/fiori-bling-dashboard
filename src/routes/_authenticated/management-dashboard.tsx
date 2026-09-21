import { createFileRoute } from "@tanstack/react-router";
import { ManagementDashboard } from "@/components/management/dashboard";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/management-dashboard")({
  head: () => ({
    meta: [
      { title: "Management Sales Dashboard — Executive Overview" },
      {
        name: "description",
        content:
          "Executive sales overview with KPIs, sales trend, segment mix, top customers, Pareto contribution and management alerts.",
      },
      { property: "og:title", content: "Management Sales Dashboard — Executive Overview" },
      {
        property: "og:description",
        content:
          "Executive sales overview with KPIs, sales trend, segment mix, top customers, Pareto contribution and management alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagementDashboardPage,
});

function ManagementDashboardPage() {
  const { data, isLoading } = useLaunchpad();
  const allowed = hasScreen(data?.screens, "sd.total-sales");
  if (!isLoading && !allowed) {
    return (
      <ReportShell title="Management Sales Dashboard" description="Executive sales overview">
        <AccessDenied area="Management Sales Dashboard" />
      </ReportShell>
    );
  }
  return <ManagementDashboard />;
}

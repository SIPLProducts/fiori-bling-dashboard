import { createFileRoute } from "@tanstack/react-router";
import { OpenSalesOrdersDashboard } from "@/components/open-sales-orders-dashboard";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/sd/open-sales-orders")({
  head: () => ({
    meta: [
      { title: "Open Sales Orders — Nexus" },
      { name: "description", content: "Monitor open sales orders across regions, customers and products." },
      { property: "og:title", content: "Open Sales Orders — Nexus" },
      { property: "og:description", content: "Open order values, quantities, trends and delivery insights." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpenSalesOrdersPage,
});

function OpenSalesOrdersPage() {
  const { data, isLoading } = useLaunchpad();
  const allowed = hasScreen(data?.screens, "sd.open-sales-orders");

  return (
    <ReportShell title="" description="">
      {!isLoading && !allowed ? <AccessDenied area="Open Sales Orders" /> : <OpenSalesOrdersDashboard />}
    </ReportShell>
  );
}
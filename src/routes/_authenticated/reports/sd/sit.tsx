import { createFileRoute } from "@tanstack/react-router";
import { OpenSalesOrdersDashboard } from "@/components/open-sales-orders-dashboard";
import { OrderBookWording } from "@/components/order-wording";
import { AccessDenied } from "@/components/report-shell";
import { ShellBar } from "@/components/shell-bar";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/sd/sit")({
  head: () => ({ meta: [
    { title: "Sales In Transit (SIT) — HBL MIS Portal" },
    { name: "description", content: "Sales in transit values by zone, plant and group from SAP." },
    { property: "og:title", content: "Sales In Transit (SIT) — HBL MIS Portal" },
    { property: "og:description", content: "Sales in transit values by zone, plant and group from SAP." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SitPage,
});

function SitPage() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "sd.sit");
  return (
    <div className="open-orders-page min-h-screen bg-background">
      <ShellBar title="Sales In Transit (SIT)" displayName={data?.profile?.display_name} screens={data?.screens} />
      <main className="p-2 sm:p-3">
        {!isLoading && !allowed ? <AccessDenied area="Sales In Transit" /> : <OrderBookWording.Provider value="sit"><OpenSalesOrdersDashboard variant="sit" /></OrderBookWording.Provider>}
      </main>
    </div>
  );
}

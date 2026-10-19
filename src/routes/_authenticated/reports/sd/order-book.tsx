import { createFileRoute } from "@tanstack/react-router";
import { OpenSalesOrdersDashboard } from "@/components/open-sales-orders-dashboard";
import { AccessDenied } from "@/components/report-shell";
import { ShellBar } from "@/components/shell-bar";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/sd/order-book")({
  head: () => ({ meta: [
    { title: "Order Book Report — HBL MIS Portal" },
    { name: "description", content: "Order book values, customers, products and plants from SAP." },
    { property: "og:title", content: "Order Book Report — HBL MIS Portal" },
    { property: "og:description", content: "Order book values, customers, products and plants from SAP." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: OrderBookPage,
});

function OrderBookPage() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "sd.order-book");
  return (
    <div className="open-orders-page min-h-screen bg-background">
      <ShellBar title="Order Book Report" displayName={data?.profile?.display_name} screens={data?.screens} />
      <main className="p-2 sm:p-3">
        {!isLoading && !allowed ? <AccessDenied area="Order Book" /> : <OpenSalesOrdersDashboard variant="order-book" />}
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ModuleComingSoon } from "@/components/module-coming-soon";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/sd/order-book")({
  head: () => ({ meta: [
    { title: "Order Book — HBL MIS Portal" },
    { name: "description", content: "Sales and Distribution order book reporting." },
    { property: "og:title", content: "Order Book — HBL MIS Portal" },
    { property: "og:description", content: "Sales and Distribution order book reporting." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: OrderBookPage,
});

function OrderBookPage() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "sd.order-book");
  return <ReportShell title="Order Book" description="Sales & Distribution">
    {!isLoading && !allowed ? <AccessDenied area="Order Book" /> : <ModuleComingSoon title="Order Book" />}
  </ReportShell>;
}
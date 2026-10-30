import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { InventoryMasterFilters, type InventoryFilters } from "@/components/inventory-master-filters";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/inv/month-wise-stock")({
  head: () => ({ meta: [
    { title: "Month Wise Stock — HBL MIS Portal" },
    { name: "description", content: "Inventory: Month-by-month stock levels." },
    { property: "og:title", content: "Month Wise Stock — HBL MIS Portal" },
    { property: "og:description", content: "Inventory: Month-by-month stock levels." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const [filters, setFilters] = useState<InventoryFilters>({});
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "inv.month-wise-stock");
  return <ReportShell title="Month Wise Stock" description="Inventory">
    {!isLoading && !allowed ? <AccessDenied area="Month Wise Stock" /> : <><InventoryMasterFilters value={filters} onChange={setFilters} /><div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">Month Wise Stock data will appear here once the SAP API is connected.</div></>}
  </ReportShell>;
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { InventoryMasterFilters, type InventoryFilters } from "@/components/inventory-master-filters";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/inv/inventory-aging")({
  head: () => ({ meta: [
    { title: "Inventory Aging — HBL MIS Portal" },
    { name: "description", content: "Inventory: Stock aging by age bucket." },
    { property: "og:title", content: "Inventory Aging — HBL MIS Portal" },
    { property: "og:description", content: "Inventory: Stock aging by age bucket." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const [filters, setFilters] = useState<InventoryFilters>({});
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "inv.inventory-aging");
  return <ReportShell title="Inventory Aging" description="Inventory">
    {!isLoading && !allowed ? <AccessDenied area="Inventory Aging" /> : <><InventoryMasterFilters value={filters} onChange={setFilters} /><div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">Inventory Aging data will appear here once the SAP API is connected.</div></>}
  </ReportShell>;
}

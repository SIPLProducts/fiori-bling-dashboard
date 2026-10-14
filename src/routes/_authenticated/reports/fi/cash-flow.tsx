import { createFileRoute } from "@tanstack/react-router";
import { CashFlowDashboard } from "@/components/cash-flow-dashboard";
import { ShellBar } from "@/components/shell-bar";
import { AccessDenied } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/fi/cash-flow")({
  head: () => ({ meta: [
    { title: "Cash Flow Dashboard — HBL MIS Portal" },
    { name: "description", content: "Cash Flow sample dashboard with credit and debit trends, plant analysis and a transaction ledger." },
    { property: "og:title", content: "Cash Flow Dashboard — HBL MIS Portal" },
    { property: "og:description", content: "Financial Accounting cash flow analysis and sample transaction reporting." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CashFlowPage,
});

function CashFlowPage() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "fi.cash-flow");
  return <div className="cash-screen min-h-screen"><ShellBar title="Cash Flow" displayName={data?.profile?.display_name} screens={data?.screens} />
    {isLoading ? <p className="p-8 text-muted-foreground">Loading Cash Flow…</p> : !allowed ? <AccessDenied area="Cash Flow" /> : <CashFlowDashboard />}
  </div>;
}
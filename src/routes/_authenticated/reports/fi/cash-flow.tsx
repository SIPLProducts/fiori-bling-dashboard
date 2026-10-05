import { createFileRoute } from "@tanstack/react-router";
import { ModuleComingSoon } from "@/components/module-coming-soon";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/fi/cash-flow")({
  head: () => ({ meta: [
    { title: "Cash Flow — HBL MIS Portal" },
    { name: "description", content: "Financial Accounting cash flow reporting." },
    { property: "og:title", content: "Cash Flow — HBL MIS Portal" },
    { property: "og:description", content: "Financial Accounting cash flow reporting." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CashFlowPage,
});

function CashFlowPage() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "fi.cash-flow");
  return <ReportShell title="Cash Flow" description="Financial Accounting">
    {!isLoading && !allowed ? <AccessDenied area="Cash Flow" /> : <ModuleComingSoon title="Cash Flow" />}
  </ReportShell>;
}
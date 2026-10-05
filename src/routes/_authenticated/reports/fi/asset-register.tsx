import { createFileRoute } from "@tanstack/react-router";
import { ModuleComingSoon } from "@/components/module-coming-soon";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/fi/asset-register")({
  head: () => ({ meta: [
    { title: "Asset Register — HBL MIS Portal" },
    { name: "description", content: "Financial Accounting asset register reporting." },
    { property: "og:title", content: "Asset Register — HBL MIS Portal" },
    { property: "og:description", content: "Financial Accounting asset register reporting." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AssetRegisterPage,
});

function AssetRegisterPage() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "fi.asset-register");
  return <ReportShell title="Asset Register" description="Financial Accounting">
    {!isLoading && !allowed ? <AccessDenied area="Asset Register" /> : <ModuleComingSoon title="Asset Register" />}
  </ReportShell>;
}
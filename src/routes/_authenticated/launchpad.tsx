import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Building2, Factory, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { ShellBar } from "@/components/shell-bar";
import { LaunchpadDashboardCard } from "@/components/launchpad-dashboard-card";
import { NetSalesLaunchCard } from "@/components/net-sales-launch-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLaunchpad } from "@/lib/use-launchpad";
import { ROLE_HEADLINE, orderGroupsForRoles, primaryRole } from "@/lib/nav";


export const Route = createFileRoute("/_authenticated/launchpad")({
  head: () => ({
    meta: [
      { title: "Launchpad — Nexus Procurement Analytics" },
      {
        name: "description",
        content: "Role-based launchpad of SAP procurement KPIs, reports and analytical tiles.",
      },
      { property: "og:title", content: "Launchpad — Nexus Procurement Analytics" },
      { property: "og:description", content: "Your SAP procurement tiles, KPIs and reports in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Launchpad,
});

function Launchpad() {
  const { data, isLoading, error } = useLaunchpad();
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const [placeholder, setPlaceholder] = useState<string | null>(null);

  // Only show groups that actually contain tiles this role may see, ordered by role focus.
  const groups = useMemo(() => {
    if (!data) return [];
    const withTiles = data.groups.filter((group) =>
      data.tiles.some((tile) => tile.group_key === group.key),
    );
    return orderGroupsForRoles(withTiles, data.roles);
  }, [data]);

  const role = primaryRole(data?.roles);
  const allowedGroups = new Set(groups.map((group) => group.key));
  const allowedKpis = new Set(data?.tiles.map((tile) => tile.kpi_key).filter(Boolean) ?? []);
  const hasGroup = (key: string) => allowedGroups.has(key) && (activeGroup === "all" || activeGroup === key);
  const kpi = (key: string, fallback: string) => {
    const metric = data?.kpis[key];
    if (!metric) return fallback;
    if (metric.value >= 1000) return `${(metric.value / 1000).toFixed(2)}K`;
    return Number.isInteger(metric.value) ? String(metric.value) : metric.value.toFixed(1);
  };
  const openPlaceholder = (name: string) => setPlaceholder(name);

  const sectionMeta: Record<string, { subtitle: string; icon: typeof BarChart3 }> = {
    "sales-distribution": { subtitle: "Quarterly Realtime Tracking", icon: BarChart3 },
    "financial-accounting": { subtitle: "FI General Ledger & Cash Analysis", icon: Building2 },
    "production-planning": { subtitle: "PP Operations & Work Centre Status", icon: Factory },
    "tables-master": { subtitle: "SAP Schema & Dictionary Tables", icon: Layers3 },
  };

  function SectionHeading({ groupKey, title }: { groupKey: string; title: string }) {
    const meta = sectionMeta[groupKey];
    const Icon = meta?.icon ?? Layers3;
    return <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="flex min-w-0 items-center gap-2"><Icon className="size-3.5 shrink-0 text-primary"/><h2 className="truncate text-[11px] font-semibold tracking-wider text-launchpad-muted uppercase">{title}</h2></div><p className="hidden text-[10px] text-launchpad-muted sm:block">{meta?.subtitle}</p></div>;
  }

  return (
    <div className="min-h-screen bg-launchpad-canvas">
      <ShellBar title="Home" displayName={data?.profile?.display_name} screens={data?.screens} />


      <div className="border-t border-shell-foreground/10 border-b border-shell-foreground/15 bg-shell shadow-sm">
        <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 sm:px-6" role="tablist" aria-label="Launchpad modules">
          {[{ key: "all", title: "All" }, ...groups].map((group) => (
            <button
              key={group.key}
              type="button"
              role="tab"
              aria-selected={activeGroup === group.key}
              onClick={() => setActiveGroup(group.key)}
              className={`relative my-1 min-h-8 shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-shell-foreground focus-visible:outline-none ${
                activeGroup === group.key
                  ? "border-shell-foreground/80 bg-shell-foreground text-shell shadow-sm"
                  : "border-transparent text-shell-muted hover:bg-shell-foreground/10 hover:text-shell-foreground"
              }`}
            >
              {group.key === "all" ? "All Modules" : group.title}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6">
        {error ? (
          <p className="text-sm text-destructive">Could not load your launchpad. Please refresh.</p>
        ) : null}

        {data && data.roles.length === 0 ? (
          <div className="mb-6 rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
            Your account has no role assigned yet. Ask an administrator to grant you access.
          </div>
        ) : null}

        {data && data.roles.length > 0 && !isLoading && data.tiles.length === 0 ? (
          <div className="mb-6 rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
            Your role has no screens assigned yet — ask an administrator to grant screens in
            Administration → Screen Permissions.
          </div>
        ) : null}


        {role ? (
          <div className="mb-7 grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-2.5 shadow-launchpad-tile">
            <div className="flex min-w-0 items-center gap-2.5"><span className="shrink-0 rounded-full bg-primary/8 px-3 py-1 text-[9px] font-semibold tracking-wide text-primary uppercase">
              {role}
            </span><span className="truncate text-[10px] text-muted-foreground">{ROLE_HEADLINE[role]}</span></div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-success/8 px-3 py-1 text-[9px] font-semibold text-success"><span className="size-1.5 rounded-full bg-success shadow-[0_0_7px_var(--color-success)]"/> <span className="hidden sm:inline">Live Session Active</span></span>
          </div>
        ) : null}


        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-[152px] rounded-md" />
            ))}
          </div>
        ) : (
          <>
            {hasGroup("sales-distribution") ? <section className="mb-8"><SectionHeading groupKey="sales-distribution" title="Sales & Distribution"/><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"><div className="sm:col-span-2"><NetSalesLaunchCard fallback={null}/></div>{allowedKpis.has("sd_open_orders") ? <LaunchpadDashboardCard title="Open Sales Orders" subtitle="Not yet delivered" value={kpi("sd_open_orders", "1.26K")} note={<span className="text-warning">● Delivery pending</span>} footer="Open Orders" icon="sales" to="open-orders"/> : null}<LaunchpadDashboardCard title="Fulfillment Rate" subtitle="Dispatch compliance" value="97.4" unit="%" note={<span className="text-success">↗ +2.3% from last month</span>} footer="View Report" icon="fulfillment" onPlaceholder={() => openPlaceholder("Fulfillment Rate")}/><LaunchpadDashboardCard title="Billing Cleared" subtitle="Current billing cycle" value="8,412" note={<span>✓ 99.1% processed</span>} footer="Open Billing" icon="billing" onPlaceholder={() => openPlaceholder("Billing Cleared")}/></div></section> : null}

            {hasGroup("financial-accounting") ? <section className="mb-8"><SectionHeading groupKey="financial-accounting" title="Financial Accounting"/><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"><LaunchpadDashboardCard title="FI — Financial Accounting" subtitle="Receivables, payables, cash and closing status overview." footer="Module App" icon="finance" overview to="fi"/>{allowedKpis.has("fi_receivables") ? <LaunchpadDashboardCard title="Open Receivables" subtitle="All company codes" value={kpi("fi_receivables", "13.3")} unit="M EUR" note="All company codes" footer="View Ledger" icon="finance" to="fi"/> : null}{allowedKpis.has("fi_payables") ? <LaunchpadDashboardCard title="Open Payables" subtitle="Due within 30 days" value={kpi("fi_payables", "8.1")} unit="M EUR" note="Due within 30 days" footer="Payables List" icon="billing" to="fi"/> : null}{allowedKpis.has("fi_dso") ? <LaunchpadDashboardCard title="Days Sales Outstanding" subtitle="Rolling average" value={kpi("fi_dso", "44")} unit="Days" note="Rolling average" footer="DSO Report" icon="clock" to="fi"/> : null}{allowedKpis.has("fi_cash_trend") ? <LaunchpadDashboardCard title="Cash Flow Trend" subtitle="Monthly net cash" footer="Cash Analytics" icon="trend" chart={[34,58,42,76,48,85,62,91]} to="fi"/> : null}</div></section> : null}

            {hasGroup("production-planning") ? <section className="mb-8"><SectionHeading groupKey="production-planning" title="Production Planning"/><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"><LaunchpadDashboardCard title="PP — Production Planning" subtitle="Production orders, capacity load and adherence tracking." footer="Module App" icon="production" overview to="pp"/>{allowedKpis.has("pp_open_orders") ? <LaunchpadDashboardCard title="Open Production Orders" subtitle="Released and in progress" value={kpi("pp_open_orders", "389")} note="Released and in progress" footer="Orders Pool" icon="production" to="pp"/> : null}{allowedKpis.has("pp_schedule_adherence") ? <LaunchpadDashboardCard title="Schedule Adherence" subtitle="Last 30 days" value={kpi("pp_schedule_adherence", "93")} unit="%" note="Last 30 days" footer="Schedules" icon="fulfillment" to="pp"/> : null}{allowedKpis.has("pp_capacity_load") ? <LaunchpadDashboardCard title="Capacity Utilisation" subtitle="All work centres" value={kpi("pp_capacity_load", "85")} unit="%" note="All work centres" footer="Capacity Details" icon="chart" to="pp"/> : null}{allowedKpis.has("pp_output_trend") ? <LaunchpadDashboardCard title="Output Trend" subtitle="Monthly confirmed output" footer="Confirmed Output" icon="trend" chart={[46,73,58,88,62,76,53,82]} to="pp"/> : null}</div></section> : null}

            {hasGroup("tables-master") ? <section className="mb-4"><SectionHeading groupKey="tables-master" title="Tables Master"/><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"><LaunchpadDashboardCard eyebrow="KNA1" title="Customer Master" subtitle="Business partner & sold-to master data" footer="12.8k records" icon="users" compact onPlaceholder={() => openPlaceholder("Customer Master (KNA1)")}/><LaunchpadDashboardCard eyebrow="MARA" title="Material Master" subtitle="Product & material master data" footer="45.2k records" icon="material" compact onPlaceholder={() => openPlaceholder("Material Master (MARA)")}/><LaunchpadDashboardCard eyebrow="LFA1" title="Vendor Master" subtitle="Supplier master data" footer="3.4k records" icon="sales" compact onPlaceholder={() => openPlaceholder("Vendor Master (LFA1)")}/><LaunchpadDashboardCard eyebrow="T001W" title="Plant Master" subtitle="Plants, profit centres & org units" footer="28 units" icon="production" compact onPlaceholder={() => openPlaceholder("Plant Master (T001W)")}/><LaunchpadDashboardCard eyebrow="Custom" title="ZFISALES_DETAIL" subtitle="Table / SAP API mapping" footer="Sync Active" icon="grid" compact to="zfisales"/></div></section> : null}
          </>
        )}

        {data ? (
          <p className="mt-8 text-xs text-muted-foreground">
            Data source: {data.providerMode === "mock" ? "sample data (SAP not connected)" : "SAP OData"}
          </p>
        ) : null}
      </main>
      <Sheet open={Boolean(placeholder)} onOpenChange={(open) => !open && setPlaceholder(null)}><SheetContent className="w-[min(90vw,400px)] border-border bg-launchpad-canvas"><SheetHeader className="mt-8 text-left"><span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-5"/></span><SheetTitle>{placeholder}</SheetTitle><SheetDescription>This screen is under development. Its launchpad card is available as a preview of the planned module.</SheetDescription></SheetHeader><div className="mt-8 rounded-2xl border border-border/70 bg-launchpad-tile p-4 shadow-launchpad-tile"><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-success"/><div><p className="text-sm font-medium text-card-foreground">Access preserved</p><p className="mt-1 text-xs text-muted-foreground">No data source, permission, or route has been changed.</p></div></div></div></SheetContent></Sheet>
    </div>
  );
}

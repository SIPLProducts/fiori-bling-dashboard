import { useMemo } from "react";
import { useUserAccess } from "@/lib/use-user-access";
import { scopeRowsToAssigned } from "@/lib/user-access";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useReportSync } from "@/lib/use-report-sync";
import { lastSyncedLabel } from "@/lib/report-sync-time";
import { summarizeLaunchOrders, type LaunchOrderRow } from "@/lib/open-orders-launch-summary";
import { currentReportPeriod, inReportPeriod, reportPeriodLabel } from "@/lib/report-period";

const BAR_TONES = ["var(--kpi-1)", "var(--kpi-2)", "var(--kpi-3)", "var(--kpi-4)"];
const formatValue = (value: number) => `₹${(value / 10_000_000).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
type Summary = ReturnType<typeof summarizeLaunchOrders>;

async function fetchOrderBookRows() {
  const pageSize = 1_000;
  const allRows: { netwr: number | string | null; vtext_dc: string | null; auart: string | null; plant: string | null; profit_center: string | null; created_date: string | null }[] = [];
  for (let page = 0; ; page += 1) {
    const result = await supabase.from("order_book").select("netwr,vtext_dc,auart,plant,profit_center,created_date")
      .order("id", { ascending: true }).range(page * pageSize, (page + 1) * pageSize - 1);
    if (result.error) throw result.error;
    const rows = result.data ?? [];
    allRows.push(...rows);
    if (rows.length < pageSize) break;
  }
  return allRows;
}

export function OrderBookLaunchCard({ fallback }: { fallback: React.ReactNode }) {
  const { data: rows, isLoading } = useQuery({
    queryKey: ["order-book-launch-summary", "netwr-current-fy-v2"],
    queryFn: fetchOrderBookRows,
    staleTime: Infinity, gcTime: Infinity, refetchOnMount: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
  const access = useUserAccess();
  const period = useMemo(() => currentReportPeriod(), []);
  const data = useMemo(() => rows ? summarizeLaunchOrders(scopeRowsToAssigned(rows.filter((r) => inReportPeriod(r.created_date, period)), access, { plant: (r) => r.plant, profitCentre: (r) => r.profit_center })
    .map((r) => ({ p_value1: r.netwr, sales_type: r.vtext_dc, order_type: r.auart })), { byCode: true, all: true }) : undefined, [rows, access, period]);
  const { data: lastSynced } = useReportSync("order-book");
  if (isLoading) return <div className="h-[188px] w-full animate-pulse rounded-2xl border border-border bg-launchpad-tile" />;
  if (!data) return <>{fallback}</>;
  return <LaunchSummaryCard data={data} lastSynced={lastSynced} title="Order Book" subtitle="Current FY Orders" caption={reportPeriodLabel(period)} lineLabel="order lines" href="/reports/sd/order-book" />;
}

async function fetchSitRows() {
  const pageSize = 1_000;
  const allRows: { netwr_tot: number | string | null; vtext_dc: string | null; auart: string | null; werks: string | null; prctr: string | null; fkdat: string | null }[] = [];
  for (let page = 0; ; page += 1) {
    const result = await supabase.from("sales_in_transit").select("netwr_tot,vtext_dc,auart,werks,prctr,fkdat")
      .order("id", { ascending: true }).range(page * pageSize, (page + 1) * pageSize - 1);
    if (result.error) throw result.error;
    const rows = result.data ?? [];
    allRows.push(...rows);
    if (rows.length < pageSize) break;
  }
  return allRows;
}

export function SitLaunchCard({ fallback }: { fallback: React.ReactNode }) {
  const { data: rows, isLoading } = useQuery({
    queryKey: ["sit-launch-summary", "netwr-tot-auart-v3"],
    queryFn: fetchSitRows,
    staleTime: Infinity, gcTime: Infinity, refetchOnMount: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
  const access = useUserAccess();
  const period = useMemo(() => currentReportPeriod(), []);
  // SIT is a current in-transit snapshot: count every stored line regardless of billing date.
  const data = useMemo(() => rows ? summarizeLaunchOrders(scopeRowsToAssigned(rows, access, { plant: (r) => r.werks, profitCentre: (r) => r.prctr })
    .map((r) => ({ p_value1: r.netwr_tot, sales_type: r.vtext_dc, order_type: r.auart })), { all: true }) : undefined, [rows, access, period]);
  const { data: lastSynced } = useReportSync("sit");
  if (isLoading) return <div className="h-[188px] w-full animate-pulse rounded-2xl border border-border bg-launchpad-tile" />;
  if (!data) return <>{fallback}</>;
  return <LaunchSummaryCard data={data} lastSynced={lastSynced} title="Sales In Transit (SIT)" subtitle="All SIT" caption="All billing dates" lineLabel="SIT lines" href="/reports/sd/sit" />;
}

async function fetchSalesRegisterRows() {
  const allRows: { netwr_t: number | string | null; vtext_dc: string | null; auart: string | null; werks: string | null; prctr: string | null }[] = [];
  for (let page = 0; ; page += 1) {
    const result = await supabase.from("sales_register").select("netwr_t,vtext_dc,auart,werks,prctr")
      .order("id", { ascending: true }).range(page * 1000, (page + 1) * 1000 - 1);
    if (result.error) throw result.error;
    const rows = result.data ?? [];
    allRows.push(...rows);
    if (rows.length < 1000) break;
  }
  return allRows;
}

export function SalesRegisterLaunchCard({ fallback }: { fallback: React.ReactNode }) {
  const { data: rows, isLoading } = useQuery({
    queryKey: ["sales-register-launch-summary", "netwr-t-auart-v1"],
    queryFn: fetchSalesRegisterRows,
    staleTime: Infinity, gcTime: Infinity, refetchOnMount: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
  const access = useUserAccess();
  const data = useMemo(() => rows ? summarizeLaunchOrders(scopeRowsToAssigned(rows, access, { plant: (r) => r.werks, profitCentre: (r) => r.prctr })
    .map((r) => ({ p_value1: r.netwr_t, sales_type: r.auart && r.vtext_dc ? `${r.auart.trim()} — ${r.vtext_dc.trim()}` : r.vtext_dc, order_type: r.auart })), { all: true }) : undefined, [rows, access]);
  const { data: lastSynced } = useReportSync("sales-register");
  if (isLoading) return <div className="h-[188px] w-full animate-pulse rounded-2xl border border-border bg-launchpad-tile" />;
  if (!data || !rows?.length) return <>{fallback}</>;
  return <LaunchSummaryCard data={data} lastSynced={lastSynced} title="Sales Register" subtitle="All billed" caption="All billing dates" lineLabel="invoice lines" href="/reports/sd/dispatches" />;
}

async function fetchSummary(): Promise<Summary> {
  const pageSize = 1_000;
  let page = 0;
  const allRows: LaunchOrderRow[] = [];

  while (true) {
    const result = await supabase.from("open_sales_orders").select("p_value1,sales_type,order_type")
      .eq("is_active_snapshot", true)
      .order("id", { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (result.error) throw result.error;
    const rows = result.data ?? [];
    allRows.push(...rows);
    if (rows.length < pageSize) break;
    page += 1;
  }

  return summarizeLaunchOrders(allRows);
}

export function OpenSalesOrdersLaunchCard({ fallback }: { fallback: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["open-sales-orders-launch-summary", "p-value1-all-active-v5"],
    queryFn: fetchSummary,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: lastSynced } = useReportSync("open-sales-orders");

  if (isLoading) return <div className="h-[188px] w-full animate-pulse rounded-2xl border border-border bg-launchpad-tile" />;
  if (!data) return <>{fallback}</>;
  return <LaunchSummaryCard data={data} lastSynced={lastSynced} title="Open Sales Orders" subtitle="Total Open Orders" lineLabel="open order lines" href="/reports/sd/open-sales-orders" />;
}

function LaunchSummaryCard({ data, lastSynced, title, subtitle, caption, lineLabel, href }: { data: Summary; lastSynced: string | null | undefined; title: string; subtitle: string; caption?: string; lineLabel: string; href: "/reports/sd/open-sales-orders" | "/reports/sd/order-book" | "/reports/sd/sit" | "/reports/sd/dispatches" }) {
  return (
    <section aria-label={`${title} all dates`} className="flex h-full min-h-[188px] flex-col overflow-hidden rounded-2xl border p-4 text-left shadow-launchpad-tile" style={{
      borderColor: "color-mix(in oklab, var(--kpi-1) 28%, var(--color-border))",
      background: "linear-gradient(160deg, color-mix(in oklab, var(--kpi-1) var(--kpi-tint), var(--color-launchpad-tile)) 0%, var(--color-launchpad-tile) 70%)",
    }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-primary uppercase">{title}</p>
          <p className="mt-2 text-[26px] xl:text-[22px] 2xl:text-[26px] leading-none font-semibold tabular-nums" style={{ color: BAR_TONES[0] }}>{formatValue(data.openValue)}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary shadow-sm"><ShoppingCart className="size-[18px]" /></span>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[9px] font-semibold text-primary">{subtitle}</p>
        <p className="text-[9px] font-medium text-foreground tabular-nums">{data.count.toLocaleString("en-IN")} {lineLabel}</p>
      </div>
      {caption && <p className="mt-1 text-[9px] text-muted-foreground tabular-nums">{caption}</p>}
      <div className="my-3 space-y-2.5">
        {data.breakdown.map((group, index) => (
          <div key={group.name}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[9px] leading-snug">
              <span className="min-w-0 font-medium text-foreground">{group.name}</span>
              <span className="flex flex-wrap gap-x-2 text-muted-foreground tabular-nums">
                <span>{group.count.toLocaleString("en-IN")} lines</span>
                <span className="font-semibold text-foreground">{formatValue(group.value)}</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${group.name}: ${group.share.toFixed(1)}% of value`}>
              <div className="h-full rounded-full" style={{ width: `${group.share}%`, background: BAR_TONES[index % BAR_TONES.length] }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 launch-footer grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[10px] text-muted-foreground">
        <span className="min-w-0 leading-relaxed">{lastSyncedLabel(lastSynced)}</span>
        <Link to={href} aria-label={`Open ${title} details`} className="group inline-flex min-h-8 items-center gap-1 rounded-full btn-action px-4 font-semibold transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transform-none">
          Open<span className="launch-details"> Details</span>
          <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
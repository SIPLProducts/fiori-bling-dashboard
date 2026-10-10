import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useReportSync } from "@/lib/use-report-sync";
import { lastSyncedLabel } from "@/lib/report-sync-time";
import { summarizeLaunchOrders, type LaunchOrderRow } from "@/lib/open-orders-launch-summary";

const BAR_TONES = ["var(--kpi-1)", "var(--kpi-2)", "var(--kpi-3)", "var(--kpi-4)"];
const formatValue = (value: number) => `₹${(value / 10_000_000).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
type Summary = ReturnType<typeof summarizeLaunchOrders>;

async function fetchSummary(): Promise<Summary> {
  const pageSize = 1_000;
  let page = 0;
  const allRows: LaunchOrderRow[] = [];

  while (true) {
    const result = await supabase.from("open_sales_orders").select("kwert_inr,sales_type,order_type")
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
    queryKey: ["open-sales-orders-launch-summary", "kwert-inr-all-active-v3"],
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

  return (
    <section aria-label="Open Sales Orders all dates" className="flex h-full min-h-[188px] flex-col overflow-hidden rounded-2xl border p-4 text-left shadow-launchpad-tile" style={{
      borderColor: "color-mix(in oklab, var(--kpi-1) 28%, var(--color-border))",
      background: "linear-gradient(160deg, color-mix(in oklab, var(--kpi-1) var(--kpi-tint), var(--color-launchpad-tile)) 0%, var(--color-launchpad-tile) 70%)",
    }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-primary uppercase">Open Sales Orders</p>
          <p className="mt-2 text-[26px] leading-none font-semibold tabular-nums" style={{ color: BAR_TONES[0] }}>{formatValue(data.openValue)}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary shadow-sm"><ShoppingCart className="size-[18px]" /></span>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[11px] font-semibold text-primary">Total Open Orders</p>
        <p className="text-[11px] font-medium text-foreground tabular-nums">{data.count.toLocaleString("en-IN")} open order lines</p>
      </div>
      <div className="my-3 space-y-2.5">
        {data.breakdown.map((group, index) => (
          <div key={group.name}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[11px] leading-snug">
              <span className="min-w-0 font-medium text-foreground">{group.name}</span>
              <span className="flex flex-wrap gap-x-2 text-muted-foreground tabular-nums">
                <span>{group.count.toLocaleString("en-IN")} lines</span>
                <span className="font-semibold text-foreground">{formatValue(group.value)}</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${group.name}: ${group.share.toFixed(1)}% of open value`}>
              <div className="h-full rounded-full" style={{ width: `${group.share}%`, background: BAR_TONES[index % BAR_TONES.length] }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 min-[1100px]:grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[10px] text-muted-foreground">
        <span className="min-w-0 leading-relaxed">{lastSyncedLabel(lastSynced)}</span>
        <Link to="/reports/sd/open-sales-orders" aria-label="Open Open Sales Orders details" className="group inline-flex min-h-8 items-center gap-1 rounded-full bg-launchpad-tile-footer px-4 font-semibold text-primary shadow-launchpad-inset transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transform-none">
          View details
          <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
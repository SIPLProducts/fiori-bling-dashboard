import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { currentReportPeriod, reportPeriodLabel } from "@/lib/report-period";
import { useReportSync } from "@/lib/use-report-sync";
import { DEFAULT_DOCUMENT_TYPES } from "@/lib/open-sales-orders-filters";
import { lastSyncedLabel } from "@/lib/report-sync-time";


type Summary = { count: number; openValue: number; lastUpdatedAt: string | null };

async function fetchSummary(from: string, to: string): Promise<Summary> {
  const pageSize = 1_000;
  let page = 0;
  let openValue = 0;
  let count = 0;
  let lastUpdatedAt: string | null = null;

  while (true) {
    const result = await supabase.from("open_sales_orders").select("open_value,updated_at")
      .eq("is_active_snapshot", true)
      .gte("order_date", from)
      .lte("order_date", to)
      .in("order_type", DEFAULT_DOCUMENT_TYPES)
      .order("updated_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (result.error) throw result.error;
    const rows = result.data ?? [];
    if (page === 0) lastUpdatedAt = rows[0]?.updated_at ?? null;
    count += rows.length;
    openValue += rows.reduce((sum, row) => sum + Number(row.open_value ?? 0), 0);
    if (rows.length < pageSize) break;
    page += 1;
  }

  return { count, openValue, lastUpdatedAt };
}

export function OpenSalesOrdersLaunchCard({ fallback }: { fallback: React.ReactNode }) {
  const range = currentReportPeriod();
  const { data, isLoading } = useQuery({
    queryKey: ["open-sales-orders-launch-summary", range.from, range.to],
    queryFn: () => fetchSummary(range.from, range.to),
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
    <section className="flex h-full min-h-[188px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-launchpad-tile p-4 text-left shadow-launchpad-tile">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Open Sales Orders</p>
          <p className="mt-2 text-[26px] leading-none font-semibold text-foreground tabular-nums">₹{(data.openValue / 10_000_000).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary shadow-sm"><ShoppingCart className="size-[18px]" /></span>
      </div>
      <p className="mt-3 text-xs font-semibold text-primary">Current FY Orders</p>
      <p className="mt-auto truncate text-[10px] font-medium text-foreground">{data.count.toLocaleString("en-IN")} open order lines</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{reportPeriodLabel(range)}</p>
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
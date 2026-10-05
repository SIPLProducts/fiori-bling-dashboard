import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { currentFiscalYearRange } from "@/lib/sd-live";

const DEFAULT_DOCUMENT_TYPES = ["ZDOR", "ZEOR", "ZSOR"];

type Summary = { count: number; lastUpdatedAt: string | null };

function relativeUpdate(value: string | null): string {
  if (!value) return "Update time unavailable";
  const elapsed = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return "Updated just now";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
}

async function fetchSummary(from: string, to: string): Promise<Summary> {
  const constrain = <T extends ReturnType<typeof supabase.from>>(query: T) => query
    .eq("is_active_snapshot", true)
    .gte("order_date", from)
    .lte("order_date", to)
    .in("order_type", DEFAULT_DOCUMENT_TYPES);

  const [countResult, latestResult] = await Promise.all([
    constrain(supabase.from("open_sales_orders").select("id", { count: "exact", head: true })),
    constrain(supabase.from("open_sales_orders").select("updated_at"))
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (countResult.error) throw countResult.error;
  if (latestResult.error) throw latestResult.error;
  return { count: countResult.count ?? 0, lastUpdatedAt: latestResult.data?.updated_at ?? null };
}

export function OpenSalesOrdersLaunchCard({ fallback }: { fallback: React.ReactNode }) {
  const range = currentFiscalYearRange();
  const { data, isLoading } = useQuery({
    queryKey: ["open-sales-orders-launch-summary", range.from, range.to],
    queryFn: () => fetchSummary(range.from, range.to),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (isLoading) return <div className="h-[188px] w-full animate-pulse rounded-2xl border border-border bg-launchpad-tile" />;
  if (!data) return <>{fallback}</>;

  return (
    <section className="flex h-full min-h-[188px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-launchpad-tile p-4 text-left shadow-launchpad-tile">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Open Sales Orders</p>
          <p className="mt-2 text-[26px] leading-none font-semibold text-foreground tabular-nums">{data.count.toLocaleString("en-IN")}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary shadow-sm"><ShoppingCart className="size-[18px]" /></span>
      </div>
      <div className="h-8" />
      <p className="mt-auto truncate text-[10px] text-muted-foreground">Current financial year</p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[10px] text-muted-foreground">
        <span className="truncate" title={data.lastUpdatedAt ? new Date(data.lastUpdatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : undefined}>{relativeUpdate(data.lastUpdatedAt)}</span>
        <Link to="/reports/sd/open-sales-orders" aria-label="Open Open Sales Orders details" className="group inline-flex min-h-8 items-center gap-1 rounded-full bg-launchpad-tile-footer px-4 font-semibold text-primary shadow-launchpad-inset transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transform-none">
          View details
          <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
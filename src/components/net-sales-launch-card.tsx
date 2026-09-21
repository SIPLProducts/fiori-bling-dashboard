import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const KPI_TONES = [
  "var(--kpi-1)",
  "var(--kpi-2)",
  "var(--kpi-3)",
  "var(--kpi-4)",
  "var(--kpi-5)",
  "var(--kpi-6)",
];

const TYPE_ORDER = ["Domestic", "Service", "Exports"];

function compact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(2)} L`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)} K`;
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

type Summary = { total: number; shares: { name: string; value: number }[]; lastUpdatedAt: string | null };

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

async function fetchSummary(): Promise<Summary | null> {
  const [{ data, error }, { data: run }] = await Promise.all([
    supabase.rpc("net_sales_summary"),
    supabase
      .from("sap_sync_runs")
      .select("finished_at")
      .eq("endpoint", "Sales_Reports_KPI")
      .eq("status", "success")
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (error || !data?.length) return null;
  const byType = new Map<string, number>();
  let total = 0;
  for (const row of data) {
    const t = Number(row.type_total) || 0;
    byType.set(row.sales_type, t);
    total += t;
  }
  const names = [
    ...TYPE_ORDER.filter((n) => byType.has(n)),
    ...[...byType.keys()].filter((n) => !TYPE_ORDER.includes(n)).sort(),
  ];
  return {
    total,
    shares: names.map((name) => ({ name, value: byType.get(name) ?? 0 })),
    lastUpdatedAt: run?.finished_at ?? null,
  };
}

/** Launchpad replacement for the plain SD tile: live Total Sales card. */
export function NetSalesLaunchCard({ fallback }: { fallback: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["net-sales-summary"],
    queryFn: fetchSummary,
    staleTime: 60_000,
  });

  const color = KPI_TONES[0];

  if (isLoading) {
    return <div className="h-[188px] w-full animate-pulse rounded-2xl border border-border bg-launchpad-tile" />;
  }
  if (!data) return <>{fallback}</>;

  return (
    <Link
      to="/reports/module/$module"
      params={{ module: "sd" }}
      className="group block h-full rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <section
        className="relative flex h-full min-h-[188px] w-full cursor-pointer flex-col overflow-hidden rounded-2xl border p-4 text-left shadow-launchpad-tile transition-all duration-200 group-hover:-translate-y-1 group-hover:scale-[1.006] group-hover:shadow-tile-hover motion-reduce:transform-none"
        style={{
          borderColor: `color-mix(in oklab, ${color} 28%, var(--color-border))`,
          background: `linear-gradient(160deg, color-mix(in oklab, ${color} var(--kpi-tint), var(--color-launchpad-tile)) 0%, var(--color-launchpad-tile) 70%)`,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold tracking-wide text-primary uppercase">
              Total Sales
            </p>
            <p className="tabular mt-1 text-[26px] leading-none font-semibold" style={{ color }}>
              ₹{compact(data.total)}
            </p>
          </div>
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl shadow-sm"
            style={{ background: `color-mix(in oklab, ${color} 20%, transparent)`, color }}
          >
            <IndianRupee className="size-4" strokeWidth={1.7} />
          </span>
        </div>
        <p className="mt-1 truncate text-[10px] text-muted-foreground">Filtered postings</p>
        {data.total ? (
          <div className="mt-2 space-y-1">
            {data.shares.slice(0, 3).map((item, i) => (
              <div key={item.name}>
                <div className="flex items-center justify-between text-[9px] font-medium text-foreground/80">
                  <span className="truncate">{item.name || "—"}</span>
                  <span className="tabular">{((item.value / data.total) * 100).toFixed(1)}%</span>
                </div>
                <div className="mt-0.5 h-1 rounded-full bg-muted">
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${Math.max(2, Math.min(100, (item.value / data.total) * 100))}%`,
                      background: KPI_TONES[i % KPI_TONES.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pt-4 text-[10px] text-muted-foreground">
          <span className="truncate" title={data.lastUpdatedAt ? new Date(data.lastUpdatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : undefined}>{relativeUpdate(data.lastUpdatedAt)}</span>
          <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-launchpad-tile-footer px-4 font-semibold text-primary shadow-launchpad-inset">
          Open Details
          <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </section>
    </Link>
  );
}

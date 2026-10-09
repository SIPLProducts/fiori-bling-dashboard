import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { currentReportPeriod } from "@/lib/report-period";
import { useReportSync } from "@/lib/use-report-sync";
import { lastSyncedLabel } from "@/lib/report-sync-time";
import { STABLE_SALES_QUERY_OPTIONS } from "@/lib/stable-sales-query";

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

async function fetchSummary(): Promise<Summary | null> {
  const range = currentReportPeriod();
  const { data, error } = await
    supabase.rpc("net_sales_summary", {
      _posting_from: range.from,
      _posting_to: range.to,
    });
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
    lastUpdatedAt: null,
  };
}

/** Launchpad replacement for the plain SD tile: live Net Sales card. */
export function NetSalesLaunchCard({ fallback }: { fallback: React.ReactNode }) {
  const range = currentReportPeriod();
  const { data, isLoading } = useQuery({
    queryKey: ["net-sales-summary", range.from, range.to],
    queryFn: fetchSummary,
    ...STABLE_SALES_QUERY_OPTIONS,
  });

  const { data: lastSynced } = useReportSync("net-sales");
  const color = KPI_TONES[0];

  if (isLoading) {
    return <div className="h-[188px] w-full animate-pulse rounded-2xl border border-border bg-launchpad-tile" />;
  }
  if (!data) return <>{fallback}</>;

  return (
      <section
        className="relative flex h-full min-h-[188px] w-full flex-col overflow-hidden rounded-2xl border p-4 text-left shadow-launchpad-tile"
        style={{
          borderColor: `color-mix(in oklab, ${color} 28%, var(--color-border))`,
          background: `linear-gradient(160deg, color-mix(in oklab, ${color} var(--kpi-tint), var(--color-launchpad-tile)) 0%, var(--color-launchpad-tile) 70%)`,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold tracking-wide text-primary uppercase">
              Net Sales
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
        <div className="mt-auto grid grid-cols-1 min-[1100px]:grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pt-4 text-[10px] text-muted-foreground">
          <span className="min-w-0 leading-relaxed">{lastSyncedLabel(lastSynced)}</span>
          <Link
            to="/reports/module/$module"
            params={{ module: "sd" }}
            aria-label="Open Net Sales details"
            className="group inline-flex min-h-8 items-center gap-1 rounded-full bg-launchpad-tile-footer px-4 font-semibold text-primary shadow-launchpad-inset transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transform-none"
          >
            Open Details
            <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </section>
  );
}

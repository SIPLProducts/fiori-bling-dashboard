import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { IndianRupee } from "lucide-react";
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

type Summary = { total: number; shares: { name: string; value: number }[] };

async function fetchSummary(): Promise<Summary | null> {
  const { data, error } = await supabase.rpc("net_sales_summary");
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
  return { total, shares: names.map((name) => ({ name, value: byType.get(name) ?? 0 })) };
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
    return <div className="h-[152px] w-full animate-pulse rounded-lg border border-border bg-card" />;
  }
  if (!data) return <>{fallback}</>;

  return (
    <Link
      to="/reports/module/$module"
      params={{ module: "sd" }}
      className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <section
        className="relative flex w-full cursor-pointer flex-col rounded-lg border p-4 text-left shadow-tile transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
        style={{
          borderColor: `color-mix(in oklab, ${color} 28%, var(--color-border))`,
          background: `linear-gradient(160deg, color-mix(in oklab, ${color} var(--kpi-tint), var(--color-card)) 0%, var(--color-card) 70%)`,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Total Sales
            </p>
            <p className="tabular mt-1 text-2xl font-semibold" style={{ color }}>
              ₹{compact(data.total)}
            </p>
          </div>
          <span
            className="grid size-9 shrink-0 place-items-center rounded-md"
            style={{ background: `color-mix(in oklab, ${color} 20%, transparent)`, color }}
          >
            <IndianRupee className="size-4" />
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          Filtered postings · click for details
        </p>
        {data.total ? (
          <div className="mt-1.5 space-y-1">
            {data.shares.slice(0, 3).map((item, i) => (
              <div key={item.name}>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate">{item.name || "—"}</span>
                  <span className="tabular">{((item.value / data.total) * 100).toFixed(1)}%</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full"
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
      </section>
    </Link>
  );
}

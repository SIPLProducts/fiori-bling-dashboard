import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, PackageOpen } from "lucide-react";
import { openPoTypeSummary, poTypeGroup } from "@/lib/open-po-data";
import { purchaseOrdersQuery } from "@/lib/purchase-orders-data";

const TONES = ["var(--kpi-1)", "var(--kpi-2)", "var(--kpi-3)", "var(--kpi-4)", "var(--kpi-5)", "var(--kpi-6)"];
const cr = (v: number) => `₹${(v / 1e7).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;

/** Launchpad card for ZME2N Purchase Orders (INR lines). Shares the screen's query. */
export function PurchaseOrdersLaunchCard({ fallback }: { fallback: React.ReactNode }) {
  const { data: rows, isLoading, isError } = useQuery(purchaseOrdersQuery);
  const s = useMemo(() => (rows ? openPoTypeSummary(rows.filter((r) => r.inr).map((r) => ({ ...r, poValue: r.netValue })) as never) : null), [rows]);
  if (isLoading) return <div className="h-[188px] w-full animate-pulse rounded-2xl border border-border bg-launchpad-tile" />;
  if (isError || !s || !rows?.length) return <>{fallback}</>;
  const types = s ? Object.values(rows!.filter((r) => r.inr).reduce<Record<string, { name: string; value: number; count: number }>>((a, r) => {
    const k = poTypeGroup(r.poType || ""); (a[k] ??= { name: k, value: 0, count: 0 }); a[k].value += r.netValue; a[k].count++; return a;
  }, {})).sort((a, b) => b.value - a.value) : [];
  const max = Math.max(...types.map((g) => g.value), 1e-9);
  return <section aria-label="Purchase Orders List" className="flex h-full min-h-[188px] flex-col overflow-hidden rounded-2xl border p-4 text-left shadow-launchpad-tile" style={{
    borderColor: "color-mix(in oklab, var(--kpi-2) 28%, var(--color-border))",
    background: "linear-gradient(160deg, color-mix(in oklab, var(--kpi-2) var(--kpi-tint), var(--color-launchpad-tile)) 0%, var(--color-launchpad-tile) 70%)",
  }}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-[11px] font-semibold text-primary uppercase">Purchase Orders List</p>
        <p className="mt-2 text-[26px] xl:text-[22px] 2xl:text-[26px] leading-none font-semibold tabular-nums" style={{ color: "var(--kpi-1)" }}>{cr(s.poValue)}</p></div>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary shadow-sm"><PackageOpen className="size-[18px]" /></span>
    </div>
    <div className="mt-3 flex items-baseline justify-between gap-2"><p className="text-[9px] font-semibold text-primary">PO Value by Doc Type</p><p className="text-[9px] font-medium tabular-nums">{s.poCount.toLocaleString("en-IN")} POs · {s.lines.toLocaleString("en-IN")} lines</p></div>
    <div className="my-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">{types.map((g, i) => <div key={g.name}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-[9px]"><span className="font-medium text-foreground">{g.name}</span>
        <span className="flex gap-x-2 text-muted-foreground tabular-nums"><span>{g.count.toLocaleString("en-IN")} lines</span><span className="font-semibold text-foreground">{cr(g.value)}</span></span></div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(g.value / max) * 100}%`, background: TONES[i % TONES.length] }} /></div>
    </div>)}</div>
    <div className="mt-auto flex justify-end"><Link to="/reports/mm/purchase-orders" className="group inline-flex min-h-7 items-center gap-1 rounded-full btn-action px-3 text-[9px] font-semibold">Open Details<ArrowRight className="size-3.5" /></Link></div>
  </section>;
}

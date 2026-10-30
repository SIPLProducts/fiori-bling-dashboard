import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { purchaseRegisterKpiQuery } from "@/lib/purchase-register-data";

const TONES = ["var(--kpi-2)", "var(--kpi-4)", "var(--kpi-3)"];
const cr = (v: number) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;

export function PurchaseRegisterLaunchCard({ fallback }: { fallback: React.ReactNode }) {
  const { data, isLoading, isError } = useQuery(purchaseRegisterKpiQuery);
  const s = data ? { ...data, max: Math.max(...data.by.map((b) => Math.abs(b.value)), 1e-9) } : null;
  if (isLoading) return <div className="h-[188px] w-full animate-pulse rounded-2xl border border-border bg-launchpad-tile" />;
  if (isError || !s) return <>{fallback}</>;
  return <section aria-label="Purchase Register" className="flex h-full min-h-[188px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-launchpad-tile p-4 text-left shadow-launchpad-tile">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-[11px] font-semibold text-primary uppercase">Purchase Register</p>
        <p className="mt-2 text-[26px] xl:text-[22px] 2xl:text-[26px] leading-none font-semibold tabular-nums" style={{ color: "var(--kpi-1)" }}>{cr(s.total)}</p></div>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary shadow-sm"><ShoppingCart className="size-[18px]" /></span>
    </div>
    <div className="mt-3 flex items-baseline justify-between gap-2"><p className="text-[9px] font-semibold text-primary">Total Purchase</p><p className="text-[9px] font-medium tabular-nums">{s.count.toLocaleString("en-IN")} lines</p></div>
    <div className="my-3 flex-1 space-y-2.5">{s.by.map((g, i) => <div key={g.name}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-[9px]"><span className="font-medium text-foreground">{g.name}</span>
        <span className="flex gap-x-2 text-muted-foreground tabular-nums"><span>{g.count.toLocaleString("en-IN")} lines</span><span className="font-semibold text-foreground">{cr(g.value)}</span></span></div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(Math.abs(g.value) / s.max) * 100}%`, background: TONES[i] }} /></div>
    </div>)}</div>
    <div className="mt-auto flex justify-end"><Link to="/reports/mm/purchase-register" className="group inline-flex min-h-7 items-center gap-1 rounded-full btn-action px-3 text-[9px] font-semibold">Open Details<ArrowRight className="size-3.5" /></Link></div>
  </section>;
}

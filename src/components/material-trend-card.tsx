import { useMemo, useState } from "react";
import { Boxes, Percent, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { materialPoints, materialTrends, TREND_RULES, type MaterialTrend } from "@/lib/purchase-material-trend";
import type { PurchaseRow } from "@/lib/purchase-register-data";

const n2 = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const n0 = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const sp = (v: number) => `${v >= 0 ? "▲ +" : "▼ "}${v.toFixed(1)}%`;
const UP = "var(--destructive)", DOWN = "var(--success)";
const PAGE = 10;
type Filter = "all" | "rising" | "falling";
type Sort = "spend" | "rise" | "fall";

function Kpi({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm" style={{ borderTop: `3px solid ${tone}` }}>
    <span className="grid size-10 shrink-0 place-items-center rounded-lg text-primary-foreground" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${tone} 70%, white), ${tone})` }}>{icon}</span>
    <div className="min-w-0"><p className="text-xl font-bold leading-tight">{value}</p><p className="truncate text-[10px] text-muted-foreground">{label}</p></div>
  </div>;
}

export function MaterialTrendSection({ rows, onOpen }: { rows: PurchaseRow[]; onOpen: (t: MaterialTrend) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("spend");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const res = useMemo(() => materialTrends(rows), [rows]);
  const sparks = useMemo(() => {
    const by = new Map<string, PurchaseRow[]>();
    for (const r of rows) { const a = by.get(r.material); if (a) a.push(r); else by.set(r.material, [r]); }
    const m = new Map<string, { rate: number }[]>();
    for (const t of [...res.rising, ...res.falling]) m.set(t.material, materialPoints(by.get(t.material) ?? []).map((p) => ({ rate: p.rate })));
    return m;
  }, [rows, res]);
  const all = [...res.rising, ...res.falling];
  const avg = all.length ? all.reduce((s, t) => s + t.changePct, 0) / all.length : 0;
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = (filter === "rising" ? res.rising : filter === "falling" ? res.falling : [...res.rising, ...res.falling])
      .filter((t) => !s || t.name.toLowerCase().includes(s) || t.material.toLowerCase().includes(s));
    return [...base].sort((a, b) => sort === "spend" ? b.totalValue - a.totalValue : sort === "rise" ? b.changePct - a.changePct : a.changePct - b.changePct);
  }, [res, filter, sort, q]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const pg = Math.min(page, pages - 1);
  const chip = (f: Filter, label: string, n: number, tone?: string) => <button type="button" onClick={() => { setFilter(f); setPage(0); }}
    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
    style={filter === f && tone ? { color: tone, borderColor: tone, background: `color-mix(in oklab, ${tone} 10%, transparent)` } : undefined}>{label} {n}</button>;

  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi icon={<Boxes className="size-5" />} value={n0(all.length)} label={`Materials with a steady price change (of ${n0(res.scanned)} checked)`} tone="var(--chart-1)" />
      <Kpi icon={<TrendingUp className="size-5" />} value={n0(res.rising.length)} label="Price rising first → latest" tone={UP} />
      <Kpi icon={<TrendingDown className="size-5" />} value={n0(res.falling.length)} label="Price falling first → latest" tone={DOWN} />
      <Kpi icon={<Percent className="size-5" />} value={`${avg >= 0 ? "+" : ""}${avg.toFixed(1)}%`} label="Average price change" tone="var(--chart-4)" />
    </div>

    <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="text-xs font-semibold text-card-foreground">Material Price Movers</h2>
          <p className="text-[10px] text-muted-foreground">{n0(list.length)} materials · click one to see its full price history</p></div>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort" className="h-7 rounded-md border border-border bg-background px-2 text-[11px]">
          <option value="spend">Highest spend</option><option value="rise">Biggest rise</option><option value="fall">Biggest fall</option></select>
      </div>
      <div className="relative mb-2"><Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search material name or code…" className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 text-xs" /></div>
      <div className="mb-2 flex flex-wrap gap-1.5">{chip("all", "All", all.length)}{chip("rising", "▲ Rising", res.rising.length, UP)}{chip("falling", "▼ Falling", res.falling.length, DOWN)}</div>
      <div className="grid grid-cols-[minmax(0,1fr)_90px_110px] border-b border-border px-2 pb-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[minmax(0,1fr)_120px_140px_110px]">
        <span>Material</span><span className="text-center">Trend</span><span className="hidden text-right sm:block">First → Latest</span><span className="text-right">Latest · change</span></div>
      {list.length ? <ul>{list.slice(pg * PAGE, pg * PAGE + PAGE).map((t) => {
        const tone = t.direction === "rising" ? UP : DOWN;
        return <li key={t.material}><button type="button" onClick={() => onOpen(t)}
          className="grid w-full grid-cols-[minmax(0,1fr)_90px_110px] items-center gap-2 border-b border-border/50 px-2 py-2 text-left hover:bg-accent/50 sm:grid-cols-[minmax(0,1fr)_120px_140px_110px]">
          <span className="min-w-0"><span className="block truncate text-[11px] font-semibold uppercase text-foreground">{t.name}</span>
            <span className="text-[9px] text-muted-foreground">{t.material} · ₹/{t.unit || "unit"} · {t.purchases} buys</span></span>
          <span className="h-8"><ResponsiveContainer width="100%" height="100%"><LineChart data={sparks.get(t.material)}><YAxis hide domain={["dataMin", "dataMax"]} />
            <Line dataKey="rate" stroke={tone} strokeWidth={1.6} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></span>
          <span className="hidden text-right text-[10px] tabular-nums text-muted-foreground sm:block">₹ {n2(t.firstRate)} → ₹ {n2(t.lastRate)}</span>
          <span className="text-right"><span className="block text-xs font-bold tabular-nums">₹ {n2(t.lastRate)}</span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold" style={{ color: tone, background: `color-mix(in oklab, ${tone} 12%, transparent)` }}>{sp(t.changePct)}</span></span>
        </button></li>;
      })}</ul> : <p className="py-8 text-center text-xs text-muted-foreground">No material shows a steady price change for these filters.</p>}
      {pages > 1 ? <div className="mt-2 flex items-center gap-2 text-[10px]"><Button size="sm" variant="outline" className="h-6 text-[10px]" disabled={pg === 0} onClick={() => setPage(pg - 1)}>Prev</Button><span>{pg + 1} / {pages}</span><Button size="sm" variant="outline" className="h-6 text-[10px]" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Next</Button></div> : null}
      <p className="mt-2 text-[9px] text-muted-foreground">Only materials bought {TREND_RULES.minPurchases}+ times on {TREND_RULES.minDates}+ dates, moving the same way in {TREND_RULES.minConsistency * 100}%+ of purchases{res.outliers ? `; ${res.outliers} unusual changes (over +1,000% or under −95%) left out` : ""}.</p>
    </section>
  </div>;
}

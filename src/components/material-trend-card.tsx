import { useMemo, useState } from "react";
import { Boxes, Eye, Percent, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { radiantColor } from "@/lib/radiant";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { filterMovers, materialPoints, materialTrends, TREND_RULES, type MaterialTrend } from "@/lib/purchase-material-trend";
import type { PurchaseRow } from "@/lib/purchase-register-data";

const n2 = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const n0 = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const sp = (v: number) => `${v >= 0 ? "▲ +" : "▼ "}${v.toFixed(1)}%`;
const UP = "var(--destructive)", DOWN = "var(--success)";
const PAGE = 10;
type Filter = "all" | "rising" | "falling";
type Sort = "spend" | "rise" | "fall";

function Kpi({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone: string }) {
  return <div className="flex items-center gap-3 rounded-xl p-3 text-primary-foreground shadow-md" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${tone} 65%, white), ${tone})` }}>
    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-background/20">{icon}</span>
    <div className="min-w-0"><p className="text-xl font-bold leading-tight">{value}</p><p className="truncate text-[10px] opacity-90">{label}</p></div>
  </div>;
}

export function MaterialTrendSection({ rows, onOpen }: { rows: PurchaseRow[]; onOpen: (t: MaterialTrend) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("spend");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [minPct, setMinPct] = useState(2);
  const [minEff, setMinEff] = useState<number | null>(500000);
  const [peek, setPeek] = useState<MaterialTrend | null>(null);
  const base = useMemo(() => materialTrends(rows, { ...TREND_RULES, minChangePct: 0 }), [rows]);
  const res = useMemo(() => ({ ...base, rising: filterMovers(base.rising, minPct, minEff), falling: filterMovers(base.falling, minPct, minEff) }), [base, minPct, minEff]);
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
      <Kpi icon={<Boxes className="size-5" />} value={n0(all.length)} label={`Materials with a steady price change (of ${n0(res.scanned)} checked)`} tone="#1f6fd1" />
      <Kpi icon={<TrendingUp className="size-5" />} value={n0(res.rising.length)} label="Price rising first → latest" tone="#d64550" />
      <Kpi icon={<TrendingDown className="size-5" />} value={n0(res.falling.length)} label="Price falling first → latest" tone="#2e8b57" />
      <Kpi icon={<Percent className="size-5" />} value={`${avg >= 0 ? "+" : ""}${avg.toFixed(1)}%`} label="Average price change" tone="#8e44ad" />
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
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-[11px]">
        <span>Show price changes of at least</span>
        <select aria-label="Minimum change" value={minPct} onChange={(e) => { setMinPct(Number(e.target.value)); setPage(0); }} className="h-7 rounded-md border border-border bg-background px-2 font-semibold">
          {[2, 5, 10, 20, 50].map((v) => <option key={v} value={v}>{v}%</option>)}</select>
        <span className="text-muted-foreground">(up or down) and smaller changes with a value effect of</span>
        <select aria-label="Minimum value effect" value={minEff ?? "none"} onChange={(e) => { setMinEff(e.target.value === "none" ? null : Number(e.target.value)); setPage(0); }} className="h-7 rounded-md border border-border bg-background px-2 font-semibold">
          {[[100000, "at least ₹ 1 lakh"], [500000, "at least ₹ 5 lakh"], [1000000, "at least ₹ 10 lakh"], [5000000, "at least ₹ 50 lakh"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          <option value="none">don't include</option></select>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">{chip("all", "All", all.length)}{chip("rising", "▲ Rising", res.rising.length, UP)}{chip("falling", "▼ Falling", res.falling.length, DOWN)}</div>
      {list.length ? <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">{list.slice(pg * PAGE, pg * PAGE + PAGE).map((t, i) => {
        const tone = t.direction === "rising" ? UP : DOWN, rc = radiantColor(pg * PAGE + i);
        return <li key={t.material} className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: `linear-gradient(120deg, color-mix(in oklab, ${rc} 14%, var(--card)), var(--card) 60%)`, borderLeft: `4px solid ${rc}` }}>
          <button type="button" onClick={() => onOpen(t)} className="grid w-full grid-cols-[minmax(0,1fr)_96px] items-center gap-2 p-3 pr-10 text-left">
            <span className="min-w-0"><span className="block truncate text-[11px] font-bold uppercase text-foreground">{t.name}</span>
              <span className="block text-[9px] text-muted-foreground">{t.material} · {t.purchases} buys · ₹/{t.unit || "unit"}</span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] tabular-nums">
                <span className="text-muted-foreground">₹ {n2(t.firstRate)} →</span><b>₹ {n2(t.lastRate)}</b>
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground" style={{ background: tone }}>{sp(t.changePct)}</span>
                <span className="text-[9px] text-muted-foreground">effect ₹ {n2(Math.abs(t.impact) * 100)} LAH</span></span></span>
            <span className="h-10"><ResponsiveContainer width="100%" height="100%"><LineChart data={sparks.get(t.material) ?? []}><YAxis hide domain={["dataMin", "dataMax"]} />
              <Line dataKey="rate" stroke={rc} strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></span>
          </button>
          <button type="button" aria-label="Quick view" onClick={() => setPeek(t)} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-background/70 text-muted-foreground hover:text-primary"><Eye className="size-3.5" /></button>
        </li>;
      })}</ul> : <p className="py-8 text-center text-xs text-muted-foreground">No material shows a steady price change for these filters.</p>}
      {pages > 1 ? <div className="mt-2 flex items-center gap-2 text-[10px]"><Button size="sm" variant="outline" className="h-6 text-[10px]" disabled={pg === 0} onClick={() => setPage(pg - 1)}>Prev</Button><span>{pg + 1} / {pages}</span><Button size="sm" variant="outline" className="h-6 text-[10px]" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Next</Button></div> : null}
      <p className="mt-2 text-[9px] text-muted-foreground">Only materials bought {TREND_RULES.minPurchases}+ times on {TREND_RULES.minDates}+ dates, moving the same way in {TREND_RULES.minConsistency * 100}%+ of purchases{res.outliers ? `; ${res.outliers} unusual changes (over +1,000% or under −95%) left out` : ""}.</p>
    </section>
    <Dialog open={!!peek} onOpenChange={(o) => !o && setPeek(null)}>
      <DialogContent className="max-w-2xl">{peek ? <QuickView t={peek} rows={rows.filter((r) => r.material === peek.material)} onOpen={() => { onOpen(peek); setPeek(null); }} /> : null}</DialogContent>
    </Dialog>
  </div>;
}

function QuickView({ t, rows, onOpen }: { t: MaterialTrend; rows: PurchaseRow[]; onOpen: () => void }) {
  const pts = materialPoints(rows);
  const tone = t.direction === "rising" ? UP : DOWN;
  const list = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  return <>
    <DialogHeader><DialogTitle className="text-sm">{t.name}</DialogTitle>
      <p className="text-[11px] text-muted-foreground">{t.material} · ₹ {n2(t.firstRate)} → ₹ {n2(t.lastRate)} <b style={{ color: tone }}>{sp(t.changePct)}</b></p></DialogHeader>
    <div className="h-48"><ResponsiveContainer width="100%" height="100%"><LineChart data={pts} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} />
      <Tooltip formatter={(v: number) => `₹ ${n2(v)}`} /><Line dataKey="rate" stroke={tone} strokeWidth={2.5} dot={{ r: 3, fill: tone }} /></LineChart></ResponsiveContainer></div>
    <div className="max-h-56 overflow-auto rounded-md border border-border"><table className="w-full text-[11px]">
      <thead className="sticky top-0 bg-primary text-primary-foreground"><tr><th className="px-2 py-1 text-left">Date</th><th className="px-2 py-1 text-left">Vendor</th><th className="px-2 py-1 text-right">Qty</th><th className="px-2 py-1 text-right">Rate ₹</th></tr></thead>
      <tbody>{list.map((r, i) => <tr key={i} className="border-t border-border/60 odd:bg-muted/30"><td className="px-2 py-1">{r.date}</td><td className="max-w-[220px] truncate px-2 py-1">{r.vendorName}</td><td className="px-2 py-1 text-right tabular-nums">{n0(r.qty ?? 0)}</td><td className="px-2 py-1 text-right font-semibold tabular-nums">{n2(r.rate ?? 0)}</td></tr>)}</tbody></table></div>
    <Button size="sm" onClick={onOpen}>Open full price history</Button>
  </>;
}

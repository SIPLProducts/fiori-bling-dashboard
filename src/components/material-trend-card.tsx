import { useMemo, useState } from "react";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { datedFileName } from "@/lib/format";
import { materialPoints, materialTrends, TREND_RULES, type MaterialTrend } from "@/lib/purchase-material-trend";
import type { PurchaseRow } from "@/lib/purchase-register-data";

const n2 = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const n0 = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const sp = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const PAGE = 10;

export function MaterialTrendSection({ rows }: { rows: PurchaseRow[] }) {
  const [mode, setMode] = useState<"rising" | "falling">("rising");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<MaterialTrend | null>(null);
  const res = useMemo(() => materialTrends(rows), [rows]);
  const list = mode === "rising" ? res.rising : res.falling;
  const top = list.slice(0, 10);
  const max = Math.max(...top.map((t) => Math.abs(t.changePct)), 1);
  const tone = mode === "rising" ? "var(--destructive)" : "var(--success)";
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const pg = Math.min(page, pages - 1);
  const sw = (m: "rising" | "falling") => { setMode(m); setPage(0); };

  return <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
    <section className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div><h2 className="text-xs font-semibold text-card-foreground">Material Price Movers</h2>
          <p className="text-[10px] text-muted-foreground">Frequently bought materials · first → latest rate per unit</p></div>
        <div className="flex gap-1 text-[10px] font-semibold">
          <button type="button" onClick={() => sw("rising")} className={`rounded-full px-2 py-0.5 ${mode === "rising" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>Rising {res.rising.length}</button>
          <button type="button" onClick={() => sw("falling")} className={`rounded-full px-2 py-0.5 ${mode === "falling" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>Falling {res.falling.length}</button>
        </div>
      </div>
      {top.length ? <ol className="space-y-2">{top.map((t, i) => <li key={t.material}>
        <button type="button" onClick={() => setOpen(t)} className="grid w-full grid-cols-[1rem_minmax(0,1fr)] gap-2 rounded-md p-1 text-left hover:bg-accent/50">
          <span className="text-[10px] text-muted-foreground">{i + 1}</span>
          <span className="min-w-0">
            <span className="flex items-center justify-between gap-2 text-[11px]"><span className="truncate font-medium text-foreground">{t.name}</span><b style={{ color: tone }}>{sp(t.changePct)}</b></span>
            <span className="mt-0.5 block h-1.5 rounded-full bg-muted"><span className="block h-full rounded-full" style={{ width: `${Math.max(3, (Math.abs(t.changePct) / max) * 100)}%`, background: tone }} /></span>
            <span className="mt-0.5 flex justify-between text-[9px] text-muted-foreground"><span>₹ {n2(t.firstRate)} → ₹ {n2(t.lastRate)} per {t.unit || "unit"} · {t.purchases} buys</span><span>Qty {n0(t.firstQty)} → {n0(t.lastQty)} ({sp(t.qtyChangePct)})</span></span>
          </span>
        </button></li>)}</ol>
        : <p className="py-8 text-center text-xs text-muted-foreground">No material shows a steady {mode} trend for these filters.</p>}
      <p className="mt-2 text-[9px] text-muted-foreground">Only materials bought {TREND_RULES.minPurchases}+ times on {TREND_RULES.minDates}+ dates, moving the same way in {TREND_RULES.minConsistency * 100}%+ of purchases. {res.scanned} checked, {res.rising.length + res.falling.length} qualified{res.outliers ? `, ${res.outliers} unusual changes (over +1,000% or under −95%) left out` : ""}.</p>
    </section>

    <section className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-1"><h2 className="text-xs font-semibold text-card-foreground">Price Changes — {mode === "rising" ? "Rising" : "Falling"}</h2>
        <p className="text-[10px] text-muted-foreground">₹ per unit · click a row for full purchase history</p></div>
      <div className="overflow-x-auto"><table className="w-full text-[10px]">
        <thead className="bg-primary/5 text-primary"><tr><th className="px-1.5 py-1 text-left">Material</th><th className="px-1.5 py-1 text-right">Buys</th><th className="px-1.5 py-1 text-right">First</th><th className="px-1.5 py-1 text-right">Latest</th><th className="px-1.5 py-1 text-right">Change</th><th className="px-1.5 py-1 text-right">Qty</th><th className="px-1.5 py-1 text-right">Impact (₹ Cr)</th></tr></thead>
        <tbody>{list.slice(pg * PAGE, pg * PAGE + PAGE).map((t) => <tr key={t.material} onClick={() => setOpen(t)} className="cursor-pointer border-t border-border/60 hover:bg-accent/50">
          <td className="max-w-[180px] px-1.5 py-1"><span className="block truncate font-medium">{t.name}</span><span className="text-[9px] text-muted-foreground">{t.material} · ₹/{t.unit || "unit"}</span></td>
          <td className="px-1.5 py-1 text-right">{t.purchases}</td><td className="px-1.5 py-1 text-right tabular-nums">{n2(t.firstRate)}</td><td className="px-1.5 py-1 text-right tabular-nums">{n2(t.lastRate)}</td>
          <td className="px-1.5 py-1 text-right"><span className="rounded-full px-1.5 py-0.5 font-semibold" style={{ color: tone, background: `color-mix(in oklab, ${tone} 12%, transparent)` }}>{t.changePct >= 0 ? "▲" : "▼"} {sp(t.changePct)}</span></td>
          <td className="px-1.5 py-1 text-right tabular-nums">{n0(t.firstQty)} → {n0(t.lastQty)}</td><td className="px-1.5 py-1 text-right tabular-nums">{t.impact >= 0 ? "+" : ""}{t.impact.toFixed(3)}</td></tr>)}</tbody>
      </table></div>
      {pages > 1 ? <div className="mt-2 flex items-center gap-2 text-[10px]"><Button size="sm" variant="outline" className="h-6 text-[10px]" disabled={pg === 0} onClick={() => setPage(pg - 1)}>Prev</Button><span>{pg + 1} / {pages}</span><Button size="sm" variant="outline" className="h-6 text-[10px]" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Next</Button></div> : null}
    </section>

    <MaterialDetail trend={open} rows={rows} onClose={() => setOpen(null)} />
  </div>;
}

function MaterialDetail({ trend, rows, onClose }: { trend: MaterialTrend | null; rows: PurchaseRow[]; onClose: () => void }) {
  const lines = useMemo(() => trend ? rows.filter((r) => r.material === trend.material).sort((a, b) => a.date.localeCompare(b.date)) : [], [trend, rows]);
  const pts = useMemo(() => materialPoints(lines), [lines]);
  if (!trend) return null;
  const up = trend.direction === "rising";
  const tone = up ? "var(--destructive)" : "var(--success)";
  const download = async () => {
    const { Workbook } = await import("exceljs");
    const wb = new Workbook(); const sh = wb.addWorksheet("Purchases");
    sh.addRow(["Date", "Document No", "Vendor", "Plant", "Quantity", "Unit", "Rate (₹)", "Value (₹ Cr)"]);
    lines.forEach((r) => sh.addRow([r.date, r.docNo ?? "", r.vendorName, r.plantName, r.qty ?? 0, r.unit ?? "", r.rate ?? 0, r.value]));
    sh.columns.forEach((c) => { c.width = 18; });
    const url = URL.createObjectURL(new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a"); a.href = url; a.download = datedFileName(`Purchase Register_${trend.material}`, "xlsx"); a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <Dialog open onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle className="flex items-center gap-2 text-sm">{up ? <TrendingUp className="size-4" style={{ color: tone }} /> : <TrendingDown className="size-4" style={{ color: tone }} />}{trend.name}</DialogTitle>
        <p className="text-[11px] text-muted-foreground">{trend.material} · {trend.unit || "unit"} · {trend.purchases} purchases · {trend.firstDate} → {trend.lastDate}</p></DialogHeader>
      <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        {[["First rate", `₹ ${n2(trend.firstRate)}`], ["Latest rate", `₹ ${n2(trend.lastRate)}`], ["Rate change", sp(trend.changePct)], ["Qty change", `${n0(trend.firstQty)} → ${n0(trend.lastQty)}`]].map(([l, v], i) =>
          <div key={l} className="rounded-lg border border-border p-2"><p className="text-[10px] text-muted-foreground">{l}</p><p className="text-sm font-bold" style={i === 2 ? { color: tone } : undefined}>{v}</p></div>)}
      </div>
      <ResponsiveContainer width="100%" height={200}><ComposedChart data={pts} margin={{ top: 8, left: -8, right: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" tick={{ fontSize: 9 }} />
        <YAxis yAxisId="r" tick={{ fontSize: 9 }} /><YAxis yAxisId="q" orientation="right" tick={{ fontSize: 9 }} />
        <Tooltip formatter={(v: number, k: string) => k === "rate" ? `₹ ${n2(v)}` : n0(v)} />
        <Bar yAxisId="q" dataKey="qty" name="qty" fill="var(--chart-2)" fillOpacity={0.35} maxBarSize={20} />
        <Line yAxisId="r" dataKey="rate" name="rate" stroke={tone} strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart></ResponsiveContainer>
      <div className="flex justify-end"><Button size="sm" variant="outline" className="h-7 text-xs" onClick={download}><Download className="mr-1 size-3" />Excel</Button></div>
      <table className="w-full text-[10px]"><thead className="bg-primary/5 text-primary"><tr><th className="px-1.5 py-1 text-left">Date</th><th className="px-1.5 py-1 text-left">Doc No</th><th className="px-1.5 py-1 text-left">Vendor</th><th className="px-1.5 py-1 text-left">Plant</th><th className="px-1.5 py-1 text-right">Qty</th><th className="px-1.5 py-1 text-right">Rate ₹</th><th className="px-1.5 py-1 text-right">Value ₹ Cr</th></tr></thead>
        <tbody>{lines.map((r, i) => <tr key={i} className="border-t border-border/60 odd:bg-muted/40"><td className="px-1.5 py-0.5">{r.date}</td><td className="px-1.5 py-0.5">{r.docNo}</td><td className="max-w-[160px] truncate px-1.5 py-0.5">{r.vendorName}</td><td className="px-1.5 py-0.5">{r.plantName}</td><td className="px-1.5 py-0.5 text-right tabular-nums">{n0(r.qty ?? 0)}</td><td className="px-1.5 py-0.5 text-right tabular-nums">{n2(r.rate ?? 0)}</td><td className="px-1.5 py-0.5 text-right tabular-nums">{r.value.toFixed(4)}</td></tr>)}</tbody></table>
    </DialogContent>
  </Dialog>;
}

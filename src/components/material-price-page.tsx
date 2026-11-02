import { useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Dot, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { datedFileName } from "@/lib/format";
import { collapseEmptyPeriods, periodSeries, type MaterialTrend, type Period } from "@/lib/purchase-material-trend";
import type { PurchaseRow } from "@/lib/purchase-register-data";
import { radiantBar, radiantColor } from "@/lib/radiant";

const n2 = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const n0 = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const sp = (v: number) => `${v >= 0 ? "▲ +" : "▼ "}${v.toFixed(1)}%`;
const UP = "var(--destructive)", DOWN = "var(--success)";
const toneOf = (v: number) => (v > 0 ? UP : v < 0 ? DOWN : "var(--muted-foreground)");

export function MaterialPricePage({ trend, rows, onBack }: { trend: MaterialTrend; rows: PurchaseRow[]; onBack: () => void }) {
  const [period, setPeriod] = useState<Period>(() => new Set(rows.filter((r) => r.material === trend.material).map((r) => r.date.slice(0, 7))).size <= 1 ? "day" : "month");
  const [hideEmpty, setHideEmpty] = useState(true);
  const lines = useMemo(() => rows.filter((r) => r.material === trend.material).sort((a, b) => a.date.localeCompare(b.date)), [rows, trend.material]);
  const series = useMemo(() => periodSeries(lines, period), [lines, period]);
  const bought = series.filter((p) => p.rate != null);
  const passKeys = new Set(bought.map((p) => p.key));
  const first = bought[0], last = bought[bought.length - 1], prev = bought[bought.length - 2];
  const vsPrev = prev && last ? ((last.rate! - prev.rate!) / prev.rate!) * 100 : 0;
  const sinceFirst = first && last ? ((last.rate! - first.rate!) / first.rate!) * 100 : 0;
  const rates = lines.map((r) => r.rate ?? 0).filter((v) => v > 0);
  const totalQty = lines.reduce((s, r) => s + (r.qty ?? 0), 0);
  const spend = lines.reduce((s, r) => s + r.value, 0);
  const unit = trend.unit || "unit";

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

  const stats: [string, string, (string | undefined)?, (string | undefined)?][] = [
    ["First price", `₹ ${n2(first?.rate ?? 0)}`, first?.label],
    ["Latest price", `₹ ${n2(last?.rate ?? 0)}`, last?.label],
    ["Since first", `${sinceFirst >= 0 ? "+" : ""}${sinceFirst.toFixed(1)}%`, undefined, toneOf(sinceFirst)],
    ["Quantity bought", n0(totalQty), unit],
    ["Lowest paid", `₹ ${n2(rates.length ? Math.min(...rates) : 0)}`],
    ["Highest paid", `₹ ${n2(rates.length ? Math.max(...rates) : 0)}`],
    ["Purchases", n0(lines.length)],
    ["Total spend", `₹ ${spend.toFixed(3)} Cr`],
  ];

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" className="h-8" onClick={onBack}><ArrowLeft className="mr-1 size-4" />Back</Button>
      <span className="rounded-full px-2.5 py-1 text-[11px] font-bold text-on-radiant" style={{ background: trend.direction === "rising" ? UP : DOWN }}>{trend.direction === "rising" ? "▲ Rising" : "▼ Falling"}</span>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex rounded-full border border-border bg-card p-0.5 text-[11px] font-semibold">
          {(["day", "month", "quarter", "year"] as const).map((p) => <button key={p} type="button" onClick={() => setPeriod(p)}
            className={`rounded-full px-3 py-1 ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{p === "day" ? "Daily" : p === "month" ? "Monthly" : p === "quarter" ? "Quarterly" : "Yearly"}</button>)}
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={download}><Download className="mr-1 size-3" />Excel</Button>
      </div>
    </div>


    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="-m-4 mb-3 rounded-t-xl p-4 text-on-radiant" style={{ background: `linear-gradient(120deg, #1f6fd1, ${sinceFirst >= 0 ? "#d64550" : "#2e8b57"})` }}>
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-90">{trend.material} · since first purchase</p>
        <div className="flex flex-wrap items-baseline gap-3"><span className="text-lg font-bold">{trend.name}</span><span className="text-3xl font-extrabold">{sp(sinceFirst)}</span></div>
      </div>
      <div className="flex flex-col gap-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Price now · {last?.label}</p>
          <div className="flex items-center gap-2"><span className="text-3xl font-bold" style={{ color: toneOf(vsPrev) }}>₹ {n2(last?.rate ?? 0)}</span>
            {prev ? <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color: toneOf(vsPrev), background: `color-mix(in oklab, ${toneOf(vsPrev)} 14%, transparent)` }}>{sp(vsPrev)}</span> : null}</div>
          {prev ? <p className="text-[10px] text-muted-foreground">vs {prev.label} (₹ {n2(prev.rate!)})</p> : null}</div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {stats.map(([l, v, s], i) => <div key={l} className="rounded-lg p-2.5 text-on-radiant shadow-sm" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${radiantColor(i)} 70%, white), ${radiantColor(i)})` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-90">{l}</p>
            <p className="text-base font-bold">{v}</p>{s ? <p className="text-[10px] opacity-85">{s}</p> : null}</div>)}
        </div>
      </div>
      <div className="mt-3"><ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={series} margin={{ top: 22, left: 4, right: 24, bottom: 0 }}>
          <defs><linearGradient id="mpp-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} /></linearGradient></defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} width={60} label={{ value: `₹ per ${unit}`, angle: -90, position: "insideLeft", fontSize: 10 }} />
          <Tooltip formatter={(v: number) => `₹ ${n2(v)}`} />
          <Area type="monotone" dataKey="rate" connectNulls stroke="none" fill="url(#mpp-area)" />
          <Line type="monotone" dataKey="rate" name="Price" connectNulls stroke="var(--primary)" strokeWidth={2.5}
            dot={(p: { cx?: number; cy?: number; index?: number; value?: number | null }) => {
              if (p.value == null || p.cx == null || p.cy == null) return <g key={p.index} />;
              const i = p.index ?? 0; const on = passKeys.has(series[i]?.key ?? ""); const before = series.slice(0, i).reverse().find((x) => x.rate != null);
              const c = before ? toneOf(p.value - before.rate!) : "var(--primary)";
              return <Dot key={i} cx={p.cx} cy={p.cy} r={on ? 6 : 3.5} fill={c} fillOpacity={on ? 1 : 0.3} stroke="var(--card)" strokeWidth={2} />;
            }}>
            <LabelList dataKey="rate" position="top" fontSize={10} fill="var(--foreground)" formatter={(v: number | null) => (v == null ? "" : n2(v))} />
          </Line>
        </ComposedChart></ResponsiveContainer></div>
    </section>

    <div className="grid gap-3 lg:grid-cols-2">
    <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <h3 className="text-xs font-semibold">Quantity bought</h3><p className="text-[10px] text-muted-foreground">{unit} per {period}</p>
        <ResponsiveContainer width="100%" height={200}><BarChart data={series} margin={{ top: 16, left: -8, right: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 9 }} />
          <Tooltip formatter={(v: number) => `${n0(v)} ${unit}`} />
          <Bar dataKey="qty" name="Quantity" radius={[4, 4, 0, 0]} maxBarSize={36} minPointSize={3}><LabelList dataKey="qty" position="top" fontSize={9} fill="var(--foreground)" formatter={(v: number) => (v ? n0(v) : "")} />{series.map((p, i) => <Cell key={p.key} fill={radiantColor(i)} />)}</Bar>
        </BarChart></ResponsiveContainer>
    </section>

    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold">Price by {period}</h3>
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><input type="checkbox" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} />Hide periods with no purchase</label>
      </div>
      <div className="max-h-[480px] overflow-auto"><table className="w-full text-[11px]">
        <thead className="sticky top-0 z-10 text-on-radiant" style={{ background: "linear-gradient(90deg, #1f6fd1, #0f9d8a, #8e44ad)" }}><tr>
          {["Period", "Price (₹)", "vs previous", "Since first", "Low – High", "Quantity", "Main vendor"].map((h, i) => <th key={h} className={`px-3 py-2 font-semibold ${i && i !== 6 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
        <tbody>{(() => {
          const rev = [...series].reverse();
          const bought = rev.filter((x) => x.rate != null);
          const lo = rates.length ? Math.min(...rates) : 0, hi = rates.length ? Math.max(...rates) : 1, span = hi - lo || 1;
          const pill = (v: number | null) => v == null ? <span className="text-muted-foreground">–</span> :
            <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: toneOf(v), background: `color-mix(in oklab, ${toneOf(v)} 14%, transparent)` }}>{sp(v)}</span>;
          return collapseEmptyPeriods(rev).filter((r) => r.kind === "gap" ? !hideEmpty : passKeys.has(r.point.key)).map((r) => {
            if (r.kind === "gap") return <tr key={`g-${r.from}`} className="border-t border-border/60 text-muted-foreground/70 italic"><td colSpan={7} className="px-3 py-1.5 text-center">No purchase · {r.count > 1 ? `${r.to} to ${r.from}` : r.from}</td></tr>;
            const p = r.point, bi = bought.indexOf(p), before = bought[bi + 1];
            const d = before ? ((p.rate! - before.rate!) / before.rate!) * 100 : null;
            const f = first && p.key !== first.key ? ((p.rate! - first.rate!) / first.rate!) * 100 : null;
            return <tr key={p.key} className="border-t border-border/60 font-medium odd:bg-muted/30 hover:bg-accent/40">
              <td className="px-3 py-2 font-semibold">{p.label}</td><td className="px-3 py-2 text-right text-sm font-bold tabular-nums">{n2(p.rate!)}</td>
              <td className="px-3 py-2 text-right">{pill(d)}</td><td className="px-3 py-2 text-right">{pill(f)}</td>
              <td className="px-3 py-2"><div className="ml-auto w-32"><div className="relative h-1.5 rounded-full bg-muted"><div className="absolute h-full rounded-full" style={{ left: `${((p.low! - lo) / span) * 100}%`, width: `${Math.max(3, ((p.high! - p.low!) / span) * 100)}%`, background: radiantBar(bi) }} /></div>
                <p className="mt-0.5 text-right text-[9px] tabular-nums text-muted-foreground">{n2(p.low!)} – {n2(p.high!)}</p></div></td>
              <td className="px-3 py-2 text-right tabular-nums">{n0(p.qty)}</td>
              <td className="max-w-[200px] truncate px-3 py-2">{p.vendor}</td></tr>;
          });
        })()}</tbody></table></div>
    </section>
    </div>
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2"><h3 className="text-xs font-semibold">Purchases by date</h3><span className="text-[10px] text-muted-foreground">{n0(lines.length)} purchases</span></div>
      <div className="max-h-[480px] overflow-auto"><table className="w-full text-[11px]">
        <thead className="sticky top-0 z-10 text-on-radiant" style={{ background: "linear-gradient(90deg, #1f6fd1, #0f9d8a, #8e44ad)" }}><tr>
          {["Date", "Document No", "Vendor", "Plant", "Quantity", "Unit", "Rate (₹)", "vs previous", "Value (₹ Cr)"].map((h, i) => <th key={h} className={`px-3 py-2 font-semibold ${i >= 4 && i !== 5 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
        <tbody>{lines.map((r, i) => {
          const pr = lines.slice(0, i).reverse().find((x) => (x.rate ?? 0) > 0);
          const d = pr && r.rate ? ((r.rate - pr.rate!) / pr.rate!) * 100 : null;
          return { r, d, i };
        }).reverse().map(({ r, d, i }) => <tr key={i} className="border-t border-border/60 odd:bg-muted/30 hover:bg-accent/40">
          <td className="px-3 py-2 font-semibold">{r.date.length >= 10 ? `${r.date.slice(8, 10)}-${r.date.slice(5, 7)}-${r.date.slice(0, 4)}` : r.date}</td><td className="px-3 py-2">{r.docNo ?? ""}</td>
          <td className="max-w-[220px] truncate px-3 py-2">{r.vendorName}</td><td className="px-3 py-2">{r.plantSh || r.plant}</td>
          <td className="px-3 py-2 text-right tabular-nums">{n0(r.qty ?? 0)}</td><td className="px-3 py-2">{r.unit ?? ""}</td>
          <td className="px-3 py-2 text-right font-bold tabular-nums">{n2(r.rate ?? 0)}</td>
          <td className="px-3 py-2 text-right">{d == null ? <span className="text-muted-foreground">–</span> : <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: toneOf(d), background: `color-mix(in oklab, ${toneOf(d)} 14%, transparent)` }}>{sp(d)}</span>}</td>
          <td className="px-3 py-2 text-right tabular-nums">{r.value.toFixed(3)}</td></tr>)}</tbody></table></div>
    </section>
  </div>;
}

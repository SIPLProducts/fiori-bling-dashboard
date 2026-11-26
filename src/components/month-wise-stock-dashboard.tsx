import { usePlantNames } from "@/hooks/use-plant-names";
import { useMemo, useState } from "react";
import { plantShort } from "@/lib/plant-names";
import { ChevronDown, IndianRupee } from "lucide-react";
import { Bar, CartesianGrid, Cell, ComposedChart, LabelList, ResponsiveContainer, Tooltip, Legend, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { BarList, Card, Tile } from "@/components/open-po-dashboard";
import { ZrmmatCompareCard } from "@/components/zrmmat-compare-card";
import { TINTS, type Tint } from "@/lib/card-tints";
import { datedFileName } from "@/lib/format";
import { radiantColor } from "@/lib/radiant";
import { OrderBookSubGroupChart } from "@/components/order-book-subgroup-chart";
import { summarizeGroupsByDivision } from "@/lib/open-orders-groups";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { monthWiseStockMonthQuery, monthWiseStockMaterialsQuery } from "@/lib/month-wise-stock-data";
import { sumBy, defaultPeriod, nowPeriodIST, latestPeriod, lastNMonthsByType, topWithOthers, toPurchaseRows, type StockRow } from "@/lib/month-wise-stock-map";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const crv = (v: number) => (v / 1e7).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const full = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pl = (p: string) => `${MON[Number(p.slice(5, 7)) - 1]}-${p.slice(0, 4)}`;
const TONES = ["#0f9d8a", "#e08a1e", "#8e44ad", "#d64550", "#3a8dde", "#16a3b8", "#c0841a", "#5c6bc0", "#2e8b57", "#64748b"];
type F = { plants: string[] | null; types: string[] | null };
const EMPTY: F = { plants: null, types: null };

export function MonthWiseStockDashboard({ rows }: { rows: StockRow[] }) {
  usePlantNames();
  const [f, setF] = useState<F>(EMPTY);
  const [collapsed, setCollapsed] = useState(true);
  const [showOthers, setShowOthers] = useState(false);
  const periods = useMemo(() => [...new Set(rows.map((r) => r.period))].sort(), [rows]);
  const defaultMonths = useMemo(() => { const d = defaultPeriod(periods, nowPeriodIST()); return d ? [d] : periods.length ? [periods[periods.length - 1] as string] : null; }, [periods]);
  const [monthSel, setMonthSel] = useState<string[] | null | undefined>(undefined);
  const months = monthSel === undefined ? defaultMonths : monthSel;
  const opt = (k: (r: StockRow) => string) => [...new Set(rows.map(k).filter(Boolean))].sort();
  const opts = useMemo(() => { const m = new Map<string, string>(); for (const r of rows) if (r.plant && !m.has(r.plant)) m.set(r.plant, r.sub3 && r.sub3 !== r.plant ? `${r.plant} - ${r.sub3}` : r.plant); return { plant: [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([value, label]) => ({ value, label })), type: opt((r) => r.type) }; }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = useMemo(() => rows.filter((r) => (!f.plants || f.plants.includes(r.plant)) && (!f.types || f.types.includes(r.type))
    && (!months || months.includes(r.period))), [rows, f, months]);
  // Month Wise Inventory uses every selected month; all other tiles/cards use the latest selected month.
  const lp = latestPeriod(months ?? periods);
  const cur = useMemo(() => filtered.filter((r) => r.period === lp), [filtered, lp]);
  const total = cur.reduce((s, r) => s + r.value, 0);
  const types = sumBy(cur, (r) => r.type);
  const tw = topWithOthers(types, 10);
  const monthly = useMemo(() => { const m = new Map<string, number>(); for (const r of filtered) m.set(r.period, (m.get(r.period) ?? 0) + r.value); return [...m.entries()].sort().map(([k, v]) => ({ name: pl(k), value: v })); }, [filtered]);
  const cmp = useMemo(() => lastNMonthsByType(rows.filter((r) => (!f.plants || f.plants.includes(r.plant)) && (!f.types || f.types.includes(r.type))), periods), [rows, f, periods]);
  const mq = useQuery(monthWiseStockMaterialsQuery);
  const matsF = useMemo(() => (mq.data ?? []).filter((r) => (!f.plants || f.plants.includes(r.plant)) && (!f.types || f.types.includes(r.type)) && (!months || months.includes(r.period))), [mq.data, f, months]);
  const matsCur = useMemo(() => matsF.filter((r) => r.period === lp), [matsF, lp]);
  const zk = useMemo(() => toPurchaseRows(matsF), [matsF]);
  const MS = "col-span-2 sm:col-span-1 [&_label>span]:h-auto [&_label>span]:text-[10px] [&_label>span]:font-semibold [&_label]:space-y-0";
  const field = (k: "plants" | "types", o: (string | { value: string; label: string })[], label: string) => <div className={MS}><FilterMultiSelect label={label} selected={f[k]} options={o as never} onChange={(v) => setF({ ...f, [k]: v.length === o.length ? null : v })} placeholder="All" /></div>;
  const sub = lp ? pl(lp) : "No months";
  const gCard = (title: string, k: (r: StockRow) => string, tint: Tint) => {
    const g = summarizeGroupsByDivision(cur.filter((r) => k(r)).map((r) => ({ name: k(r), value: r.value / 1e7, order: r.key, division: r.plant })), (r) => r.name);
    return <Card tint={tint} title={title} sub={`${sub} · ₹ Cr`}>{g.groups.length ? <OrderBookSubGroupChart groups={g.groups} divisions={g.divisions} groupLabel={title} /> : <p className="py-8 text-center text-xs text-muted-foreground">No data</p>}</Card>;
  };

  return <div className="space-y-3">
    <div data-pdf-exclude className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
      <button type="button" aria-expanded={!collapsed} onClick={() => setCollapsed((c) => !c)} className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-card-foreground"><span>Filters</span><ChevronDown className={`size-4 transition-transform ${collapsed ? "-rotate-90" : ""}`} /></button>
      {collapsed ? null : <div className="grid grid-cols-2 gap-2 px-3 pb-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 sm:col-span-1 [&_label>span]:h-auto [&_label>span]:text-[10px] [&_label>span]:font-semibold [&_label]:space-y-0"><FilterMultiSelect label="Month" selected={months} options={periods.map((p) => ({ value: p, label: pl(p) }))} onChange={(v) => setMonthSel(v.length === periods.length ? null : v)} placeholder="All months" /></div>{field("plants", opts.plant, "Plant")}{field("types", opts.type, "Type")}
        <div className="flex items-end"><Button type="button" variant="reset" size="sm" className="h-8 w-full text-xs" onClick={() => { setF(EMPTY); setMonthSel(undefined); }}>Reset</Button></div>
      </div>}
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      <Tile icon={<IndianRupee className="size-5" />} label="Total Inv" value={crv(total)} tone="#1f6fd1" />
      {types.filter((t) => t.value !== 0).slice(0, 5).map((t, i) => <Tile key={t.name} icon={<IndianRupee className="size-5" />} label={t.name} value={crv(t.value)} tone={TONES[i % TONES.length] ?? "#64748b"} />)}
    </div>

    <div className="grid grid-cols-1 gap-3">
      <Card tint="teal" title="Month Wise Inventory" sub={`${months && months.length !== periods.length ? `${months.length} month(s)` : "All months"} · CB Val · ₹ Cr`}><div className="h-64"><ResponsiveContainer><ComposedChart data={monthly} margin={{ top: 18, left: 10, right: 8 }}>
        <defs>{Array.from({ length: 10 }, (_, i) => <linearGradient key={i} id={`mws-g${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={radiantColor(i)} /><stop offset="100%" stopColor={radiantColor(i)} stopOpacity={0.45} /></linearGradient>)}</defs><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--foreground)", fontWeight: 600 }} /><YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} tickFormatter={(v: number) => (v / 1e7).toFixed(0)} />
        <Tooltip formatter={(v: number) => crv(v)} />
        <Bar dataKey="value" name="CB Val" radius={[6, 6, 0, 0]} maxBarSize={44}>{monthly.map((_, i) => <Cell key={i} fill={`url(#mws-g${i % 10})`} />)}<LabelList dataKey="value" position="top" formatter={(v: number) => crv(v)} style={{ fontSize: 9, fontWeight: 700, fill: "var(--foreground)" }} /></Bar>
      </ComposedChart></ResponsiveContainer></div></Card>
    </div>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
      <Card tint="violet" title="Last 3 Months Comparison" sub="Top 5 Types · ₹ Cr">{cmp.data.length ? <div className="h-64"><ResponsiveContainer><ComposedChart data={cmp.data} margin={{ top: 18, left: 10, right: 8 }}>
        <defs>{cmp.months.map((_, i) => <linearGradient key={i} id={`mws-c${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={radiantColor(i * 3)} /><stop offset="100%" stopColor={radiantColor(i * 3)} stopOpacity={0.45} /></linearGradient>)}</defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" interval={0} tick={{ fontSize: 10, fill: "var(--foreground)", fontWeight: 600 }} /><YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} tickFormatter={(v: number) => (v / 1e7).toFixed(0)} />
        <Tooltip formatter={(v: number) => crv(v)} /><Legend wrapperStyle={{ fontSize: 11 }} />
        {cmp.months.map((p, i) => <Bar key={p} dataKey={p} name={pl(p)} fill={`url(#mws-c${i})`} radius={[4, 4, 0, 0]} maxBarSize={28}><LabelList dataKey={p} position="top" formatter={(v: number) => crv(v)} style={{ fontSize: 8, fontWeight: 700, fill: "var(--foreground)" }} /></Bar>)}
      </ComposedChart></ResponsiveContainer></div> : <p className="py-8 text-center text-xs text-muted-foreground">No data</p>}</Card>
      <Card tint="sky" title="Top 10 Types" sub={`${sub} · ₹ Cr`}><BarList data={tw.top} fmt={crv} />{tw.others.length ? <button type="button" data-pdf-exclude onClick={() => setShowOthers(true)} className="mt-2 w-full rounded-md border border-border px-2 py-1 text-left text-[11px] font-semibold text-primary hover:bg-muted">Others ({tw.others.length}) · ₹ {crv(tw.others.reduce((a, o) => a + o.value, 0))} Cr — view</button> : null}</Card>
      <Dialog open={showOthers} onOpenChange={setShowOthers}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Other Types (₹ Cr)</DialogTitle></DialogHeader><BarList data={tw.others} fmt={crv} /></DialogContent></Dialog>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="lg:col-span-8"><Card tint="copper" title="Top 15 Plants" sub={`${sub} · ₹ Cr`}><div className="h-64"><ResponsiveContainer><ComposedChart data={sumBy(cur, (r) => r.sub3 || r.plant).slice(0, 15)} margin={{ top: 18, left: 10, right: 8 }}>
        <defs>{Array.from({ length: 15 }, (_, i) => <linearGradient key={i} id={`mws-p${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={radiantColor(i)} /><stop offset="100%" stopColor={radiantColor(i)} stopOpacity={0.45} /></linearGradient>)}</defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} tick={{ fontSize: 10, fill: "var(--foreground)", fontWeight: 600 }} /><YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} tickFormatter={(v: number) => (v / 1e7).toFixed(0)} />
        <Tooltip formatter={(v: number) => crv(v)} />
        <Bar dataKey="value" name="CB Val" radius={[6, 6, 0, 0]} maxBarSize={44}>{sumBy(cur, (r) => r.sub3 || r.plant).slice(0, 15).map((_, i) => <Cell key={i} fill={`url(#mws-p${i})`} />)}<LabelList dataKey="value" position="top" formatter={(v: number) => crv(v)} style={{ fontSize: 9, fontWeight: 700, fill: "var(--foreground)" }} /></Bar>
      </ComposedChart></ResponsiveContainer></div></Card></div>
      <div className="lg:col-span-4"><Card tint="violet" title="Top 10 Materials" sub={`${sub} · ₹ Cr`}>{mq.isLoading ? <p className="py-8 text-center text-xs text-muted-foreground">Loading materials…</p> : <BarList data={sumBy(matsCur, (r) => r.materialName || r.material).slice(0, 10)} fmt={crv} />}</Card></div>
    </div>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {gCard("Main Group", (r) => r.mainGroup, "sky")}
      {gCard("Sub Group 1", (r) => r.sub1, "teal")}
      {gCard("Sub Group 2", (r) => r.sub2, "violet")}
      {gCard("Sub Group 3", (r) => r.sub3, "rose")}
    </div>

    <ZrmmatCompareCard rows={zk} emptyLabel="no stock in selected months" />

    <div data-pdf-exclude><MonthDetails period={lp} plants={f.plants} types={f.types} /></div>
  </div>;
}

function MonthDetails({ period, plants, types }: { period: string; plants: string[] | null; types: string[] | null }) {
  const q = useQuery(monthWiseStockMonthQuery(period));
  const rows = useMemo(() => (q.data ?? []).filter((r) => (!plants || plants.includes(r.plant)) && (!types || types.includes(r.type))), [q.data, plants, types]);
  if (q.isError) return <p className="p-3 text-xs text-destructive">{(q.error as Error).message}</p>;
  if (q.isLoading) return <section className="rounded-xl border border-border p-6 text-center text-xs text-muted-foreground shadow-sm" style={TINTS.neutral}>Loading stock details…</section>;
  return <DetailsTable rows={rows} />;
}

const HEADS = ["Month", "Plant", "Plant Short Name", "Location", "Material", "Description", "Profit Centre", "Val Class", "Type", "Matl Group", "Main Group", "Sub Group 1", "Sub Group 2", "Sub Group 3", "UOM", "CB Qty", "CB Val"];
const cells = (r: StockRow) => [pl(r.period), r.plant, plantShort(r.plant), r.location, r.material, r.materialName, r.profitCenter, r.valClass, r.type, r.matGroup, r.mainGroup, r.sub1, r.sub2, r.sub3, r.unit, r.qty, r.value];

function DetailsTable({ rows }: { rows: StockRow[] }) {
  const [q, setQ] = useState(""); const [page, setPage] = useState(0); const [size, setSize] = useState(10);
  const s = q.toLowerCase();
  const list = useMemo(() => rows.filter((r) => !s || cells(r).some((v) => String(v).toLowerCase().includes(s))).sort((a, b) => b.period.localeCompare(a.period) || b.value - a.value), [rows, s]);
  const pages = Math.max(1, Math.ceil(list.length / size)); const p = Math.min(page, pages - 1);
  const tot = list.reduce((a, r) => a + r.value, 0);
  const excel = async () => {
    const { Workbook } = await import("exceljs");
    const wb = new Workbook(); const sh = wb.addWorksheet("Month Wise Stock");
    const h = sh.addRow(HEADS); h.font = { bold: true, color: { argb: "FFFFFFFF" } }; h.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A6ED1" } }; });
    list.forEach((r) => sh.addRow(cells(r)));
    sh.columns.forEach((c) => { c.width = 16; });
    const url = URL.createObjectURL(new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a"); a.href = url; a.download = datedFileName("Month Wise Stock", "xlsx"); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
      <h2 className="text-xs font-semibold">Stock Details</h2>
      <div className="flex items-center gap-2">
        <button type="button" disabled={!list.length} onClick={() => void excel()} className="btn-export rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-40">Excel</button>
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search material, plant, group..." className="h-8 w-56 rounded-md border border-border bg-background px-2 text-xs" />
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-[11px]">
      <thead className="text-on-radiant" style={{ background: "linear-gradient(90deg, #1f6fd1, #0f9d8a)" }}><tr>{HEADS.map((h) => <th key={h} className={`whitespace-nowrap px-2 py-1.5 font-semibold ${h.startsWith("CB") ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
      <tbody>{list.length ? list.slice(p * size, p * size + size).map((r) => <tr key={r.key} className="border-t border-border/60 odd:bg-muted/30 hover:bg-primary/10">
        {cells(r).map((v, i) => <td key={i} className={`whitespace-nowrap px-2 py-1 ${typeof v === "number" ? "text-right tabular-nums" : ""}`}>{typeof v === "number" ? full(v) : v}</td>)}</tr>)
        : <tr><td colSpan={HEADS.length} className="h-20 text-center text-muted-foreground">No stock rows for these filters.</td></tr>}</tbody>
      {list.length > 0 && <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td colSpan={HEADS.length - 1} className="px-2 py-1.5">Total ({list.length} lines)</td><td className="px-2 py-1.5 text-right tabular-nums">{full(tot)}</td></tr></tfoot>}
    </table></div>
    <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2 text-xs">
      <span>Rows</span><select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }} className="rounded border border-border bg-background px-1 py-0.5">{[10, 25, 50].map((n) => <option key={n}>{n}</option>)}</select>
      <span className="text-muted-foreground">Showing {list.length ? p * size + 1 : 0}–{Math.min(list.length, p * size + size)} of {list.length}</span>
      <button type="button" disabled={p === 0} onClick={() => setPage(p - 1)} className="btn-soft rounded-md px-2 py-0.5 disabled:opacity-40">Previous</button>
      <span>{p + 1} / {pages}</span>
      <button type="button" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="btn-soft rounded-md px-2 py-0.5 disabled:opacity-40">Next</button>
    </div>
  </section>;
}

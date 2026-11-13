import { useMemo, useState } from "react";
import { ChevronDown, IndianRupee } from "lucide-react";
import { Bar, CartesianGrid, Cell, ComposedChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { BarList, Card, Tile } from "@/components/open-po-dashboard";
import { ZrmmatCompareCard } from "@/components/zrmmat-compare-card";
import { TINTS, type Tint } from "@/lib/card-tints";
import { datedFileName } from "@/lib/format";
import { radiantColor } from "@/lib/radiant";
import { OrderBookSubGroupChart } from "@/components/order-book-subgroup-chart";
import { summarizeGroupsByDivision } from "@/lib/open-orders-groups";
import { sumBy, toPurchaseRows, type StockRow } from "@/lib/month-wise-stock-map";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const full = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pl = (p: string) => `${MON[Number(p.slice(5, 7)) - 1]}-${p.slice(0, 4)}`;
const TONES = ["#0f9d8a", "#e08a1e", "#8e44ad", "#d64550", "#3a8dde", "#16a3b8", "#c0841a", "#5c6bc0", "#2e8b57", "#64748b"];
const sel = "h-8 w-full rounded-md border border-border bg-background px-2 text-xs";
type F = { plant: string; type: string; matGroup: string; from: string; to: string };
const EMPTY: F = { plant: "", type: "", matGroup: "", from: "", to: "" };

export function MonthWiseStockDashboard({ rows }: { rows: StockRow[] }) {
  const [f, setF] = useState<F>(EMPTY);
  const [collapsed, setCollapsed] = useState(true);
  const periods = useMemo(() => [...new Set(rows.map((r) => r.period))].sort(), [rows]);
  const opt = (k: (r: StockRow) => string) => [...new Set(rows.map(k).filter(Boolean))].sort();
  const opts = useMemo(() => ({ plant: opt((r) => r.plant), type: opt((r) => r.type), matGroup: opt((r) => r.matGroup) }), [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = useMemo(() => rows.filter((r) => (!f.plant || r.plant === f.plant) && (!f.type || r.type === f.type) && (!f.matGroup || r.matGroup === f.matGroup)
    && (!f.from || r.period >= f.from) && (!f.to || r.period <= f.to)), [rows, f]);
  // Tiles and cards add up every month in the selected range (All = every month).
  const cur = filtered;
  const total = cur.reduce((s, r) => s + r.value, 0);
  const types = sumBy(cur, (r) => r.type);
  const monthly = useMemo(() => { const m = new Map<string, number>(); for (const r of filtered) m.set(r.period, (m.get(r.period) ?? 0) + r.value); return [...m.entries()].sort().map(([k, v]) => ({ name: pl(k), value: v })); }, [filtered]);
  const zk = useMemo(() => toPurchaseRows(filtered), [filtered]);
  const field = (k: "plant" | "type" | "matGroup", label: string) => <label className="min-w-0 text-[10px] font-semibold text-muted-foreground">{label}
    <select className={sel} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-label={label}><option value="">All</option>{opts[k].map((v) => <option key={v} value={v}>{v}</option>)}</select></label>;
  const period = (k: "from" | "to", label: string) => <label className="min-w-0 text-[10px] font-semibold text-muted-foreground">{label}
    <select className={sel} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-label={label}><option value="">All</option>{periods.map((p) => <option key={p} value={p}>{pl(p)}</option>)}</select></label>;
  const sub = !f.from && !f.to ? "All months" : f.from && f.from === f.to ? pl(f.from) : `${f.from ? pl(f.from) : "Start"} – ${f.to ? pl(f.to) : "Latest"}`;
  const gCard = (title: string, k: (r: StockRow) => string, tint: Tint) => {
    const g = summarizeGroupsByDivision(cur.filter((r) => k(r)).map((r) => ({ name: k(r), value: r.value / 1e7, order: r.key, division: r.plant })), (r) => r.name);
    return <Card tint={tint} title={title} sub="₹ Cr">{g.groups.length ? <OrderBookSubGroupChart groups={g.groups} divisions={g.divisions} groupLabel={title} /> : <p className="py-8 text-center text-xs text-muted-foreground">No data</p>}</Card>;
  };
  const groupCard = (title: string, k: (r: StockRow) => string, tint: Tint) => <Card tint={tint} title={title} sub={sub}><BarList data={sumBy(cur, k).slice(0, 10)} fmt={full} /></Card>;

  return <div className="space-y-3">
    <div data-pdf-exclude className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
      <button type="button" aria-expanded={!collapsed} onClick={() => setCollapsed((c) => !c)} className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-card-foreground"><span>Filters</span><ChevronDown className={`size-4 transition-transform ${collapsed ? "-rotate-90" : ""}`} /></button>
      {collapsed ? null : <div className="grid grid-cols-2 gap-2 px-3 pb-2 sm:grid-cols-3 lg:grid-cols-6">
        {period("from", "Month From")}{period("to", "Month To")}{field("plant", "Plant")}{field("type", "Type")}{field("matGroup", "Material Group")}
        <div className="flex items-end"><Button type="button" variant="reset" size="sm" className="h-8 w-full text-xs" onClick={() => setF(EMPTY)}>Reset</Button></div>
      </div>}
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      <Tile icon={<IndianRupee className="size-5" />} label="Total Inv Val" value={full(total)} tone="#1f6fd1" />
      {types.filter((t) => t.value !== 0).map((t, i) => <Tile key={t.name} icon={<IndianRupee className="size-5" />} label={`${t.name} Val`} value={full(t.value)} tone={TONES[i % TONES.length] ?? "#64748b"} />)}
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
      <Card tint="teal" title="Month Wise Inventory" sub="CB Val"><div className="h-64"><ResponsiveContainer><ComposedChart data={monthly} margin={{ top: 18, left: 10, right: 8 }}>
        <defs>{Array.from({ length: 10 }, (_, i) => <linearGradient key={i} id={`mws-g${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={radiantColor(i)} /><stop offset="100%" stopColor={radiantColor(i)} stopOpacity={0.45} /></linearGradient>)}</defs><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--foreground)", fontWeight: 600 }} /><YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} tickFormatter={(v: number) => v.toLocaleString("en-IN", { notation: "compact" })} />
        <Tooltip formatter={(v: number) => full(v)} />
        <Bar dataKey="value" name="CB Val" radius={[6, 6, 0, 0]} maxBarSize={44}>{monthly.map((_, i) => <Cell key={i} fill={`url(#mws-g${i % 10})`} />)}<LabelList dataKey="value" position="top" formatter={(v: number) => full(v)} style={{ fontSize: 9, fontWeight: 700, fill: "var(--foreground)" }} /></Bar>
      </ComposedChart></ResponsiveContainer></div></Card>
      <Card tint="sky" title="Top Types" sub={sub}><BarList data={types.slice(0, 10)} fmt={full} /></Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
      <Card tint="copper" title="Top 10 Plants" sub={sub}><div className="h-64"><ResponsiveContainer><ComposedChart data={sumBy(cur, (r) => r.plant).slice(0, 10)} margin={{ top: 18, left: 10, right: 8 }}>
        <defs>{Array.from({ length: 10 }, (_, i) => <linearGradient key={i} id={`mws-p${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={radiantColor(i)} /><stop offset="100%" stopColor={radiantColor(i)} stopOpacity={0.45} /></linearGradient>)}</defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" interval={0} tick={{ fontSize: 10, fill: "var(--foreground)", fontWeight: 600 }} /><YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} tickFormatter={(v: number) => v.toLocaleString("en-IN", { notation: "compact" })} />
        <Tooltip formatter={(v: number) => full(v)} />
        <Bar dataKey="value" name="CB Val" radius={[6, 6, 0, 0]} maxBarSize={44}>{sumBy(cur, (r) => r.plant).slice(0, 10).map((_, i) => <Cell key={i} fill={`url(#mws-p${i})`} />)}<LabelList dataKey="value" position="top" formatter={(v: number) => full(v)} style={{ fontSize: 9, fontWeight: 700, fill: "var(--foreground)" }} /></Bar>
      </ComposedChart></ResponsiveContainer></div></Card>
      {groupCard("Top 10 Material Groups", (r) => r.matGroup, "steel")}
      {groupCard("Top 10 Materials", (r) => r.materialName || r.material, "violet")}
    </div>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {gCard("Main Group", (r) => r.mainGroup, "sky")}
      {gCard("Sub Group 1", (r) => r.sub1, "teal")}
      {gCard("Sub Group 2", (r) => r.sub2, "violet")}
      {gCard("Sub Group 3", (r) => r.sub3, "rose")}
    </div>

    <ZrmmatCompareCard rows={zk} />

    <div data-pdf-exclude><DetailsTable rows={filtered} /></div>
  </div>;
}

const HEADS = ["Month", "Plant", "Location", "Material", "Description", "Profit Centre", "Val Class", "Type", "Matl Group", "Main Group", "Sub Group 1", "Sub Group 2", "Sub Group 3", "UOM", "CB Qty", "CB Val"];
const cells = (r: StockRow) => [pl(r.period), r.plant, r.location, r.material, r.materialName, r.profitCenter, r.valClass, r.type, r.matGroup, r.mainGroup, r.sub1, r.sub2, r.sub3, r.unit, r.qty, r.value];

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

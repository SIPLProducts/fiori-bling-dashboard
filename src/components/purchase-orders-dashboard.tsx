import { useMemo, useState } from "react";
import { ChevronDown, ClipboardList, FileText, IndianRupee, Truck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { OrderBookSubGroupChart } from "@/components/order-book-subgroup-chart";
import { summarizeGroupsByDivision } from "@/lib/open-orders-groups";
import { BarList, Card, Donut, PlantColumns, Tile } from "@/components/open-po-dashboard";
import { TINTS } from "@/lib/card-tints";
import { datedFileName } from "@/lib/format";
import { monthlyByGroup, PO_GROUP_COLORS, PO_GROUPS, poGroup, poTotals, quarterlyCompare, sumInr, type PoRow } from "@/lib/purchase-orders-data";

const COLORS = ["#1f6fd1", "#0f9d8a", "#e08a1e", "#8e44ad", "#d64550", "#3a8dde", "#16a3b8", "#c0841a", "#5c6bc0", "#2e8b57"];
const CR = 1e7;
const cr = (v: number) => (v / CR).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const dmy = (d: string) => (d ? `${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(0, 4)}` : "");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const sel = "h-8 w-full rounded-md border border-border bg-background px-2 text-xs";

type Filters = Record<"plant" | "poType" | "vendor" | "purGroup" | "materialGroup" | "mainGroup" | "sub1" | "sub2" | "division", string>;
const EMPTY: Filters = { plant: "", poType: "", vendor: "", purGroup: "", materialGroup: "", mainGroup: "", sub1: "", sub2: "", division: "" };

export function PurchaseOrdersDashboard({ rows }: { rows: PoRow[] }) {
  const [f, setF] = useState<Filters>(EMPTY);
  const [collapsed, setCollapsed] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const opts = useMemo(() => {
    const u = (k: (r: PoRow) => string, l?: (r: PoRow) => string) => {
      const m = new Map<string, string>(); for (const r of rows) if (k(r)) m.set(k(r), l ? l(r) : k(r));
      return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    };
    return {
      plant: u((r) => r.plant, (r) => `${r.plant} — ${r.plantName}`), poType: u((r) => r.poType), vendor: u((r) => r.vendor, (r) => r.vendorName),
      purGroup: u((r) => r.purGroup), materialGroup: u((r) => r.materialGroup),
      mainGroup: u((r) => r.mainGroup), sub1: u((r) => r.sub1), sub2: u((r) => r.sub2), division: u((r) => r.division),
    };
  }, [rows]);
  const filtered = useMemo(() => rows.filter((r) =>
    (!f.plant || r.plant === f.plant) && (!f.poType || r.poType === f.poType) && (!f.vendor || r.vendor === f.vendor)
    && (!f.purGroup || r.purGroup === f.purGroup) && (!f.materialGroup || r.materialGroup === f.materialGroup)
    && (!f.mainGroup || r.mainGroup === f.mainGroup) && (!f.sub1 || r.sub1 === f.sub1) && (!f.sub2 || r.sub2 === f.sub2) && (!f.division || r.division === f.division)
    && (!from || r.poDate >= from) && (!to || r.poDate <= to)), [rows, f, from, to]);
  const tot = poTotals(filtered);
  const types = sumInr(filtered, poGroup);
  const stacked = monthlyByGroup(filtered).map((m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, typeof v === "number" ? v / CR : v])));
  const qc = quarterlyCompare(filtered);
  const qData = qc.data.map((d) => ({ name: d.name, current: d.current / CR, previous: d.previous / CR }));
  const plantRows = (() => { const m = new Map<string, { code: string; name: string; value: number }>(); for (const r of filtered) if (r.inr) { const o = m.get(r.plant) ?? { code: r.plant, name: r.division || r.plant, value: 0 }; o.value += r.netValue; m.set(r.plant, o); } return [...m.values()].sort((a, b) => b.value - a.value).slice(0, 12); })();
  const vendors = sumInr(filtered, (r) => r.vendorName).slice(0, 10);
  const materials = sumInr(filtered, (r) => r.materialName).slice(0, 10);
  const plants = sumInr(filtered, (r) => r.division || r.plant).slice(0, 12).map((d) => ({ name: d.name, value: d.value / CR }));
  const purGroups = sumInr(filtered, (r) => r.purGroup).slice(0, 10);
  const grp = (k: (r: PoRow) => string) => summarizeGroupsByDivision(filtered.filter((r) => r.inr && k(r)).map((r) => ({ name: k(r), value: r.netValue, order: r.poNo, division: r.plantName || r.plant })), (r) => r.name);
  const mainGroups = grp((r) => r.mainGroup), sub1s = grp((r) => r.sub1), sub2s = grp((r) => r.sub2);
  const gChart = (g: ReturnType<typeof grp>, label: string) => g.groups.length ? <OrderBookSubGroupChart groups={g.groups} divisions={g.divisions} groupLabel={label} /> : <p className="py-8 text-center text-xs text-muted-foreground">No data</p>;
  const monthly = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) if (r.inr && r.poDate) m.set(r.poDate.slice(0, 7), (m.get(r.poDate.slice(0, 7)) ?? 0) + r.netValue);
    return [...m.entries()].sort().map(([k, v]) => ({ name: `${MONTHS[Number(k.slice(5, 7)) - 1]}-${k.slice(2, 4)}`, value: v / CR }));
  }, [filtered]);
  const field = (k: keyof Filters, label: string) => <label className="min-w-0 text-[10px] font-semibold text-muted-foreground">{label}
    <select className={sel} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-label={label}><option value="">All</option>{opts[k].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;

  return <div className="space-y-3">
    <div data-pdf-exclude className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
      <button type="button" aria-expanded={!collapsed} onClick={() => setCollapsed((c) => !c)} className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-card-foreground">
        <span>Filters</span><ChevronDown className={`size-4 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
      </button>
      {collapsed ? null : <div className="grid grid-cols-2 gap-2 px-3 pb-2 sm:grid-cols-4 lg:grid-cols-8">
        {field("plant", "Plant")}{field("poType", "Document Type")}{field("vendor", "Vendor")}{field("purGroup", "Purchasing Group")}{field("materialGroup", "Material Group")}{field("division", "Division")}
        <label className="text-[10px] font-semibold text-muted-foreground">PO Date From<input type="date" className={sel} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-[10px] font-semibold text-muted-foreground">PO Date To<input type="date" className={sel} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
        <div className="flex items-end"><Button type="button" variant="reset" size="sm" className="h-8 w-full text-xs" onClick={() => { setF(EMPTY); setFrom(""); setTo(""); }}>Reset</Button></div>
      </div>}
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Tile icon={<IndianRupee className="size-5" />} label="Total Val" value={cr(tot.value)} tone="#1f6fd1" />
      <Tile icon={<ClipboardList className="size-5" />} label="POs / Lines" value={`${tot.poCount.toLocaleString("en-IN")} / ${tot.lines.toLocaleString("en-IN")}`} tone="#0f9d8a" />
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
      <Card tint="teal" title="Purchase Trend" sub="Monthly"><div className="h-56"><ResponsiveContainer><ComposedChart data={monthly} margin={{ top: 16, left: -16, right: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--foreground)", fontWeight: 600 }} /><YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} />
        <Tooltip formatter={(v: number) => v.toFixed(2)} />
        <Bar dataKey="value" name="PO Val" fill="#1f6fd1" radius={[6, 6, 0, 0]} maxBarSize={40}><LabelList dataKey="value" position="top" formatter={(v: number) => v.toFixed(2)} style={{ fontSize: 10, fontWeight: 700, fill: "var(--foreground)" }} /></Bar>
      </ComposedChart></ResponsiveContainer></div></Card>
      <Card tint="sky" title="Document Type"><Donut data={types} colors={types.map((d) => PO_GROUP_COLORS[d.name] ?? "#64748b")} heads={["Type", "Val", "%"]} /></Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card tint="steel" title="Top Materials"><BarList data={materials} /></Card>
      <Card tint="rose" title="Top Vendors"><BarList data={vendors} /></Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card tint="mint" title="Monthly Expenditure" sub="By document type"><div className="h-56"><ResponsiveContainer><BarChart data={stacked} margin={{ top: 8, left: -16, right: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--foreground)" }} /><YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} />
        <Tooltip formatter={(v: number) => v.toFixed(2)} /><Legend wrapperStyle={{ fontSize: 10 }} />
        {PO_GROUPS.filter((g) => stacked.some((m) => (m as Record<string, unknown>)[g])).map((g) => <Bar key={g} dataKey={g} stackId="m" fill={PO_GROUP_COLORS[g]} />)}
      </BarChart></ResponsiveContainer></div></Card>
      <Card tint="peach" title="Quarterly Comparison" sub={<span>FY{String(qc.fy).slice(2)} vs FY{String(qc.fy - 1).slice(2)} · <b className={qc.yoy < 0 ? "text-destructive" : "text-success"}>{qc.yoy < 0 ? "▼" : "▲"} {Math.abs(qc.yoy)}% YoY</b></span>}>
        <div className="h-56"><ResponsiveContainer><BarChart data={qData} margin={{ top: 16, left: -16, right: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--foreground)" }} /><YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} />
          <Tooltip formatter={(v: number) => v.toFixed(2)} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="current" name={`FY${String(qc.fy).slice(2)}`} fill="#1f6fd1" radius={[4, 4, 0, 0]} maxBarSize={26}><LabelList dataKey="current" position="top" formatter={(v: number) => v.toFixed(2)} style={{ fontSize: 9, fill: "var(--foreground)" }} /></Bar>
          <Bar dataKey="previous" name={`FY${String(qc.fy - 1).slice(2)}`} fill="#8e44ad" radius={[4, 4, 0, 0]} maxBarSize={26}><LabelList dataKey="previous" position="top" formatter={(v: number) => v.toFixed(2)} style={{ fontSize: 9, fill: "var(--foreground)" }} /></Bar>
        </BarChart></ResponsiveContainer></div></Card>
    </div>

    <Card tint="sky" title="Main Group" sub="₹ Cr">{gChart(mainGroups, "Main Group")}</Card>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card tint="teal" title="Sub Group 1" sub="₹ Cr">{gChart(sub1s, "Sub Group 1")}</Card>
      <Card tint="violet" title="Sub Group 2" sub="₹ Cr">{gChart(sub2s, "Sub Group 2")}</Card>
    </div>
    <Card tint="copper" title="Plant Analytics" sub="Top 12">
      <PlantColumns data={plants} />
      <table className="mt-2 w-full text-[11px]"><thead><tr className="border-b border-border"><th className="px-1.5 py-1 text-left">Plant Code</th><th className="px-1.5 py-1 text-left">Short Name</th><th className="px-1.5 py-1 text-right">Val</th></tr></thead>
        <tbody>{plantRows.map((p, i) => <tr key={p.code} className="border-t border-border/60"><td className="px-1.5 py-0.5 font-medium text-primary"><span className="mr-1 inline-block size-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />{p.code}</td><td className="px-1.5 py-0.5">{p.name}</td><td className="px-1.5 py-0.5 text-right tabular-nums">{cr(p.value)}</td></tr>)}</tbody>
        <tfoot><tr className="border-t-2 border-border font-bold"><td className="px-1.5 py-1" colSpan={2}>Total</td><td className="px-1.5 py-1 text-right tabular-nums">{cr(plantRows.reduce((s, p) => s + p.value, 0))}</td></tr></tfoot></table>
    </Card>

    <Card tint="violet" title="PO Value by Purchasing Group"><BarList data={purGroups} /></Card>

    <div data-pdf-exclude><DetailsTable rows={filtered} /></div>
  </div>;
}

function DetailsTable({ rows }: { rows: PoRow[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const s = q.toLowerCase();
  const list = useMemo(() => rows.filter((r) => !s || [r.poNo, r.vendorName, r.vendor, r.material, r.materialName, r.plantName, r.poType, r.poTypeCode, r.purGroup, r.mainGroup, r.sub1, r.sub2, r.division].some((v) => v.toLowerCase().includes(s)))
    .sort((a, b) => b.poDate.localeCompare(a.poDate) || a.poNo.localeCompare(b.poNo)), [rows, s]);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const p = Math.min(page, pages - 1);
  const heads = ["PO Date", "PO No", "Item", "Delivery Date", "Days", "Document Type", "Vendor", "Plant", "SLoc", "Main Group", "Sub Group 1", "Sub Group 2", "Division", "Material", "Qty", "UOM", "Net Price", "Currency", "Net Order Val (Cr)"];
  const numeric = new Set(["Days", "Qty", "Net Price", "Net Order Val (Cr)"]);
  const t = poTotals(list);
  const c2 = (v: number) => Math.round((v / CR) * 100) / 100;
  const typeLabel = (r: PoRow) => `${r.poTypeCode || "—"} – ${poGroup(r)}`;
  const excel = async () => {
    const { Workbook } = await import("exceljs");
    const wb = new Workbook(); const sh = wb.addWorksheet("Purchase Orders");
    const h = sh.addRow(heads); h.font = { bold: true, color: { argb: "FFFFFFFF" } }; h.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A6ED1" } }; });
    list.forEach((r) => sh.addRow([dmy(r.poDate), r.poNo, r.item, dmy(r.deliveryDate), r.days, typeLabel(r), r.vendorName, `${r.plant} ${r.plantName}`, r.sloc, r.mainGroup, r.sub1, r.sub2, r.division, [r.material, r.materialName].filter(Boolean).join(" "), r.qty, r.uom, r.netPrice, r.currency, c2(r.netValue)]));
    const ft = sh.addRow(["Total (INR)", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", c2(t.value)]); ft.font = { bold: true };
    sh.columns.forEach((c) => { c.width = 18; });
    const url = URL.createObjectURL(new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a"); a.href = url; a.download = datedFileName("Purchase Orders", "xlsx"); a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
      <h2 className="text-xs font-semibold">Purchase Order Details</h2>
      <div className="flex items-center gap-2">
        <button type="button" disabled={!list.length} onClick={() => void excel()} className="btn-export rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-40">Excel</button>
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search PO, vendor, material..." className="h-8 w-56 rounded-md border border-border bg-background px-2 text-xs" />
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-[11px]">
      <thead className="text-on-radiant" style={{ background: "linear-gradient(90deg, #1f6fd1, #0f9d8a, #8e44ad)" }}><tr>{heads.map((h) => <th key={h} className={`whitespace-nowrap px-2 py-1.5 font-semibold ${numeric.has(h) ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
      <tbody>{list.length ? list.slice(p * size, p * size + size).map((r) => <tr key={`${r.poNo}-${r.item}`} className="border-t border-border/60 transition-colors odd:bg-muted/30 hover:bg-primary/10">
        <td className="whitespace-nowrap px-2 py-1">{dmy(r.poDate)}</td><td className="px-2 py-1 font-medium text-primary">{r.poNo}</td><td className="px-2 py-1">{r.item}</td>
        <td className="whitespace-nowrap px-2 py-1">{dmy(r.deliveryDate)}</td><td className="px-2 py-1 text-right tabular-nums">{r.days}</td>
        <td className="whitespace-nowrap px-2 py-1"><span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: PO_GROUP_COLORS[poGroup(r)], color: PO_GROUP_COLORS[poGroup(r)], background: `${PO_GROUP_COLORS[poGroup(r)]}1a` }}><span className="size-1.5 rounded-full" style={{ background: PO_GROUP_COLORS[poGroup(r)] }} />{typeLabel(r)}</span></td><td className="whitespace-nowrap px-2 py-1">{r.vendorName}</td><td className="whitespace-nowrap px-2 py-1">{r.plantName}</td>
        {[r.sloc, r.mainGroup, r.sub1, r.sub2, r.division].map((v, i) => <td key={i} className="whitespace-nowrap px-2 py-1">{v}</td>)}
        <td className="min-w-48 px-2 py-1">{r.materialName}</td><td className="px-2 py-1 text-right tabular-nums">{num(r.qty)}</td><td className="px-2 py-1">{r.uom}</td>
        <td className="px-2 py-1 text-right tabular-nums">{num(r.netPrice)}</td><td className="px-2 py-1">{r.currency}</td>
        <td className="px-2 py-1 text-right font-semibold tabular-nums">{cr(r.netValue)}</td></tr>)
        : <tr><td colSpan={heads.length} className="h-20 text-center text-muted-foreground">No purchase orders for these filters.</td></tr>}</tbody>
      {list.length > 0 && <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td colSpan={18} className="px-2 py-1.5">Total INR ({list.length} lines)</td>
        <td className="px-2 py-1.5 text-right tabular-nums">{cr(t.value)}</td></tr></tfoot>}
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

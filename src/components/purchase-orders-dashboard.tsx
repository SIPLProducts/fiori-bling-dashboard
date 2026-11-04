import { useMemo, useState } from "react";
import { ChevronDown, ClipboardList, FileText, IndianRupee, Truck } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { BarList, Card, Donut, PlantColumns, Tile } from "@/components/open-po-dashboard";
import { TINTS } from "@/lib/card-tints";
import { datedFileName } from "@/lib/format";
import { istToday } from "@/lib/open-po-data";
import { poTotals, sumInr, type PoRow } from "@/lib/purchase-orders-data";

const COLORS = ["#1f6fd1", "#0f9d8a", "#e08a1e", "#8e44ad", "#d64550", "#3a8dde", "#16a3b8", "#c0841a", "#5c6bc0", "#2e8b57"];
const CR = 1e7;
const cr = (v: number) => (v / CR).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const dmy = (d: string) => (d ? `${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(0, 4)}` : "");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const sel = "h-8 w-full rounded-md border border-border bg-background px-2 text-xs";

type Filters = Record<"plant" | "poType" | "vendor" | "purGroup" | "materialGroup", string>;
const EMPTY: Filters = { plant: "", poType: "", vendor: "", purGroup: "", materialGroup: "" };

export function PurchaseOrdersDashboard({ rows }: { rows: PoRow[] }) {
  const [f, setF] = useState<Filters>(EMPTY);
  const [collapsed, setCollapsed] = useState(false);
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
    };
  }, [rows]);
  const filtered = useMemo(() => rows.filter((r) =>
    (!f.plant || r.plant === f.plant) && (!f.poType || r.poType === f.poType) && (!f.vendor || r.vendor === f.vendor)
    && (!f.purGroup || r.purGroup === f.purGroup) && (!f.materialGroup || r.materialGroup === f.materialGroup)
    && (!from || r.poDate >= from) && (!to || r.poDate <= to)), [rows, f, from, to]);
  const tot = poTotals(filtered);
  const types = sumInr(filtered, (r) => r.poType);
  const vendors = sumInr(filtered, (r) => r.vendorName).slice(0, 10);
  const materials = sumInr(filtered, (r) => r.materialName).slice(0, 10);
  const plants = sumInr(filtered, (r) => r.plantName).slice(0, 12).map((d) => ({ name: d.name, value: d.value / CR }));
  const purGroups = sumInr(filtered, (r) => r.purGroup).slice(0, 10);
  const users = sumInr(filtered, (r) => r.userName || "—").slice(0, 10);
  const monthly = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) if (r.inr && r.poDate) m.set(r.poDate.slice(0, 7), (m.get(r.poDate.slice(0, 7)) ?? 0) + r.netValue);
    return [...m.entries()].sort().map(([k, v]) => ({ name: `${MONTHS[Number(k.slice(5, 7)) - 1]}-${k.slice(2, 4)}`, value: v / CR }));
  }, [filtered]);
  const field = (k: keyof Filters, label: string) => <label className="min-w-0 text-[10px] font-semibold text-muted-foreground">{label}
    <select className={sel} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-label={label}><option value="">All</option>{opts[k].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
  const foreignNote = tot.foreignLines ? `${tot.foreignLines} foreign-currency lines not in ₹ totals` : undefined;

  return <div className="space-y-3">
    <div data-pdf-exclude className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
      <button type="button" aria-expanded={!collapsed} onClick={() => setCollapsed((c) => !c)} className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-card-foreground">
        <span>Filters</span><ChevronDown className={`size-4 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
      </button>
      {collapsed ? null : <div className="grid grid-cols-2 gap-2 px-3 pb-2 sm:grid-cols-4 lg:grid-cols-8">
        {field("plant", "Plant")}{field("poType", "Document Type")}{field("vendor", "Vendor")}{field("purGroup", "Purchasing Group")}{field("materialGroup", "Material Group")}
        <label className="text-[10px] font-semibold text-muted-foreground">PO Date From<input type="date" className={sel} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-[10px] font-semibold text-muted-foreground">PO Date To<input type="date" className={sel} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
        <div className="flex items-end"><Button type="button" variant="reset" size="sm" className="h-8 w-full text-xs" onClick={() => { setF(EMPTY); setFrom(""); setTo(""); }}>Reset</Button></div>
      </div>}
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile icon={<IndianRupee className="size-5" />} label="Total Val" value={cr(tot.value)} {...(foreignNote ? { note: foreignNote } : {})} tone="#1f6fd1" />
      <Tile icon={<Truck className="size-5" />} label="Pending Delivery Val" value={cr(tot.pendDel)} tone="#e08a1e" />
      <Tile icon={<FileText className="size-5" />} label="Pending Invoice Val" value={cr(tot.pendInv)} tone="#8e44ad" />
      <Tile icon={<ClipboardList className="size-5" />} label="POs / Lines" value={`${tot.poCount.toLocaleString("en-IN")} / ${tot.lines.toLocaleString("en-IN")}`} tone="#0f9d8a" />
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card tint="sky" title="PO Value by Document Type"><Donut data={types} heads={["Type", "Val", "%"]} /></Card>
      <Card tint="rose" title="Top 10 Vendors"><BarList data={vendors} /></Card>
      <Card tint="steel" title="Top 10 Materials"><BarList data={materials} /></Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card tint="copper" title="Plant Analytics"><PlantColumns data={plants} /></Card>
      <Card tint="teal" title="Monthly PO Value Trend"><div className="h-56"><ResponsiveContainer><ComposedChart data={monthly} margin={{ top: 16, left: -16, right: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--foreground)", fontWeight: 600 }} /><YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} />
        <Tooltip formatter={(v: number) => v.toFixed(2)} />
        <Bar dataKey="value" name="PO Val" fill="#1f6fd1" radius={[6, 6, 0, 0]} maxBarSize={40}><LabelList dataKey="value" position="top" formatter={(v: number) => v.toFixed(2)} style={{ fontSize: 10, fontWeight: 700, fill: "var(--foreground)" }} /></Bar>
      </ComposedChart></ResponsiveContainer></div></Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card tint="violet" title="PO Value by Purchasing Group"><BarList data={purGroups} /></Card>
      <Card tint="mint" title="PO Value by Created User"><BarList data={users} /></Card>
    </div>

    <div data-pdf-exclude><DetailsTable rows={filtered} /></div>
  </div>;
}

function DetailsTable({ rows }: { rows: PoRow[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const s = q.toLowerCase();
  const list = useMemo(() => rows.filter((r) => !s || [r.poNo, r.vendorName, r.vendor, r.material, r.materialName, r.plantName, r.poType, r.poTypeCode, r.purGroup].some((v) => v.toLowerCase().includes(s)))
    .sort((a, b) => b.poDate.localeCompare(a.poDate) || a.poNo.localeCompare(b.poNo)), [rows, s]);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const p = Math.min(page, pages - 1);
  const heads = ["PO Date", "PO No", "Item", "Delivery Date", "Days", "Document Type", "Vendor", "Plant", "Material", "Qty", "UOM", "Net Price", "Currency", "Net Order Val (Cr)", "Pending Del Val (Cr)", "Pending Inv Val (Cr)"];
  const numeric = new Set(["Days", "Qty", "Net Price", "Net Order Val (Cr)", "Pending Del Val (Cr)", "Pending Inv Val (Cr)"]);
  const t = poTotals(list);
  const c2 = (v: number) => Math.round((v / CR) * 100) / 100;
  const typeLabel = (r: PoRow) => (r.poTypeCode ? `${r.poTypeCode} – ${r.poType}` : r.poType);
  const excel = async () => {
    const { Workbook } = await import("exceljs");
    const wb = new Workbook(); const sh = wb.addWorksheet("Purchase Orders");
    const h = sh.addRow(heads); h.font = { bold: true, color: { argb: "FFFFFFFF" } }; h.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A6ED1" } }; });
    list.forEach((r) => sh.addRow([dmy(r.poDate), r.poNo, r.item, dmy(r.deliveryDate), r.days, typeLabel(r), r.vendorName, `${r.plant} ${r.plantName}`, [r.material, r.materialName].filter(Boolean).join(" "), r.qty, r.uom, r.netPrice, r.currency, c2(r.netValue), c2(r.pendDelValue), c2(r.pendInvValue)]));
    const ft = sh.addRow(["Total (INR)", "", "", "", "", "", "", "", "", "", "", "", "", c2(t.value), c2(t.pendDel), c2(t.pendInv)]); ft.font = { bold: true };
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
        <td className="whitespace-nowrap px-2 py-1">{typeLabel(r)}</td><td className="whitespace-nowrap px-2 py-1">{r.vendorName}</td><td className="whitespace-nowrap px-2 py-1">{r.plantName}</td>
        <td className="min-w-48 px-2 py-1">{r.materialName}</td><td className="px-2 py-1 text-right tabular-nums">{num(r.qty)}</td><td className="px-2 py-1">{r.uom}</td>
        <td className="px-2 py-1 text-right tabular-nums">{num(r.netPrice)}</td><td className="px-2 py-1">{r.currency}</td>
        <td className="px-2 py-1 text-right font-semibold tabular-nums">{cr(r.netValue)}</td><td className="px-2 py-1 text-right tabular-nums">{cr(r.pendDelValue)}</td><td className="px-2 py-1 text-right tabular-nums">{cr(r.pendInvValue)}</td></tr>)
        : <tr><td colSpan={heads.length} className="h-20 text-center text-muted-foreground">No purchase orders for these filters.</td></tr>}</tbody>
      {list.length > 0 && <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td colSpan={13} className="px-2 py-1.5">Total INR ({list.length} lines)</td>
        <td className="px-2 py-1.5 text-right tabular-nums">{cr(t.value)}</td><td className="px-2 py-1.5 text-right tabular-nums">{cr(t.pendDel)}</td><td className="px-2 py-1.5 text-right tabular-nums">{cr(t.pendInv)}</td></tr></tfoot>}
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

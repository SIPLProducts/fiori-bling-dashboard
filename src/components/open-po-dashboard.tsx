import { OrderBookSubGroupChart } from "@/components/order-book-subgroup-chart";
import { summarizeGroupsByDivision } from "@/lib/open-orders-groups";
import { useId, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ClipboardList, IndianRupee, Maximize2, PackageCheck, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { datedFileName } from "@/lib/format";
import { radiantBar } from "@/lib/radiant";
import { TINTS, type Tint } from "@/lib/card-tints";
import { AGING_BUCKETS, agingBucket, istToday, openPoTotals, poStatus, sumBy, type OpenPoRow, type OpenPoStatus } from "@/lib/open-po-data";

const COLORS = ["#1f6fd1", "#0f9d8a", "#e08a1e", "#8e44ad", "#d64550", "#3a8dde", "#16a3b8", "#c0841a", "#5c6bc0", "#2e8b57"];
const AGING_COLORS = ["#0f9d8a", "#1f6fd1", "#e08a1e", "#d64550", "#6b7280"];
const CR = 1e7;
const cr = (v: number) => (v / CR).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const dmy = (d: string) => (d ? `${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(0, 4)}` : "");
const sel = "h-8 w-full rounded-md border border-border bg-background px-2 text-xs";

const STATUSES: OpenPoStatus[] = ["Open", "Partially received", "Overdue", "Delivery complete"];

function Card({ title, sub, children, className = "", tint = "neutral" }: { title: string; sub?: ReactNode; children: ReactNode; className?: string; tint?: Tint }) {
  const [open, setOpen] = useState(false);
  return <section className={`flex min-w-0 flex-col rounded-xl border p-2 ${className}`} style={TINTS[tint]}>
    <div className="mb-2 flex items-center justify-between gap-2"><h2 className="border-b-2 pb-0.5 text-xs font-bold text-foreground" style={{ borderColor: TINTS[tint].borderColor }}>{title}</h2><div className="flex items-center gap-1">{sub ? <span className="text-[10px] font-medium text-foreground/70">{sub}</span> : null}<button type="button" data-pdf-exclude data-html2canvas-ignore aria-label={`Full screen: ${title}`} title="Full screen" onClick={() => setOpen(true)} className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Maximize2 className="size-3.5" /></button></div></div>
    <div className="min-h-0 flex-1">{children}</div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[92vh] max-w-[96vw] flex-col sm:max-w-[96vw]">
        <DialogHeader><DialogTitle>{title}{sub ? <span className="ml-2 text-xs font-normal text-muted-foreground">{sub}</span> : null}</DialogTitle></DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto text-sm [&_.h-56]:h-[75vh] [&_.recharts-responsive-container]:min-h-[60vh]">{children}</div>
      </DialogContent>
    </Dialog>
  </section>;
}
function Tile({ icon, label, value, note, tone, unit }: { icon: ReactNode; label: string; value: string; note?: string; tone: string; unit?: string }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-on-radiant shadow-md" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${tone} 65%, white), ${tone})` }}>
    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-background/20">{icon}</div>
    <div className="min-w-0"><p className="truncate text-xs font-semibold opacity-90">{label}</p><p className="truncate text-lg font-bold">{value}</p>{unit ? <p className="truncate text-[10px] font-medium opacity-85">{unit}</p> : null}{note ? <p className="truncate text-[10px] opacity-85">{note}</p> : null}</div>
  </div>;
}
function BarList({ data, empty = "No data" }: { data: { name: string; value: number }[]; empty?: string }) {
  const max = Math.max(...data.map((d) => d.value), 0) || 1;
  if (!data.length) return <p className="py-8 text-center text-xs text-muted-foreground">{empty}</p>;
  return <ul className="space-y-1.5">{data.map((d, i) => <li key={d.name} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 text-[11px]">
    <span className="truncate font-semibold text-foreground" title={d.name}>{d.name}</span>
    <span className="h-3.5 rounded-full bg-background/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]"><span className="block h-full rounded-full" style={{ width: `${Math.max((d.value / max) * 100, 3)}%`, background: `linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%), ${radiantBar(i)}`, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} /></span>
    <span className="tabular-nums font-bold text-foreground">{cr(d.value)}</span>
  </li>)}</ul>;
}
function Donut({ data, colors = COLORS, heads }: { data: { name: string; value: number }[]; colors?: string[]; heads?: [string, string, string] }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return <div className="@container"><div className="grid grid-cols-1 items-center gap-2 @[17rem]:grid-cols-[minmax(0,6rem)_minmax(0,1fr)]">
    <div className="relative h-36"><div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="text-center leading-tight"><p className="text-[8px] font-semibold text-foreground/70">Total</p><p className="text-[10px] font-bold tabular-nums text-foreground">{cr(total)}</p></div></div><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={1}>{data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={(v: number) => cr(v)} /></PieChart></ResponsiveContainer></div>
    <ul className="min-w-0 space-y-1 text-[10px]">{heads ? <li className="flex items-center gap-1.5 border-b border-border pb-1 text-[10px] font-bold text-foreground/75"><span className="size-2.5" /><span className="min-w-0 flex-1">{heads[0]}</span><span className="shrink-0">{heads[1]}</span><span className="w-8 shrink-0 text-right">{heads[2]}</span></li> : null}{data.map((d, i) => <li key={d.name} className="flex items-center gap-1.5"><span className="size-2.5 shrink-0 rounded-full" style={{ background: colors[i % colors.length] }} /><span title={d.name} className="min-w-0 flex-1 break-words font-semibold leading-tight text-foreground">{d.name}</span><span className="shrink-0 font-bold text-foreground tabular-nums">{cr(d.value)}</span><span className="w-8 shrink-0 text-right font-semibold text-foreground/75 tabular-nums">{total ? Math.round((d.value / total) * 100) : 0}%</span></li>)}</ul>
  </div></div>;
}

function PlantColumns({ data }: { data: { name: string; value: number }[] }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return <div className="h-56"><ResponsiveContainer><BarChart data={data} margin={{ top: 16, left: -16, right: 4 }}>
    <defs>{COLORS.map((c, i) => <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity={0.6} /><stop offset="35%" stopColor={c} stopOpacity={0.9} /><stop offset="100%" stopColor={c} stopOpacity={1} /></linearGradient>)}</defs>
    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" interval={0} tick={{ fontSize: 10, fill: "var(--foreground)", fontWeight: 600 }} /><YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} />
    <Tooltip formatter={(v: number) => v.toFixed(2)} />
    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40} stroke="rgba(255,255,255,0.5)" strokeWidth={1}>{data.map((_, i) => <Cell key={i} fill={`url(#${id}-${i % COLORS.length})`} />)}
      <LabelList dataKey="value" position="top" formatter={(v: number) => v.toFixed(2)} style={{ fontSize: 10, fontWeight: 700, fill: "var(--foreground)" }} /></Bar>
  </BarChart></ResponsiveContainer></div>;
}

type Filters = Record<"plant" | "poType" | "createdBy" | "mainGroup" | "subGroup" | "vendor" | "material" | "status", string>;
const EMPTY: Filters = { plant: "", poType: "", createdBy: "", mainGroup: "", subGroup: "", vendor: "", material: "", status: "" };

export function OpenPoDashboard({ rows }: { rows: OpenPoRow[] }) {
  const today = istToday();
  const [f, setF] = useState<Filters>(EMPTY);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const opts = useMemo(() => {
    const u = (k: (r: OpenPoRow) => string, l?: (r: OpenPoRow) => string) => {
      const m = new Map<string, string>(); for (const r of rows) if (k(r)) m.set(k(r), l ? l(r) : k(r));
      return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    };
    return {
      plant: u((r) => r.plant, (r) => `${r.plant} — ${r.plantName}`), poType: u((r) => r.poType), createdBy: u((r) => r.createdBy),
      mainGroup: u((r) => r.mainGroup), subGroup: u((r) => r.subGroup), vendor: u((r) => r.vendor, (r) => r.vendorName),
      material: u((r) => r.materialName), status: STATUSES.map((s) => [s, s] as [string, string]),
    };
  }, [rows]);
  const filtered = useMemo(() => rows.filter((r) =>
    (!f.plant || r.plant === f.plant) && (!f.poType || r.poType === f.poType) && (!f.createdBy || r.createdBy === f.createdBy)
    && (!f.mainGroup || r.mainGroup === f.mainGroup) && (!f.subGroup || r.subGroup === f.subGroup) && (!f.vendor || r.vendor === f.vendor)
    && (!f.material || r.materialName === f.material) && (!f.status || poStatus(r, today) === f.status)
    && (!from || r.poDate >= from) && (!to || r.poDate <= to)), [rows, f, from, to, today]);
  const tot = openPoTotals(filtered);
  const vendors = sumBy(filtered, (r) => r.vendorName, (r) => r.openValue).slice(0, 10);
  const types = sumBy(filtered, (r) => r.poType, (r) => r.poValue);
  const aging = AGING_BUCKETS.map((b) => ({ name: b, value: filtered.filter((r) => agingBucket(r) === b).reduce((a, r) => a + r.openValue, 0) }));
  const daily = useMemo(() => {
    const m = new Map<string, { po: number; migo: number }>();
    for (const r of filtered) { if (!r.poDate) continue; const e = m.get(r.poDate) ?? { po: 0, migo: 0 }; e.po += r.poValue; e.migo += r.migoValue; m.set(r.poDate, e); }
    return [...m.entries()].sort().map(([d, v]) => ({ name: dmy(d).slice(0, 5), po: v.po / CR, migo: v.migo / CR }));
  }, [filtered]);
  const purGroups = sumBy(filtered, (r) => r.purGroup, (r) => r.openValue).slice(0, 8).map((d) => ({ name: d.name, value: d.value / CR }));
  const plants = sumBy(filtered, (r) => r.plantName || r.plant, (r) => r.poValue).slice(0, 12).map((d) => ({ name: d.name, value: d.value / CR }));
  const materials = sumBy(filtered, (r) => r.materialName, (r) => r.poValue).slice(0, 10);
  const grpRows = (k: "mainGroup" | "subGroup" | "subGroup2" | "subGroup3") => filtered.map((r) => ({ name: r[k] ?? "", value: r.poValue / CR, order: r.poNo, division: r.plantName || r.plant }));
  const mainG = summarizeGroupsByDivision(grpRows("mainGroup"), (r) => r.name);
  const subG1 = summarizeGroupsByDivision(grpRows("subGroup"), (r) => r.name);
  const subG2 = summarizeGroupsByDivision(grpRows("subGroup2"), (r) => r.name);
  const subG3 = summarizeGroupsByDivision(grpRows("subGroup3"), (r) => r.name);
  const slocs = sumBy(filtered, (r) => r.sloc, (r) => r.openValue).slice(0, 10);
  const field = (k: keyof Filters, label: string) => <label className="min-w-0 text-[10px] font-semibold text-muted-foreground">{label}
    <select className={sel} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-label={label}><option value="">All</option>{opts[k].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;

  return <div className="space-y-3">
    <div data-pdf-exclude className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
      <button type="button" data-pdf-exclude aria-expanded={!filtersCollapsed} onClick={() => setFiltersCollapsed((c) => !c)} className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-card-foreground">
        <span>Filters</span><ChevronDown className={`size-4 transition-transform ${filtersCollapsed ? "-rotate-90" : ""}`} />
      </button>
      {filtersCollapsed ? null : <div className="grid grid-cols-2 gap-2 px-3 pb-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11">
      {field("plant", "Plant")}{field("poType", "PO Type")}{field("createdBy", "Created By")}{field("mainGroup", "Main Group")}{field("subGroup", "Sub Group")}
      {field("vendor", "Vendor")}{field("material", "Material")}{field("status", "Delivery Status")}
      <label className="text-[10px] font-semibold text-muted-foreground">PO Date From<input type="date" className={sel} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
      <label className="text-[10px] font-semibold text-muted-foreground">PO Date To<input type="date" className={sel} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
      <div className="flex items-end"><Button type="button" variant="reset" size="sm" className="h-8 w-full text-xs" onClick={() => { setF(EMPTY); setFrom(""); setTo(""); }}>Reset</Button></div>
      </div>}
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Tile icon={<IndianRupee className="size-5" />} label="Total Val" value={cr(tot.poValue)} note={`${filtered.length.toLocaleString("en-IN")} lines`} tone="#1f6fd1" />
      <Tile icon={<PackageCheck className="size-5" />} label="Gr Val" value={cr(tot.migoValue)} tone="#0f9d8a" />
      <Tile icon={<ClipboardList className="size-5" />} label="Open Val" value={cr(tot.openValue)} tone="#e08a1e" />
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card tint="sky" title="PO Value by PO Type"><Donut data={types} heads={["Type", "Val", "%"]} /></Card>
      <Card tint="peach" title="Delivery Aging Status" sub="Open value · SAP Days"><Donut data={aging} colors={AGING_COLORS} heads={["Days", "Val", "%"]} /></Card>
      <Card tint="rose" title="Top 10 Vendors"><BarList data={vendors} /></Card>
      <Card tint="steel" title="Top 10 Materials" sub="PO value"><BarList data={materials} /></Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card tint="copper" title="Plant Analytics" sub="PO value"><PlantColumns data={plants} /></Card>
      <Card tint="teal" title="PO Value by Main Group" sub="₹ Cr">{mainG.groups.length ? <OrderBookSubGroupChart groups={mainG.groups} divisions={mainG.divisions} groupLabel="Main Group" /> : <p className="py-8 text-center text-xs text-muted-foreground">No data</p>}</Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {([["Sub Group 1", subG1], ["Sub Group 2", subG2], ["Sub Group 3", subG3]] as const).map(([label, g]) => <Card key={label} tint={(["violet", "amber", "mint"] as const)[label.endsWith("1") ? 0 : label.endsWith("2") ? 1 : 2]} title={`PO Value by ${label}`} sub="₹ Cr">{g.groups.length ? <OrderBookSubGroupChart groups={g.groups} divisions={g.divisions} groupLabel={label} /> : <p className="py-8 text-center text-xs text-muted-foreground">No data</p>}</Card>)}
    </div>

    <div data-pdf-exclude><DetailsTable rows={filtered} today={today} /></div>
  </div>;
}

function DetailsTable({ rows, today }: { rows: OpenPoRow[]; today: string }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const s = q.toLowerCase();
  const typeKeys = useMemo(() => [...new Set(rows.map((r) => r.poType))].sort(), [rows]);
  const list = useMemo(() => rows.filter((r) => !s || [r.poNo, r.vendorName, r.vendor, r.material, r.materialName, r.plantName, r.poType, r.poTypeCode, r.mainGroup, r.subGroup, r.subGroup2, r.subGroup3].some((v) => v.toLowerCase().includes(s)))
    .sort((a, b) => b.poDate.localeCompare(a.poDate) || a.poNo.localeCompare(b.poNo)), [rows, s]);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const p = Math.min(page, pages - 1);
  const heads = ["PO Date", "PO No", "Item", "PO Type", "Plant", "Vendor", "Main Group", "Sub Group 1", "Sub Group 2", "Sub Group 3", "Material", "SLoc", "UOM", "PO Qty", "PO Value (Cr)", "MIGO Qty", "MIGO Value (Cr)", "Open Value (Cr)", "Delivery Date", "Days"];
  const num = new Set(["PO Qty", "PO Value (Cr)", "MIGO Qty", "MIGO Value (Cr)", "Open Value (Cr)", "Days"]);
  const t = openPoTotals(list);
  const sumQ = list.reduce((a, r) => ({ po: a.po + r.poQty, migo: a.migo + r.migoQty }), { po: 0, migo: 0 });
  const c2 = (v: number) => Math.round((v / CR) * 100) / 100;
  const excel = async () => {
    const { Workbook } = await import("exceljs");
    const wb = new Workbook(); const sh = wb.addWorksheet("Open Purchase Orders");
    const h = sh.addRow(heads); h.font = { bold: true, color: { argb: "FFFFFFFF" } }; h.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A6ED1" } }; });
    list.forEach((r) => sh.addRow([dmy(r.poDate), r.poNo, r.item, r.poTypeCode ? `${r.poTypeCode} – ${r.poType}` : r.poType, `${r.plant} ${r.plantName}`, r.vendorName, r.mainGroup, r.subGroup, r.subGroup2, r.subGroup3, [r.material, r.materialName].filter(Boolean).join(" "), r.sloc, r.uom, r.poQty, c2(r.poValue), r.migoQty, c2(r.migoValue), c2(r.openValue), dmy(r.deliveryDate), r.days]));
    const ft = sh.addRow(["Total", "", "", "", "", "", "", "", "", "", "", "", "", sumQ.po, c2(t.poValue), sumQ.migo, c2(t.migoValue), c2(t.openValue), "", ""]); ft.font = { bold: true };
    sh.columns.forEach((c) => { c.width = 18; });
    const url = URL.createObjectURL(new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a"); a.href = url; a.download = datedFileName("Open Purchase Orders", "xlsx"); a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
      <h2 className="text-xs font-semibold">Open Purchase Order Details</h2>
      <div className="flex items-center gap-2">
        <button type="button" disabled={!list.length} onClick={() => void excel()} className="btn-export rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-40">Excel</button>
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search PO, vendor, material..." className="h-8 w-56 rounded-md border border-border bg-background px-2 text-xs" />
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-[11px]">
      <thead className="text-on-radiant" style={{ background: "linear-gradient(90deg, #1f6fd1, #0f9d8a, #8e44ad)" }}><tr>{heads.map((h) => <th key={h} className={`whitespace-nowrap px-2 py-1.5 font-semibold ${num.has(h) ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
      <tbody>{list.length ? list.slice(p * size, p * size + size).map((r) => <tr key={`${r.poNo}-${r.item}`} className="border-t border-border/60 transition-colors odd:bg-muted/30 hover:bg-primary/10">
        <td className="whitespace-nowrap px-2 py-1">{dmy(r.poDate)}</td><td className="px-2 py-1 font-medium text-primary">{r.poNo}</td><td className="px-2 py-1">{r.item}</td><td className="whitespace-nowrap px-2 py-1"><span className="mr-1.5 inline-block size-2.5 rounded-sm align-middle" style={{ background: COLORS[Math.max(0, typeKeys.indexOf(r.poType)) % COLORS.length] }} />{r.poTypeCode ? `${r.poTypeCode} – ${r.poType}` : r.poType}</td>
        <td className="whitespace-nowrap px-2 py-1">{r.plantName}</td><td className="whitespace-nowrap px-2 py-1">{r.vendorName}</td><td className="whitespace-nowrap px-2 py-1">{r.mainGroup}</td><td className="whitespace-nowrap px-2 py-1">{r.subGroup}</td><td className="whitespace-nowrap px-2 py-1">{r.subGroup2}</td><td className="whitespace-nowrap px-2 py-1">{r.subGroup3}</td>
        <td className="min-w-48 px-2 py-1">{r.materialName}</td><td className="px-2 py-1">{r.sloc}</td><td className="px-2 py-1">{r.uom}</td>
        <td className="px-2 py-1 text-right tabular-nums">{inr(r.poQty)}</td><td className="px-2 py-1 text-right tabular-nums">{cr(r.poValue)}</td>
        <td className="px-2 py-1 text-right tabular-nums">{inr(r.migoQty)}</td><td className="px-2 py-1 text-right tabular-nums">{cr(r.migoValue)}</td>
        <td className="px-2 py-1 text-right font-semibold tabular-nums">{cr(r.openValue)}</td><td className="whitespace-nowrap px-2 py-1">{dmy(r.deliveryDate)}</td>
        <td className="px-2 py-1 text-right tabular-nums">{r.days}</td></tr>)
        : <tr><td colSpan={heads.length} className="h-20 text-center text-muted-foreground">No open purchase orders for these filters.</td></tr>}</tbody>
      {list.length > 0 && <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td colSpan={13} className="px-2 py-1.5">Total ({list.length} lines)</td>
        <td className="px-2 py-1.5 text-right tabular-nums">{inr(sumQ.po)}</td><td className="px-2 py-1.5 text-right tabular-nums">{cr(t.poValue)}</td><td className="px-2 py-1.5 text-right tabular-nums">{inr(sumQ.migo)}</td><td className="px-2 py-1.5 text-right tabular-nums">{cr(t.migoValue)}</td><td className="px-2 py-1.5 text-right tabular-nums">{cr(t.openValue)}</td><td colSpan={2} /></tr></tfoot>}
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

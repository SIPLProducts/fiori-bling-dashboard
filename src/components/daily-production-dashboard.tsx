import { useId, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ChevronDown, ClipboardList, Factory, Gauge, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TINTS } from "@/lib/card-tints";
import { BarList, Card, Donut, PlantColumns } from "@/components/open-po-dashboard";
import { datedFileName } from "@/lib/format";
import { defaultDprDates, dprDateOptions, matchesDprDates, type DprDateFilters } from "@/lib/daily-production-filters";
import { dprDaily, dprGroup, dprTotals, type DprRow } from "@/lib/daily-production-data";

const CR = 1e7;
const cr = (v: number) => (v / CR).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v: number, d = 2) => v.toLocaleString("en-IN", { maximumFractionDigits: d });
const PAGE = 50;
type Key = "plant" | "material" | "sloc" | "wc" | "cc";
const EMPTY: Record<Key, string[] | null> = { plant: null, material: null, sloc: null, wc: null, cc: null };
const ok = (sel: string[] | null, v: string) => sel === null || sel.includes(v);
const ddmm = (iso: string) => (iso ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : "");

function DailyChart({ data }: { data: { date: string; value: number; scrap: number }[] }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!data.length) return <p className="py-8 text-center text-xs text-muted-foreground">No data</p>;
  const rows = data.map((d) => ({ name: ddmm(d.date).slice(0, 5), value: d.value / CR, scrap: d.scrap / CR }));
  return <div className="h-60"><ResponsiveContainer><BarChart data={rows} margin={{ top: 10, left: -8, right: 6 }}>
    <defs><linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--kpi-1)" stopOpacity={0.6} /><stop offset="100%" stopColor="var(--kpi-1)" /></linearGradient>
      <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.6} /><stop offset="100%" stopColor="var(--destructive)" /></linearGradient></defs>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--foreground)" }} interval="preserveStartEnd" />
    <YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} width={52} tickFormatter={(v: number) => v.toFixed(2)} />
    <Tooltip formatter={(v: number, k) => [`${v.toFixed(2)} Cr`, k === "value" ? "Production Val" : "Scrap Val"]} />
    <Bar dataKey="value" fill={`url(#${id}p)`} radius={[4, 4, 0, 0]} />
    <Bar dataKey="scrap" fill={`url(#${id}s)`} radius={[4, 4, 0, 0]} />
  </BarChart></ResponsiveContainer></div>;
}

export function DailyProductionDashboard({ rows }: { rows: DprRow[] }) {
  const [f, setF] = useState(EMPTY);
  const latestDates = useMemo(() => defaultDprDates(rows), [rows]);
  const [chosenDates, setChosenDates] = useState<DprDateFilters | null>(null);
  const dates = chosenDates ?? latestDates;
  const dateOptions = useMemo(() => dprDateOptions(rows, dates.year), [rows, dates.year]);
  const updateDates = (patch: Partial<DprDateFilters>) => { setChosenDates({ ...dates, ...patch }); setPage(0); };
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const opts = useMemo(() => {
    const pairs = (k: (r: DprRow) => string, l: (r: DprRow) => string) => [...new Map(rows.filter((r) => k(r)).map((r) => [k(r), l(r) && l(r) !== k(r) ? `${k(r)} - ${l(r)}` : k(r)]))].sort((a, b) => a[0].localeCompare(b[0])).map(([value, label]) => ({ value, label }));
    return { plant: [...new Map(rows.filter((r) => r.plant).map((r) => [r.plant, r.plantName || r.plant]))].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label)), material: pairs((r) => r.material, (r) => r.matDesc), sloc: pairs((r) => r.sloc, () => ""), wc: pairs((r) => r.wc, (r) => r.wcDesc), cc: pairs((r) => r.cc, (r) => r.ccName) };
  }, [rows]);
  const data = useMemo(() => rows.filter((r) => ok(f.plant, r.plant) && ok(f.material, r.material) && ok(f.sloc, r.sloc) && ok(f.wc, r.wc) && ok(f.cc, r.cc) && matchesDprDates(r.date, dates)), [rows, f, dates]);
  const t = dprTotals(data);
  const wcs = dprGroup(data, (r) => r.wcDesc).slice(0, 10);
  const ccs = dprGroup(data, (r) => r.ccName).slice(0, 10);
  const mats = dprGroup(data, (r) => r.matDesc).slice(0, 10);
  const scrapMats = dprGroup(data, (r) => r.matDesc, (r) => r.scrapVal).slice(0, 10);
  const plants = dprGroup(data, (r) => r.plantName).slice(0, 15).map((d) => ({ ...d, value: d.value / CR }));
  const table = data.filter((r) => !q || `${r.plant} ${r.plantName} ${r.order} ${r.material} ${r.matDesc} ${r.batch} ${r.wc} ${r.wcDesc} ${r.ccName} ${r.doc} ${r.sloc}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date) || b.value - a.value);
  const pages = Math.max(1, Math.ceil(table.length / PAGE));
  const tt = dprTotals(table);
  const HEADS = ["Posting Date", "Plant", "Stage", "Mvt", "Prod. Order", "Material", "Description", "St.Locn", "Batch", "Qty", "UOM", "Rate", "Value (₹)", "Scrap Qty", "Scrap Val (₹)", "Work Center", "WC Desc", "Cost Center", "Mat. Doc"];
  const cells = (r: DprRow) => [ddmm(r.date), r.plantName, r.stage, r.mvt, r.order, r.material, r.matDesc, r.sloc, r.batch, r.qty, r.uom, r.rate, r.value, r.scrapQty, r.scrapVal, r.wc, r.wcDesc, r.ccName, r.doc];
  const exportXlsx = async () => {
    const { Workbook } = await import("exceljs");
    const wb = new Workbook(); const ws = wb.addWorksheet("Daily Production");
    ws.addRow(HEADS).font = { bold: true };
    table.forEach((r) => ws.addRow(cells(r)));
    ws.addRow(["Total", "", "", "", "", "", "", "", "", tt.qty, "", "", tt.value, tt.scrapQty, tt.scrapVal]).font = { bold: true };
    const blob = new Blob([await wb.xlsx.writeBuffer()]); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = datedFileName("Daily Production Report", "xlsx"); a.click(); URL.revokeObjectURL(a.href);
  };
  const field = (k: Key, label: string) => <FilterMultiSelect label={label} placeholder="All" selected={f[k]} options={opts[k]} onChange={(v) => { setF({ ...f, [k]: v.length === opts[k].length ? null : v }); setPage(0); }} />;
  const dateInput = (label: string, v: string, set: (s: string) => void) => <label className="flex flex-col gap-1 text-[11px] font-medium text-foreground">{label}<input type="date" value={v} onChange={(e) => { set(e.target.value); setPage(0); }} className="h-8 rounded-md border border-border bg-background px-2 text-xs" /></label>;
  const periodField = (key: "year" | "month", label: string, values: string[]) => <div className="min-w-0 space-y-1"><span className="text-[11px] font-medium text-foreground">{label}</span><Select value={dates[key]} onValueChange={(value) => {
    if (key === "year") {
      const months = dprDateOptions(rows, value).months;
      updateDates({ year: value, month: dates.month === "all" || months.includes(dates.month) ? dates.month : "all" });
    } else updateDates({ month: value });
  }}><SelectTrigger aria-label={label} className="h-8 bg-background px-2 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{values.map((value) => <SelectItem key={value} value={value}>{key === "month" ? new Date(2000, Number(value) - 1, 1).toLocaleString("en", { month: "long" }) : value}</SelectItem>)}</SelectContent></Select></div>;

  return <div className="space-y-3">
    <div data-pdf-exclude className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-card-foreground"><span>Filters</span><ChevronDown className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`} /></button>
      {open ? <div className="grid grid-cols-2 gap-2 px-3 pb-2 sm:grid-cols-4 lg:grid-cols-5">{field("plant", "Plant")}{periodField("year", "Year", dateOptions.years)}{periodField("month", "Month", dateOptions.months)}{dateInput("Posting Date From", dates.from, (from) => updateDates({ from }))}{dateInput("To", dates.to, (to) => updateDates({ to }))}{field("material", "Material")}
        <div className="flex items-end"><Button type="button" variant="reset" size="sm" className="h-8 w-full text-xs" onClick={() => { setF(EMPTY); setChosenDates(null); setPage(0); }}>Reset</Button></div></div> : null}
    </div>
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
      {([
        ["Production", cr(t.value), "#1f6fd1", Factory],
        ["Production Qty", num(t.qty, 0), "#0f9d8a", Package],
        ["Scrap", cr(t.scrapVal), "#d64550", Trash2],
        ["Scrap Qty", num(t.scrapQty), "#e07b39", AlertTriangle],
        ["Scrap %", `${t.scrapPct.toFixed(2)}%`, "#7b4fd6", Gauge],
        ["Prod. Orders", num(t.orders, 0), "#2f8f4e", ClipboardList],
      ] as const).map(([label, value, tone, Icon]) => <div key={label} className="min-w-0 rounded-xl px-2.5 py-2 text-primary-foreground shadow-md" style={{ background: `linear-gradient(135deg, ${tone}cc, ${tone})` }}>
        <p className="flex items-center gap-1 text-[10px] font-semibold opacity-95"><Icon className="size-3 shrink-0" />{label}</p>
        <p title={value} className="mt-1 truncate text-sm font-bold tabular-nums leading-tight sm:text-base">{value}</p></div>)}
    </div>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
      <Card title="Day Wise Production vs Scrap" sub="Val in Cr" tint="sky"><DailyChart data={dprDaily(data)} /></Card>
      <Card title="Top 10 Work Centers" sub="Val in Cr" tint="peach"><Donut data={wcs} heads={["Work Center", "Val", "%"]} /></Card>
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <Card title="Top 10 Materials Produced" sub="Val in Cr" tint="teal"><BarList data={mats} /></Card>
      <Card title="Top 10 Scrap Materials" sub="Val in Cr" tint="rose"><BarList data={scrapMats} /></Card>
      <Card title="Production by Cost Center" sub="Val in Cr" tint="amber"><BarList data={ccs} /></Card>
    </div>
    <Card title="Plant Wise Production (Top 15)" sub="Val in Cr" tint="copper"><PlantColumns data={plants} /></Card>
    <div data-pdf-exclude><Card title="Production Details" tint="neutral">
      <div className="mb-2 flex flex-wrap items-center gap-2"><input className="h-8 w-60 rounded-md border border-border bg-background px-2 text-xs" placeholder="Search order, material, work center…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} /><Button size="sm" variant="outline" onClick={exportXlsx}>Excel</Button><span className="text-[11px] text-muted-foreground">{table.length} lines</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1800px] text-[11px]"><thead><tr className="border-b text-left">{HEADS.map((h) => <th key={h} className="whitespace-nowrap px-2 py-1.5 font-bold">{h}</th>)}</tr></thead>
        <tbody>{table.slice(page * PAGE, page * PAGE + PAGE).map((r, i) => <tr key={i} className="border-b border-border/50">{cells(r).map((v, j) => <td key={j} className={`whitespace-nowrap px-2 py-1 ${typeof v === "number" ? "text-right tabular-nums" : ""}`}>{typeof v === "number" ? num(v) : v}</td>)}</tr>)}</tbody>
        <tfoot><tr className="border-t-2 border-border font-bold"><td className="px-2 py-1.5" colSpan={9}>Total ({table.length} lines)</td><td className="px-2 py-1.5 text-right tabular-nums">{num(tt.qty)}</td><td /><td /><td className="px-2 py-1.5 text-right tabular-nums">{num(tt.value)}</td><td className="px-2 py-1.5 text-right tabular-nums">{num(tt.scrapQty)}</td><td className="px-2 py-1.5 text-right tabular-nums">{num(tt.scrapVal)}</td><td colSpan={4} /></tr></tfoot></table></div>
      <div className="mt-2 flex items-center gap-2 text-[11px]"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button><span>Page {page + 1} / {pages}</span><Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button></div>
    </Card></div>
  </div>;
}

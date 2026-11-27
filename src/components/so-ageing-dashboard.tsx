import { useId, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarClock, ChevronDown, Hourglass, Timer, TimerOff, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { TINTS } from "@/lib/card-tints";
import { Card, Donut } from "@/components/open-po-dashboard";
import { datedFileName } from "@/lib/format";
import { ageGroup, ageGroupBuckets, ageTotals, bucketLabels, type AgeRow } from "@/lib/so-ageing-data";

const CR = 1e7;
const cr = (v: number) => (v / CR).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const full = (v: number, d = 2) => v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
const PAGE = 50;
type Key = "plant" | "sloc" | "material" | "pc";
const EMPTY: Record<Key, string[] | null> = { plant: null, sloc: null, material: null, pc: null };
const ok = (sel: string[] | null, v: string) => sel === null || sel.includes(v);
const ddmm = (iso: string) => (iso ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : "");
const BUCKET_COLORS = ["var(--kpi-5)", "var(--kpi-1)", "var(--kpi-3)", "var(--destructive)"];

function BucketColumns({ data, labels }: { data: { name: string; b1: number; b2: number; b3: number; b4: number }[]; labels: string[] }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!data.length) return <p className="py-8 text-center text-xs text-muted-foreground">No data</p>;
  const rows = data.map((d) => ({ name: d.name, b1: d.b1 / CR, b2: d.b2 / CR, b3: d.b3 / CR, b4: d.b4 / CR }));
  return <div className="h-64"><ResponsiveContainer><BarChart data={rows} margin={{ top: 10, left: -8, right: 6 }}>
    <defs>{BUCKET_COLORS.map((c, i) => <linearGradient key={i} id={`${id}${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity={0.6} /><stop offset="100%" stopColor={c} /></linearGradient>)}</defs>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--foreground)" }} interval={0} />
    <YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} width={52} tickFormatter={(v: number) => v.toFixed(2)} />
    <Tooltip formatter={(v: number, k) => [`${v.toFixed(2)} Cr`, labels[Number(String(k).slice(1)) - 1] ?? k]} />
    <Legend formatter={(k: string) => `${labels[Number(k.slice(1)) - 1]} days`} wrapperStyle={{ fontSize: 10 }} />
    {["b1", "b2", "b3", "b4"].map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={`url(#${id}${i})`} maxBarSize={28} />)}
  </BarChart></ResponsiveContainer></div>;
}

function SingleColumns({ data, color, label, angled = false }: { data: { name: string; value: number; full?: string }[]; color: string; label: string; angled?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!data.length) return <p className="py-8 text-center text-xs text-muted-foreground">No data</p>;
  const rows = data.map((d) => ({ name: d.name, full: d.full ?? d.name, v: d.value / CR }));
  return <div className={angled ? "h-80" : "h-64"}><ResponsiveContainer><BarChart data={rows} margin={{ top: 10, left: -8, right: 6 }}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.6} /><stop offset="100%" stopColor={color} /></linearGradient></defs>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
    {angled
      ? <XAxis dataKey="name" interval={0} height={84} angle={-35} textAnchor="end" tick={{ fontSize: 9, fill: "var(--foreground)" }} tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)} />
      : <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--foreground)" }} interval={0} />}
    <YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} width={52} tickFormatter={(v: number) => v.toFixed(2)} />
    <Tooltip cursor={false} labelFormatter={(_l, p) => (p?.[0]?.payload as { full?: string } | undefined)?.full ?? String(_l)} formatter={(v: number) => [`${v.toFixed(2)} Cr`, label]} />
    <Bar dataKey="v" fill={`url(#${id})`} maxBarSize={28} />
  </BarChart></ResponsiveContainer></div>;
}

export function SoAgeingDashboard({ rows }: { rows: AgeRow[] }) {
  const [f, setF] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const labels = bucketLabels(rows[0]?.bkt ?? [90, 180, 365]);
  const opts = useMemo(() => {
    const pairs = (k: (r: AgeRow) => string, l: (r: AgeRow) => string) => [...new Map(rows.filter((r) => k(r)).map((r) => [k(r), l(r) && l(r) !== k(r) ? `${k(r)} - ${l(r)}` : k(r)]))].sort((a, b) => a[0].localeCompare(b[0])).map(([value, label]) => ({ value, label }));
    return { plant: [...new Map(rows.filter((r) => r.plant).map((r) => [r.plant, r.plantName]))].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label)), sloc: pairs((r) => r.sloc, (r) => r.slocName), material: pairs((r) => r.material, (r) => r.matDesc), pc: pairs((r) => r.pc, (r) => r.pcDesc) };
  }, [rows]);
  const data = useMemo(() => rows.filter((r) => ok(f.plant, r.plant) && ok(f.sloc, r.sloc) && ok(f.material, r.material) && ok(f.pc, r.pc)), [rows, f]);
  const t = ageTotals(data);
  const donut = labels.map((l, i) => ({ name: `${l} days`, value: t.v[i]! })).filter((d) => d.value > 0);
  const plants = ageGroupBuckets(data, (r) => r.plantName).slice(0, 15);
  const plantBuckets = [3, 2, 1, 0].map((i) => ({ i, data: ageGroup(data, (r) => r.plantName, (r) => r.v[i]!).filter((d) => d.value > 0) }));
  const pcs = ageGroupBuckets(data, (r) => r.pcDesc || r.pc).slice(0, 15);
  const matDesc = new Map(data.map((r) => [r.material, r.matDesc]));
  const matBuckets = [3, 2, 1, 0].map((i) => ({ i, data: ageGroup(data, (r) => r.material, (r) => r.v[i]!).filter((d) => d.value > 0).slice(0, 10).map((d) => { const desc = matDesc.get(d.name) || d.name; return { ...d, name: desc, full: `${d.name} — ${desc}` }; }) }));
  const table = data.filter((r) => !q || `${r.plant} ${r.plantName} ${r.sloc} ${r.slocName} ${r.material} ${r.matDesc} ${r.batch} ${r.doc} ${r.pc} ${r.pcDesc}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.value - a.value);
  const pages = Math.max(1, Math.ceil(table.length / PAGE));
  const tt = ageTotals(table);
  const HEADS = ["Plant", "Plant Name", "St.Locn", "St.Locn Desc", "Material", "Description", "UoM", "Batch", "Mat. Doc", "Year", "Doc Date", "Profit Centre", "Profit Centre Desc", ...labels.flatMap((l) => [`${l} Qty`, `${l} Val (₹)`]), "Closing Qty", "Closing Val (₹)"];
  const cells = (r: AgeRow): (string | number)[] => [r.plant, r.plantName, r.sloc, r.slocName, r.material, r.matDesc, r.uom, r.batch, r.doc, r.year, ddmm(r.docDate), r.pc, r.pcDesc, r.q[0], r.v[0], r.q[1], r.v[1], r.q[2], r.v[2], r.q[3], r.v[3], r.qty, r.value];
  const totals = [tt.q[0]!, tt.v[0]!, tt.q[1]!, tt.v[1]!, tt.q[2]!, tt.v[2]!, tt.q[3]!, tt.v[3]!, tt.qty, tt.value];
  const isQty = (j: number) => j >= 12 && (j - 12) % 2 === 0;
  const exportXlsx = async () => {
    const { Workbook } = await import("exceljs");
    const wb = new Workbook(); const ws = wb.addWorksheet("Inventory Aging");
    ws.addRow(HEADS).font = { bold: true };
    table.forEach((r) => ws.addRow(cells(r)));
    ws.addRow(["Total", ...Array(11).fill(""), ...totals]).font = { bold: true };
    const blob = new Blob([await wb.xlsx.writeBuffer()]); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = datedFileName("Inventory Aging", "xlsx"); a.click(); URL.revokeObjectURL(a.href);
  };
  const field = (k: Key, label: string) => <FilterMultiSelect label={label} placeholder="All" selected={f[k]} options={opts[k]} onChange={(v) => { setF({ ...f, [k]: v.length === opts[k].length ? null : v }); setPage(0); }} />;
  const fmtCell = (v: string | number, j: number) => typeof v === "number" ? full(v, isQty(j) || j === 20 ? 3 : 2) : v;

  return <div className="space-y-3">
    <div data-pdf-exclude className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-card-foreground"><span>Filters</span><ChevronDown className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`} /></button>
      {open ? <div className="grid grid-cols-2 gap-2 px-3 pb-2 sm:grid-cols-3 lg:grid-cols-6">{field("plant", "Plant")}{field("sloc", "Storage Location")}{field("material", "Material")}{field("pc", "Profit Centre")}
        <div className="flex items-end gap-2"><Button type="button" variant="outline" size="sm" className="h-8 flex-1 text-xs" onClick={() => { setF({ plant: [], sloc: [], material: [], pc: [] }); setPage(0); }}>Clear</Button><Button type="button" variant="reset" size="sm" className="h-8 flex-1 text-xs" onClick={() => { setF(EMPTY); setPage(0); }}>Reset</Button></div></div> : null}
    </div>
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
      {([
        [`${labels[3]} Days`, cr(t.v[3]!), "#d64550", TimerOff],
        [`${labels[2]} Days`, cr(t.v[2]!), "#e07b39", CalendarClock],
        [`${labels[1]} Days`, cr(t.v[1]!), "#e0a030", Hourglass],
        [`${labels[0]} Days`, cr(t.v[0]!), "#2f8f4e", Timer],
        ["Total Val", cr(t.v.reduce((a, b) => a + b, 0)), "#1f6fd1", Wallet],
      ] as const).map(([label, value, tone, Icon]) => <div key={label} className="min-w-0 rounded-xl px-2.5 py-2 text-primary-foreground shadow-md" style={{ background: `linear-gradient(135deg, ${tone}cc, ${tone})` }}>
        <p className="flex items-center gap-1 text-[10px] font-semibold opacity-95"><Icon className="size-3 shrink-0" />{label}</p>
        <p title={value} className="mt-1 truncate text-sm font-bold tabular-nums leading-tight sm:text-base">{value}</p></div>)}
    </div>
    <div data-pdf-block className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_2fr]">
      <Card title="Ageing Buckets" sub="Val in Cr" tint="peach"><Donut data={donut} heads={["Bucket", "Val", "%"]} /></Card>
      <Card title="Plant Wise Ageing" sub="Val in Cr" tint="sky"><BucketColumns data={plants} labels={labels} /></Card>
    </div>
    <div data-pdf-block className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {plantBuckets.map(({ i, data: d }) => <Card key={i} title={`Plant Wise ${labels[i]} Days`} sub="Val in Cr" tint="sky"><SingleColumns data={d} color={BUCKET_COLORS[i]!} label={`${labels[i]} days`} /></Card>)}
    </div>
    <div data-pdf-block className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {matBuckets.map(({ i, data: d }) => <Card key={i} title={`Material Wise ${labels[i]} Days`} sub="Top 10 · Val in Cr" tint="rose"><SingleColumns data={d} color={BUCKET_COLORS[i]!} label={`${labels[i]} days`} angled /></Card>)}
    </div>
    <div data-pdf-block><Card title="Profit Centre Wise Ageing" sub="Val in Cr" tint="amber"><BucketColumns data={pcs} labels={labels} /></Card></div>
    <div data-pdf-exclude><Card title="Ageing Details" tint="neutral">
      <div className="mb-2 flex flex-wrap items-center gap-2"><input className="h-8 w-60 rounded-md border border-border bg-background px-2 text-xs" placeholder="Search plant, material, batch…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} /><Button size="sm" variant="outline" onClick={exportXlsx}>Excel</Button><span className="text-[11px] text-muted-foreground">{table.length} lines</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[2000px] text-[11px]"><thead><tr className="border-b text-left">{HEADS.map((h) => <th key={h} className="whitespace-nowrap px-2 py-1.5 font-bold">{h}</th>)}</tr></thead>
        <tbody>{table.slice(page * PAGE, page * PAGE + PAGE).map((r, i) => <tr key={i} className="border-b border-border/50">{cells(r).map((v, j) => <td key={j} className={`whitespace-nowrap px-2 py-1 ${typeof v === "number" ? "text-right tabular-nums" : ""}`}>{fmtCell(v, j)}</td>)}</tr>)}</tbody>
        <tfoot><tr className="border-t-2 border-border font-bold"><td className="px-2 py-1.5" colSpan={12}>Total ({table.length} lines)</td>{totals.map((v, j) => <td key={j} className="px-2 py-1.5 text-right tabular-nums">{fmtCell(v, j + 12)}</td>)}</tr></tfoot></table></div>
      <div className="mt-2 flex items-center gap-2 text-[11px]"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button><span>Page {page + 1} / {pages}</span><Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button></div>
    </Card></div>
  </div>;
}

import { useId, useMemo, useState, type ReactNode } from "react";
import { Factory, Globe2, IndianRupee, Truck, Wrench } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { datedFileName } from "@/lib/format";
import { MONTHS, PURCHASE_TYPES, sumValues, type PurchaseType } from "@/lib/purchase-register-sample";
import { fyLabel, fyOf, monthOf, monthly, quarters, rankBy, typeTotals, type PurchaseRow } from "@/lib/purchase-register-data";

const COLORS = ["#1f6fd1", "#0f9d8a", "#2e8b57", "#e08a1e", "#8e44ad", "#d64550", "#3a8dde", "#16a3b8", "#c0841a", "#5c6bc0"];
const TYPE_COLOR: Record<PurchaseType, number> = { Domestic: 0, Imported: 3, Service: 4 };
const fmt = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Card({ title, sub, children, className = "" }: { title: string; sub?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`flex min-w-0 flex-col rounded-xl border border-border bg-card p-2 shadow-sm ${className}`}>
    <div className="mb-1 flex items-center justify-between gap-2"><h2 className="text-xs font-semibold text-card-foreground">{title}</h2>{sub ? <span className="text-[10px] text-muted-foreground">{sub}</span> : null}</div>
    <div className="min-h-0 flex-1">{children}</div>
  </section>;
}

function Tile({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note?: string; tone: string }) {
  return <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm" style={{ backgroundImage: `linear-gradient(135deg, color-mix(in oklab, ${tone} 12%, transparent), transparent)` }}>
    <div className="grid size-8 shrink-0 place-items-center rounded-full text-primary-foreground" style={{ background: tone }}>{icon}</div>
    <div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{label}</p>
      <p className="truncate text-lg font-bold text-foreground">{value}</p>{note ? <p className="truncate text-[10px] text-muted-foreground">{note}</p> : null}</div>
  </div>;
}

function grad(id: string) {
  return <defs>{COLORS.map((c, i) => <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" style={{ stopColor: c, stopOpacity: 0.55 }} /><stop offset="55%" style={{ stopColor: c, stopOpacity: 0.9 }} /><stop offset="100%" style={{ stopColor: c, stopOpacity: 1 }} /></linearGradient>)}</defs>;
}

function Columns({ data, height = 170 }: { data: { name: string; value: number }[]; height?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return <ResponsiveContainer width="100%" height={height}><BarChart data={data} margin={{ top: 16, left: -16, right: 4, bottom: 0 }}>{grad(id)}
    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
    <XAxis dataKey="name" interval={0} tick={{ fontSize: 9, fontWeight: 600 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip formatter={(v: number) => `₹ ${fmt(v)} Cr`} />
    <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={28}>{data.map((_, i) => <Cell key={i} fill={`url(#${id}-${i % COLORS.length})`} />)}
      <LabelList dataKey="value" position="top" formatter={(v: number) => Math.round(v)} style={{ fontSize: 9, fill: "var(--primary)" }} /></Bar>
  </BarChart></ResponsiveContainer>;
}

function RankList({ data }: { data: { name: string; code?: string; extra?: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return <div className="text-[10px]"><p className="mb-1 text-right text-muted-foreground">₹ Cr</p>
    <ul className="space-y-1.5">{data.map((d, i) => <li key={d.name + i} className="grid grid-cols-[minmax(0,45%)_minmax(0,1fr)_auto] items-center gap-2" title={`${d.name}${d.code ? ` (${d.code})` : ""}: ₹ ${fmt(d.value)} Cr`}>
      <span className="min-w-0"><span className="block truncate text-foreground">{d.name}</span>{d.code || d.extra ? <span className="block truncate text-[9px] text-muted-foreground">{[d.code, d.extra].filter(Boolean).join(" · ")}</span> : null}</span>
      <span className="h-2 rounded-full" style={{ width: `${Math.max(3, (d.value / max) * 100)}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}99, ${COLORS[i % COLORS.length]})` }} />
      <b className="text-right text-foreground">{fmt(d.value)}</b></li>)}</ul></div>;
}

function CodeTable({ rows, codeLabel }: { rows: { code: string; name: string; value: number }[]; codeLabel: string }) {
  return <table className="w-full text-[10px]"><thead className="bg-primary/5 text-primary"><tr><th className="px-1.5 py-1 text-left">{codeLabel}</th><th className="px-1.5 py-1 text-left">Name</th><th className="px-1.5 py-1 text-right">Amount (₹ Cr)</th></tr></thead>
    <tbody>{rows.map((r, i) => <tr key={r.code} className="border-t border-border/60"><td className="px-1.5 py-0.5 font-medium text-primary"><span className="mr-1 inline-block size-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />{r.code}</td><td className="truncate px-1.5 py-0.5">{r.name}</td><td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(r.value)}</td></tr>)}</tbody>
    <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td className="px-1.5 py-1" colSpan={2}>Total</td><td className="px-1.5 py-1 text-right tabular-nums">{fmt(sumValues(rows))}</td></tr></tfoot></table>;
}

function DataTable({ cols, rows }: { cols: string[]; rows: { cells: string[]; value: number }[] }) {
  return <table className="mt-2 w-full text-[10px]"><thead className="bg-primary/5 text-primary"><tr>{cols.map((c) => <th key={c} className="px-1.5 py-1 text-left">{c}</th>)}<th className="px-1.5 py-1 text-right">Amount (₹ Cr)</th></tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i} className={`border-t border-border/60 ${i % 2 ? "bg-muted/40" : ""}`}>{r.cells.map((c, j) => <td key={j} className={`px-1.5 py-0.5 ${j === 0 ? "font-medium text-primary" : ""}`}>{c}</td>)}<td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(r.value)}</td></tr>)}</tbody>
    <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td className="px-1.5 py-1" colSpan={cols.length}>Total</td><td className="px-1.5 py-1 text-right tabular-nums">{fmt(sumValues(rows))}</td></tr></tfoot></table>;
}

const sel = "h-8 rounded-md border border-border bg-background px-2 text-xs";

export function PurchaseRegisterDashboard({ rows }: { rows: PurchaseRow[] }) {
  const years = useMemo(() => [...new Set(rows.filter((r) => r.date).map((r) => fyOf(r.date)))].sort((a, b) => b - a), [rows]);
  const [yearSel, setYear] = useState<number | null>(null);
  const year = yearSel ?? years[0] ?? null;
  const [type, setType] = useState<"" | PurchaseType>("");
  const [month, setMonth] = useState("");
  const [plant, setPlant] = useState("");
  const [group, setGroup] = useState("");
  const [postFrom, setPostFrom] = useState("");
  const [postTo, setPostTo] = useState("");
  const types = type ? [type] : PURCHASE_TYPES;
  const base = (r: PurchaseRow) => (!plant || r.plant === plant) && (!group || r.group === group) && (!month || monthOf(r.date) === month)
    && (!postFrom || r.date >= postFrom) && (!postTo || r.date <= postTo);
  const yearRows = useMemo(() => rows.filter((r) => year == null || fyOf(r.date) === year), [rows, year]);
  const noType = useMemo(() => yearRows.filter(base), [yearRows, plant, group, month, postFrom, postTo]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = useMemo(() => noType.filter((r) => !type || r.type === type), [noType, type]);
  const prevRows = useMemo(() => rows.filter((r) => year != null && fyOf(r.date) === year - 1 && base(r) && (!type || r.type === type)), [rows, year, plant, group, month, postFrom, postTo, type]); // eslint-disable-line react-hooks/exhaustive-deps
  const TYPE_TOTALS = typeTotals(noType);
  const TOTAL_PURCHASE = sumValues(PURCHASE_TYPES.map((t) => ({ value: TYPE_TOTALS[t] })));
  const monthlyData = monthly(filtered, types).filter((r) => !month || r.month === month);
  const PLANTS = rankBy(yearRows, (r) => r.plant, (r) => r.plantName, 1000);
  const plants = rankBy(filtered, (r) => r.plant, (r) => r.plantName);
  const allGroups = rankBy(yearRows.filter((r) => !type || r.type === type), (r) => r.group, (r) => r.group, 1000).map((g) => ({ name: g.name, value: g.value }));
  const groups = rankBy(filtered, (r) => r.group, (r) => r.group, 1000).map((g) => ({ name: g.name, value: g.value }));
  const materials = rankBy(filtered, (r) => r.material, (r) => r.materialName);
  const vendors = rankBy(filtered, (r) => r.vendor, (r) => r.vendorName);
  const pcs = rankBy(filtered, (r) => r.profitCenter, (r) => r.profitCenterName);
  const qData = quarters(filtered, prevRows);
  const done = qData.filter((q) => q.current !== 0);
  const prevSum = done.reduce((s, q) => s + q.previous, 0);
  const yoy = prevSum ? Math.round(((done.reduce((s, q) => s + q.current, 0) - prevSum) / prevSum) * 1000) / 10 : 0;
  const typeData = types.map((t) => ({ name: t, value: TYPE_TOTALS[t] }));
  const total = type ? TYPE_TOTALS[type] : TOTAL_PURCHASE;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const curL = year != null ? fyLabel(year) : "-", prevL = year != null ? fyLabel(year - 1) : "-";

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
      <span className="text-[10px] font-bold tracking-wide text-primary uppercase">Filters</span>
      <select className={sel} value={year ?? ""} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year">{years.length ? years.map((y) => <option key={y} value={y}>{fyLabel(y)}</option>) : <option value="">No data</option>}</select>
      <select className={sel} value={plant} onChange={(e) => setPlant(e.target.value)} aria-label="Plant"><option value="">All Plants</option>{PLANTS.map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}</select>
      <select className={sel} value={type} onChange={(e) => setType(e.target.value as "" | PurchaseType)} aria-label="Type"><option value="">All Types</option>{PURCHASE_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      <select className={sel} value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Material Group"><option value="">All Material Groups</option>{allGroups.map((g) => <option key={g.name}>{g.name}</option>)}</select>
      <select className={sel} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month"><option value="">All Months</option>{MONTHS.map((m) => <option key={m}>{m}</option>)}</select>
      <label className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">Posting Date From<input type="date" className={sel} value={postFrom} max={postTo || undefined} onChange={(e) => setPostFrom(e.target.value)} aria-label="Posting Date From" /></label>
      <label className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">Posting Date To<input type="date" className={sel} value={postTo} min={postFrom || undefined} onChange={(e) => setPostTo(e.target.value)} aria-label="Posting Date To" /></label>
      <Button type="button" variant="reset" size="sm" className="h-8 text-xs" onClick={() => { setYear(null); setType(""); setMonth(""); setPlant(""); setGroup(""); setPostFrom(""); setPostTo(""); }}>Reset</Button>
      <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{filtered.length.toLocaleString("en-IN")} lines · ₹ values in Crores</span>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile icon={<IndianRupee className="size-5" />} label="Total Purchase Value" value={`₹ ${fmt(total)} Cr`} tone="var(--chart-1)" />
      <Tile icon={<Truck className="size-5" />} label="Domestic" value={`₹ ${fmt(TYPE_TOTALS.Domestic)} Cr`} tone="var(--chart-2)" />
      <Tile icon={<Globe2 className="size-5" />} label="Imported" value={`₹ ${fmt(TYPE_TOTALS.Imported)} Cr`} tone="var(--chart-4)" />
      <Tile icon={<Wrench className="size-5" />} label="Service" value={`₹ ${fmt(TYPE_TOTALS.Service)} Cr`} tone="var(--chart-3)" />
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
      <Card title="Purchase Trend" sub="Monthly · ₹ Cr"><Columns data={monthlyData.map((r) => ({ name: r.month, value: r.total }))} /></Card>
      <Card title="Purchase by Type" sub="Click to filter">
        <div className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] items-center gap-2">
          <div className="relative"><ResponsiveContainer width="100%" height={150}><PieChart>{grad(id)}
            <Pie data={typeData.filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={1} onClick={(d: { name: PurchaseType }) => setType(type === d.name ? "" : d.name)}>
              {typeData.filter((d) => d.value > 0).map((d) => <Cell key={d.name} className="cursor-pointer" fill={`url(#${id}-${TYPE_COLOR[d.name]})`} />)}</Pie>
            <Tooltip formatter={(v: number) => `₹ ${fmt(v)} Cr`} /></PieChart></ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center text-[10px] font-bold leading-tight">₹ {Math.round(total).toLocaleString("en-IN")} Cr</div></div>
          <ul className="space-y-1 text-[10px]">{typeData.map((d) => <li key={d.name}><button type="button" onClick={() => setType(type === d.name ? "" : d.name)} className="flex w-full items-center gap-1 text-left"><span className="size-2 rounded-full" style={{ background: COLORS[TYPE_COLOR[d.name]] }} />{d.name}<b className="ml-auto">{fmt(d.value)}</b></button></li>)}</ul>
        </div>
      </Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card title="Top Materials" sub="Amount in ₹ Cr"><RankList data={materials.map((m) => ({ name: m.name, code: m.code, value: m.value }))} />
        <DataTable cols={["Material Code", "Material Name", "Material Group"]} rows={materials.map((m) => ({ cells: [m.code || "-", m.name, m.group], value: m.value }))} /></Card>
      <Card title="Top Vendors" sub="Amount in ₹ Cr"><RankList data={vendors} />
        <DataTable cols={["Vendor Code", "Vendor Name"]} rows={vendors.map((v) => ({ cells: [v.code || "-", v.name], value: v.value }))} /></Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card title="Material Group" sub={<span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">Click to filter</span>}>
        <div className="relative"><ResponsiveContainer width="100%" height={200}><PieChart>{grad(`${id}g`)}
          <Pie data={groups} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={1} onClick={(d: { name: string }) => setGroup(group === d.name ? "" : d.name)}>
            {groups.map((g) => <Cell key={g.name} className="cursor-pointer" fill={`url(#${id}g-${allGroups.findIndex((x) => x.name === g.name) % COLORS.length})`} />)}</Pie>
          <Tooltip formatter={(v: number) => `₹ ${fmt(v)} Cr`} /></PieChart></ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-[9px] text-muted-foreground">TOTAL</p><p className="text-sm font-bold">{fmt(sumValues(groups))}</p></div></div></div>
      </Card>
      <Card title="Material Group Summary" sub="Amount in ₹ Cr">
        <table className="w-full text-[10px]"><thead className="bg-primary/5 text-primary"><tr><th className="px-1.5 py-1 text-left">Material Group</th><th className="px-1.5 py-1 text-right">Amount (₹ Cr)</th></tr></thead>
          <tbody>{groups.map((g, i) => <tr key={g.name} className={`cursor-pointer border-t border-border/60 ${i % 2 ? "bg-muted/40" : ""}`} onClick={() => setGroup(group === g.name ? "" : g.name)}><td className="px-1.5 py-1"><span className="mr-1.5 inline-block size-2 rounded-full" style={{ background: COLORS[allGroups.findIndex((x) => x.name === g.name) % COLORS.length] }} />{g.name}</td><td className="px-1.5 py-1 text-right tabular-nums">{fmt(g.value)}</td></tr>)}</tbody>
          <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td className="px-1.5 py-1">Total</td><td className="px-1.5 py-1 text-right tabular-nums">{fmt(sumValues(groups))}</td></tr></tfoot></table>
      </Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card title="Monthly Expenditure" sub="Amount in ₹ Cr"><ResponsiveContainer width="100%" height={180}><BarChart data={monthlyData} margin={{ top: 8, left: -16, right: 4, bottom: 0 }}>{grad(`${id}m`)}
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
        {types.map((t) => <Bar key={t} dataKey={t} stackId="m" fill={`url(#${id}m-${TYPE_COLOR[t]})`} />)}
      </BarChart></ResponsiveContainer></Card>
      <Card title="Quarterly Comparison" sub={<span>{curL} vs {prevL} · <b className={yoy < 0 ? "text-destructive" : "text-success"}>{yoy < 0 ? "▼" : "▲"} {Math.abs(yoy)}% YoY</b></span>}>
        <ResponsiveContainer width="100%" height={180}><BarChart data={qData} margin={{ top: 16, left: -16, right: 4, bottom: 0 }}>{grad(`${id}q`)}
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip formatter={(v: number) => `₹ ${fmt(v)} Cr`} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="current" name={curL} fill={`url(#${id}q-0)`} radius={[3, 3, 0, 0]} maxBarSize={26}><LabelList dataKey="current" position="top" style={{ fontSize: 8, fill: "var(--primary)" }} /></Bar>
          <Bar dataKey="previous" name={prevL} fill={`url(#${id}q-3)`} radius={[3, 3, 0, 0]} maxBarSize={26}><LabelList dataKey="previous" position="top" style={{ fontSize: 8, fill: "var(--muted-foreground)" }} /></Bar>
        </BarChart></ResponsiveContainer></Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card title="Plant Analytics" sub={<span className="inline-flex items-center gap-1"><Factory className="size-3" />Top 10 · ₹ Cr</span>}>
        <Columns data={plants.map((p) => ({ name: p.code, value: p.value }))} height={150} /><CodeTable rows={plants} codeLabel="Plant Code" /></Card>
      <Card title="Profit Center Analytics" sub="Top 10 · ₹ Cr">
        <Columns data={pcs.map((p) => ({ name: p.code.slice(-5), value: p.value }))} height={150} /><CodeTable rows={pcs} codeLabel="Profit Center" /></Card>
    </div>
    <DetailsTable rows={filtered} />
  </div>;
}

function DetailsTable({ rows }: { rows: PurchaseRow[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const s = q.toLowerCase();
  const list = useMemo(() => [...rows].filter((r) => !s || [r.docNo, r.grNo, r.vendorName, r.vendor, r.material, r.materialName, r.plant].some((v) => (v ?? "").toLowerCase().includes(s))).sort((a, b) => b.date.localeCompare(a.date)), [rows, s]);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const p = Math.min(page, pages - 1);
  const dmy = (d: string) => d ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : "";
  const excel = async () => {
    const { Workbook } = await import("exceljs");
    const wb = new Workbook(); const sh = wb.addWorksheet("Purchase Register");
    const h = sh.addRow(["#", "Posting Date", "Document No", "GR No", "Type", "Plant", "Profit Center", "Vendor", "Material", "Material Name", "Material Group", "Amount (NET_AMT) Cr"]);
    h.font = { bold: true, color: { argb: "FFFFFFFF" } }; h.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A6ED1" } }; });
    list.forEach((r, i) => sh.addRow([i + 1, dmy(r.date), r.docNo, r.grNo, r.type, `${r.plant} ${r.plantName}`.trim(), r.profitCenter, `${r.vendor} ${r.vendorName}`.trim(), r.material, r.materialName, r.group, Number(r.value.toFixed(4))]));
    sh.columns.forEach((c) => { c.width = 20; });
    const url = URL.createObjectURL(new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a"); a.href = url; a.download = datedFileName("Purchase Register", "xlsx"); a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const heads = ["#", "Posting Date", "Document No", "GR No", "Type", "Plant", "Profit Center", "Vendor", "Material", "Material Group", "Amount (NET_AMT) Cr"];
  return <section className="rounded-xl border border-border bg-card shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
      <h2 className="text-xs font-semibold">Purchase Register Details</h2>
      <div className="flex items-center gap-2">
        <button type="button" disabled={!list.length} onClick={() => void excel()} className="btn-export rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-40">Excel</button>
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search document, vendor, material..." className={`${sel} w-56`} />
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-[11px]">
      <thead className="bg-primary/5 text-primary"><tr>{heads.map((h) => <th key={h} className={`whitespace-nowrap px-2 py-1.5 font-semibold ${h.startsWith("Amount") ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
      <tbody>{list.length ? list.slice(p * size, p * size + size).map((r, i) => <tr key={i} className="border-t border-border/60">
        <td className="px-2 py-1">{p * size + i + 1}</td><td className="whitespace-nowrap px-2 py-1">{dmy(r.date)}</td>
        <td className="px-2 py-1 font-medium text-primary">{r.docNo}</td><td className="px-2 py-1">{r.grNo}</td><td className="px-2 py-1">{r.type}</td>
        <td className="whitespace-nowrap px-2 py-1">{[r.plant, r.plantName].filter(Boolean).join(" — ")}</td><td className="px-2 py-1">{r.profitCenter}</td>
        <td className="whitespace-nowrap px-2 py-1">{r.vendorName}</td><td className="min-w-48 px-2 py-1">{r.materialName}</td><td className="px-2 py-1">{r.group}</td>
        <td className="px-2 py-1 text-right tabular-nums">{fmt(r.value)}</td></tr>)
        : <tr><td colSpan={heads.length} className="h-20 text-center text-muted-foreground">No Purchase Register data for these filters.</td></tr>}</tbody>
      {list.length > 0 && <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td colSpan={heads.length - 1} className="px-2 py-1.5">Total ({list.length} lines)</td><td className="px-2 py-1.5 text-right tabular-nums">{fmt(list.reduce((a, r) => a + r.value, 0))}</td></tr></tfoot>}
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

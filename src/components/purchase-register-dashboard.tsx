import { useId, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Factory, Globe2, IndianRupee, Truck, Wrench } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { MaterialTrendSection } from "@/components/material-trend-card";
import { MaterialPricePage } from "@/components/material-price-page";
import { ZrmmatCompareCard } from "@/components/zrmmat-compare-card";
import type { MaterialTrend } from "@/lib/purchase-material-trend";
import { datedFileName } from "@/lib/format";
import { MONTHS, PURCHASE_TYPES, sumValues, type PurchaseType } from "@/lib/purchase-register-sample";
import { currentFy, fyLabel, monthOf, monthly, quarters, rankBy, typeTotals, type PurchaseRow } from "@/lib/purchase-register-data";
import { OrderBookSubGroupChart } from "@/components/order-book-subgroup-chart";
import { summarizeGroupsByDivision } from "@/lib/open-orders-groups";
import { TINTS, type Tint } from "@/lib/card-tints";

const COLORS = ["#1f6fd1", "#0f9d8a", "#2e8b57", "#e08a1e", "#8e44ad", "#d64550", "#3a8dde", "#16a3b8", "#c0841a", "#5c6bc0"];
const TYPE_COLOR: Record<PurchaseType, number> = { Domestic: 0, Imported: 3, Service: 4 };
const fmt = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CARD_TINT: Record<string, Tint> = { "Purchase Trend": "sky", "Purchase by Type": "peach", "Top Materials": "steel", "Top Vendors": "rose", "Material Group": "teal", "Material Group Summary": "violet", "Monthly Expenditure": "amber", "Quarterly Comparison": "mint", "Plant Analytics": "copper", "Value by Main Group": "teal", "Value by Sub Group 1": "violet", "Value by Sub Group 2": "amber", "Value by Sub Group 3": "mint" };
function Card({ title, sub, children, className = "" }: { title: string; sub?: ReactNode; children: ReactNode; className?: string }) {
  const tint = TINTS[CARD_TINT[title] ?? "neutral"];
  return <section className={`flex min-w-0 flex-col rounded-xl border p-2 ${className}`} style={tint}>
    <div className="mb-2 flex items-center justify-between gap-2"><h2 className="border-b-2 pb-0.5 text-xs font-bold text-foreground" style={{ borderColor: tint.borderColor }}>{title}</h2>{sub ? <span className="text-[10px] text-muted-foreground">{sub}</span> : null}</div>
    <div className="min-h-0 flex-1">{children}</div>
  </section>;
}

function Tile({ icon, label, value, note, tone, unit }: { icon: ReactNode; label: string; value: string; note?: string; tone: string; unit?: string }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-on-radiant shadow-md" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${tone} 65%, white), ${tone})` }}>
    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-background/20">{icon}</div>
    <div className="min-w-0"><p className="truncate text-xs font-semibold opacity-90">{label}</p>
      <p className="truncate text-lg font-bold">{value}</p>{unit ? <p className="truncate text-[10px] font-medium opacity-85">{unit}</p> : null}{note ? <p className="truncate text-[10px] opacity-85">{note}</p> : null}</div>
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
    <XAxis dataKey="name" interval={0} height={30} tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => { const [a, b] = String(payload.value).split("\n"); return <text x={x} y={y + 10} textAnchor="middle" fontSize={9} fill="var(--foreground)"><tspan x={x} fontWeight={600}>{a}</tspan>{b ? <tspan x={x} dy={11} fill="var(--muted-foreground)">{b}</tspan> : null}</text>; }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip formatter={(v: number) => `₹ ${fmt(v)}`} />
    <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={28}>{data.map((_, i) => <Cell key={i} fill={`url(#${id}-${i % COLORS.length})`} />)}
      <LabelList dataKey="value" position="top" formatter={(v: number) => Math.round(v)} style={{ fontSize: 9, fill: "var(--primary)" }} /></Bar>
  </BarChart></ResponsiveContainer>;
}

function RankList({ data }: { data: { name: string; code?: string; extra?: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return <div className="text-[10px]">
    <ul className="space-y-1.5">{data.map((d, i) => <li key={d.name + i} className="grid grid-cols-[minmax(0,45%)_minmax(0,1fr)_auto] items-center gap-2" title={`${d.name}${d.code ? ` (${d.code})` : ""}: ₹ ${fmt(d.value)}`}>
      <span className="min-w-0"><span className="block truncate text-foreground">{d.name}</span>{d.code || d.extra ? <span className="block truncate text-[9px] text-muted-foreground">{[d.code, d.extra].filter(Boolean).join(" · ")}</span> : null}</span>
      <span className="h-2 rounded-full" style={{ width: `${Math.max(3, (d.value / max) * 100)}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}99, ${COLORS[i % COLORS.length]})` }} />
      <b className="text-right text-foreground">{fmt(d.value)}</b></li>)}</ul></div>;
}

function CodeTable({ rows, codeLabel }: { rows: { code: string; name: string; value: number }[]; codeLabel: string }) {
  return <table className="w-full text-[10px]"><thead className="bg-primary/5 text-primary"><tr><th className="px-1.5 py-1 text-left">{codeLabel}</th><th className="px-1.5 py-1 text-left">Name</th><th className="px-1.5 py-1 text-right">Amount</th></tr></thead>
    <tbody>{rows.map((r, i) => <tr key={r.code} className="border-t border-border/60"><td className="px-1.5 py-0.5 font-medium text-primary"><span className="mr-1 inline-block size-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />{r.code}</td><td className="truncate px-1.5 py-0.5">{r.name}</td><td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(r.value)}</td></tr>)}</tbody>
    <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td className="px-1.5 py-1" colSpan={2}>Total</td><td className="px-1.5 py-1 text-right tabular-nums">{fmt(sumValues(rows))}</td></tr></tfoot></table>;
}


const sel = "h-8 rounded-md border border-border bg-background px-2 text-xs";

export function PurchaseRegisterDashboard({ rows, prevYearRows, years, year, onYear }: { rows: PurchaseRow[]; prevYearRows: PurchaseRow[]; years: number[]; year: number; onYear: (y: number) => void }) {
  const setYear = (y: number | null) => onYear(y ?? currentFy());
  const [type, setType] = useState<"" | PurchaseType>("");
  const [month, setMonth] = useState("");
  const [plant, setPlant] = useState("");
  const [group, setGroup] = useState("");
  const [mainGrp, setMainGrp] = useState("");
  const [subGrp, setSubGrp] = useState("");
  const [postFrom, setPostFrom] = useState("");
  const [postTo, setPostTo] = useState("");
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const types = type ? [type] : PURCHASE_TYPES;
  const base = (r: PurchaseRow) => (!plant || r.plant === plant) && (!group || r.group === group) && (!mainGrp || r.mainGroup === mainGrp) && (!subGrp || r.subGroup === subGrp) && (!month || monthOf(r.date) === month)
    && (!postFrom || r.date >= postFrom) && (!postTo || r.date <= postTo);
  const yearRows = rows;
  const noType = useMemo(() => yearRows.filter(base), [yearRows, plant, group, mainGrp, subGrp, month, postFrom, postTo]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = useMemo(() => noType.filter((r) => !type || r.type === type), [noType, type]);
  const [openMat, setOpenMat] = useState<MaterialTrend | null>(null);
  const prevRows = useMemo(() => prevYearRows.filter((r) => base(r) && (!type || r.type === type)), [prevYearRows, plant, group, mainGrp, subGrp, month, postFrom, postTo, type]); // eslint-disable-line react-hooks/exhaustive-deps
  const TYPE_TOTALS = typeTotals(noType);
  const TOTAL_PURCHASE = sumValues(PURCHASE_TYPES.map((t) => ({ value: TYPE_TOTALS[t] })));
  const monthlyData = monthly(filtered, types).filter((r) => !month || r.month === month);
  const PLANTS = rankBy(yearRows, (r) => r.plant, (r) => r.plantName, 1000);
  const plants = rankBy(filtered, (r) => r.plant, (r) => r.plantName);
  const plantInfo = new Map<string, { full: string; sh: string }>();
  for (const r of yearRows) { const e = plantInfo.get(r.plant); if (!e || (!e.sh && r.plantSh) || (!e.full && r.plantFull)) plantInfo.set(r.plant, { full: e?.full || r.plantFull || "", sh: e?.sh || r.plantSh || "" }); }
  const allGroups = rankBy(yearRows.filter((r) => !type || r.type === type), (r) => r.group, (r) => r.group, 1000).map((g) => ({ name: g.name, value: g.value }));
  const groups = rankBy(filtered, (r) => r.group, (r) => r.group, 1000).map((g) => ({ name: g.name, value: g.value }));
  const uniq = (k: "mainGroup" | "subGroup") => [...new Set(yearRows.map((r) => r[k] ?? "").filter(Boolean))].sort();
  const grpRows = (k: "mainGroup" | "subGroup" | "subGroup2" | "subGroup3") => filtered.map((r, i) => ({ name: r[k] ?? "", value: r.value, order: r.docNo || String(i), division: r.plantSh || r.plantName || r.plant }));
  const mainG = summarizeGroupsByDivision(grpRows("mainGroup"), (r) => r.name);
  const subGs = [["Sub Group 1", summarizeGroupsByDivision(grpRows("subGroup"), (r) => r.name)], ["Sub Group 2", summarizeGroupsByDivision(grpRows("subGroup2"), (r) => r.name)], ["Sub Group 3", summarizeGroupsByDivision(grpRows("subGroup3"), (r) => r.name)]] as const;
  const materials = rankBy(filtered, (r) => r.material, (r) => r.materialName);
  const vendors = rankBy(filtered, (r) => r.vendor, (r) => r.vendorName);
  const qData = quarters(filtered, prevRows);
  const done = qData.filter((q) => q.current !== 0);
  const prevSum = done.reduce((s, q) => s + q.previous, 0);
  const yoy = prevSum ? Math.round(((done.reduce((s, q) => s + q.current, 0) - prevSum) / prevSum) * 1000) / 10 : 0;
  const typeData = types.map((t) => ({ name: t, value: TYPE_TOTALS[t] }));
  const total = type ? TYPE_TOTALS[type] : TOTAL_PURCHASE;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const curL = year != null ? fyLabel(year) : "-", prevL = year != null ? fyLabel(year - 1) : "-";

  if (openMat) return <MaterialPricePage trend={openMat} rows={filtered} onBack={() => setOpenMat(null)} />;
  return <div className="space-y-3">
    <div className="rounded-xl border" style={TINTS.neutral}>
      <button type="button" aria-expanded={!filtersCollapsed} onClick={() => setFiltersCollapsed((c) => !c)} className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-xs font-semibold text-card-foreground">
        <span className="text-[10px] font-bold tracking-wide text-primary uppercase">Filters</span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{filtered.length.toLocaleString("en-IN")} lines</span>
          <ChevronDown className={`size-4 transition-transform ${filtersCollapsed ? "-rotate-90" : ""}`} />
        </span>
      </button>
      {filtersCollapsed ? null : <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
      <select className={sel} value={year ?? ""} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year">{years.length ? years.map((y) => <option key={y} value={y}>{fyLabel(y)}</option>) : <option value="">No data</option>}</select>
      <select className={sel} value={plant} onChange={(e) => setPlant(e.target.value)} aria-label="Plant"><option value="">All Plants</option>{PLANTS.map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}</select>
      <select className={sel} value={type} onChange={(e) => setType(e.target.value as "" | PurchaseType)} aria-label="Type"><option value="">All Types</option>{PURCHASE_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      <select className={sel} value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Material Group"><option value="">All Material Groups</option>{allGroups.map((g) => <option key={g.name}>{g.name}</option>)}</select>
      <select className={sel} value={mainGrp} onChange={(e) => setMainGrp(e.target.value)} aria-label="Main Group"><option value="">All Main Groups</option>{uniq("mainGroup").map((g) => <option key={g}>{g}</option>)}</select>
      <select className={sel} value={subGrp} onChange={(e) => setSubGrp(e.target.value)} aria-label="Sub Group"><option value="">All Sub Groups</option>{uniq("subGroup").map((g) => <option key={g}>{g}</option>)}</select>
      <select className={sel} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month"><option value="">All Months</option>{MONTHS.map((m) => <option key={m}>{m}</option>)}</select>
      <label className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">Posting Date From<input type="date" className={sel} value={postFrom} max={postTo || undefined} onChange={(e) => setPostFrom(e.target.value)} aria-label="Posting Date From" /></label>
      <label className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">Posting Date To<input type="date" className={sel} value={postTo} min={postFrom || undefined} onChange={(e) => setPostTo(e.target.value)} aria-label="Posting Date To" /></label>
      <Button type="button" variant="reset" size="sm" className="h-8 text-xs" onClick={() => { setYear(null); setType(""); setMonth(""); setPlant(""); setGroup(""); setMainGrp(""); setSubGrp(""); setPostFrom(""); setPostTo(""); }}>Reset</Button>
      </div>}
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile icon={<IndianRupee className="size-5" />} label="Total Value" value={`${fmt(total)}`} tone="#1f6fd1" />
      <Tile icon={<Truck className="size-5" />} label="Domestic" value={`${fmt(TYPE_TOTALS.Domestic)}`} tone="#0f9d8a" />
      <Tile icon={<Globe2 className="size-5" />} label="Imported" value={`${fmt(TYPE_TOTALS.Imported)}`} tone="#8e44ad" />
      <Tile icon={<Wrench className="size-5" />} label="Service" value={`${fmt(TYPE_TOTALS.Service)}`} tone="#e08a1e" />
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
      <Card title="Purchase Trend" sub="Monthly"><Columns data={monthlyData.map((r) => ({ name: r.month, value: r.total }))} /></Card>
      <Card title="Purchase by Type" sub="Click to filter">
        <div className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] items-center gap-2">
          <div className="relative"><ResponsiveContainer width="100%" height={150}><PieChart>{grad(id)}
            <Pie data={typeData.filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={1} onClick={(d: { name: PurchaseType }) => setType(type === d.name ? "" : d.name)}>
              {typeData.filter((d) => d.value > 0).map((d) => <Cell key={d.name} className="cursor-pointer" fill={`url(#${id}-${TYPE_COLOR[d.name]})`} />)}</Pie>
            <Tooltip formatter={(v: number) => `₹ ${fmt(v)}`} /></PieChart></ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center text-[10px] font-bold leading-tight">₹ {Math.round(total).toLocaleString("en-IN")}</div></div>
          <ul className="space-y-1 text-[10px]">{typeData.map((d) => <li key={d.name}><button type="button" onClick={() => setType(type === d.name ? "" : d.name)} className="flex w-full items-center gap-1 text-left"><span className="size-2 rounded-full" style={{ background: COLORS[TYPE_COLOR[d.name]] }} />{d.name}<b className="ml-auto">{fmt(d.value)}</b></button></li>)}</ul>
        </div>
      </Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card title="Top Materials"><RankList data={materials.map((m) => ({ name: m.name, value: m.value }))} /></Card>
      <Card title="Top Vendors"><RankList data={vendors.map((v) => ({ name: v.name, value: v.value }))} /></Card>
    </div>

    <ZrmmatCompareCard rows={filtered} />

    <MaterialTrendSection rows={filtered} onOpen={(t) => { setOpenMat(t); window.scrollTo({ top: 0 }); }} />

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card title="Material Group" sub={<span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">Click to filter</span>}>
        <div className="relative"><ResponsiveContainer width="100%" height={200}><PieChart>{grad(`${id}g`)}
          <Pie data={groups} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={1} onClick={(d: { name: string }) => setGroup(group === d.name ? "" : d.name)}>
            {groups.map((g) => <Cell key={g.name} className="cursor-pointer" fill={`url(#${id}g-${allGroups.findIndex((x) => x.name === g.name) % COLORS.length})`} />)}</Pie>
          <Tooltip formatter={(v: number) => `₹ ${fmt(v)}`} /></PieChart></ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-[9px] text-muted-foreground">TOTAL</p><p className="text-sm font-bold">{fmt(sumValues(groups))}</p></div></div></div>
      </Card>
      <Card title="Material Group Summary">
        <table className="w-full text-[10px]"><thead className="bg-primary/5 text-primary"><tr><th className="px-1.5 py-1 text-left">Material Group</th><th className="px-1.5 py-1 text-right">Amount</th></tr></thead>
          <tbody>{groups.map((g, i) => <tr key={g.name} className={`cursor-pointer border-t border-border/60 ${i % 2 ? "bg-muted/40" : ""}`} onClick={() => setGroup(group === g.name ? "" : g.name)}><td className="px-1.5 py-1"><span className="mr-1.5 inline-block size-2 rounded-full" style={{ background: COLORS[allGroups.findIndex((x) => x.name === g.name) % COLORS.length] }} />{g.name}</td><td className="px-1.5 py-1 text-right tabular-nums">{fmt(g.value)}</td></tr>)}</tbody>
          <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td className="px-1.5 py-1">Total</td><td className="px-1.5 py-1 text-right tabular-nums">{fmt(sumValues(groups))}</td></tr></tfoot></table>
      </Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card title="Monthly Expenditure"><ResponsiveContainer width="100%" height={180}><BarChart data={monthlyData} margin={{ top: 8, left: -16, right: 4, bottom: 0 }}>{grad(`${id}m`)}
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
        {types.map((t) => <Bar key={t} dataKey={t} stackId="m" fill={`url(#${id}m-${TYPE_COLOR[t]})`} />)}
      </BarChart></ResponsiveContainer></Card>
      <Card title="Quarterly Comparison" sub={<span>{curL} vs {prevL} · <b className={yoy < 0 ? "text-destructive" : "text-success"}>{yoy < 0 ? "▼" : "▲"} {Math.abs(yoy)}% YoY</b></span>}>
        <ResponsiveContainer width="100%" height={180}><BarChart data={qData} margin={{ top: 16, left: -16, right: 4, bottom: 0 }}>{grad(`${id}q`)}
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip formatter={(v: number) => `₹ ${fmt(v)}`} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="current" name={curL} fill={`url(#${id}q-0)`} radius={[3, 3, 0, 0]} maxBarSize={26}><LabelList dataKey="current" position="top" style={{ fontSize: 8, fill: "var(--primary)" }} /></Bar>
          <Bar dataKey="previous" name={prevL} fill={`url(#${id}q-3)`} radius={[3, 3, 0, 0]} maxBarSize={26}><LabelList dataKey="previous" position="top" style={{ fontSize: 8, fill: "var(--muted-foreground)" }} /></Bar>
        </BarChart></ResponsiveContainer></Card>
    </div>

    <div className="grid grid-cols-1 gap-3">
      <Card title="Value by Main Group" sub="₹ Cr">{mainG.groups.length ? <OrderBookSubGroupChart groups={mainG.groups} divisions={mainG.divisions} groupLabel="Main Group" /> : <p className="py-8 text-center text-xs text-muted-foreground">No data</p>}</Card>
    </div>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {subGs.map(([label, g]) => <Card key={label} title={`Value by ${label}`} sub="₹ Cr">{g.groups.length ? <OrderBookSubGroupChart groups={g.groups} divisions={g.divisions} groupLabel={label} /> : <p className="py-8 text-center text-xs text-muted-foreground">No data</p>}</Card>)}
    </div>

    <div className="grid grid-cols-1 gap-3">
      <Card title="Plant Analytics" sub={<span className="inline-flex items-center gap-1"><Factory className="size-3" />Top 10</span>}>
        <Columns data={plants.map((p) => ({ name: plantInfo.get(p.code)?.sh || p.code, value: p.value }))} height={170} />
        <table className="w-full text-[10px]"><thead className="bg-primary/5 text-primary"><tr><th className="px-1.5 py-1 text-left">Plant Code</th><th className="px-1.5 py-1 text-left">Plant Name</th><th className="px-1.5 py-1 text-left">Short Name</th><th className="px-1.5 py-1 text-right">Amount</th></tr></thead>
          <tbody>{plants.map((r, i) => <tr key={r.code} className="border-t border-border/60"><td className="px-1.5 py-0.5 font-medium text-primary"><span className="mr-1 inline-block size-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />{r.code}</td><td className="truncate px-1.5 py-0.5">{plantInfo.get(r.code)?.full || "-"}</td><td className="px-1.5 py-0.5">{plantInfo.get(r.code)?.sh || "-"}</td><td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(r.value)}</td></tr>)}</tbody>
          <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td className="px-1.5 py-1" colSpan={3}>Total</td><td className="px-1.5 py-1 text-right tabular-nums">{fmt(sumValues(plants))}</td></tr></tfoot></table></Card>
    </div>
    <DetailsTable rows={filtered} />
  </div>;
}

function DetailsTable({ rows }: { rows: PurchaseRow[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const s = q.toLowerCase();
  const list = useMemo(() => [...rows].filter((r) => !s || [r.docNo, r.grNo, r.vendorName, r.vendor, r.material, r.materialName, r.plant, r.mainGroup, r.subGroup, r.subGroup2, r.subGroup3].some((v) => (v ?? "").toLowerCase().includes(s))).sort((a, b) => b.date.localeCompare(a.date)), [rows, s]);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const p = Math.min(page, pages - 1);
  const dmy = (d: string) => d ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : "";
  const excel = async () => {
    const { Workbook } = await import("exceljs");
    const wb = new Workbook(); const sh = wb.addWorksheet("Purchase Register");
    const h = sh.addRow(["#", "Posting Date", "Document No", "GR No", "Type", "Plant", "Profit Center", "Vendor", "Material", "Material Name", "Material Group", "Main Group", "Sub Group 1", "Sub Group 2", "Sub Group 3", "Amount"]);
    h.font = { bold: true, color: { argb: "FFFFFFFF" } }; h.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A6ED1" } }; });
    list.forEach((r, i) => sh.addRow([i + 1, dmy(r.date), r.docNo, r.grNo, r.type, `${r.plant} ${r.plantName}`.trim(), r.profitCenter, `${r.vendor} ${r.vendorName}`.trim(), r.material, r.materialName, r.group, r.mainGroup, r.subGroup, r.subGroup2, r.subGroup3, Number(r.value.toFixed(4))]));
    sh.columns.forEach((c) => { c.width = 20; });
    const url = URL.createObjectURL(new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a"); a.href = url; a.download = datedFileName("Purchase Register", "xlsx"); a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const heads = ["#", "Posting Date", "Document No", "GR No", "Type", "Plant", "Profit Center", "Vendor", "Material", "Material Group", "Main Group", "Sub Group 1", "Sub Group 2", "Sub Group 3", "Amount"];
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
        <td className="whitespace-nowrap px-2 py-1">{r.vendorName}</td><td className="min-w-48 px-2 py-1">{r.materialName}</td><td className="px-2 py-1">{r.group}</td><td className="whitespace-nowrap px-2 py-1">{r.mainGroup}</td><td className="whitespace-nowrap px-2 py-1">{r.subGroup}</td><td className="whitespace-nowrap px-2 py-1">{r.subGroup2}</td><td className="whitespace-nowrap px-2 py-1">{r.subGroup3}</td>
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

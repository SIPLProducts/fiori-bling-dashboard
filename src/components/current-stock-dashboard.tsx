import { useMemo, useState } from "react";
import { ArrowLeftRight, ChevronDown, IndianRupee, Lock, PackageCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { TINTS } from "@/lib/card-tints";
import { Card, Donut, PlantColumns } from "@/components/open-po-dashboard";
import { datedFileName } from "@/lib/format";
import { radiantBar } from "@/lib/radiant";
import { groupValue, rowValue, STOCK_CATEGORIES, stockTotals, type CurrentStockRow } from "@/lib/current-stock-data";

const CR = 1e7;
const cr = (v: number) => (v / CR).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const sel = "h-8 w-full rounded-md border border-border bg-background px-2 text-xs";
const PAGE = 15;
const numCols = (r: CurrentStockRow) => [r.price, r.unrQ, r.unrV, r.qcQ, r.qcV, r.restrQ, r.restrV, r.blkQ, r.blkV, r.retQ, r.retV, r.trfQ, r.trfV];
const EMPTY = { plant: null, sloc: null, mtype: null, material: null };
const ok = (sel: string[] | null, v: string) => !sel || sel.includes(v);

function Bars({ data, fmt = cr }: { data: { name: string; value: number }[]; fmt?: (v: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 0) || 1;
  return <ul className="space-y-1.5">{data.length ? null : <li className="text-[11px] text-muted-foreground">No stock in this view</li>}{data.map((d, i) => <li key={d.name} className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-2 text-[11px]">
    <span className="truncate font-semibold" title={d.name}>{d.name}</span>
    <span className="h-3.5 rounded-full bg-background/60"><span className="block h-full rounded-full" style={{ width: `${Math.max((d.value / max) * 100, 3)}%`, background: radiantBar(i) }} /></span>
    <span className="font-bold tabular-nums">{fmt(d.value)}</span></li>)}</ul>;
}

const NONFREE = [{ key: "qcV", label: "QC", tone: "#7b4fd6" }, { key: "blkV", label: "Blocked", tone: "#d64550" }, { key: "trfV", label: "Transfer", tone: "#1f6fd1" }] as const;
type NF = { name: string; qcV: number; blkV: number; trfV: number; value: number };
function StackBars({ data }: { data: NF[] }) {
  const max = Math.max(...data.map((d) => d.value), 0) || 1;
  return <div className="space-y-1.5">
    <div className="flex flex-wrap gap-3 text-[10px] font-semibold">{NONFREE.map((c) => <span key={c.key} className="flex items-center gap-1"><span className="size-2.5 rounded-sm" style={{ background: c.tone }} />{c.label}</span>)}</div>
    {data.length ? null : <p className="text-[11px] text-muted-foreground">No stock in this view</p>}
    {data.map((d) => <div key={d.name} className="text-[11px]">
      <div className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-2">
        <span className="truncate font-semibold" title={d.name}>{d.name}</span>
        <span className="flex h-3.5 overflow-hidden rounded-full bg-background/60"><span className="flex h-full" style={{ width: `${Math.max((d.value / max) * 100, 3)}%` }}>{NONFREE.map((c) => d[c.key] > 0 ? <span key={c.key} title={`${c.label}: ${cr(d[c.key])} Cr`} style={{ width: `${(d[c.key] / d.value) * 100}%`, background: c.tone }} /> : null)}</span></span>
        <span className="font-bold tabular-nums">{cr(d.value)}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 pl-1 text-[10px] text-muted-foreground tabular-nums">{NONFREE.map((c) => <span key={c.key}><span style={{ color: c.tone }} className="font-semibold">{c.label}</span> {cr(d[c.key])}</span>)}</div>
    </div>)}
  </div>;
}

export function CurrentStockDashboard({ rows, sample = false }: { rows: CurrentStockRow[]; sample?: boolean }) {
  const [f, setF] = useState<Record<"plant" | "sloc" | "mtype" | "material", string[] | null>>(EMPTY);
  const [open, setOpen] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const opts = useMemo(() => ({
    plant: [...new Set(rows.map((r) => r.plant))].sort(),
    sloc: [...new Map(rows.map((r) => [r.sloc, `${r.sloc} — ${r.slocDesc}`]))].sort(),
    mtype: [...new Set(rows.map((r) => r.mtype))].sort(),
    material: [...new Map(rows.map((r) => [r.material, `${r.material} — ${r.matDesc}`]))].sort(),
  }), [rows]);
  const data = useMemo(() => rows.filter((r) => ok(f.plant, r.plant) && ok(f.sloc, r.sloc) && ok(f.mtype, r.mtype) && ok(f.material, r.material)), [rows, f]);
  const t = stockTotals(data);
  const mtypes = groupValue(data, (r) => r.mtype);
  const cats = STOCK_CATEGORIES.map((c) => ({ name: c.label, value: data.reduce((a, r) => a + r[c.key], 0) })).filter((c) => c.value > 0);
  const plants = groupValue(data, (r) => r.plant).slice(0, 15).map((d) => ({ ...d, value: d.value / CR }));
  const slocs = groupValue(data, (r) => `${r.sloc} ${r.slocDesc}`).slice(0, 10);
  const mats = groupValue(data, (r) => r.matDesc).slice(0, 10);
  const unrQty = groupValue(data, (r) => `${r.matDesc} (${r.uom})`, (r) => r.unrQ).slice(0, 10);
  const nonFree = [...data.reduce((m, r) => { const e = m.get(r.matDesc) ?? { name: r.matDesc, qcV: 0, blkV: 0, trfV: 0, value: 0 }; e.qcV += r.qcV; e.blkV += r.blkV; e.trfV += r.trfV; e.value = e.qcV + e.blkV + e.trfV; m.set(r.matDesc, e); return m; }, new Map<string, NF>()).values()].filter((d) => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);
  const prices = [...new Map(data.filter((r) => r.price > 0).map((r) => [r.material, { name: `${r.matDesc} / ${r.uom}`, value: r.price }])).values()].sort((a, b) => b.value - a.value).slice(0, 10);
  const table = data.filter((r) => !q || `${r.plant} ${r.sloc} ${r.slocDesc} ${r.material} ${r.matDesc} ${r.batch} ${r.bin}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => rowValue(b) - rowValue(a));
  const totals = table.reduce((acc, r) => { numCols(r).forEach((v, j) => { acc[j] = (acc[j] ?? 0) + v; }); return acc; }, Array<number>(13).fill(0));
  const pages = Math.max(1, Math.ceil(table.length / PAGE));
  const exportXlsx = async () => {
    const { Workbook } = await import("exceljs");
    const wb = new Workbook(); const ws = wb.addWorksheet("Current Stock");
    ws.addRow(["Plant", "St.Locn", "Location Desc", "Mat.type", "Material", "Description", "Batch", "UOM", "Mat.price", "Unrestr.stk (Q)", "Unrestr.stk (V)", "Stk in QC (Q)", "Stk in QC (V)", "Restr.batch stk (Q)", "Restr.batch stk (V)", "Block.Stk (Q)", "Block.Stk (V)", "Blk stk ret(Q)", "Blk stk ret (V)", "Transfer (Q)", "Transfer (V)", "Row / Shelf / Rack / Bin"]).font = { bold: true };
    const x = (vals: number[]) => vals.map((v, j) => j % 2 === 0 ? Math.round((v / CR) * 100) / 100 : v);
    table.forEach((r) => ws.addRow([r.plant, r.sloc, r.slocDesc, r.mtype, r.material, r.matDesc, r.batch, r.uom, ...x(numCols(r)), r.bin]));
    ws.addRow(["Total", "", "", "", "", "", "", "", ...x(totals), ""]).font = { bold: true };
    const blob = new Blob([await wb.xlsx.writeBuffer()]); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = datedFileName("Current Stock", "xlsx"); a.click(); URL.revokeObjectURL(a.href);
  };
  const field = (k: keyof typeof f, label: string, list: (string | [string, string])[]) => <FilterMultiSelect label={label} placeholder="All" selected={f[k]} options={list.map((o) => Array.isArray(o) ? { value: o[0], label: o[1] } : { value: o, label: o })} onChange={(v) => { setF({ ...f, [k]: v.length === list.length ? null : v }); setPage(0); }} />;

  return <div className="space-y-3">
    <div data-pdf-exclude className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-card-foreground"><span>Filters</span><ChevronDown className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`} /></button>
      {open ? <div className="grid grid-cols-2 gap-2 px-3 pb-2 sm:grid-cols-3 lg:grid-cols-5">{field("plant", "Plant", opts.plant)}{field("sloc", "Storage Location", opts.sloc)}{field("mtype", "Material Type", opts.mtype)}{field("material", "Material", opts.material)}
        <div className="flex items-end"><Button type="button" variant="reset" size="sm" className="h-8 w-full text-xs" onClick={() => { setF(EMPTY); setPage(0); }}>Reset</Button></div></div> : null}
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {([
        ["Mat.price (V)", cr(data.reduce((a, r) => a + r.price, 0)), "#5c6bc0", IndianRupee],
        ["Unrestr.stk (Q)", inr(t.unrQ), "#0f9d8a", PackageCheck], ["Unrestr.stk (V)", cr(t.unrV), "#0f9d8a", PackageCheck],
        ["Stk in QC (Q)", inr(t.qcQ), "#7b4fd6", ShieldAlert], ["Stk in QC (V)", cr(t.qcV), "#7b4fd6", ShieldAlert],
        ["Restr.batch stk (Q)", inr(t.restrQ), "#c06a12", ArrowLeftRight], ["Restr.batch stk (V)", cr(t.restrV), "#c06a12", ArrowLeftRight],
        ["Block.Stk (Q)", inr(t.blkQ), "#d64550", Lock], ["Block.Stk (V)", cr(t.blkV), "#d64550", Lock],
        ["Blk stk ret(Q)", inr(t.retQ), "#1f6fd1", IndianRupee], ["Blk stk ret (V)", cr(t.retV), "#1f6fd1", IndianRupee],
      ] as const).map(([label, value, tone, Icon]) => <div key={label} className="min-w-0 rounded-xl px-2.5 py-2 text-primary-foreground shadow-md" style={{ background: `linear-gradient(135deg, ${tone}cc, ${tone})` }}>
        <p className="flex items-center gap-1 text-[10px] font-semibold opacity-95"><Icon className="size-3 shrink-0" />{label}</p>
        <p title={value} className="mt-1 truncate text-sm font-bold tabular-nums leading-tight sm:text-base">{value}</p></div>)}
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card title="Value by Mat Type" tint="sky"><Donut data={mtypes.map((c) => ({ ...c, value: c.value }))} heads={["Mat Type", "Val", "%"]} /></Card>
      <Card title="Stock Status" tint="peach"><Donut data={cats.map((c) => ({ ...c, value: c.value }))} heads={["Status", "Val", "%"]} /></Card>
      <Card title="Top 10 Materials" tint="steel"><Bars data={mats} /></Card>
      <Card title="Top Storage Locations" tint="rose"><Bars data={slocs} /></Card>
    </div>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <Card title="Top Unrestr. Stk (Q)" sub="Quantity" tint="teal"><Bars data={unrQty} fmt={inr} /></Card>
      <Card title="Highest Mat Price" sub="Val in Cr" tint="violet"><Bars data={prices} /></Card>
      <Card title="QC / Blocked / Transfer" sub="Val in Cr" tint="amber"><StackBars data={nonFree} /></Card>
    </div>
    <Card title="Plant Analytics (Top 15)" sub="Val in Cr" tint="copper"><PlantColumns data={plants} /></Card>
    <div data-pdf-exclude><Card title="Stock Details" sub="Val in Cr" tint="neutral">
      <div className="mb-2 flex flex-wrap items-center gap-2"><input className="h-8 w-60 rounded-md border border-border bg-background px-2 text-xs" placeholder="Search plant, location, material…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} /><Button size="sm" variant="outline" onClick={exportXlsx}>Excel</Button><span className="text-[11px] text-muted-foreground">{table.length} lines</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1400px] text-[11px]"><thead><tr className="border-b text-left">{["Plant", "St.Locn", "Material", "Description", "Batch", "UOM", "Mat Price", "Unrestr.stk (Q)", "Unrestr.stk (V)", "Stk in QC (Q)", "Stk in QC (V)", "Restr.batch stk (Q)", "Restr.batch stk (V)", "Block.Stk (Q)", "Block.Stk (V)", "Blk stk ret(Q)", "Blk stk ret (V)", "Transfer (Q)", "Transfer (V)", "Bin"].map((h) => <th key={h} className="px-2 py-1.5 font-bold">{h}</th>)}</tr></thead>
        <tbody>{table.slice(page * PAGE, page * PAGE + PAGE).map((r, i) => <tr key={i} className="border-b border-border/50"><td className="px-2 py-1">{r.plant}</td><td className="px-2 py-1" title={r.slocDesc}>{r.sloc}</td><td className="px-2 py-1">{r.material}</td><td className="px-2 py-1">{r.matDesc}</td><td className="px-2 py-1">{r.batch}</td><td className="px-2 py-1">{r.uom}</td>{numCols(r).map((v, j) => <td key={j} className="px-2 py-1 text-right tabular-nums">{j % 2 === 0 ? cr(v) : inr(v)}</td>)}<td className="px-2 py-1">{r.bin}</td></tr>)}</tbody><tfoot><tr className="border-t-2 border-border font-bold"><td className="px-2 py-1.5" colSpan={6}>Total ({table.length} lines)</td>{totals.map((v, j) => <td key={j} className="px-2 py-1.5 text-right tabular-nums">{j % 2 === 0 ? cr(v) : inr(v)}</td>)}<td /></tr></tfoot></table></div>
      <div className="mt-2 flex items-center gap-2 text-[11px]"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button><span>Page {page + 1} / {pages}</span><Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button></div>
    </Card></div>
  </div>;
}

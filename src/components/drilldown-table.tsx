import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { downloadCsv } from "@/lib/chart-export";
import type { SalesLine } from "@/lib/zfisales-types";

function fmt(value: number) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

type Props = {
  /** Posting-level rows for the current selection. */
  rows: SalesLine[];
  /** Column header for the aggregation level (e.g. "Month", "Segment"). */
  groupLabel: string;
  /** Returns the group key for a posting-level row. */
  groupBy: (row: SalesLine) => string;
  /** Optional display label for a group key. */
  labelFor?: (key: string) => string;
  /** Optional second grouping level shown as a sub-column. */
  splitBy?: (row: SalesLine) => string;
  splitLabel?: string;
};

type Group = {
  key: string;
  split: string;
  revenue: number;
  documents: number;
  rows: SalesLine[];
};

const ALL = "__all__";

export function DrilldownTable({ rows, groupLabel, groupBy, labelFor, splitBy, splitLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [salesType, setSalesType] = useState(ALL);
  const [companyCode, setCompanyCode] = useState(ALL);
  const [profitCtr, setProfitCtr] = useState(ALL);

  const options = useMemo(() => {
    const uniq = (vals: string[]) => [...new Set(vals.filter(Boolean))].sort();
    return {
      salesTypes: uniq(rows.map((r) => r.salesType)),
      companies: uniq(rows.map((r) => r.companyCode)),
      profitCentres: uniq(rows.map((r) => r.profitCtr)),
    };
  }, [rows]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (from && r.postingDate < from) return false;
        if (to && r.postingDate > to) return false;
        if (salesType !== ALL && r.salesType !== salesType) return false;
        if (companyCode !== ALL && r.companyCode !== companyCode) return false;
        if (profitCtr !== ALL && r.profitCtr !== profitCtr) return false;
        return true;
      }),
    [rows, from, to, salesType, companyCode, profitCtr],
  );

  const invalidRange = Boolean(from && to && from > to);
  const activeCount =
    (from ? 1 : 0) + (to ? 1 : 0) + [salesType, companyCode, profitCtr].filter((v) => v !== ALL).length;

  const resetFilters = () => {
    setFrom("");
    setTo("");
    setSalesType(ALL);
    setCompanyCode(ALL);
    setProfitCtr(ALL);
  };

  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const row of invalidRange ? [] : filtered) {
      const key = groupBy(row);
      const split = splitBy ? splitBy(row) : "";
      const id = `${key}||${split}`;
      let g = map.get(id);
      if (!g) {
        g = { key, split, revenue: 0, documents: 0, rows: [] };
        map.set(id, g);
      }
      g.revenue += row.amount;
      g.rows.push(row);
    }
    for (const g of map.values()) {
      g.documents = new Set(g.rows.map((r) => r.docNo)).size;
    }
    return [...map.values()].sort((a, b) =>
      a.key === b.key ? b.revenue - a.revenue : a.key.localeCompare(b.key),
    );
  }, [filtered, invalidRange, groupBy, splitBy]);

  const toggle = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectCls =
    "h-7 rounded-sm border border-input bg-background px-1.5 text-xs text-foreground";

  const exportRows = () => {
    const data = (invalidRange ? [] : filtered).map((r) => ({
      [groupLabel]: labelFor ? labelFor(groupBy(r)) : groupBy(r),
      ...(splitBy ? { [splitLabel ?? "Split"]: splitBy(r) } : {}),
      "Posting date": r.postingDate,
      "Document": r.docNo,
      "Doc type": r.docType,
      "Company code": r.companyCode,
      "Company": r.companyName,
      "Profit centre": r.profitCtr,
      "Profit centre name": r.profitCtrName,
      "Sales type": r.salesType,
      "Segment": r.segment,
      "Customer": r.customer,
      "Customer name": r.customerName,
      "Fiscal year": r.fiscalYear,
      "Amount (LC)": r.amount,
    }));
    const slug = groupLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCsv(data, `drilldown-${slug}-${new Date().toISOString().slice(0, 10)}.csv`);
  };


  return (
    <div className="mt-3 border-t border-border pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        aria-expanded={open}
      >
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        Drill-down · {groups.length} {groupLabel.toLowerCase()} groups · {filtered.length} line items
        {activeCount > 0 ? ` · ${activeCount} filter${activeCount > 1 ? "s" : ""}` : ""}
      </button>

      {open ? (
        <>
          <div className="mt-2 flex flex-wrap items-end gap-2 rounded-sm border border-border bg-muted/30 p-2">
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              Posting from
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls} />
            </label>
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              Posting to
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={selectCls} />
            </label>
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              Sales type
              <select value={salesType} onChange={(e) => setSalesType(e.target.value)} className={selectCls}>
                <option value={ALL}>All</option>
                {options.salesTypes.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              Company code
              <select value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} className={selectCls}>
                <option value={ALL}>All</option>
                {options.companies.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              Profit centre
              <select value={profitCtr} onChange={(e) => setProfitCtr(e.target.value)} className={selectCls}>
                <option value={ALL}>All</option>
                {options.profitCentres.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={resetFilters}
              disabled={activeCount === 0}
              className="h-7 rounded-sm border border-border px-2 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={exportRows}
              disabled={invalidRange || filtered.length === 0}
              title="Download the filtered drill-down rows as CSV"
              className="inline-flex h-7 items-center gap-1 rounded-sm border border-border px-2 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              <Download className="size-3" />
              Export CSV ({filtered.length})
            </button>
            {invalidRange ? (
              <p className="w-full text-[11px] text-destructive">Posting from must be on or before posting to.</p>
            ) : null}
          </div>
          <div className="mt-2 max-h-72 overflow-auto rounded-sm border border-border">
          <table className="w-full text-xs">

            <thead className="sticky top-0 bg-muted/60">
              <tr className="text-left text-muted-foreground">
                <th className="px-2 py-1.5 font-medium">{groupLabel}</th>
                {splitBy ? <th className="px-2 py-1.5 font-medium">{splitLabel ?? "Split"}</th> : null}
                <th className="px-2 py-1.5 text-right font-medium">Documents</th>
                <th className="px-2 py-1.5 text-right font-medium">Revenue (LC)</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const id = `${g.key}||${g.split}`;
                const isOpen = expanded.includes(id);
                return (
                  <Fragment key={id}>
                    <tr
                      className="cursor-pointer border-t border-border/60 hover:bg-muted/40"
                      onClick={() => toggle(id)}
                    >
                      <td className="px-2 py-1.5">
                        <span className="inline-flex items-center gap-1">
                          {isOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                          {labelFor ? labelFor(g.key) : g.key}
                        </span>
                      </td>
                      {splitBy ? <td className="px-2 py-1.5">{g.split}</td> : null}
                      <td className="px-2 py-1.5 text-right tabular">{g.documents}</td>
                      <td className="px-2 py-1.5 text-right tabular">{fmt(g.revenue)}</td>
                    </tr>
                    {isOpen
                      ? g.rows.map((row, i) => (
                          <tr key={`${id}-${row.docNo}-${i}`} className="border-t border-border/40 bg-muted/20">
                            <td className="px-2 py-1 pl-6" colSpan={splitBy ? 2 : 1}>
                              <span className="tabular">{row.postingDate}</span>
                              <span className="ml-2 text-muted-foreground">
                                {row.docNo} · {row.customerName || row.customer} · {row.profitCtr} · {row.salesType}
                              </span>
                            </td>
                            <td className="px-2 py-1 text-right text-muted-foreground">{row.docType}</td>
                            <td className="px-2 py-1 text-right tabular">{fmt(row.amount)}</td>
                          </tr>
                        ))
                      : null}
                  </Fragment>
                );
              })}
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-muted-foreground">
                    No rows for this selection.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

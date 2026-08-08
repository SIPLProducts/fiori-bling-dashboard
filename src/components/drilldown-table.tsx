import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
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

export function DrilldownTable({ rows, groupLabel, groupBy, labelFor, splitBy, splitLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);

  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const row of rows) {
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
  }, [rows, groupBy, splitBy]);

  const toggle = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="mt-3 border-t border-border pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        aria-expanded={open}
      >
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        Drill-down · {groups.length} {groupLabel.toLowerCase()} groups · {rows.length} line items
      </button>

      {open ? (
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
      ) : null}
    </div>
  );
}

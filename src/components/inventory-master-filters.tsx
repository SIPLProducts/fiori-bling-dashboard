import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { Button } from "@/components/ui/button";
import { buildMasterOptions, masterRowsByNameQuery } from "@/lib/sap-master";

/** Filter fields and the SAP MASTER sheet/column each dropdown reads. */
export const INVENTORY_FILTER_FIELDS = [
  { key: "plant", label: "Plant", sheet: "Sheet1", column: "Plnt" },
  { key: "location", label: "Location", sheet: "Sheet1", column: "Location" },
  { key: "material", label: "Material", sheet: "Sheet1", column: "Material", desc: "Material Description" },
  { key: "profitCenter", label: "Profit Center", sheet: "Sheet1", column: "Profit Center" },
  { key: "mtyp", label: "Material Type", sheet: "Sheet1", column: "MTyp" },
  { key: "valcl", label: "Valuation Class", sheet: "Sheet1", column: "ValCl" },
  { key: "valType", label: "Valuation Type", sheet: "Sheet1", column: "Val. Type" },
  { key: "gl", label: "G/L Account", sheet: "Sheet1", column: "G/L Acct", desc: "GL Description" },
  { key: "mainGroup", label: "Main Group", sheet: "Data", column: "MNGRP1" },
  { key: "sub1", label: "Sub Group 1", sheet: "Data", column: "PCGRP1" },
  { key: "sub2", label: "Sub Group 2", sheet: "Data", column: "PCGRP2" },
  { key: "sub3", label: "Sub Group 3", sheet: "Data", column: "PCGRP3" },
] as const;

export type InventoryFilters = Record<string, string[] | null>;

export function InventoryMasterFilters({ value, onChange }: { value: InventoryFilters; onChange: (v: InventoryFilters) => void }) {
  const qc = useQueryClient();
  const sheet1 = useQuery(masterRowsByNameQuery("Sheet1"));
  const dataSheet = useQuery(masterRowsByNameQuery("Data"));
  const rowsFor = (s: string) => (s === "Data" ? dataSheet.data : sheet1.data) ?? [];
  return <section className="mb-4 rounded-xl border border-border bg-card p-4">
    <div className="mb-2 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold">Filters</h2>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["sap-master-rows", "by-name"] })}>Refresh</Button>
        <Button size="sm" variant="outline" onClick={() => onChange({})}>Reset</Button>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {INVENTORY_FILTER_FIELDS.map((f) => {
        const opts = buildMasterOptions(rowsFor(f.sheet), f.column, "desc" in f ? f.desc : undefined);
        if (!opts.length) return <div key={f.key} className="space-y-1"><span className="flex h-8 items-center text-[10px] font-medium text-muted-foreground">{f.label}</span><div className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">{sheet1.isLoading || dataSheet.isLoading ? "Loading…" : "No values — upload in SAP MASTER"}</div></div>;
        return <FilterMultiSelect key={f.key} label={f.label} placeholder="All" options={opts} selected={value[f.key] ?? null} onChange={(v) => onChange({ ...value, [f.key]: v.length === opts.length ? null : v })} />;
      })}
    </div>
  </section>;
}

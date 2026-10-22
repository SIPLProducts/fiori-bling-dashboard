import { useState } from "react";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { FilterField, FilterMultiSelect } from "@/components/filter-multi-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserAccess } from "@/lib/use-user-access";
import { restrictToAssigned } from "@/lib/user-access";
import {
  emptySalesRegisterFilters, salesRegisterOptions,
  type SalesRegisterCodeKey, type SalesRegisterDateRange, type SalesRegisterFilterState, type SalesRegisterRow,
} from "@/lib/sales-register";

const FIELDS: ReadonlyArray<readonly [string, string]> = [
  ["distributionChannel", "Distribution Channel"],
  ["division", "Division"],
  ["plant", "Plant"],
  ["billingType", "Billing Type"],
  ["billingDate", "Billing Document Date"],
  ["billingDocument", "Billing Document"],
  ["billingCreationDate", "Billing Creation Date"],
  ["salesDocument", "Sales Document"],
  ["salesDocumentItem", "Sales Document Item"],
  ["customer", "Customer"],
  ["salesOffice", "Sales Office"],
  ["material", "Material code"],
  ["profitCenter", "Profit Center"],
];
const DATE_KEYS = new Set(["billingDate", "billingCreationDate"]);

export function SalesRegisterFilters({ defaultOpen = true, rows, value, onChange }: {
  defaultOpen?: boolean; rows: SalesRegisterRow[]; value: SalesRegisterFilterState; onChange: (v: SalesRegisterFilterState) => void;
}) {
  const access = useUserAccess();
  const [open, setOpen] = useState(defaultOpen);
  const optionsFor = (key: SalesRegisterCodeKey): string[] => {
    const all = salesRegisterOptions(rows, key);
    if (key === "plant") return restrictToAssigned(all, access?.plants, access?.unrestricted, (o) => o);
    if (key === "profitCenter") return restrictToAssigned(all, access?.profitCenters, access?.unrestricted, (o) => o);
    return all;
  };
  const active = Object.values(value.codes).filter((v) => v !== null && v !== undefined).length
    + Object.values(value.dates).filter((d) => d && (d.from || d.to)).length;

  return <section className="rounded-xl border border-border bg-card shadow-sm">
    <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 text-xs font-semibold text-foreground" aria-expanded={open}>
        <SlidersHorizontal className="size-4 text-primary" />Smart Filters
        {active ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{active} active</span> : null}
        <ChevronDown className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange(emptySalesRegisterFilters)}><RotateCcw className="size-3.5" />Reset</Button>
    </div>
    {open ? <div className="grid grid-cols-1 gap-x-3 gap-y-2 p-3 sm:grid-cols-2 md:grid-cols-4">
      {FIELDS.map(([key, label]) => {
        if (DATE_KEYS.has(key)) {
          const dk = key as keyof SalesRegisterFilterState["dates"];
          const d = value.dates[dk] ?? { mode: "range", from: "", to: "" };
          const set = (next: Partial<SalesRegisterDateRange>) => onChange({ ...value, dates: { ...value.dates, [dk]: { ...d, ...next } } });
          return <FilterField key={key} label={label}>
            <div className="flex gap-1">
              <select aria-label={`${label} mode`} value={d.mode} onChange={(e) => set({ mode: e.target.value as SalesRegisterDateRange["mode"], to: "" })} className="h-9 rounded-sm border border-input bg-background px-1 text-xs">
                <option value="single">Single</option><option value="range">From–To</option>
              </select>
              <Input type="date" aria-label={`${label} from`} value={d.from} onChange={(e) => set({ from: e.target.value })} className="h-9 min-w-0 px-1 text-xs" />
              {d.mode === "range" ? <Input type="date" aria-label={`${label} to`} value={d.to} onChange={(e) => set({ to: e.target.value })} className="h-9 min-w-0 px-1 text-xs" /> : null}
            </div>
          </FilterField>;
        }
        const ck = key as SalesRegisterCodeKey;
        return <FilterMultiSelect key={key} label={label} placeholder="All" options={optionsFor(ck)} selected={value.codes[ck] ?? null} onChange={(v) => onChange({ ...value, codes: { ...value.codes, [ck]: v } })} />;
      })}
    </div> : null}
  </section>;
}

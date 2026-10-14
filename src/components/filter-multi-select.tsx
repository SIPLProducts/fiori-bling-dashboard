import type { ReactNode } from "react";
import { MultiSelect, type MultiSelectOption } from "@/components/multi-select";

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0 space-y-1"><span className="flex h-8 items-center text-[10px] font-medium text-muted-foreground">{label}</span>{children}</label>;
}

export function FilterMultiSelect({ label, selected, options, onChange }: { label: string; selected: string[] | null; options: string[] | MultiSelectOption[]; onChange: (value: string[]) => void; placeholder: string }) {
  const choices = options.map((option) => typeof option === "string" ? { value: option, label: option } : option);
  return <FilterField label={label}><MultiSelect bulkActions options={choices} selected={selected ?? choices.map((option) => option.value)} onChange={onChange} placeholder="No values selected" /></FilterField>;
}

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type MultiSelectOption = { value: string; label: string };

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "All",
  emptyText = "No values available",
  disabled = false,
  bulkActions = false,
}: {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  bulkActions?: boolean;
}) {
  const [search, setSearch] = useState("");
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const visibleOptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      option.label.toLocaleLowerCase().includes(query)
      || option.value.toLocaleLowerCase().includes(query),
    );
  }, [options, search]);

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? selected[0])
        : `${selected.length} selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="h-9 w-full justify-between rounded-sm px-2 text-sm font-normal"
        >
          <span className={`truncate ${selected.length ? "" : "text-muted-foreground"}`}>{label}</span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="pointer-events-auto w-64 p-1">
        <div className="relative mb-1 border-b border-border p-1 pb-2">
          <Search className="pointer-events-none absolute left-3 top-3 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search values"
            aria-label="Search dropdown values"
            className="h-8 pl-8 text-sm"
          />
        </div>
        {bulkActions ? <div className="mb-1 grid grid-cols-2 gap-1 border-b border-border pb-1">
          <Button type="button" variant="ghost" size="sm" disabled={!options.length} onClick={() => onChange(options.map((option) => option.value))}>Select All</Button>
          <Button type="button" variant="ghost" size="sm" disabled={!selected.length} onClick={() => onChange([])}>Deselect All</Button>
        </div> : null}
        <div className="max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">{emptyText}</p>
          ) : visibleOptions.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">No matching values</p>
          ) : (
            visibleOptions.map((option) => {
              const active = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded-[3px] border ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-input"
                    }`}
                  >
                    {active ? <Check className="size-3" /> : null}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
        {!bulkActions && selected.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-1 w-full border-t border-border px-2 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

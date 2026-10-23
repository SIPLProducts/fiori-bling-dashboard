import { useMemo, useState } from "react";
import { Panel } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
import { ModelWiseChart, SalesByModelChart, type ModelLimit } from "@/components/sd-live-dashboard";
import { limitTypePerformance } from "@/lib/sd-live";
import { rankModels, rankTypes, type ModelInput } from "@/lib/model-performance";

function Toggle({ value, onChange, noun }: { value: ModelLimit; onChange: (v: ModelLimit) => void; noun: string }) {
  return <div className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted/50 p-0.5">
    {([10, 20, "all"] as const).map((v) => <Button key={v} type="button" variant={value === v ? "default" : "ghost"} size="sm" className="h-7 px-2 text-[11px]" onClick={() => onChange(v)}>
      {v === "all" ? `All ${noun}s` : `Top ${v} ${noun}s`}</Button>)}
  </div>;
}

/** "Sales by Model" + "Model Wise Type" cards, same look as Net Sales. */
export function ModelTypeCards({ rows }: { rows: ModelInput[] }) {
  const models = useMemo(() => rankModels(rows), [rows]);
  const types = useMemo(() => rankTypes(rows), [rows]);
  const [ml, setMl] = useState<ModelLimit>(10);
  const [tl, setTl] = useState<ModelLimit>(10);
  return <div data-pdf-page-block className="grid grid-cols-1 gap-3 lg:grid-cols-2">
    <Panel title="Sales by Model" className="min-w-0" expandable actions={<Toggle value={ml} onChange={setMl} noun="Model" />}>
      {(full: boolean) => <SalesByModelChart items={models} limit={ml} full={full} />}
    </Panel>
    <Panel title="Model Wise Type" className="min-w-0" expandable actions={<Toggle value={tl} onChange={setTl} noun="Type" />}>
      {() => <ModelWiseChart items={limitTypePerformance(types, tl)} />}
    </Panel>
  </div>;
}

import { useState } from "react";
import { Download, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadCsv, exportChartPng } from "@/lib/chart-export";

export function ChartExportActions({
  rows,
  columns,
  filename,
  containerRef,
}: {
  rows: Array<Record<string, unknown>>;
  columns?: string[];
  filename: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-xs"
        onClick={() => {
          if (!rows.length) {
            toast.error("No data to export");
            return;
          }
          downloadCsv(rows, `${filename}.csv`, columns);
          toast.success("CSV downloaded");
        }}
      >
        <Download className="size-3.5" aria-hidden="true" />
        CSV
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        className="h-7 gap-1 px-2 text-xs"
        onClick={async () => {
          setBusy(true);
          try {
            await exportChartPng(containerRef.current, `${filename}.png`);
            toast.success("Chart image downloaded");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Unable to export the chart");
          } finally {
            setBusy(false);
          }
        }}
      >
        <ImageIcon className="size-3.5" aria-hidden="true" />
        PNG
      </Button>
    </>
  );
}

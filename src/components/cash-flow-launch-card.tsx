import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Wallet } from "lucide-react";
import { cashFlowQueryOptions } from "@/lib/cash-flow-data";
import { CRORE, summarizeCashLaunch } from "@/lib/cash-flow";
import { lastSyncedLabel } from "@/lib/report-sync-time";

const fmt = (value: number) => `₹${(value / CRORE).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
const LABELS = { credit: "Credit", debit: "Debit", net: "Net" } as const;
const TONES = { credit: "oklch(0.59 0.07 157)", debit: "oklch(0.68 0.18 38)", net: "var(--kpi-1)" } as const;

/** Shares the Cash Flow screen's cached dataset, so it changes only after Refresh/Sync there. */
export function CashFlowLaunchCard({ fallback }: { fallback: React.ReactNode }) {
  const { data, isLoading } = useQuery(cashFlowQueryOptions());
  if (isLoading) return <div className="h-[188px] w-full animate-pulse rounded-2xl border border-border bg-launchpad-tile" />;
  if (!data?.rows.length) return <>{fallback}</>;
  const s = summarizeCashLaunch(data.rows);
  const netTone = s.net < 0 ? "var(--destructive)" : TONES.net;

  return (
    <section aria-label="Cash Flow summary" className="flex h-full min-h-[188px] flex-col overflow-hidden rounded-2xl border p-4 text-left shadow-launchpad-tile" style={{
      borderColor: "color-mix(in oklab, var(--kpi-2) 28%, var(--color-border))",
      background: "linear-gradient(160deg, color-mix(in oklab, var(--kpi-2) var(--kpi-tint), var(--color-launchpad-tile)) 0%, var(--color-launchpad-tile) 70%)",
    }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-primary uppercase">Cash Flow</p>
          <p className="mt-2 text-[26px] leading-none font-semibold tabular-nums" style={{ color: netTone }}>{fmt(s.net)}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary shadow-sm"><Wallet className="size-[18px]" /></span>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[9px] font-semibold text-primary">Net Balance</p>
        <p className="text-[9px] font-medium text-foreground tabular-nums">{s.records.toLocaleString("en-IN")} GL records · {s.plants.toLocaleString("en-IN")} plants</p>
      </div>
      <div className="my-3 space-y-2.5">
        {s.bars.map((bar) => {
          const tone = bar.key === "net" ? netTone : TONES[bar.key];
          return <div key={bar.key}>
            <div className="flex items-baseline justify-between gap-2 text-[9px] leading-snug">
              <span className="font-medium text-foreground">{LABELS[bar.key]}</span>
              <span className="font-semibold text-foreground tabular-nums">{fmt(bar.value)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${LABELS[bar.key]}: ${fmt(bar.value)}`}>
              <div className="h-full rounded-full" style={{ width: `${bar.share}%`, background: `linear-gradient(90deg, color-mix(in oklab, ${tone} 55%, var(--card)), ${tone})` }} />
            </div>
          </div>;
        })}
      </div>
      <div className="mt-auto grid grid-cols-1 min-[1100px]:grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[10px] text-muted-foreground">
        <span className="min-w-0 leading-relaxed">{lastSyncedLabel(data.syncedAt)}</span>
        <Link to="/reports/fi/cash-flow" aria-label="Open Cash Flow details" className="group inline-flex min-h-8 items-center gap-1 rounded-full bg-launchpad-tile-footer px-4 font-semibold text-primary shadow-launchpad-inset transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transform-none">
          View details
          <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

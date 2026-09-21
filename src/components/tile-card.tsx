import type { CSSProperties, KeyboardEvent } from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Banknote,
  Boxes,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
  CircleDollarSign,
  CircleGauge,
  Clock3,
  Factory,
  Gauge,
  PackageCheck,
  ReceiptText,
  ShoppingCart,
  TableProperties,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import type { TileRecord } from "@/lib/sap.functions";
import { NetSalesLaunchCard } from "@/components/net-sales-launch-card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type KpiValue = { value: number; unit?: string; footer?: string; trend?: number[] };

const ICONS = {
  sd_open_orders: ShoppingCart,
  fi_receivables: CircleDollarSign,
  fi_payables: Banknote,
  fi_dso: CalendarClock,
  fi_cash_trend: TrendingUp,
  pp_open_orders: Factory,
  pp_schedule_adherence: PackageCheck,
  pp_capacity_load: Gauge,
  pp_output_trend: ChartNoAxesCombined,
} as const;

const PLACEHOLDERS: Record<string, { label: string; value: string; note: string; icon: typeof Gauge }> = {
  fulfillment: { label: "Fulfillment Rate", value: "97.4%", note: "+2.3% from last month", icon: CircleGauge },
  billing: { label: "Billing Cleared", value: "8,412", note: "99.1% processed", icon: ReceiptText },
  kna1: { label: "KNA1", value: "12.8k", note: "Customer master", icon: UsersRound },
  mara: { label: "MARA", value: "45.2k", note: "Material master", icon: Boxes },
  lfa1: { label: "LFA1", value: "3.4k", note: "Vendor master", icon: Building2 },
  t001w: { label: "T001W", value: "28 units", note: "Plant master", icon: Factory },
};

function compact(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${26 - ((v - min) / range) * 22}`).join(" ");
  return <svg viewBox="0 0 100 30" className="mt-2 h-8 w-full" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.2" vectorEffect="non-scaling-stroke" /></svg>;
}

function CardSurface({ label, value, note, icon: Icon, trend, href, onOpen, accent = 2, status }: {
  label: string; value: string; note: string; icon: typeof Gauge; trend?: number[]; href?: string; onOpen?: () => void; accent?: number; status?: string;
}) {
  const style = { "--tile-accent": `var(--kpi-${accent})` } as CSSProperties;
  const content = (
    <div className="group flex h-full min-h-[188px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/80 bg-launchpad-tile p-4 text-left shadow-launchpad-tile transition-all duration-200 hover:-translate-y-1 hover:scale-[1.008] hover:shadow-tile-hover motion-reduce:transform-none" style={style}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="mt-2 text-[26px] leading-none font-semibold text-foreground">{value}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary shadow-sm"><Icon className="size-[18px]" /></span>
      </div>
      {trend?.length ? <div className="text-primary"><Sparkline values={trend} /></div> : <div className="h-8" />}
      <p className="mt-auto truncate text-[10px] text-muted-foreground">{note}</p>
      <div className="mt-3 flex min-h-8 items-center justify-between gap-2 rounded-full bg-launchpad-tile-footer px-3 text-[10px] shadow-launchpad-inset">
        <span className="truncate text-muted-foreground">{status ?? "View details"}</span>
        <ArrowRight className="size-3.5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
  if (href) return <Link to={href} className="block h-full rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">{content}</Link>;
  return <div role="button" tabIndex={0} aria-label={`Open ${label}`} className="h-full rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onClick={onOpen} onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen?.(); } }}>{content}</div>;
}

export function TileCard({ tile, kpi }: { tile: TileRecord; kpi?: KpiValue }) {
  if (tile.kind === "launch" && tile.target === "/reports/module/sd") return <NetSalesLaunchCard />;
  const Icon = ICONS[tile.kpi_key as keyof typeof ICONS] ?? TableProperties;
  const href = tile.target || "/launchpad";
  return <CardSurface label={tile.title} value={kpi ? `${compact(kpi.value)}${kpi.unit ? ` ${kpi.unit}` : ""}` : "Open"} note={kpi?.footer ?? tile.subtitle ?? "Live SAP report"} icon={Icon} trend={kpi?.trend} href={href} accent={tile.accent_index ?? 2} />;
}

export function PlaceholderTile({ type }: { type: keyof typeof PLACEHOLDERS }) {
  const [open, setOpen] = useState(false);
  const item = PLACEHOLDERS[type];
  return <>
    <CardSurface label={item.label} value={item.value} note={item.note} icon={item.icon} onOpen={() => setOpen(true)} accent={type === "billing" ? 3 : 2} status="Under development" />
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-[92vw] max-w-md border-border bg-background p-7">
        <SheetHeader className="mt-8 text-left">
          <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Clock3 className="size-5" /></span>
          <SheetTitle>{item.label}</SheetTitle>
          <SheetDescription>This screen is under development. It will be available in a future portal update.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  </>;
}

export function TableStatusTile({ title, value, note, href }: { title: string; value: string; note: string; href?: string }) {
  return <CardSurface label={title} value={value} note={note} icon={TableProperties} href={href} accent={6} status={href ? "Open table" : "Under development"} />;
}
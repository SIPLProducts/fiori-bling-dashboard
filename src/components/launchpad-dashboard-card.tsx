import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Boxes, CircleDollarSign, Clock3, Factory, Grid3X3, PackageCheck, ReceiptText, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = { sales: ShoppingBag, fulfillment: PackageCheck, billing: ReceiptText, finance: CircleDollarSign, clock: Clock3, trend: TrendingUp, production: Factory, grid: Grid3X3, users: Users, material: Boxes, chart: BarChart3 };

export type LaunchpadIcon = keyof typeof ICONS;

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  value?: string;
  unit?: string;
  note?: ReactNode;
  footer: string;
  icon: LaunchpadIcon;
  chart?: number[];
  overview?: boolean;
  compact?: boolean;
  to?: "sd" | "open-orders" | "fi" | "pp" | "zfisales";
  onPlaceholder?: () => void;
};

function CardBody({ eyebrow, title, subtitle, value, unit, note, footer, icon, chart, overview, compact }: Omit<Props, "to" | "onPlaceholder">) {
  const Icon = ICONS[icon];
  return (
    <article className={cn(
      "flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/70 bg-launchpad-tile p-4 text-left shadow-launchpad-tile transition-all duration-200 group-hover:-translate-y-1 group-hover:scale-[1.01] group-hover:border-primary/25 group-hover:shadow-tile-hover motion-reduce:transform-none",
      compact ? "h-[164px]" : "h-[250px] sm:h-[244px]",
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? <p className="truncate text-[9px] font-semibold tracking-wide text-launchpad-muted uppercase">{eyebrow}</p> : null}
          {!overview ? <h3 className="mt-1 line-clamp-2 text-[12px] leading-snug font-semibold text-card-foreground">{title}</h3> : null}
          {!overview && subtitle ? <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-launchpad-muted">{subtitle}</p> : null}
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary shadow-[inset_0_1px_1px_var(--color-launchpad-tile-footer)]">
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
      </div>

      {overview ? (
        <div className="mt-auto mb-auto">
          <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
          {subtitle ? <p className="mt-2 text-[10px] leading-relaxed text-launchpad-muted">{subtitle}</p> : null}
        </div>
      ) : value ? (
        <div className="mt-7">
          <div className="flex items-baseline gap-1">
            <strong className="tabular text-[27px] leading-none font-semibold text-primary">{value}</strong>
            {unit ? <span className="text-[9px] font-medium text-launchpad-muted uppercase">{unit}</span> : null}
          </div>
          <div className="mt-3 border-t border-border/80 pt-3 text-[10px] text-launchpad-muted">{note ?? subtitle}</div>
        </div>
      ) : null}

      {chart ? (
        <div className="mt-5">
          <div className="flex h-10 items-end justify-between gap-2 border-b border-border/70 px-1 pb-1" aria-hidden="true">
            {chart.map((height, index) => <span key={`${height}-${index}`} className="w-2 rounded-t-sm bg-primary/80" style={{ height: `${height}%` }} />)}
          </div>
          <p className="mt-2 text-center text-[9px] text-launchpad-muted">Monthly net cash flow</p>
        </div>
      ) : null}

      <div className={cn("mt-auto flex items-center", overview || compact ? "justify-between" : "justify-end")}>
        {overview || compact ? <span className="text-[9px] font-semibold tracking-wide text-launchpad-muted uppercase">{footer}</span> : null}
        <span className={cn(
          "flex min-h-8 items-center justify-center gap-1 rounded-full border border-border/60 bg-launchpad-tile-footer px-4 text-[10px] font-semibold text-primary shadow-[inset_0_1px_2px_color-mix(in_oklab,var(--color-ink)_8%,transparent)]",
          !overview && !compact && "w-full",
        )}>
          {overview || compact ? <Grid3X3 className="size-3" /> : <>{footer}<ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" /></>}
        </span>
      </div>
    </article>
  );
}

export function LaunchpadDashboardCard(props: Props) {
  const body = <CardBody {...props} />;
  const classes = "group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  if (props.to === "sd") return <Link to="/reports/module/$module" params={{ module: "sd" }} className={classes}>{body}</Link>;
  if (props.to === "open-orders") return <Link to="/reports/sd/open-sales-orders" className={classes}>{body}</Link>;
  if (props.to === "fi") return <Link to="/reports/module/$module" params={{ module: "fi" }} className={classes}>{body}</Link>;
  if (props.to === "pp") return <Link to="/reports/module/$module" params={{ module: "pp" }} className={classes}>{body}</Link>;
  if (props.to === "zfisales") return <Link to="/tables/$tableKey" params={{ tableKey: "zfisales-detail" }} className={classes}>{body}</Link>;
  return <button type="button" onClick={props.onPlaceholder} className={`${classes} w-full`}>{body}</button>;
}
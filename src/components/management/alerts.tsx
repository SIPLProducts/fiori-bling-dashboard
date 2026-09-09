import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle } from "lucide-react";
import { type ManagementAlert } from "@/lib/management-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "./charts";

function AlertRow({ alert, last }: { alert: ManagementAlert; last: boolean }) {
  const tone =
    alert.tone === "negative"
      ? { Icon: ArrowDownCircle, icon: "text-destructive", highlight: "text-destructive" }
      : alert.tone === "warning"
        ? { Icon: AlertTriangle, icon: "text-warning", highlight: "text-warning-foreground" }
        : { Icon: ArrowUpCircle, icon: "text-success", highlight: "text-success" };

  return (
    <li
      className={`flex items-start gap-2.5 py-2.5 ${last ? "" : "border-b border-border/70"}`}
    >
      <tone.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.icon}`} />
      <div className="min-w-0">
        <p className="mb-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{alert.category}</p>
        <p className="break-words text-[12.5px] leading-relaxed text-card-foreground">
          {alert.before}
          <span className={`font-semibold ${tone.highlight}`}>{alert.highlight}</span>
          {alert.after}
        </p>
        {alert.detail ? <p className="mt-0.5 break-words text-[10.5px] text-muted-foreground">{alert.detail}</p> : null}
      </div>
    </li>
  );
}

export function ManagementAlerts({ alerts }: { alerts: ManagementAlert[] }) {
  const [open, setOpen] = useState(false);
  const visible = alerts.slice(0, 5);

  return (
    <Card
      title="Management Alerts"
      meta={
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[12px] font-semibold text-primary hover:underline"
        >
          View All
        </button>
      }
    >
      <ul>
        {visible.map((alert, index) => (
          <AlertRow key={alert.id} alert={alert} last={index === visible.length - 1} />
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Management Alerts</DialogTitle>
          </DialogHeader>
          <ul>
            {alerts.map((alert, index) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                last={index === alerts.length - 1}
              />
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

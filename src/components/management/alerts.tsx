import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle } from "lucide-react";
import { managementAlerts, type ManagementAlert } from "@/lib/management-data";
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
      ? { Icon: ArrowDownCircle, color: "#DC2626" }
      : alert.tone === "warning"
        ? { Icon: AlertTriangle, color: "#F59E0B" }
        : { Icon: ArrowUpCircle, color: "#16A34A" };
  const highlightColor =
    alert.tone === "positive" ? "#16A34A" : alert.tone === "warning" ? "#EA580C" : "#DC2626";

  return (
    <li
      className={`flex items-start gap-2.5 py-2.5 ${last ? "" : "border-b border-[#EEF2F8]"}`}
    >
      <tone.Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: tone.color }} />
      <p className="min-w-0 text-[12.5px] leading-relaxed text-[#101B3D]">
        {alert.before}
        <span className="font-semibold" style={{ color: highlightColor }}>
          {alert.highlight}
        </span>
        {alert.after}
      </p>
    </li>
  );
}

export function ManagementAlerts() {
  const [open, setOpen] = useState(false);
  const visible = managementAlerts.slice(0, 5);

  return (
    <Card
      title="Management Alerts"
      meta={
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[12px] font-semibold text-[#1769E8] hover:underline"
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
            {managementAlerts.map((alert, index) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                last={index === managementAlerts.length - 1}
              />
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

import { useState } from "react";
import { CloudDownload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runNamedEndpointSync } from "@/lib/sap-api.functions";
import { useLaunchpad } from "@/lib/use-launchpad";
import { canSyncSap } from "@/lib/sync-access";

/** Gradient Sync button (Admin / Sharvi Admin only) that runs a screen's SAP API Settings endpoint. */
export function SyncNowButton({ endpointName, label, onSynced, className = "" }: {
  endpointName: string;
  label: string;
  onSynced?: () => unknown;
  className?: string;
}) {
  const { data } = useLaunchpad();
  const [busy, setBusy] = useState(false);
  if (!canSyncSap(data?.roles)) return null;
  const run = async () => {
    setBusy(true);
    try {
      const r = await runNamedEndpointSync(endpointName);
      if (r.status === "error") toast.error(r.message || `${label} sync failed`);
      else {
        toast.success(r.received ? `${label} synced — ${r.received.toLocaleString("en-IN")} rows received` : (r.message || "No data returned — existing data unchanged"));
        await onSynced?.();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `${label} sync failed`);
    } finally { setBusy(false); }
  };
  return (
    <Button type="button" variant="action" size="sm" className={className} disabled={busy} onClick={run} aria-label={`Sync ${label} from SAP`} title={`Sync ${label} from SAP`}>
      <CloudDownload className={`size-4 ${busy ? "animate-pulse" : ""}`} />
      <span className="hidden sm:inline">{busy ? "Syncing…" : "Sync"}</span>
    </Button>
  );
}

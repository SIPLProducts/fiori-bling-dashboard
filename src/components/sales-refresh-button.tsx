import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SalesRefreshButton({
  refreshing,
  onRefresh,
  className = "h-9",
}: {
  refreshing: boolean;
  onRefresh: () => Promise<unknown>;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={refreshing}
      onClick={async () => {
        try {
          await onRefresh();
          toast.success("Sales data refreshed");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Unable to refresh Sales data");
        }
      }}
    >
      <RefreshCw className={`size-4 sm:mr-1 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
      <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
    </Button>
  );
}
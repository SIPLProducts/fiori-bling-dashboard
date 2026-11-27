import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/reports/sd/so-ageing")({
  beforeLoad: () => { throw redirect({ to: "/reports/inv/inventory-aging", replace: true }); },
});

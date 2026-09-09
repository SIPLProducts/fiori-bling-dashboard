import { createFileRoute } from "@tanstack/react-router";
import { ManagementDashboard } from "@/components/management/dashboard";

export const Route = createFileRoute("/_authenticated/management-dashboard")({
  head: () => ({
    meta: [
      { title: "Management Sales Dashboard — Executive Overview" },
      {
        name: "description",
        content:
          "Executive sales overview with KPIs, sales trend, segment mix, top customers, Pareto contribution and management alerts.",
      },
      { property: "og:title", content: "Management Sales Dashboard — Executive Overview" },
      {
        property: "og:description",
        content:
          "Executive sales overview with KPIs, sales trend, segment mix, top customers, Pareto contribution and management alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagementDashboard,
});

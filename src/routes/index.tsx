import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus — SAP Procurement Analytics Portal" },
      {
        name: "description",
        content:
          "A Fiori-inspired analytics portal for SAP procurement: launchpad tiles, spend dashboards, purchase order and supplier reports.",
      },
      { property: "og:title", content: "Nexus — SAP Procurement Analytics Portal" },
      {
        property: "og:description",
        content: "Launchpad tiles, spend dashboards and supplier scorecards on top of your SAP data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RootRedirect,
});

function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/auth", replace: true });
  }, [navigate]);

  return <div className="min-h-screen bg-background" aria-hidden />;
}

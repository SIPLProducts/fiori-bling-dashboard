import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

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
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/launchpad" : "/auth" });
  },
});

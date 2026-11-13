import { createFileRoute } from "@tanstack/react-router";
import { MasterTableScreen } from "@/components/master-table-screen";

export const Route = createFileRoute("/_authenticated/reports/tables/valuation-subgroup")({
  head: () => ({ meta: [
    { title: "Valuation Class Wise Subgroup — HBL MIS Portal" },
    { name: "description", content: "Upload, edit and delete Valuation Class Wise Subgroup master rows from Excel." },
    { property: "og:title", content: "Valuation Class Wise Subgroup — HBL MIS Portal" },
    { property: "og:description", content: "Upload, edit and delete Valuation Class Wise Subgroup master rows from Excel." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <MasterTableScreen cat="valuation_subgroup" title="Valuation Class Wise Subgroup" screenKey="tables.valuation-subgroup" />,
});

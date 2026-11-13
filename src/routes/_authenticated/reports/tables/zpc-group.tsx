import { createFileRoute } from "@tanstack/react-router";
import { MasterTableScreen } from "@/components/master-table-screen";

export const Route = createFileRoute("/_authenticated/reports/tables/zpc-group")({
  head: () => ({ meta: [
    { title: "ZPC GROUP — HBL MIS Portal" },
    { name: "description", content: "Upload, edit and delete ZPC GROUP master rows from Excel." },
    { property: "og:title", content: "ZPC GROUP — HBL MIS Portal" },
    { property: "og:description", content: "Upload, edit and delete ZPC GROUP master rows from Excel." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <MasterTableScreen cat="zpc_group" title="ZPC GROUP" screenKey="tables.zpc-group" singleSheet />,
});

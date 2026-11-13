import { createFileRoute } from "@tanstack/react-router";
import { MasterTableScreen } from "@/components/master-table-screen";

export const Route = createFileRoute("/_authenticated/reports/tables/zrmmat")({
  head: () => ({ meta: [
    { title: "ZKEYRM — HBL MIS Portal" },
    { name: "description", content: "Upload, edit and delete ZKEYRM master rows from Excel." },
    { property: "og:title", content: "ZKEYRM — HBL MIS Portal" },
    { property: "og:description", content: "Upload, edit and delete ZKEYRM master rows from Excel." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <MasterTableScreen cat="zrmmat" title="ZKEYRM" screenKey="tables.zrmmat" />,
});

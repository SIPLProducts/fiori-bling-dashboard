import { createFileRoute } from "@tanstack/react-router";
import { MonthWiseUploadScreen } from "@/components/month-wise-upload-screen";

export const Route = createFileRoute("/_authenticated/reports/tables/month-wise-upload")({
  head: () => ({ meta: [
    { title: "Month Wise Upload — HBL MIS Portal" },
    { name: "description", content: "Upload monthly Excel data by month and year." },
    { property: "og:title", content: "Month Wise Upload — HBL MIS Portal" },
    { property: "og:description", content: "Upload monthly Excel data by month and year." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MonthWiseUploadScreen,
});

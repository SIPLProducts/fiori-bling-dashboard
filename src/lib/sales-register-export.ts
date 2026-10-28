import { toCr, toLah } from "./sales-register";
import { datedFileName } from "@/lib/format";
import { industryTotals, segmentTotals } from "@/lib/industry-name";
import type { SalesRegisterRow } from "@/lib/sales-register";

export const channelLabel = (r: Pick<SalesRegisterRow, "channelCode" | "channel">) =>
  r.channelCode && r.channel ? `${r.channelCode} — ${r.channel}` : r.channel || r.channelCode;

export const SALES_REGISTER_EXPORT_COLUMNS: [string, (r: SalesRegisterRow) => string | number][] = [
  ["Billing Date", (r) => r.billingDate], ["Billing Creation Date", (r) => r.creationDate],
  ["Billing Document", (r) => r.billingDocument], ["Invoice No", (r) => r.invoiceNo],
  ["Billing Type", (r) => r.billingType], ["Distribution Channel", channelLabel],
  ["Division", (r) => r.division], ["Product Category", (r) => r.productCategory],
  ["Customer", (r) => r.customer], ["Customer Name", (r) => r.customerName], ["Industry Name", (r) => r.industry ?? ""], ["Segment", (r) => r.segmentName || r.segmentCode || ""],
  ["Plant", (r) => r.plant], ["Plant Name", (r) => r.descs?.["plant"] ?? ""],
  ["Profit Center", (r) => r.profitCenter], ["Sales Office", (r) => r.salesOffice],
  ["Sales Document", (r) => r.salesDocument], ["Sales Document Item", (r) => r.salesDocumentItem],
  ["Main Group", (r) => r.mainGroup], ["Sub Group", (r) => r.subGroup],
  ["Material Code", (r) => r.materialCode], ["Material Description", (r) => r.material],
  ["Billed Qty (LAH)", (r) => toLah(r.billedQty)], ["Net Value (₹ Cr)", (r) => toCr(r.netValue)],
  ["CGST (LAH)", (r) => toLah(r.cgst)], ["SGST (LAH)", (r) => toLah(r.sgst)], ["IGST (LAH)", (r) => toLah(r.igst)], ["TCS (₹)", (r) => r.tcs],
  ["Posting Status", (r) => r.status],
];

export async function downloadSalesRegisterExcel(rows: SalesRegisterRow[]) {
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();
  const sheet = wb.addWorksheet("Sales Register");
  const header = sheet.addRow(SALES_REGISTER_EXPORT_COLUMNS.map(([h]) => h));
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A6ED1" } }; });
  rows.forEach((r) => sheet.addRow(SALES_REGISTER_EXPORT_COLUMNS.map(([, get]) => get(r))));
  sheet.columns.forEach((c) => { c.width = 20; });
  const ind = wb.addWorksheet("Industry Name");
  const ih = ind.addRow(["Industry Name", "Net Value (₹ Cr)", "Lines"]); ih.font = { bold: true };
  industryTotals(rows, (r) => r.industry, (r) => r.netValue).forEach((d) => ind.addRow([d.name, toCr(d.value), d.count]));
  ind.columns.forEach((c) => { c.width = 28; });
  const seg = wb.addWorksheet("Segment");
  const sh = seg.addRow(["Segment", "Net Value (₹ Cr)", "Lines"]); sh.font = { bold: true };
  segmentTotals(rows, (r) => r.segmentCode, (r) => r.industry, (r) => r.netValue).forEach((d) => seg.addRow([d.name, toCr(d.value), d.count]));
  seg.columns.forEach((c) => { c.width = 28; });
  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const a = document.createElement("a"); a.href = url; a.download = datedFileName("Sales Register", "xlsx"); a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

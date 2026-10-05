import type { OpenSalesOrder } from "@/lib/open-sales-orders-data";

export async function downloadOpenSalesOrdersExcel(rows: OpenSalesOrder[]) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HBL Engineering Limited";
  const sheet = workbook.addWorksheet("Open Sales Orders", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "#", key: "row", width: 7 },
    { header: "Order No.", key: "order", width: 16 },
    { header: "POSNR", key: "item", width: 11 },
    { header: "Customer", key: "customer", width: 32 },
    { header: "Document Type", key: "documentType", width: 17 },
    { header: "Sales Zone", key: "zone", width: 19 },
    { header: "Division", key: "division", width: 13 },
    { header: "Product", key: "material", width: 19 },
    { header: "Product Description", key: "description", width: 42 },
    { header: "Order Date", key: "orderDate", width: 15 },
    { header: "Requested Date", key: "deliveryDate", width: 17 },
    { header: "Days Open", key: "daysOpen", width: 13 },
    { header: "Open Qty", key: "openQuantity", width: 15 },
    { header: "Delivered Qty", key: "deliveredQuantity", width: 16 },
    { header: "Open Value (₹ Cr)", key: "value", width: 19 },
    { header: "Status", key: "status", width: 21 },
  ];
  rows.forEach((row, index) => sheet.addRow({
    row: index + 1,
    order: row.order,
    item: row.item,
    customer: row.customer,
    documentType: row.documentType,
    zone: row.zone.replace(" Zone", ""),
    division: row.division,
    material: row.material,
    description: row.description,
    orderDate: row.orderDate,
    deliveryDate: row.deliveryDate,
    daysOpen: row.daysOpen,
    openQuantity: row.openQuantity,
    deliveredQuantity: row.deliveredQuantity,
    value: row.value,
    status: row.deliveredQuantity > 0 ? "Partially Delivered" : "Open",
  }));
  sheet.autoFilter = { from: "A1", to: `P${Math.max(1, rows.length + 1)}` };
  const header = sheet.getRow(1);
  header.height = 24;
  header.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 10 };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A6ED1" } };
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.font = { name: "Arial", size: 10 };
    row.eachCell((cell) => {
      cell.border = { bottom: { style: "thin", color: { argb: "FFD9E2EC" } } };
      cell.alignment = { vertical: "middle" };
    });
  });
  for (const key of ["openQuantity", "deliveredQuantity", "value"] as const) {
    const column = sheet.getColumn(key);
    column.numFmt = key === "value" ? "#,##0.00" : "#,##0.00;[Red](#,##0.00);-";
  }
  const bytes = await workbook.xlsx.writeBuffer();
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "open-sales-orders.xlsx";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
import type { OpenSalesOrder } from "@/lib/open-sales-orders-data";

export async function downloadOpenSalesOrdersExcel(rows: OpenSalesOrder[]) {
  const XLSX = await import("xlsx");
  const headers = [
    "#", "Order No.", "POSNR", "Customer", "Document Type", "Sales Zone", "Division",
    "Product", "Product Description", "Order Date", "Requested Date", "Days Open",
    "Open Qty", "Delivered Qty", "Open Value (₹ Cr)", "Status",
  ];
  const values = rows.map((row, index) => [
    index + 1,
    row.order,
    row.item,
    row.customer,
    row.documentType,
    row.zone.replace(" Zone", ""),
    row.division,
    row.material,
    row.description,
    row.orderDate,
    row.deliveryDate,
    row.daysOpen,
    row.openQuantity,
    row.deliveredQuantity,
    row.value,
    row.deliveredQuantity > 0 ? "Partially Delivered" : "Open",
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...values]);
  sheet["!autofilter"] = { ref: `A1:P${Math.max(1, values.length + 1)}` };
  sheet["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };
  sheet["!cols"] = [6, 15, 10, 30, 16, 18, 12, 18, 38, 14, 16, 12, 14, 14, 18, 20].map((wch) => ({ wch }));
  for (let row = 2; row <= values.length + 1; row += 1) {
    for (const column of ["J", "K"]) {
      const cell = sheet[`${column}${row}`];
      if (cell) cell.z = "dd-mmm-yyyy";
    }
    for (const column of ["M", "N"]) {
      const cell = sheet[`${column}${row}`];
      if (cell) cell.z = "#,##0.00";
    }
    const amountCell = sheet[`O${row}`];
    if (amountCell) amountCell.z = "#,##0.00";
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Open Sales Orders");
  XLSX.writeFile(workbook, "open-sales-orders.xlsx", { compression: true });
}
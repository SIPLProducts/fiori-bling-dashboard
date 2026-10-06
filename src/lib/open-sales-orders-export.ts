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
    { header: "Line Item", key: "item", width: 11 },
    { header: "Preceding Document", key: "precedingDocument", width: 20 },
    { header: "Purchase Order", key: "purchaseOrder", width: 18 },
    { header: "Sales Document Type", key: "documentType", width: 17 },
    { header: "Order Date", key: "orderDate", width: 15 },
    { header: "Purchase Order Date", key: "purchaseOrderDate", width: 20 },
    { header: "Requested Date", key: "deliveryDate", width: 17 },
    { header: "Sales Organization", key: "salesOrg", width: 19 },
    { header: "Distribution Channel", key: "channel", width: 21 },
    { header: "Division", key: "division", width: 13 },
    { header: "Plant", key: "plant", width: 13 },
    { header: "Plant Name", key: "plantName", width: 25 },
    { header: "Sales Office", key: "office", width: 16 },
    { header: "Sales Group", key: "salesGroup", width: 16 },
    { header: "Sales Representative", key: "salesRepName", width: 26 },
    { header: "Profit Centre", key: "profitCentre", width: 17 },
    { header: "Sales Zone", key: "zone", width: 19 },
    { header: "Region", key: "region", width: 18 },
    { header: "Country", key: "country", width: 18 },
    { header: "Sales Type", key: "salesType", width: 17 },
    { header: "Sold-to Customer", key: "customerSoldTo", width: 18 },
    { header: "Sold-to Customer Name", key: "customerSoldToName", width: 32 },
    { header: "Bill-to Customer", key: "customerBillTo", width: 18 },
    { header: "Bill-to Customer Name", key: "customerBillToName", width: 32 },
    { header: "Ship-to Customer", key: "customerShipTo", width: 18 },
    { header: "Ship-to Customer Name", key: "customerShipToName", width: 32 },
    { header: "Customer Group", key: "customerGroup", width: 20 },
    { header: "Industry Description", key: "industryDescription", width: 28 },
    { header: "Usage Description", key: "usageDescription", width: 28 },
    { header: "Product", key: "material", width: 19 },
    { header: "Product Description", key: "description", width: 42 },
    { header: "Material Type", key: "materialType", width: 17 },
    { header: "Product Category", key: "category", width: 21 },
    { header: "Model", key: "model", width: 20 },
    { header: "Product Range", key: "productRange", width: 20 },
    { header: "Product Type", key: "productType", width: 20 },
    { header: "Ordered Qty", key: "quantity", width: 15 },
    { header: "Open Qty", key: "openQuantity", width: 15 },
    { header: "Delivered Qty", key: "deliveredQuantity", width: 16 },
    { header: "Unit", key: "unit", width: 10 },
    { header: "Currency", key: "currency", width: 11 },
    { header: "Open Value (₹ Cr)", key: "value", width: 19 },
    { header: "Days Open", key: "daysOpen", width: 13 },
    { header: "Delivery Status", key: "deliveryStatus", width: 18 },
    { header: "Overall Status", key: "overallStatus", width: 18 },
  ];
  rows.forEach((row, index) => sheet.addRow({
    row: index + 1,
    order: row.order,
    item: row.item,
    precedingDocument: row.precedingDocument,
    purchaseOrder: row.purchaseOrder,
    documentType: row.documentType,
    orderDate: row.orderDate,
    purchaseOrderDate: row.purchaseOrderDate,
    deliveryDate: row.deliveryDate,
    salesOrg: row.salesOrg,
    channel: row.channel,
    division: row.division,
    plant: row.plant,
    plantName: row.plantName,
    office: row.office,
    salesGroup: row.salesGroup,
    salesRepName: row.salesRepName,
    profitCentre: row.profitCentre,
    zone: row.zone.replace(" Zone", ""),
    region: row.region,
    country: row.country,
    salesType: row.salesType,
    customerSoldTo: row.customerSoldTo,
    customerSoldToName: row.customerSoldToName,
    customerBillTo: row.customerBillTo,
    customerBillToName: row.customerBillToName,
    customerShipTo: row.customerShipTo,
    customerShipToName: row.customerShipToName,
    customerGroup: row.customerGroup,
    industryDescription: row.industryDescription,
    usageDescription: row.usageDescription,
    material: row.material,
    description: row.description,
    materialType: row.materialType,
    category: row.category,
    model: row.model,
    productRange: row.productRange,
    productType: row.productType,
    quantity: row.quantity,
    openQuantity: row.openQuantity,
    deliveredQuantity: row.deliveredQuantity,
    unit: row.unit,
    currency: row.currency,
    value: row.value,
    daysOpen: row.daysOpen,
    deliveryStatus: row.deliveryStatus,
    overallStatus: row.overallStatus,
  }));
  const lastColumn = sheet.getColumn(sheet.columnCount).letter;
  sheet.autoFilter = { from: "A1", to: `${lastColumn}${Math.max(1, rows.length + 1)}` };
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
  for (const key of ["quantity", "openQuantity", "deliveredQuantity", "value"] as const) {
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
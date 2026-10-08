import { format } from "date-fns";
import type { OpenSalesOrder } from "./open-sales-orders-data";

export type OpenOrderTableStatus = "all" | "open" | "partial";

export function summarizeOpenOrderTable(rows: Pick<OpenSalesOrder, "openQuantity" | "deliveredQuantity" | "ah" | "totalAh" | "value">[]) {
  return rows.reduce((totals, row) => ({
    openQuantity: totals.openQuantity + row.openQuantity,
    deliveredQuantity: totals.deliveredQuantity + row.deliveredQuantity,
    ah: totals.ah + row.ah,
    totalAh: totals.totalAh + row.totalAh,
    value: totals.value + row.value,
  }), { openQuantity: 0, deliveredQuantity: 0, ah: 0, totalAh: 0, value: 0 });
}

export function openOrderStatusLabel(deliveredQuantity: number) {
  return deliveredQuantity > 0 ? "Partially Delivered" : "Open";
}

export function displayOpenOrderDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : format(date, "dd-MMM-yyyy");
}

export function filterOpenOrderTable(rows: OpenSalesOrder[], status: OpenOrderTableStatus, search: string) {
  const query = search.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    if (status === "partial" && row.deliveredQuantity <= 0) return false;
    if (status === "open" && row.deliveredQuantity > 0) return false;
    if (!query) return true;
    const numbers = [row.daysOpen, row.openQuantity, row.deliveredQuantity, row.ah, row.totalAh];
    const values = [
      row.order, row.item, row.customer, row.documentType, row.zone.replace(" Zone", ""),
      row.division, row.plant ?? "", row.plantName ?? "", row.material, row.description, row.orderDate, row.deliveryDate,
      displayOpenOrderDate(row.orderDate), displayOpenOrderDate(row.deliveryDate),
      ...numbers.map(String), ...numbers.map((value) => Math.round(value).toLocaleString("en-IN")),
      row.ah.toLocaleString("en-IN", { maximumFractionDigits: 15 }), row.totalAh.toLocaleString("en-IN", { maximumFractionDigits: 15 }),
      String(row.value), row.value.toFixed(2), openOrderStatusLabel(row.deliveredQuantity),
    ];
    return values.some((value) => value.toLocaleLowerCase().includes(query));
  });
}
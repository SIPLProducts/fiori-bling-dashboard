import { expect, test } from "bun:test";
import type { OpenSalesOrder } from "../src/lib/open-sales-orders-data";
import { defaultOpenOrderFilters, documentTypeKey, documentTypeDescription, filterOpenOrders, summarizeDocumentDescriptions } from "../src/lib/open-sales-orders-filters";

const rows = [
  { order: "1", documentType: "ZDOR", salesType: "Domestic Sales", value: 10 },
  { order: "2", documentType: "ZDOR", salesType: "Deemed Export Sales", value: 2 },
  { order: "3", documentType: "ZDOR", salesType: "SEZ Sales", value: 3 },
  { order: "1", documentType: "ZSOR", salesType: "Domestic Sales", value: 4 },
  { order: "4", documentType: "ZEOR", salesType: "Export Sales", value: 5 },
  { order: "5", documentType: "ZSD2", salesType: "Domestic Sales", value: 6 },
] as OpenSalesOrder[];

test("selecting ZDOR Deemed Export matches only that exact code and description", () => {
  const selected = rows[1];
  if (!selected) throw new Error("Missing fixture");
  expect(filterOpenOrders(rows, { ...defaultOpenOrderFilters(rows), documentTypes: [documentTypeKey(selected)] })).toEqual([selected]);
});
test("default and Reset include every description for ZDOR ZEOR ZSOR only", () => {
  expect(defaultOpenOrderFilters(rows).documentTypes).toHaveLength(5);
  expect(filterOpenOrders(rows, defaultOpenOrderFilters(rows))).toEqual(rows.slice(0, 5));
});
test("card combines shared descriptions across codes and counts unique orders", () => {
  const groups = summarizeDocumentDescriptions(rows);
  expect(groups.find((group) => group.name === "Domestic Sales")).toEqual({ name: "Domestic Sales", count: 2, value: 20 });
  expect(groups.reduce((sum, group) => sum + group.count, 0)).toBe(5);
  expect(groups.reduce((sum, group) => sum + group.value, 0)).toBe(30);
});
test("missing SAP descriptions fall back to the document code", () => {
  expect(documentTypeDescription({ documentType: "ZDOR", salesType: "" } as OpenSalesOrder)).toBe("ZDOR");
  expect(documentTypeDescription({ documentType: "ZEOR", salesType: "Unassigned" } as OpenSalesOrder)).toBe("ZEOR");
});
test("deselecting all combinations produces no rows", () => {
  expect(filterOpenOrders(rows, { ...defaultOpenOrderFilters(rows), documentTypes: [] })).toEqual([]);
});
test("document descriptions rank by summed value descending, with name ties", () => {
  expect(summarizeDocumentDescriptions(rows).map(group => group.name)).toEqual(["Domestic Sales", "Export Sales", "SEZ Sales", "Deemed Export Sales"]);
  expect(summarizeDocumentDescriptions([{order: "1", documentType: "ZDOR", salesType: "Z", value: 2}, {order: "2", documentType: "ZDOR", salesType: "A", value: 2}] as OpenSalesOrder[]).map(group => group.name)).toEqual(["A", "Z"]);
});

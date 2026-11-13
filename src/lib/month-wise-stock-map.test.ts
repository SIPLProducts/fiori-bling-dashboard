import { describe, expect, it } from "vitest";
import { mapStockRows, sumBy, valuationLookup, zpcLookup } from "./month-wise-stock-map";

const val = valuationLookup([{ "Valuation Class": "4011", Description: "Raw Materials (Domestic)", "Short Name": "Raw material" }, { "Valuation Class": "4031", Description: "Raw Materials (Adv. Lic)", "Short Name": "Raw material" }]);
const zpc = zpcLookup([{ PRCTR: "COFF100001", MNGRP1: "Batteries", PCGRP1: "Defence", PCGRP2: "", PCGRP3: "" }]);
const rows = mapStockRows([
  { id: "1", month: 11, year: 2026, data: { ValCl: "4011", "CB Val": "92471.34", "CB Qty": "500", "Profit Centre": "COFF100001" } },
  { id: "2", month: 11, year: 2026, data: { ValCl: "4031", "CB Val": "1,000.66", "CB Qty": "" } },
], val, zpc);

describe("month wise stock", () => {
  it("valuation classes sharing a Short Name add into one tile, in full CB Val", () => {
    expect(sumBy(rows, (r) => r.type)).toEqual([{ name: "Raw material", value: 93472 }]);
  });
  it("profit centre maps to ZPC main group", () => { expect(rows[0]?.mainGroup).toBe("Batteries"); });
});

import { describe, expect, it } from "vitest";
import { stockTotals, toCurrentStockRow, CURRENT_STOCK_SAMPLE } from "./current-stock-data";
import { mapCurrentStockPayload } from "./current-stock-map";
const base = CURRENT_STOCK_SAMPLE[0]!;
const r = (o: object) => ({ ...base, unrQ: 0, unrV: 0, qcQ: 0, qcV: 0, blkQ: 0, blkV: 0, trfQ: 0, trfV: 0, restrQ: 0, restrV: 0, retQ: 0, retV: 0, ...o });
describe("current stock", () => {
  it("adds every stock category into total value", () => {
    const t = stockTotals([r({ unrV: 100, qcV: 10, trfV: 5 }), r({ material: "X", blkV: 20 })]);
    expect(t.value).toBe(135); expect(t.nonUnrV).toBe(35); expect(t.trfV).toBe(5); expect(t.materials).toBe(2);
  });
  it("maps the SAP response and derives material price as value / quantity", () => {
    const { rows } = mapCurrentStockPayload([{ MATNR: "9000003544", WERKS: "1400", LGORT: "S084", CHARG: "", LABST: 100, WLABS: 376375, INSME: 0, WINSM: 0, SPEME: 0, WSPEM: 0, TRAME: 0, WTRAM: 0 }], "Current_Stock");
    const row = toCurrentStockRow(rows[0]!);
    expect(row.unrQ).toBe(100); expect(row.unrV).toBe(376375); expect(row.price).toBe(3763.75);
  });
});

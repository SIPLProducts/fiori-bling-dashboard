import { describe, expect, it } from "vitest";
import { stockTotals, type CurrentStockRow } from "./current-stock-data";
const r = (o: Partial<CurrentStockRow>) => ({ plant: "B020", sloc: "", slocDesc: "", mtype: "", material: "1", matDesc: "", uom: "", priceCtl: "V", price: 0, unrQ: 0, unrV: 0, qcQ: 0, qcV: 0, restrQ: 0, restrV: 0, blkQ: 0, blkV: 0, retQ: 0, retV: 0, ...o });
describe("stockTotals", () => {
  it("adds every stock category into total value", () => {
    const t = stockTotals([r({ unrV: 100, qcV: 10, retV: 5 }), r({ material: "2", blkV: 20 })]);
    expect(t.value).toBe(135); expect(t.nonUnrV).toBe(35); expect(t.materials).toBe(2);
  });
});

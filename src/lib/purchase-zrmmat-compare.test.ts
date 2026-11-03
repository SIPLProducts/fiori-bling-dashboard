import { describe, expect, it } from "vitest";
import { matchRows, monthSeries, summarize, zrmmatMaterials } from "./purchase-zrmmat-compare";
import type { PurchaseRow } from "./purchase-register-data";

const row = (date: string, valueInr: number, qty: number, material = "000000000012345", plant = "1300", docNo = date): PurchaseRow =>
  ({ date, plant, plantName: "", profitCenter: "", profitCenterName: "", vendor: "", vendorName: "", material, materialName: "", group: "", type: "Domestic", value: valueInr / 1e7, qty, docNo });

describe("zrmmat compare", () => {
  it("unit price is total value divided by total quantity per month", () => {
    const s = monthSeries([row("2026-04-02", 1000, 10), row("2026-04-20", 3000, 10), row("2026-05-05", 2500, 10)]);
    expect(s[0].price).toBe(200);
    expect(s[1].price).toBe(250);
    expect(s[1].mom).toBe(50);
    expect(s[1].momPct).toBe(25);
  });
  it("matches ZRMMAT material ignoring leading zeros and respecting plant", () => {
    const mats = zrmmatMaterials([{ Plant: "1300", Material: "12345" }]);
    const rows = [row("2026-04-02", 1, 1), row("2026-04-02", 1, 1, "12345", "1100")];
    expect(matchRows(rows, mats[0]).length).toBe(1);
  });
  it("summary price uses totals", () => {
    const s = summarize([row("2026-04-02", 1000, 10), row("2026-05-02", 3000, 10, undefined, undefined, "B")]);
    expect(s.price).toBe(200);
    expect(s.docs).toBe(2);
  });
});

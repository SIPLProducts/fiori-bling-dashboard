import { describe, expect, it } from "vitest";
import { openPoTypeSummary, toOpenPoRow } from "./open-po-data";

describe("openPoTypeSummary", () => {
  it("groups PO value and lines by PO type, counting distinct POs", () => {
    const rows = [
      toOpenPoRow({ ebeln: "1", bsart: "ZPCP", netwr: 100 }),
      toOpenPoRow({ ebeln: "1", bsart: "ZPCP", netwr: 50 }),
      toOpenPoRow({ ebeln: "2", bsart: "ZDOM", netwr: 300 }),
    ];
    const s = openPoTypeSummary(rows);
    expect(s.poValue).toBe(450);
    expect(s.poCount).toBe(2);
    expect(s.types).toEqual([{ name: "ZDOM", value: 300, count: 1 }, { name: "ZPCP", value: 150, count: 2 }]);
  });
});

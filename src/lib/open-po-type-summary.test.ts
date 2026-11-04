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
    expect(s.types).toEqual([{ name: "OTHERS", value: 300, count: 1 }, { name: "CAPITAL", value: 150, count: 2 }]);
  });
});

describe("PO type groups", () => {
  it("maps codes to groups from the business table", async () => {
    const { poTypeGroup, isExcludedPoType } = await import("./open-po-data");
    expect(["ZPDM", "ZPNI", "ZBBK", "ZPCT"].map(poTypeGroup)).toEqual(["DOMESTIC", "DOMESTIC", "DOMESTIC", "DOMESTIC"]);
    expect(poTypeGroup("ZPIT")).toBe("CAPITAL");
    expect(poTypeGroup("ZPIS")).toBe("SERVICE");
    expect(poTypeGroup("ZPIM")).toBe("IMPORTED");
    expect(poTypeGroup("ZPPM")).toBe("PROJECT");
    expect(poTypeGroup("ZXYZ")).toBe("OTHERS");
    expect(poTypeGroup("")).toBe("OTHERS");
    expect(isExcludedPoType("ZINT")).toBe(true);
    expect(isExcludedPoType("ZPDM")).toBe(false);
  });
});

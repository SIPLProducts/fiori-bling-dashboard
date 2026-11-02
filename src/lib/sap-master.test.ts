import { describe, expect, it } from "vitest";
import { gridToSheet, keyRows, mergeMaster } from "./sap-master";

describe("SAP MASTER merge", () => {
  it("adds new rows and updates matching rows", () => {
    const r = mergeMaster(
      { columns: ["Code", "Name"], rows: [{ k: "P1", d: { Code: "P1", Name: "Old" } }] },
      { columns: ["Code", "Name"], rows: [{ k: "P1", d: { Code: "P1", Name: "New" } }, { k: "P2", d: { Code: "P2", Name: "Two" } }] },
    );
    expect(r.rows).toEqual([{ k: "P1", d: { Code: "P1", Name: "New" } }, { k: "P2", d: { Code: "P2", Name: "Two" } }]);
  });
  it("appends new columns and keeps old ones", () => {
    const r = mergeMaster({ columns: ["Code", "Name"], rows: [] }, { columns: ["Code", "Zone"], rows: [] });
    expect(r.columns).toEqual(["Code", "Name", "Zone"]);
  });
  it("uses header row as columns and drops rows without key", () => {
    const s = gridToSheet("Plant", [["Code", "Name"], ["1000", "Pune"], ["", "NoKey"], []]);
    expect(s.columns).toEqual(["Code", "Name"]);
    expect(keyRows(s.rows, "Code")).toEqual([{ k: "1000", d: { Code: "1000", Name: "Pune" } }]);
  });
});

import { buildKey as bk, countUniqueKeys as cu, keyRows as kr, ROW_KEY as RK } from "./sap-master";
describe("ZRMMAT keys", () => {
  const rows = Array.from({ length: 200 }, (_, i) => ({ Plant: `P${i % 5}`, Material: `M${i}` }));
  it("single Plant key collapses 200 rows to 5", () => expect(cu(rows, "Plant")).toBe(5));
  it("Plant+Material key keeps 200", () => expect(cu(rows, "Plant+Material")).toBe(200));
  it("no key keeps every row", () => expect(kr(rows, RK)).toHaveLength(200));
  it("joins key parts", () => expect(bk({ A: "1", B: "2" }, "A+B")).toBe("1 | 2"));
});

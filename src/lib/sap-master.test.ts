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

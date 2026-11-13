import { describe, expect, it } from "vitest";
import { summarizeMasters } from "./tables-master-status";
describe("tables master status", () => {
  it("sums rows per category", () => {
    const r = summarizeMasters([{ category: "zrmmat", row_count: 10, updated_at: "2026-11-01T00:00:00Z" }, { category: "zrmmat", row_count: 5, updated_at: null }, { category: "sap_master", row_count: 99, updated_at: null }], "zrmmat");
    expect(r.value).toBe("15 rows");
    expect(r.note.startsWith("2 sheets")).toBe(true);
  });
  it("shows no data when empty", () => {
    expect(summarizeMasters([], "zpc_group").value).toBe("No data uploaded");
  });
});

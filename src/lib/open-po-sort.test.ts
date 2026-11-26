import { describe, expect, it } from "vitest";
import { sortOpenPoByDate } from "./open-po-data";
describe("sortOpenPoByDate", () => {
  it("puts December before next January and empty dates last", () => {
    const r = sortOpenPoByDate([{ poDate: "", poNo: "1" }, { poDate: "2026-01-02", poNo: "2" }, { poDate: "2025-12-28", poNo: "3" }]);
    expect(r.map((x) => x.poNo)).toEqual(["3", "2", "1"]);
  });
});

import { describe, expect, it } from "bun:test";
import { withSitDates } from "../src/lib/sap-pull-shared";

describe("SIT Current date window", () => {
  it("sends today's FKDAT_F and omits FKDAT_T", () => {
    const now = new Date(2026, 9, 27, 5, 30);
    const out = JSON.parse(withSitDates(JSON.stringify({ VKORG: "1000", FKDAT_F: "20260101", FKDAT_T: "20260131" }), "today", now)!);
    expect(out.FKDAT_F).toBe("20261027");
    expect("FKDAT_T" in out).toBe(false);
  });
});

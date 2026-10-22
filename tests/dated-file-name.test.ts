import { describe, expect, it } from "bun:test";
import { datedFileName } from "../src/lib/format";
import { toSitDashboardRow } from "../src/lib/sit-data";
import { documentTypeLabel } from "../src/lib/open-sales-orders-filters";

describe("download names", () => {
  it("uses screen name and today's IST date", () => {
    expect(datedFileName("Sales In Transit (SIT)", "pdf", new Date("2026-10-21T20:00:00Z"))).toBe("Sales In Transit (SIT)_22-10-2026.pdf");
  });
});
describe("SIT document type", () => {
  it("uses AUART code with VTEXT_DC description", () => {
    const row = toSitDashboardRow({ vbeln: "1", posnr: "10", auart: "ZDOR", fkart: "ZDF2", vtext: "Domestic Invoice", vtext_dc: "Domestic Sales" });
    expect(row.documentType).toBe("ZDOR");
    expect(documentTypeLabel(row)).toBe("ZDOR — Domestic Sales");
  });
});

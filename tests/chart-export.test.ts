import { describe, expect, test } from "bun:test";
import { selectCsvColumns, toCsv } from "../src/lib/chart-export.ts";

describe("selected-column CSV export", () => {
  test("exports only selected columns in their visible order", () => {
    const rows = [{ model: "KBL", productRange: "Premium", productType: "Tubular", amount: 1250 }];
    const selected = [
      { label: "Range", value: (row: (typeof rows)[number]) => row.productRange },
      { label: "Model", value: (row: (typeof rows)[number]) => row.model },
    ];

    const output = toCsv(selectCsvColumns(rows, selected));

    expect(output).toBe("Range,Model\nPremium,KBL");
    expect(output).not.toContain("Type");
    expect(output).not.toContain("Amount");
  });

  test("keeps Model, Range, and Type values in separate CSV columns", () => {
    const rows = [{ model: "KPH", productRange: "Industrial", productType: "Lead Acid" }];
    const selected = [
      { label: "Model", value: (row: (typeof rows)[number]) => row.model },
      { label: "Range", value: (row: (typeof rows)[number]) => row.productRange },
      { label: "Type", value: (row: (typeof rows)[number]) => row.productType },
    ];

    expect(toCsv(selectCsvColumns(rows, selected))).toBe(
      "Model,Range,Type\nKPH,Industrial,Lead Acid",
    );
  });
});
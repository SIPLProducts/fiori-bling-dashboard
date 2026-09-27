import { describe, expect, test } from "bun:test";
import { aggregateZtbn, profitCentresFromColumns, type ZtbnColumn, type ZtbnRow } from "../src/lib/ztbn";

const columns: ZtbnColumn[] = [
  { field_name: "gl_code", ui_label: "GL Code", data_type: "text", sort_order: 10 },
  { field_name: "pc_one_debit", ui_label: "PC ONE/Plant One(Debit)", data_type: "numeric", sort_order: 20 },
  { field_name: "pc_one_credit", ui_label: "PC ONE/Plant One(Credit)", data_type: "numeric", sort_order: 30 },
];

const rows = [
  { id: "1", source_row_no: 1, gl_code: "100", gl_description: "Cash", pc_one_debit: 150, pc_one_credit: 20, cumm_balance: 130 },
  { id: "2", source_row_no: 2, gl_code: "200", gl_description: "Payables", pc_one_debit: 10, pc_one_credit: 60, cumm_balance: -50 },
  { id: "3", source_row_no: 3, gl_code: "", gl_description: "Grand Total", pc_one_debit: 160, pc_one_credit: 80, cumm_balance: 80 },
] as ZtbnRow[];

describe("ZTBN dashboard aggregation", () => {
  test("pairs debit and credit fields from registered columns", () => {
    expect(profitCentresFromColumns(columns)).toEqual([{ key: "pc_one", label: "PC ONE/Plant One", debitField: "pc_one_debit", creditField: "pc_one_credit" }]);
  });

  test("excludes the imported grand-total row to prevent double counting", () => {
    const result = aggregateZtbn(rows, profitCentresFromColumns(columns));
    expect(result.totalDebit).toBe(160);
    expect(result.totalCredit).toBe(80);
    expect(result.netBalance).toBe(80);
    expect(result.cumulativeBalance).toBe(80);
    expect(result.accountCount).toBe(2);
  });

  test("filters every measure by GL search", () => {
    const result = aggregateZtbn(rows, profitCentresFromColumns(columns), "all", "Cash");
    expect(result.accountCount).toBe(1);
    expect(result.totalDebit).toBe(150);
    expect(result.totalCredit).toBe(20);
  });
});
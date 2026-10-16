import { describe, expect, it, test } from "bun:test";
import { canSee, isZtbnFieldAllowed } from "../src/lib/user-access";

const limited = { unrestricted: false, plants: ["1000", "1100"], profitCenters: ["COFF100001"] };

describe("user plant / profit centre access", () => {
  it("no assignments means everything is visible", () => {
    expect(canSee({ unrestricted: false, plants: [], profitCenters: [] }, "9999", "X")).toBe(true);
  });
  it("shows a record when plant OR profit centre matches", () => {
    expect(canSee(limited, "1100", "PGNLB11001")).toBe(true);
    expect(canSee(limited, "2000", "COFF100001")).toBe(true);
    expect(canSee(limited, "2000", "SERB010")).toBe(false);
  });
  it("plants-only and profit-centres-only assignments", () => {
    expect(canSee({ unrestricted: false, plants: ["1100"], profitCenters: [] }, "1000", "X")).toBe(false);
    expect(canSee({ unrestricted: false, plants: [], profitCenters: ["X"] }, "1000", "X")).toBe(true);
  });
  it("admins see everything", () => {
    expect(canSee({ ...limited, unrestricted: true }, "2000", "SERB010")).toBe(true);
  });
  it("hides other profit centres' TBN columns", () => {
    expect(isZtbnFieldAllowed(limited, "coff100001_debit")).toBe(true);
    expect(isZtbnFieldAllowed(limited, "serb010_credit")).toBe(false);
    expect(isZtbnFieldAllowed(limited, "gl_code")).toBe(true);
  });
});

import { restrictToAssigned } from "../src/lib/user-access";
test("dropdown lists only assigned profit centres", () => {
  const opts = ["COFF100001", "PGNLB11001", "COFF100004"];
  expect(restrictToAssigned(opts, ["COFF100001", "COFF100004"], false, (o) => o)).toEqual(["COFF100001", "COFF100004"]);
});
test("empty assignment or admin keeps all options", () => {
  expect(restrictToAssigned(["A", "B"], [], false, (o) => o)).toEqual(["A", "B"]);
  expect(restrictToAssigned(["A", "B"], ["A"], true, (o) => o)).toEqual(["A", "B"]);
});

import { scopeRowsToAssigned } from "../src/lib/user-access";
const koti = { unrestricted: false, plants: ["1100", "1200"], profitCenters: ["COFF100001", "COFF100004"] };
const rows = [{ p: "1100", pc: "PGNLB11001" }, { p: "", pc: "COFF100001" }, { p: "1200", pc: "COFF100004" }];
test("Net Sales scopes to assigned profit centres", () => {
  expect(scopeRowsToAssigned(rows, koti, { profitCentre: (r) => r.pc }).map((r) => r.pc)).toEqual(["COFF100001", "COFF100004"]);
});
test("Open Orders scopes to assigned plants", () => {
  expect(scopeRowsToAssigned(rows, koti, { plant: (r) => r.p }).map((r) => r.p)).toEqual(["1100", "1200"]);
});
test("Cash Flow needs plant and profit centre", () => {
  expect(scopeRowsToAssigned(rows, koti, { plant: (r) => r.p, profitCentre: (r) => r.pc })).toEqual([rows[2]]);
});
test("admin or empty lists pass every row", () => {
  expect(scopeRowsToAssigned(rows, { ...koti, unrestricted: true }, { plant: (r) => r.p })).toHaveLength(3);
  expect(scopeRowsToAssigned(rows, { unrestricted: false, plants: [], profitCenters: [] }, { plant: (r) => r.p })).toHaveLength(3);
});

import { expect, test } from "bun:test";
import { postingWindow } from "../src/lib/sap-pull-shared";

test("FY to date on 27.10.2026", () => {
  expect(postingWindow("fytd", new Date(2026, 9, 27))).toEqual({ from: "20260401", to: "20261027" });
});
test("FY to date on 15.02.2027 stays in FY 2026-27", () => {
  expect(postingWindow("fytd", new Date(2027, 1, 15))).toEqual({ from: "20260401", to: "20270215" });
});
test("FY to date on 01.04.2027 starts new FY", () => {
  expect(postingWindow("fytd", new Date(2027, 3, 1))).toEqual({ from: "20270401", to: "20270401" });
});

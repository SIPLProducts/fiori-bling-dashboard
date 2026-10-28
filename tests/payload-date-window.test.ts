import { expect, test } from "bun:test";
import { applyDateWindow, type PayloadField } from "../src/lib/payload-fields";
import { postingWindow } from "../src/lib/sap-pull-shared";

const saved: PayloadField[] = [
  { key: "fkdat_f", value: "20260401", optional: false, date: true },
  { key: "fkdat_t", value: "20261027", optional: false, date: true },
];
const keys = ["fkdat_f", "fkdat_t"];

test("FY-to-date replaces yesterday's saved To date with today", () => {
  const out = applyDateWindow(saved, keys, "fytd", postingWindow("fytd", new Date(2026, 9, 28)));
  expect(out.map((f) => f.value)).toEqual(["20260401", "20261028"]);
});

test("custom range keeps the saved dates", () => {
  const out = applyDateWindow(saved, keys, "custom", postingWindow("custom"));
  expect(out.map((f) => f.value)).toEqual(["20260401", "20261027"]);
});

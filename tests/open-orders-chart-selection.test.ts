import { expect, test } from "bun:test";
import { selectOpenOrderChartGroups } from "../src/lib/open-orders-chart-selection";
const groups = Array.from({length: 12}, (_, i) => ({name: String(i), value: 12-i}));
test("unrestricted opening and Reset show exactly the first 10 ranked groups without changing full totals", () => {
  expect(selectOpenOrderChartGroups(groups, {plants: null, zones: null})).toEqual(groups.slice(0, 10));
  expect(groups.reduce((sum, row) => sum + row.value, 0)).toBe(78);
  expect(groups).toHaveLength(12);
});
test("Plant selection preserves every matching group", () => {
  expect(selectOpenOrderChartGroups(groups, {plants: ["1100"], zones: null})).toEqual(groups);
});
test("Zone selection and combined selections preserve every matching group", () => {
  expect(selectOpenOrderChartGroups(groups, {plants: null, zones: ["Factory Office"]})).toHaveLength(12);
  expect(selectOpenOrderChartGroups(groups, {plants: ["1100"], zones: ["Factory Office"]})).toHaveLength(12);
});
test("empty filtered data and fewer than 10 groups remain intact", () => {
  expect(selectOpenOrderChartGroups([], {plants: [], zones: null})).toEqual([]);
  expect(selectOpenOrderChartGroups(groups.slice(0, 3), {plants: null, zones: null})).toHaveLength(3);
});

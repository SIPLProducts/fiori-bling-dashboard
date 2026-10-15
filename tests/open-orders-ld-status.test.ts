import { expect, test } from 'bun:test';
import { summarizeLdStatus, ldStatusColorRole } from '../src/lib/open-orders-ld-status';
test('Y and N sum their own P_VALUE1-derived values and count unique orders', () => {
  expect(summarizeLdStatus([
    { order: '8001', ldStatus: 'Y', value: 2572907.4 / 10_000_000 },
    { order: '8001', ldStatus: 'Y', value: 1 },
    { order: '8002', ldStatus: 'N', value: 2 },
    { order: '8003', ldStatus: 'N', value: 0 },
  ])).toEqual([{ status: 'Y', count: 1, value: 1.25729074 }, { status: 'N', count: 2, value: 2 }]);
});
test('missing or nonexact statuses do not become Y or N; zero categories remain', () => {
  expect(summarizeLdStatus([{ order: '1', value: 9 }, { order: '2', ldStatus: '', value: 8 }, { order: '3', ldStatus: 'y', value: 7 }, { order: '4', ldStatus: 'Other', value: 6 }])).toEqual([{ status: 'Y', count: 0, value: 0 }, { status: 'N', count: 0, value: 0 }]);
});
test('one order with both Y and N lines counts in each status', () => {
  expect(summarizeLdStatus([{ order: '1', ldStatus: 'Y', value: 5 }, { order: '1', ldStatus: 'N', value: 8 }])).toEqual([{ status: 'Y', count: 1, value: 5 }, { status: 'N', count: 1, value: 8 }]);
});
test('only filtered rows contribute', () => {
  expect(summarizeLdStatus([{ order: '1', ldStatus: 'Y', value: 5 }, { order: '2', ldStatus: 'N', value: 8 }].filter(row => row.value === 5))).toEqual([{ status: 'Y', count: 1, value: 5 }, { status: 'N', count: 0, value: 0 }]);
});

test("Y uses the red destructive role and N the green success role", () => {
 expect(ldStatusColorRole("Y")).toBe("destructive");
 expect(ldStatusColorRole("N")).toBe("success");
});

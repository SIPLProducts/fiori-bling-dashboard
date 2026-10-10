import { expect, test } from 'bun:test';
import { summarizeLdStatus } from '../src/lib/open-orders-ld-status';
test('Y and N sum their own KWERT_INR-derived values and count matching lines', () => {
  expect(summarizeLdStatus([{ ldStatus: 'Y', value: 2572907.4 / 10_000_000 }, { ldStatus: 'Y', value: 1 }, { ldStatus: 'N', value: 2 }, { ldStatus: 'N', value: 0 }])).toEqual([{ status: 'Y', count: 2, value: 1.25729074 }, { status: 'N', count: 2, value: 2 }]);
});
test('missing or nonexact statuses do not become Y or N; zero categories remain', () => {
  expect(summarizeLdStatus([{ value: 9 }, { ldStatus: '', value: 8 }, { ldStatus: 'y', value: 7 }, { ldStatus: 'Other', value: 6 }])).toEqual([{ status: 'Y', count: 0, value: 0 }, { status: 'N', count: 0, value: 0 }]);
});
test('only filtered rows contribute', () => {
  expect(summarizeLdStatus([{ ldStatus: 'Y', value: 5 }, { ldStatus: 'N', value: 8 }].filter(row => row.value === 5))).toEqual([{ status: 'Y', count: 1, value: 5 }, { status: 'N', count: 0, value: 0 }]);
});

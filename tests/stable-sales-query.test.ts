import { describe, expect, test } from "bun:test";
import { isStableSalesQuery, STABLE_SALES_QUERY_OPTIONS } from "../src/lib/stable-sales-query";

describe("stable Sales report query policy", () => {
  test("prevents idle, focus, reconnect, and interval refreshes", () => {
    expect(STABLE_SALES_QUERY_OPTIONS.staleTime).toBe(Infinity);
    expect(STABLE_SALES_QUERY_OPTIONS.gcTime).toBe(Infinity);
    expect(STABLE_SALES_QUERY_OPTIONS.refetchOnWindowFocus).toBe(false);
    expect(STABLE_SALES_QUERY_OPTIONS.refetchOnReconnect).toBe(false);
    expect(STABLE_SALES_QUERY_OPTIONS.refetchInterval).toBe(false);
  });

  test("reuses cached Sales data when a screen or tab remounts", () => {
    expect(STABLE_SALES_QUERY_OPTIONS.refetchOnMount).toBe(false);
  });

  test("protects every Sales dataset from global refreshes", () => {
    expect(isStableSalesQuery(["sd-live-lines"])).toBe(true);
    expect(isStableSalesQuery(["management-sd-lines"])).toBe(true);
    expect(isStableSalesQuery(["zfisales", { fiscalYear: "2026" }])).toBe(true);
    expect(isStableSalesQuery(["sd-sales-kpi", { postingFrom: "2026-04-01" }])).toBe(true);
    expect(isStableSalesQuery(["net-sales-summary", "2026-04-01", "2026-10-05"])).toBe(true);
    expect(isStableSalesQuery(["launchpad"])).toBe(false);
  });
});
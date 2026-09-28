import { describe, expect, test } from "bun:test";
import { STABLE_SALES_QUERY_OPTIONS } from "../src/lib/stable-sales-query";

describe("stable Sales report query policy", () => {
  test("prevents idle, focus, reconnect, and interval refreshes", () => {
    expect(STABLE_SALES_QUERY_OPTIONS.staleTime).toBe(Infinity);
    expect(STABLE_SALES_QUERY_OPTIONS.refetchOnWindowFocus).toBe(false);
    expect(STABLE_SALES_QUERY_OPTIONS.refetchOnReconnect).toBe(false);
    expect(STABLE_SALES_QUERY_OPTIONS.refetchInterval).toBe(false);
  });

  test("loads the latest committed snapshot whenever a Sales screen mounts", () => {
    expect(STABLE_SALES_QUERY_OPTIONS.refetchOnMount).toBe("always");
  });
});
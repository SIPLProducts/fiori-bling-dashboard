import { describe, expect, test } from "bun:test";
import { withAuthRetry } from "../src/lib/auth-retry";

describe("withAuthRetry", () => {
  test("retries 'JWT issued at future' and then succeeds", async () => {
    let calls = 0;
    const data = await withAuthRetry(async () => {
      calls++;
      return calls < 3
        ? { data: null, error: { code: "PGRST303", message: "JWT issued at future" } }
        : { data: [1, 2], error: null };
    }, [0, 0]);
    expect(data).toEqual([1, 2]);
    expect(calls).toBe(3);
  });

  test("does not retry other errors", async () => {
    let calls = 0;
    await expect(withAuthRetry(async () => {
      calls++;
      return { data: null, error: { code: "42501", message: "permission denied" } };
    }, [0, 0])).rejects.toBeTruthy();
    expect(calls).toBe(1);
  });
});

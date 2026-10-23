import { describe, expect, it } from "vitest";
import { canSyncSap } from "./sync-access";

describe("canSyncSap", () => {
  it("allows admin", () => expect(canSyncSap(["admin"])).toBe(true));
  it("allows Sharvi Admin", () => expect(canSyncSap(["super_admin"])).toBe(true));
  it("blocks viewer, approver and buyer", () => expect(canSyncSap(["viewer", "approver", "buyer"])).toBe(false));
  it("blocks users without roles", () => expect(canSyncSap([])).toBe(false));
});

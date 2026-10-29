import { describe, expect, it } from "vitest";
import { postingWindow } from "./sap-pull-shared";

describe("postingWindow previous date", () => {
  it("sends yesterday as both from and to", () => {
    expect(postingWindow("yesterday", new Date(2026, 9, 29, 15, 0))).toEqual({ from: "20261028", to: "20261028" });
  });
});

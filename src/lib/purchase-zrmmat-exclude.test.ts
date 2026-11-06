import { describe, expect, it } from "vitest";
import { excludeZkeyrm } from "./purchase-zrmmat-compare";

describe("excludeZkeyrm", () => {
  it("removes ZKEYRM materials ignoring leading zeros and keeps the rest", () => {
    const rows = [{ material: "006800009002" }, { material: "1000004308" }];
    expect(excludeZkeyrm(rows, ["6800009002"]).map((r) => r.material)).toEqual(["1000004308"]);
  });
});

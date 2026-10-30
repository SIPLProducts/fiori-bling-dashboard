import { describe, expect, it } from "vitest";
import { buildMasterOptions } from "./sap-master";

describe("buildMasterOptions", () => {
  it("dedupes codes and labels them with description", () => {
    const rows = [{ Plnt: "1100", D: "Pune" }, { Plnt: "1000", D: "Delhi" }, { Plnt: "1100", D: "Pune" }, { Plnt: "" }];
    expect(buildMasterOptions(rows, "Plnt", "D")).toEqual([{ value: "1000", label: "1000 - Delhi" }, { value: "1100", label: "1100 - Pune" }]);
  });
});

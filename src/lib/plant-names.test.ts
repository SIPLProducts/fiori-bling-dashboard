import { describe, expect, it } from "vitest";
import { plantShort, setPlantNames } from "./plant-names";
describe("plantShort", () => {
  setPlantNames([{ code: "1100", name: "NCPP" }]);
  it("uses the row's own short name first", () => expect(plantShort("1100", "VSEZ")).toBe("VSEZ"));
  it("falls back to the shared lookup", () => expect(plantShort("1100", "1100")).toBe("NCPP"));
  it("is blank for unknown plants", () => expect(plantShort("9999")).toBe(""));
});

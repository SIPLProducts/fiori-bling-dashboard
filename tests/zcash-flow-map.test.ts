import { describe, expect, it } from "vitest";
import { isZcashFlowEndpoint, mapZcashFlowPayload } from "../src/lib/zcash-flow-map";

const sample = [
  { PROFIT_CENTER: "COFF100001", PROFIT_CENTER_NAME: "CORPORATE PC", GROUP_NAME: "CORPORATE", GL_CODE: "0026342100", GL_NAME: "ADVANCE FOR EXPENSES", CLASSIFICATION: "ADVANCE FOR EXPENSES", NATURE: "SERVICES", PLANT: { WERKS: "1000" }, PROFIT_CENTER_GROUP: "ALLOCATION", DEBIT: 3144131.82, CREDIT: -10000.0, NET: 3134131.82, COLLECTION_DISBURSEMENT: "DISBURSEMENT" },
  { PROFIT_CENTER: "COFF100001", PROFIT_CENTER_NAME: "CORPORATE PC", GROUP_NAME: "CORPORATE", GL_CODE: "0026350500", GL_NAME: "ADVANCE FOR INVESTMENTS", CLASSIFICATION: "ADVANCE FOR INVESTMENTS", NATURE: "INVESTMENTS", PLANT: { WERKS: "1000" }, PROFIT_CENTER_GROUP: "ALLOCATION", DEBIT: 63651273.0, CREDIT: 0, NET: 63651273.0, COLLECTION_DISBURSEMENT: "INVESTMENTS" },
];

describe("ZCASHFLOWN mapping", () => {
  it("maps both sample rows with plant from PLANT.WERKS", () => {
    const { rows } = mapZcashFlowPayload(sample, "ZCASH_FLOW");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ profit_center: "COFF100001", plant: "1000", gl_code: "0026342100", debit: 3144131.82, credit: -10000, net: 3134131.82 });
    expect(rows[1].net).toBe(63651273);
  });
  it("keeps one row per Profit Center + Plant + GL Code, last wins", () => {
    const changed = { ...sample[0], NET: 1 };
    const { rows, duplicates } = mapZcashFlowPayload([sample[0], changed], "ZCASH_FLOW");
    expect(rows).toHaveLength(1);
    expect(rows[0].net).toBe(1);
    expect(duplicates).toBe(1);
  });
  it("returns no rows for the SAP failure message", () => {
    expect(mapZcashFlowPayload({ ERROR_CODE: "103", ERROR_TYPE: "E", MESSAGE: "No Data Available" }, "ZCASH_FLOW").rows).toHaveLength(0);
  });
  it("recognises the endpoint name", () => {
    expect(isZcashFlowEndpoint("ZCASH_FLOW")).toBe(true);
    expect(isZcashFlowEndpoint("Open _Sales _Orders")).toBe(false);
  });
});

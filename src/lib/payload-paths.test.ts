import { describe, expect, it } from "vitest";
import { getPayloadPath, setPayloadPaths } from "./payload-paths";
import { withEndpointDates } from "./sap-pull-shared";

const payload = JSON.stringify({ PLANT: "1100", PURCHASING_DOCUMENT: "", DOCUMENT_DATE: { FROM_DATE: "", TO_DATE: "" }, DELIVERY_DATE: { FROM_DATE: "", TO_DATE: "" } });

describe("Open PO document date payload", () => {
  it("writes Document From/To into DOCUMENT_DATE and keeps PLANT", () => {
    const out = setPayloadPaths(payload, { "DOCUMENT_DATE.FROM_DATE": "20260401", "DOCUMENT_DATE.TO_DATE": "20260415" })!;
    const obj = JSON.parse(out);
    expect(obj.PLANT).toBe("1100");
    expect(obj.DOCUMENT_DATE).toEqual({ FROM_DATE: "20260401", TO_DATE: "20260415" });
    expect(obj.DELIVERY_DATE).toEqual({ FROM_DATE: "", TO_DATE: "" });
    expect(obj.BUDAT_F).toBeUndefined();
    expect(getPayloadPath(out, "DOCUMENT_DATE.TO_DATE")).toBe("20260415");
  });
  it("sends custom document dates and plant unchanged", () => {
    const saved = setPayloadPaths(payload, { "DOCUMENT_DATE.FROM_DATE": "20260401", "DOCUMENT_DATE.TO_DATE": "20260415" })!;
    const sent = JSON.parse(withEndpointDates("Open_Purchase_Order", saved, "custom")!);
    expect(sent.PLANT).toBe("1100");
    expect(sent.DOCUMENT_DATE).toEqual({ FROM_DATE: "20260401", TO_DATE: "20260415" });
  });
});

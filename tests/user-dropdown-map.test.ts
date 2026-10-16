import { describe, expect, test } from "bun:test";
import { isUserDropdownEndpoint, mapUserDropdownPayload } from "../src/lib/user-dropdown-map";

describe("user management dropdown mapper", () => {
  test("recognises the SAP API name", () => {
    expect(isUserDropdownEndpoint("Get_User_Management_Dropdown_RES")).toBe(true);
    expect(isUserDropdownEndpoint("ZCASH_FLOW")).toBe(false);
  });

  test("maps plants and profit centers, keeping one row per code", () => {
    const out = mapUserDropdownPayload({
      plants: [{ plant: "1000", plantName: "VZM" }, { plant: "1000", plantName: "VZM 2" }, { plantName: "x" }],
      profitCenters: [{ profitCenter: "COFF100001", profitCenterName: "Corporate" }],
    }, "Get_User_Management_Dropdown_RES");
    expect(out.received).toBe(4);
    expect(out.invalid).toBe(1);
    expect(out.rows.length).toBe(2);
    expect(out.rows.find((r) => r.category === "plant")?.name).toBe("VZM 2");
    expect(out.rows.find((r) => r.category === "profit_center")?.code).toBe("COFF100001");
  });
});

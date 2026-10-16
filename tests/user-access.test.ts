import { describe, expect, it } from "bun:test";
import { canSee, isZtbnFieldAllowed } from "../src/lib/user-access";

const limited = { unrestricted: false, plants: ["1000", "1100"], profitCenters: ["COFF100001"] };

describe("user plant / profit centre access", () => {
  it("no assignments means everything is visible", () => {
    expect(canSee({ unrestricted: false, plants: [], profitCenters: [] }, "9999", "X")).toBe(true);
  });
  it("requires both plant and profit centre to match", () => {
    expect(canSee(limited, "1000", "COFF100001")).toBe(true);
    expect(canSee(limited, "1000", "SERB010")).toBe(false);
    expect(canSee(limited, "2000", "COFF100001")).toBe(false);
  });
  it("admins see everything", () => {
    expect(canSee({ ...limited, unrestricted: true }, "2000", "SERB010")).toBe(true);
  });
  it("hides other profit centres' TBN columns", () => {
    expect(isZtbnFieldAllowed(limited, "coff100001_debit")).toBe(true);
    expect(isZtbnFieldAllowed(limited, "serb010_credit")).toBe(false);
    expect(isZtbnFieldAllowed(limited, "gl_code")).toBe(true);
  });
});

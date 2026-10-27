import { expect, test } from "bun:test";
import { toSalesRegisterRow } from "../src/lib/sales-register-data";
test("Sales Register Net Value uses NETWR_EX", () => {
  expect(toSalesRegisterRow({ netwr_ex: 150, netwr_tot: 999, netwr_t: 500 }).netValue).toBe(150);
});

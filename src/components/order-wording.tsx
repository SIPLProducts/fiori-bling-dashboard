import { createContext, useContext } from "react";

/** Order Book says "Order Value"/"Order Count"; SIT says "SIT ..."; Open Sales Orders keeps "Open" wording. */
export const OrderBookWording = createContext<boolean | "sit">(false);

export function useOrderWording() {
  const mode = useContext(OrderBookWording);
  const book = Boolean(mode);
  const sit = mode === "sit";
  return {
    book,
    value: sit ? "SIT Value" : book ? "Order Value" : "Open Value",
    count: sit ? "SIT Invoices" : book ? "Order Count" : "Orders",
    openOrders: sit ? "SIT Invoices" : book ? "Order Count" : "Open Orders",
    pendingValue: sit ? "SIT Value (₹ Cr)" : book ? "Order Value (₹ Cr)" : "Pending Value (₹ Cr)",
  };
}

import { createContext, useContext } from "react";

/** Order Book says "Order Value"/"Order Count"; Open Sales Orders keeps "Open" wording. */
export const OrderBookWording = createContext(false);

export function useOrderWording() {
  const book = useContext(OrderBookWording);
  return {
    book,
    value: book ? "Order Value" : "Open Value",
    count: book ? "Order Count" : "Orders",
    openOrders: book ? "Order Count" : "Open Orders",
    pendingValue: book ? "Order Value (₹ Cr)" : "Pending Value (₹ Cr)",
  };
}

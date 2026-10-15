import type { OpenSalesOrder } from './open-sales-orders-data';
/** Order-number rule: an order counts once per status even with several matching lines. */
export function summarizeLdStatus(rows: Pick<OpenSalesOrder, 'order' | 'value' | 'ldStatus'>[]) {
  return (['Y', 'N'] as const).map(status => {
    const orders = new Set<string>();
    let value = 0;
    for (const row of rows) {
      if (row.ldStatus !== status) continue;
      orders.add(row.order);
      value += row.value;
    }
    return { status, count: orders.size, value };
  });
}

export const ldStatusColorRole = (status: "Y" | "N") => status === "Y" ? "destructive" : "success";

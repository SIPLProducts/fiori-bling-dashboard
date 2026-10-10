import type { OpenSalesOrder } from './open-sales-orders-data';
/** Report values are already in Crores; match SAP status text exactly. */
export function summarizeLdStatus(rows: Pick<OpenSalesOrder, 'value' | 'ldStatus'>[]) {
  return (['Y', 'N'] as const).map(status => {
    const matching = rows.filter(row => row.ldStatus === status);
    return { status, count: matching.length, value: matching.reduce((sum, row) => sum + row.value, 0) };
  });
}

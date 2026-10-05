import { supabase } from "@/integrations/supabase/client";

export type OpenSalesOrder = {
  order: string;
  item: string;
  documentType: string;
  customer: string;
  material: string;
  description: string;
  model: string;
  division: string;
  quantity: number;
  openQuantity: number;
  deliveredQuantity: number;
  value: number;
  deliveryDate: string;
  orderDate: string;
  daysOpen: number;
  salesOrg: string;
  channel: string;
  office: string;
  salesGroup: string;
  zone: string;
  salesType: string;
  profitCentre: string;
  mainGroup: string;
  category: string;
  onTime: boolean;
};

type OpenSalesOrderRecord = {
  sales_order: string;
  sales_order_item: string | null;
  order_type: string | null;
  customer_sold_to: string | null;
  customer_sold_to_name: string | null;
  material: string | null;
  material_description: string | null;
  model: string | null;
  product_range: string | null;
  product_type: string | null;
  division: string | null;
  quantity: number | string | null;
  open_quantity: number | string | null;
  delivered_quantity: number | string | null;
  open_value: number | string | null;
  delivery_date: string | null;
  order_date: string | null;
  days_open: number | null;
  sales_org: string | null;
  distribution_channel: string | null;
  sales_office: string | null;
  sales_group: string | null;
  sales_zone: string | null;
  region: string | null;
  sales_type: string | null;
  profit_center: string | null;
  product_category: string | null;
  delivery_status: string | null;
  overall_status: string | null;
};

const OPEN_ORDER_COLUMNS = "sales_order,sales_order_item,order_type,customer_sold_to,customer_sold_to_name,material,material_description,model,product_range,product_type,division,quantity,open_quantity,delivered_quantity,open_value,delivery_date,order_date,days_open,sales_org,distribution_channel,sales_office,sales_group,sales_zone,region,sales_type,profit_center,product_category,delivery_status,overall_status";
const PAGE_SIZE = 1000;
const text = (value: string | null | undefined, fallback = "Unassigned") => value?.trim() || fallback;
const amount = (value: number | string | null) => Number(value) || 0;

function toDashboardRow(row: OpenSalesOrderRecord): OpenSalesOrder {
  const deliveryStatus = text(row.delivery_status, "");
  const overallStatus = text(row.overall_status, "");
  return {
    order: row.sales_order,
    item: text(row.sales_order_item, ""),
    documentType: text(row.order_type),
    customer: text(row.customer_sold_to_name, text(row.customer_sold_to)),
    material: text(row.material),
    description: text(row.material_description, text(row.material)),
    model: text(row.model, text(row.product_type, text(row.product_range))),
    division: text(row.division),
    quantity: amount(row.quantity),
    openQuantity: amount(row.open_quantity),
    deliveredQuantity: amount(row.delivered_quantity),
    value: amount(row.open_value) / 10_000_000,
    deliveryDate: text(row.delivery_date, ""),
    orderDate: text(row.order_date, ""),
    daysOpen: Math.max(0, Number(row.days_open) || 0),
    salesOrg: text(row.sales_org),
    channel: text(row.distribution_channel),
    office: text(row.sales_office),
    salesGroup: text(row.sales_group),
    zone: text(row.sales_zone, text(row.region)),
    salesType: text(row.sales_type),
    profitCentre: text(row.profit_center),
    mainGroup: text(row.product_range),
    category: text(row.product_category),
    onTime: deliveryStatus === "C" || overallStatus === "C",
  };
}

export async function getOpenSalesOrders() {
  const records: OpenSalesOrderRecord[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("open_sales_orders")
      .select(OPEN_ORDER_COLUMNS)
      .eq("is_active_snapshot", true)
      .order("sales_order", { ascending: true })
      .order("sales_order_item", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Unable to load Open Sales Orders: ${error.message}`);
    const page = (data ?? []) as unknown as OpenSalesOrderRecord[];
    records.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return records.map(toDashboardRow);
}
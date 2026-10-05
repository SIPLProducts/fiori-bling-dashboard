import { supabase } from "@/integrations/supabase/client";
import { loadConsistentPagedRows, type SdDatasetMarker } from "@/lib/sd-live";

export type OpenSalesOrder = {
  order: string;
  item: string;
  precedingDocument: string;
  purchaseOrder: string;
  documentType: string;
  purchaseOrderDate: string;
  customerSoldTo: string;
  customerSoldToName: string;
  customerBillTo: string;
  customerBillToName: string;
  customerShipTo: string;
  customerShipToName: string;
  customer: string;
  material: string;
  description: string;
  materialType: string;
  model: string;
  productRange: string;
  productType: string;
  division: string;
  quantity: number;
  openQuantity: number;
  deliveredQuantity: number;
  unit: string;
  currency: string;
  value: number;
  deliveryDate: string;
  orderDate: string;
  daysOpen: number;
  salesOrg: string;
  channel: string;
  plant: string;
  plantName: string;
  office: string;
  salesGroup: string;
  salesRepName: string;
  zone: string;
  region: string;
  country: string;
  salesType: string;
  profitCentre: string;
  mainGroup: string;
  category: string;
  customerGroup: string;
  industryDescription: string;
  usageDescription: string;
  deliveryStatus: string;
  overallStatus: string;
  onTime: boolean;
};

type OpenSalesOrderRecord = {
  id: string;
  updated_at: string;
  sales_order: string;
  sales_order_item: string | null;
  preceding_document: string | null;
  purchase_order: string | null;
  order_type: string | null;
  purchase_order_date: string | null;
  customer_sold_to: string | null;
  customer_sold_to_name: string | null;
  customer_bill_to: string | null;
  customer_bill_to_name: string | null;
  customer_ship_to: string | null;
  customer_ship_to_name: string | null;
  material: string | null;
  material_description: string | null;
  material_type: string | null;
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
  plant: string | null;
  plant_name: string | null;
  sales_office: string | null;
  sales_group: string | null;
  sales_rep_name: string | null;
  sales_zone: string | null;
  region: string | null;
  country: string | null;
  sales_type: string | null;
  profit_center: string | null;
  product_category: string | null;
  customer_group: string | null;
  industry_description: string | null;
  usage_description: string | null;
  delivery_status: string | null;
  overall_status: string | null;
};

const OPEN_ORDER_COLUMNS = "id,updated_at,sales_order,sales_order_item,preceding_document,purchase_order,order_type,order_date,purchase_order_date,delivery_date,sales_org,distribution_channel,division,plant,plant_name,sales_office,sales_group,profit_center,sales_rep_name,customer_sold_to,customer_sold_to_name,customer_bill_to,customer_bill_to_name,customer_ship_to,customer_ship_to_name,material,material_description,material_type,product_category,model,product_range,product_type,region,sales_zone,country,sales_type,industry_description,customer_group,usage_description,quantity,open_quantity,delivered_quantity,unit,currency,open_value,days_open,delivery_status,overall_status";
const PAGE_SIZE = 1000;
const text = (value: string | null | undefined, fallback = "Unassigned") => value?.trim() || fallback;
const amount = (value: number | string | null) => Number(value) || 0;

function toDashboardRow(row: OpenSalesOrderRecord): OpenSalesOrder {
  const deliveryStatus = text(row.delivery_status, "");
  const overallStatus = text(row.overall_status, "");
  return {
    order: row.sales_order,
    item: text(row.sales_order_item, ""),
    precedingDocument: text(row.preceding_document, ""),
    purchaseOrder: text(row.purchase_order, ""),
    documentType: text(row.order_type),
    purchaseOrderDate: text(row.purchase_order_date, ""),
    customerSoldTo: text(row.customer_sold_to, ""),
    customerSoldToName: text(row.customer_sold_to_name, ""),
    customerBillTo: text(row.customer_bill_to, ""),
    customerBillToName: text(row.customer_bill_to_name, ""),
    customerShipTo: text(row.customer_ship_to, ""),
    customerShipToName: text(row.customer_ship_to_name, ""),
    customer: text(row.customer_sold_to_name, text(row.customer_sold_to)),
    material: text(row.material),
    description: text(row.material_description, text(row.material)),
    materialType: text(row.material_type, ""),
    model: text(row.model, text(row.product_type, text(row.product_range))),
    productRange: text(row.product_range, ""),
    productType: text(row.product_type, ""),
    division: text(row.division),
    quantity: amount(row.quantity),
    openQuantity: amount(row.open_quantity),
    deliveredQuantity: amount(row.delivered_quantity),
    unit: text(row.unit, ""),
    currency: text(row.currency, ""),
    value: amount(row.open_value) / 10_000_000,
    deliveryDate: text(row.delivery_date, ""),
    orderDate: text(row.order_date, ""),
    daysOpen: Math.max(0, Number(row.days_open) || 0),
    salesOrg: text(row.sales_org),
    channel: text(row.distribution_channel),
    plant: text(row.plant, ""),
    plantName: text(row.plant_name, ""),
    office: text(row.sales_office),
    salesGroup: text(row.sales_group),
    salesRepName: text(row.sales_rep_name, ""),
    zone: text(row.sales_zone, text(row.region)),
    region: text(row.region, ""),
    country: text(row.country, ""),
    salesType: text(row.sales_type),
    profitCentre: text(row.profit_center),
    mainGroup: text(row.product_range),
    category: text(row.product_category),
    customerGroup: text(row.customer_group, ""),
    industryDescription: text(row.industry_description, ""),
    usageDescription: text(row.usage_description, ""),
    deliveryStatus,
    overallStatus,
    onTime: deliveryStatus === "C" || overallStatus === "C",
  };
}

export async function getOpenSalesOrders() {
  const readMarker = async (): Promise<SdDatasetMarker> => {
    const [countResult, latestResult] = await Promise.all([
      supabase.from("open_sales_orders").select("id", { count: "exact", head: true }).eq("is_active_snapshot", true),
      supabase.from("open_sales_orders").select("updated_at").eq("is_active_snapshot", true).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (countResult.error) throw countResult.error;
    if (latestResult.error) throw latestResult.error;
    return { count: countResult.count ?? 0, latestUpdatedAt: latestResult.data?.updated_at ?? "" };
  };
  const records = await loadConsistentPagedRows<OpenSalesOrderRecord>({
    readMarker,
    readPage: async (from) => {
      const { data, error } = await supabase
      .from("open_sales_orders")
      .select(OPEN_ORDER_COLUMNS)
      .eq("is_active_snapshot", true)
      .order("sales_order", { ascending: true })
      .order("sales_order_item", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
      if (error) throw new Error(`Unable to load Open Sales Orders: ${error.message}`);
      return (data ?? []) as unknown as OpenSalesOrderRecord[];
    },
    rowKey: (row) => row.id,
    pageSize: PAGE_SIZE,
  });
  return records.map(toDashboardRow);
}
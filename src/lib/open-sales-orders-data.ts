export type OpenSalesOrder = {
  order: string;
  customer: string;
  material: string;
  description: string;
  quantity: number;
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

const customers = ["Customer A", "Customer B", "Customer C", "Customer D", "Customer E", "Customer F"];
const zones = ["North Zone", "South Zone", "West Zone", "East Zone", "Central Zone", "Others"];
const profitCentres = ["PC - 101", "PC - 102", "PC - 103", "PC - 104", "PC - 105"];
const mainGroups = ["Hardware", "Projects", "Charging", "Accessories", "Others"];
const categories = ["Category A", "Category B", "Category C", "Category D", "Category E"];

export const OPEN_SALES_ORDERS: OpenSalesOrder[] = Array.from({ length: 72 }, (_, index) => {
  const month = index % 13;
  const orderDate = new Date(Date.UTC(2024, 3 + month, 2 + (index % 22)));
  const deliveryDate = new Date(orderDate.getTime() + (16 + (index % 24)) * 86_400_000);
  return {
    order: `SO-${4500001234 + index}`,
    customer: customers[index % customers.length] ?? "Customer A",
    material: `MAT-${String(1001 + (index % 18)).padStart(4, "0")}`,
    description: `Product ${String.fromCharCode(65 + (index % 12))}`,
    quantity: 580 + ((index * 337) % 2_900),
    value: 1.2 + ((index * 73) % 540) / 100,
    deliveryDate: deliveryDate.toISOString().slice(0, 10),
    orderDate: orderDate.toISOString().slice(0, 10),
    daysOpen: 8 + ((index * 7) % 31),
    salesOrg: index % 3 === 0 ? "1000" : index % 3 === 1 ? "2000" : "3000",
    channel: index % 3 === 0 ? "Direct" : index % 3 === 1 ? "Dealer" : "Projects",
    office: ["Delhi", "Hyderabad", "Mumbai", "Chennai"][index % 4] ?? "Delhi",
    salesGroup: ["Enterprise", "Retail", "OEM"][index % 3] ?? "Enterprise",
    zone: zones[index % zones.length] ?? "North Zone",
    salesType: ["Domestic", "Export", "Service"][index % 3] ?? "Domestic",
    profitCentre: profitCentres[index % profitCentres.length] ?? "PC - 101",
    mainGroup: mainGroups[index % mainGroups.length] ?? "Hardware",
    category: categories[index % categories.length] ?? "Category A",
    onTime: index % 9 !== 0 && index % 7 !== 0,
  };
});

export function getOpenSalesOrders() {
  return Promise.resolve(OPEN_SALES_ORDERS);
}
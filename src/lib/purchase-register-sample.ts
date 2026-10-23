/** Static sample figures (₹ Cr) from the Purchase dashboard reference, until the SAP API is connected. */
export type PurchaseType = "Domestic" | "Imported" | "Service";
export const PURCHASE_TYPES: PurchaseType[] = ["Domestic", "Imported", "Service"];
export const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export const TOTAL_PURCHASE = 2950.88;
export const TYPE_TOTALS: Record<PurchaseType, number> = { Domestic: 2262.12, Imported: 688.76, Service: 0 };

export const MONTHLY: Record<PurchaseType, number[]> = {
  Domestic: [180, 220, 350, 320, 300, 180, 30, 100, 90, 280, 240, 260],
  Imported: [20, 30, 100, 30, 20, 60, 0, 20, 20, 60, 30, 30],
  Service: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export const QUARTERS = [
  { name: "Q1 Apr-Jun", current: 257.54, previous: 423.12 },
  { name: "Q2 Jul-Sep", current: 93.63, previous: 522.64 },
  { name: "Q3 Oct-Dec", current: 80.53, previous: 170.95 },
  { name: "Q4 Jan-Mar", current: null as number | null, previous: 170.95 },
];

export const TOP_MATERIALS = [
  { name: "PURE LEAD BI-150PPM_LABD/001", code: "6800009002", group: "IMPORTED", value: 490.29 },
  { name: "Unassigned (blank)", code: "", group: "-", value: 460.91 },
  { name: "NICKEL HYDROXIDE_M5 COMPOUND", code: "1000024066", group: "IMPORTED", value: 118.48 },
  { name: "CADMIUM OXIDE_SPEC: 52 - 0001-01", code: "1000030587", group: "IMPORTED", value: 78.11 },
  { name: "TCAS_BRAKE_INTERFACE_SYS_E-70", code: "", group: "RAW MATERIAL", value: 75.65 },
  { name: "GUARDIAN RADIO MODEM_10W RF", code: "", group: "IMPORTED", value: 70.52 },
  { name: "NICKEL SULPHATE_CRYSTALLINE_44105", code: "", group: "UNSORTED", value: 58.74 },
  { name: "PURE LEAD BI-50PPM_L", code: "", group: "IMPORTED", value: 41.46 },
  { name: "NICKEL ANODE 42278", code: "", group: "RAW MATERIAL", value: 36.4 },
];

export const TOP_VENDORS = [
  { name: "TODINI METALS & CHEMICALS", code: "2009684", value: 158.36 },
  { name: "HENAN KELONG NEW ENERGY", code: "4000570", value: 88.05 },
  { name: "YASH RESOURCES RECYCLING", code: "2014755", value: 87.82 },
  { name: "FAIVELEY TRANSPORT RAIL", code: "2004214", value: 75.66 },
  { name: "JAIN RESOURCE RECYCLING", code: "2014174", value: 72.16 },
  { name: "SHEETAL WIRELESS TECH PVT", code: "2002739", value: 70.52 },
  { name: "SOULFIDE PTE. LTD", code: "", value: 47.28 },
  { name: "METALLION ALLOYS PRIVATE", code: "", value: 45.88 },
  { name: "SHRI SABHARI SMELTERS PVT", code: "", value: 45.32 },
];

export const MATERIAL_GROUPS = [
  { name: "IMPORTED", value: 1152.84 }, { name: "RAW MATERIAL", value: 1000.66 }, { name: "OTHERS", value: 708.95 },
  { name: "CONSUMABLES", value: 54.38 }, { name: "PACKING MATERIAL", value: 33.95 }, { name: "FINISHED GOODS", value: 0.08 }, { name: "MAINTENANCE", value: 0.02 },
];

export const PLANTS = [
  { code: "1300", name: "HBL THUMUKUNTA", value: 736.75 }, { code: "1600", name: "HBL VRLA-VZM", value: 723.34 },
  { code: "1100", name: "HBL NCPP-SHPT", value: 556.64 }, { code: "1400", name: "HBL NANDIGAON", value: 294.0 },
  { code: "1200", name: "HBL VISAKHAPATNAM (SEZ)", value: 200.48 }, { code: "1409", name: "HBL LFP PLANT - NDG", value: 55.72 },
  { code: "B141", name: "HBL JAIPUR - WCR", value: 41.7 }, { code: "B171", name: "HBL KOLKOTA - ER PROJECTS", value: 33.33 },
  { code: "1105", name: "HBL NCFP-SHPT", value: 28.44 }, { code: "1106", name: "HBL LIBESS-SHPT", value: 23.29 },
];

export const PROFIT_CENTERS = [
  { code: "LGVRD16001", name: "2V VRLA-VIZIANAGARAM", value: 713.53 }, { code: "PGPED13010", name: "TCAS", value: 659.73 },
  { code: "PGNLB11001", name: "NCPP-SHAMEERPET (M)", value: 336.98 }, { code: "PGNLB12001", name: "NCPP-VISAKHAPATNAM", value: 200.32 },
  { code: "LGSBD14001", name: "TGEL-NANDIGAON", value: 194.21 }, { code: "LGSBD14009", name: "NEW LFP PLANT", value: 99.51 },
  { code: "PGNLB11005", name: "NCFP-SHAMEERPET (M)", value: 82.46 }, { code: "PGAPD11001", name: "SILVER ZINC-SHAMEERP", value: 60.09 },
  { code: "SERB141", name: "JAIPUR - WCR - TCAS", value: 53.02 }, { code: "PGAPD11005", name: "LIB - ESS", value: 44.36 },
];

const r2 = (v: number) => Math.round(v * 100) / 100;
export const sumValues = (rows: { value: number }[]) => r2(rows.reduce((s, r) => s + r.value, 0));

/** Year-on-year change of the current FY vs the same quarters of the previous FY, in %. */
export function quarterlyYoy(quarters = QUARTERS): number {
  const done = quarters.filter((q) => q.current != null);
  const cur = done.reduce((s, q) => s + (q.current ?? 0), 0);
  const prev = done.reduce((s, q) => s + q.previous, 0);
  return prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0;
}

/** Month-wise totals for the selected types and month. */
export function monthlyRows(types: PurchaseType[], month: string | null) {
  return MONTHS.map((m, i) => ({ month: m, Domestic: MONTHLY.Domestic[i]!, Imported: MONTHLY.Imported[i]!, Service: MONTHLY.Service[i]! }))
    .filter((r) => !month || r.month === month)
    .map((r) => ({ ...r, total: types.reduce((s, t) => s + r[t], 0) }));
}

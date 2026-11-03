import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OpenPoRow = {
  poNo: string; item: string; poDate: string; plant: string; plantName: string; plantFull: string; poType: string; sloc: string;
  purGroup: string; vendor: string; vendorName: string; material: string; materialName: string;
  uom: string; poQty: number; poValue: number; migoQty: number; migoValue: number; openValue: number;
  deliveryDate: string; days: number; buyer: string; createdBy: string; delivComplete: boolean; deleted: boolean;
  mainGroup: string; subGroup: string; subGroup2: string; subGroup3: string;
};
export type OpenPoStatus = "Open" | "Partially received" | "Overdue" | "Delivery complete";
export const AGING_BUCKETS = ["Not due", "0–30 days late", "31–60 days late", "61–90 days late", "> 90 days late"] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];

const t = (v: unknown) => (v == null ? "" : String(v)).trim();
const n = (v: unknown) => Number(v) || 0;

type Rec = Partial<Record<"ebeln" | "ebelp" | "bedat" | "werks" | "plt_name" | "plt_short" | "bsart" | "lgort" | "ekgrp" | "eknam" | "lifnr" | "name1" | "matnr" | "txz01" | "meins" | "menge" | "netwr" | "menge1" | "dmbtr1" | "eindt" | "days" | "buyer" | "creat" | "elikz" | "loekz" | "mngrp1" | "pcgrp1" | "pcgrp2" | "pcgrp3", unknown>>;
export function toOpenPoRow(r: Rec): OpenPoRow {
  const poValue = n(r.netwr), migoValue = n(r.dmbtr1);
  return {
    poNo: t(r.ebeln), item: t(r.ebelp), poDate: t(r.bedat), plant: t(r.werks), plantName: t(r.plt_short) || t(r.plt_name) || t(r.werks), plantFull: t(r.plt_name),
    poType: t(r.bsart) || "Other", sloc: t(r.lgort) || "—", purGroup: t(r.eknam) || t(r.ekgrp) || "—",
    vendor: t(r.lifnr), vendorName: t(r.name1) || t(r.lifnr) || "—", material: t(r.matnr), materialName: t(r.txz01) || t(r.matnr) || "—",
    uom: t(r.meins), poQty: n(r.menge), poValue, migoQty: n(r.menge1), migoValue, openValue: Math.max(poValue - migoValue, 0),
    deliveryDate: t(r.eindt), days: n(r.days), buyer: t(r.buyer), createdBy: t(r.creat),
    delivComplete: t(r.elikz).toUpperCase() === "X", deleted: !!t(r.loekz),
    mainGroup: t(r.mngrp1) || "Others", subGroup: t(r.pcgrp1) || "Others", subGroup2: t(r.pcgrp2), subGroup3: t(r.pcgrp3),
  };
}

/** Days past delivery date (negative = not yet due). */
export function daysLate(deliveryDate: string, today: string): number {
  if (!deliveryDate) return 0;
  return Math.round((Date.parse(today) - Date.parse(deliveryDate)) / 86400000);
}

export function poStatus(r: OpenPoRow, today: string): OpenPoStatus {
  if (r.delivComplete) return "Delivery complete";
  if (r.deliveryDate && daysLate(r.deliveryDate, today) > 0) return "Overdue";
  if (r.migoQty > 0 || r.migoValue > 0) return "Partially received";
  return "Open";
}

export function agingBucket(r: OpenPoRow, today: string): AgingBucket {
  const d = daysLate(r.deliveryDate, today);
  if (!r.deliveryDate || d <= 0) return "Not due";
  if (d <= 30) return "0–30 days late";
  if (d <= 60) return "31–60 days late";
  if (d <= 90) return "61–90 days late";
  return "> 90 days late";
}

export function openPoTotals(rows: OpenPoRow[]) {
  let po = 0, migo = 0, open = 0;
  const pos = new Set<string>(), vendors = new Set<string>();
  for (const r of rows) { po += r.poValue; migo += r.migoValue; open += r.openValue; pos.add(r.poNo); if (r.vendor) vendors.add(r.vendor); }
  return { poValue: po, migoValue: migo, openValue: open, poCount: pos.size, vendorCount: vendors.size };
}

/** Sum `val` per `key`, sorted desc. */
export function sumBy(rows: OpenPoRow[], key: (r: OpenPoRow) => string, val: (r: OpenPoRow) => number) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

/** IST today as YYYY-MM-DD. */
export const istToday = (now = new Date()) => new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);

const COLS = "id,ebeln,ebelp,bedat,werks,plt_name,plt_short,bsart,lgort,ekgrp,eknam,lifnr,name1,matnr,txz01,meins,menge,netwr,menge1,dmbtr1,eindt,days,buyer,creat,elikz,loekz,mngrp1,pcgrp1,pcgrp2,pcgrp3";
const PAGE = 1000, CONCURRENCY = 6;

export async function getOpenPoRows(): Promise<OpenPoRow[]> {
  const head = await supabase.from("open_purchase_order").select("id", { count: "exact", head: true });
  if (head.error) throw new Error(`Unable to load Open Purchase Orders: ${head.error.message}`);
  const offsets: number[] = [];
  for (let o = 0; o < (head.count ?? 0); o += PAGE) offsets.push(o);
  const pages: Rec[][] = new Array(offsets.length);
  let next = 0;
  const worker = async () => {
    while (next < offsets.length) {
      const i = next++, o = offsets[i]!;
      const { data, error } = await supabase.from("open_purchase_order").select(COLS).order("id").range(o, o + PAGE - 1);
      if (error) throw new Error(`Unable to load Open Purchase Orders: ${error.message}`);
      pages[i] = (data ?? []) as unknown as Rec[];
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, offsets.length) }, worker));
  return pages.flat().map(toOpenPoRow).filter((r) => !r.deleted);
}

export const openPoQuery = queryOptions({ queryKey: ["open-purchase-order", "v1"], queryFn: getOpenPoRows, staleTime: Infinity, refetchOnWindowFocus: false });

/** Client-safe types for the ZFISALES sales analytics dashboard. */

export type SeriesBy = "none" | "companyCode" | "profitCentre";

export type SalesFilters = {
  fiscalYear: string;
  companyCodes: string[];
  profitCentres: string[];
  salesTypes: string[];
  segments: string[];
  postingFrom: string;
  postingTo: string;
  search: string;
  seriesBy: SeriesBy;
};

export type SalesLine = {
  gl: string;
  glName: string;
  profitCtr: string;
  profitCtrName: string;
  group: string;
  salesType: string;
  companyCode: string;
  companyName: string;
  customer: string;
  customerName: string;
  fiscalYear: string;
  docNo: string;
  docDate: string;
  postingDate: string;
  month: string;
  reference: string;
  docType: string;
  pk: string;
  amount: number;
  segment: string;
};

export type NamedValue = { name: string; value: number; count?: number };

export type SeriesAnalytics = {
  dimension: SeriesBy;
  keys: string[];
  keyLabels: Record<string, string>;
  monthly: Array<{ month: string } & Record<string, number>>;
  byDimension: NamedValue[];
};

export type SalesAnalytics = {
  options: {
    fiscalYears: string[];
    companies: { code: string; name: string }[];
    profitCentres: { code: string; name: string }[];
    salesTypes: string[];
    segments: string[];
    postingMin: string;
    postingMax: string;
  };
  kpis: {
    totalRevenue: number;
    documents: number;
    customers: number;
    avgTicket: number;
    topSegmentShare: number;
    exportShare: number;
  };
  monthly: { month: string; revenue: number; documents: number }[];
  byProfitCentre: NamedValue[];
  bySegment: NamedValue[];
  bySalesType: NamedValue[];
  byGroup: NamedValue[];
  topCustomers: NamedValue[];
  rows: SalesLine[];
  totalRows: number;
  series: SeriesAnalytics;
};

export type SharedSalesFilters = {
  segments: string[];
  customers: string[];
  profitCentres: string[];
};

export const emptySharedSalesFilters: SharedSalesFilters = {
  segments: [],
  customers: [],
  profitCentres: [],
};

const STORAGE_KEY = "mis-shared-sales-filters";
const EVENT_NAME = "mis-shared-sales-filters-change";

function normalize(value: unknown): SharedSalesFilters {
  const candidate = value && typeof value === "object" ? value as Partial<SharedSalesFilters> : {};
  const strings = (items: unknown) => Array.isArray(items) ? items.filter((item): item is string => typeof item === "string" && Boolean(item)) : [];
  return {
    segments: strings(candidate.segments),
    customers: strings(candidate.customers),
    profitCentres: strings(candidate.profitCentres),
  };
}

export function readSharedSalesFilters(): SharedSalesFilters {
  if (typeof window === "undefined") return emptySharedSalesFilters;
  try {
    return normalize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"));
  } catch {
    return emptySharedSalesFilters;
  }
}

export function writeSharedSalesFilters(filters: SharedSalesFilters) {
  if (typeof window === "undefined") return;
  const normalized = normalize(filters);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: normalized }));
}

export function subscribeSharedSalesFilters(listener: (filters: SharedSalesFilters) => void) {
  if (typeof window === "undefined") return () => undefined;
  const onChange = (event: Event) => listener(normalize((event as CustomEvent).detail));
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener(readSharedSalesFilters());
  };
  window.addEventListener(EVENT_NAME, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

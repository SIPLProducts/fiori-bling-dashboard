/**
 * Entry point bundled into `middleware/sync-core.mjs` so the on-prem scheduler
 * uses exactly the same row mapping and payload-salvage logic as the portal.
 * Regenerate with: npm run build:sync-core
 */
export { canonicalJson, sha256, mapPayload, mapRow, extractRows, postingDateRange, toIsoDate } from "../../src/lib/zfisales-map";
export { mapOpenSalesOrdersPayload, mapOpenSalesOrderRow } from "../../src/lib/open-sales-orders-map";
export { mapZcashFlowPayload, isZcashFlowEndpoint } from "../../src/lib/zcash-flow-map";
export { mapOrderBookPayload, isOrderBookEndpoint } from "../../src/lib/order-book-map";
export { mapSitPayload, isSitEndpoint } from "../../src/lib/sit-map";
export { mapUserDropdownPayload, isUserDropdownEndpoint } from "../../src/lib/user-dropdown-map";
export {
  extractEmbeddedBody,
  salvageTruncatedArray,
  withPostingDates,
  withEndpointDates,
  isOpenSalesOrdersEndpoint,
  keyValueObject,
  formatBytes,
} from "../../src/lib/sap-pull-shared";

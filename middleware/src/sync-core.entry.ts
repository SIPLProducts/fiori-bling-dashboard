/**
 * Entry point bundled into `middleware/sync-core.mjs` so the on-prem scheduler
 * uses exactly the same row mapping and payload-salvage logic as the portal.
 * Regenerate with: npm run build:sync-core
 */
export { canonicalJson, sha256, mapPayload, mapRow, extractRows, toIsoDate } from "../../src/lib/zfisales-map";
export { mapOpenSalesOrdersPayload, mapOpenSalesOrderRow } from "../../src/lib/open-sales-orders-map";
export {
  extractEmbeddedBody,
  salvageTruncatedArray,
  withPostingDates,
  withEndpointDates,
  keyValueObject,
  formatBytes,
} from "../../src/lib/sap-pull-shared";

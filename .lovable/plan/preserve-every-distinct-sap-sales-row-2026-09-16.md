# Preserve every distinct SAP sales row

## Confirmed cause
- SAP returned 4,180 rows, but the current mapper generated only 3,987 unique database keys. Therefore 193 rows were replaced inside that response before the database write.
- The current key is only `plant + fiscal year + document number + item + GL account`. SAP rows that differ in profit centre, customer, material, amount, or other fields can share that key.
- The database enforces one row per `record_key`, and the sync uses that key for updates. This explains why 4,180 received rows are not necessarily 4,180 stored rows.
- The reported combined difference, 6,367 expected versus 6,090 stored, is consistent with additional key collisions across the two SAP responses. The exact 277 collision rows should be confirmed from the response diagnostics after deployment.

## Changes

1. **Create identity from the full SAP row**
   - Canonically serialize every SAP row with stable field ordering.
   - Generate a deterministic SHA-256 key from the complete row, as selected.
   - Keep the key stable when SAP returns the same fields in a different JSON property order.
   - Continue merging only exact duplicate SAP rows.

2. **Make row accounting explicit**
   - Count exact duplicates separately instead of silently replacing them.
   - Ensure each completed run reconciles as: `received = stored candidates + invalid rows + exact duplicates`.
   - Show and log received, unique, exact duplicates, invalid, new, and updated counts so missing-row questions can be answered from one run.

3. **Use the same identity everywhere**
   - Apply the full-row key to scheduled middleware sync, manual middleware sync, and portal-triggered sync.
   - Regenerate the middleware's shared sync bundle from the same mapper to prevent browser/server differences.

4. **Rebuild Quality data once**
   - Deploy the updated middleware first.
   - Clear the Quality `zfisales_detail` rows once, then run both required profit-centre payloads again.
   - Do not mix old five-field keys with new full-row hash keys; otherwise old rows remain alongside newly keyed rows.
   - Verify the final table count against the sum of unique rows reported by those runs. If SAP returns no exact duplicate rows, the expected count is 6,367.

5. **Verify before Production**
   - Add mapper tests proving two rows with the same old five-field key but different SAP fields are both retained.
   - Add a test proving exact duplicate rows still collapse and property order does not alter identity.
   - Validate Quality counts and totals before applying the same deployment and one-time rebuild to Production.

## Important behavior
Because the identity uses the complete SAP row, changing any SAP field creates a new identity rather than updating the previous version. This preserves every distinct returned row as requested, but a rolling sync will not automatically remove an older version of a row whose values later change.
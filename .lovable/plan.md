# Fix overlapping ZFISALES snapshots

## Outcome

Successful SAP syncs will replace active ZFISALES rows within the returned Posting Date range, even when an older sync used a different overlapping request range. Failed or invalid syncs will leave existing active data unchanged.

## Implementation

- Derive and validate the minimum and maximum Posting Date from every mapped SAP payload.
- Reject non-empty payloads containing rows without a valid Posting Date, so an incomplete replacement cannot silently leave stale data.
- Replace the activation routine with one atomic operation that validates the staged row count and range, serializes concurrent activations, removes active rows inside the replacement range, and activates the staged snapshot.
- Pass the validated range through manual pull, scheduled middleware, and SAP push sync paths.
- Keep full-row hashes and occurrence numbers unchanged so genuine repeated SAP rows remain preserved.
- Regenerate the middleware’s shared sync bundle and add regression tests for date-range derivation and invalid-date handling.
- Record the snapshot replacement rule in project architecture notes and mark the roadmap item complete after verification.

## Existing data

- This change prevents future overlapping snapshots from accumulating.
- It will not automatically delete current production rows during deployment. After deployment, run one controlled full sync for **01-04-2026 through 28-09-2026**; the new activation will replace every active row in that range.
- Reconcile the result against **12,831 SAP detail rows** and **₹1,357.9217584 Crores**.

## Validation

- Run the ZFISALES mapping tests and relevant project checks.
- Confirm the database function migration succeeds.
- Verify a repeated or overlapping sync leaves only the new snapshot active inside its Posting Date range.
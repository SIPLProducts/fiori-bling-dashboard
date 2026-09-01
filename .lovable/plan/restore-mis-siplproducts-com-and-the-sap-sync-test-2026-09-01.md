# Restore mis.siplproducts.com and the SAP sync test

## Why it broke

The live site returns an error because the published server bundle starts up and immediately fails with `No such module "assets/react"`. The hosted build was splitting the framework's server runtime into a chunk that never made it into the uploaded worker. Since that worker handles every page **and** the SAP endpoints, both the site and the 10-minute sync/test stopped working. The preview environment runs a different (dev) pipeline, which is why it kept working.

Two build settings in this project caused the split: the on-prem static SPA shell leaking into the hosted build, and a custom server entry override. Both are already removed, and tree-shaking is disabled for the bundle. What remains is to verify a hosted-preset build produces a complete bundle, publish, and confirm the live site and sync.

## Steps

1. Run a hosted-preset production build locally and confirm the server bundle contains every module it references (no `assets/react`-style dangling import) and that prerender completes.
2. If the dangling module is still present, load the affected browser-only dependency after hydration instead of through the server bundle, then rebuild and re-check.
3. Publish to `mis.siplproducts.com`.
4. Verify the live site loads, then trigger the SAP sync endpoint on the live domain and confirm a new run row and updated rows in the sync tables.
5. Confirm the 10-minute scheduled job succeeds on the live domain and that timestamps show correctly in IST.

## Notes

- No application logic, UI, or data changes — this is build/deploy configuration plus verification only.
- Sync behaviour stays as agreed: insert new records, update existing ones, and never delete when SAP returns nothing.

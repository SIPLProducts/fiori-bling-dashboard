# Correct ZFISALES subgroup mapping

## Confirmed issue

The SAP response supplies:

- `MNGRP1` as the main group
- `PCGRP1` as the sub group

The current mapper already saves `MNGRP1` into `main_group`. However, `sub_group` only checks `SUBGRP1`, `SUB_GROUP`, and `SUBGRP`, so it remains blank when SAP sends `PCGRP1`. The same `PCGRP1` value is currently also saved into `product_group`.

A database check confirmed rows where `raw.PCGRP1 = 'BATTERY'` and `main_group = 'INDL.BATTERY'`, while `sub_group` is blank.

## Changes

1. Update the ZFISALES mapper so `sub_group` uses the first available value from the existing subgroup aliases, then falls back to `PCGRP1`.
2. Apply the identical mapping in the checked-in middleware sync bundle so scheduled, Test, and manual synchronization behave consistently.
3. Keep `PCGRP1` in `product_group` for compatibility with existing reports, while also storing it in `sub_group` according to the confirmed SAP meaning.
4. Add a mapper test proving `MNGRP1 = INDL.BATTERY` and `PCGRP1 = BATTERY` produce:
   - `main_group = INDL.BATTERY`
   - `sub_group = BATTERY`
5. Add an idempotent deployment SQL file that fills only blank `sub_group` values from `raw ->> 'PCGRP1'`; existing nonblank subgroup values will not be overwritten.
6. Apply the backfill to the connected database and provide the same command/script for Quality and Production.
7. Rebuild the shared sync bundle and verify new synchronizations continue storing both fields correctly.

## Validation

- Compare raw `MNGRP1`/`PCGRP1` with stored `main_group`/`sub_group`.
- Confirm the sample becomes `INDL.BATTERY / BATTERY`.
- Confirm no populated subgroup is overwritten.
- Run mapper tests, type checks, and formatting checks.
- Verify the Main Group vs Sub Group dashboard uses the corrected live subgroup values.

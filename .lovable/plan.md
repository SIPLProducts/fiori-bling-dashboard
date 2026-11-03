No change needed. This is only an explanation of how Status works on Open Purchase Orders.

Status is worked out from these SAP keys, and the first rule that matches wins:

1. **Delivery complete**: `ELIKZ` = "X"
2. **Overdue**: `EINDT` (delivery date) is before today
3. **Partially received**: `MENGE1` (MIGO quantity) > 0 or `DMBTR1` (MIGO value) > 0
4. **Open**: anything else

SAP does not send a status key. Status is calculated from the keys above.

If you want a different rule (for example using `DAYS` or `LV_MENGE_SUM`), tell me and I will update this plan.

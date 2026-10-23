## Delete all Sales Register data

- Remove every row stored in the Sales Register table.
- After that, check that the table is empty.
- The table, the screen and the SAP API setting stay as they are. A new **Sync** on Sales _Register in SAP API Settings will fill the table again.
- After the delete, the Sales Register screen shows "No data yet" until the next sync. Click **Refresh** on the screen to see this.

### Technical details
- Run one data change, a delete of all rows in `public.sales_register`, then count the rows to confirm 0.

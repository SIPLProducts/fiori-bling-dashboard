# Move Main/Sub Group row on Order Book

The Order Book Report screen and its PDF get this order (Open Sales Orders stays unchanged):

```text
Row 1: [Month on Month] [Orders by Sales Document Type] [LD]
Row 2: [Orders by Main Group] [Orders by Sub Group]
Row 3: Orders By Zone, Plant-wise order received
... rankings, table
```

## Technical details
- In the shared dashboard, render the group row before the zone/plant block when `isBook` is true. Keep its current position after zone/plant for Open Sales Orders.

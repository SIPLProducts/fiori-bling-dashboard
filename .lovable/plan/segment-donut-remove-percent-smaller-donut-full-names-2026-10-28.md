## Segment donut: remove percent, smaller donut, full names

**Net Sales – Segment card**
- Remove the "· 32.2%" percent from each legend row; show only name and ₹ value.
- Make the donut smaller (about 150px instead of 240px) so the segment names get more room and aren't cut off.
- Hover tooltip keeps the percent.

**Sales Register – Segment card**
- Remove the percent column from the Segment legend; show the segment name with its ₹ Cr value.
- Make the donut smaller (about 110px) so names show fully.
- Distribution Channel donut stays as it is.

PDF picks up the same look automatically. Excel is unchanged.

### Technical
- `sd-live-dashboard.tsx` `SegmentDonut`: chart box `h-[170px] max-w-[160px]`, legend value shows `₹{compact(v)}` only.
- `sales-register-dashboard.tsx` `Donut`: add optional `showPercent` (default true) and `size` props; Segment card passes `showPercent={false}` and smaller size, legend shows value instead.

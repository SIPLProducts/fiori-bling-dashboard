# Net Sales — compact posting date boxes

Make "Posting from" and "Posting to" look like the attached reference: a small, neat
date box where the date text sits on the left and the calendar icon sits snugly at the
right edge, with no empty gap after the icon.

## Changes

In the Net Sales smart filters:

- Give both date boxes a fixed compact width (about 180px) instead of stretching to fill
  the column, so they match the reference proportions.
- Keep the label above each box, both boxes side by side on wider screens.
- Trim the inner right spacing so the calendar icon sits right at the edge of the box.
- Leave the profit centre filter and all filtering behaviour unchanged.

## Technical notes

`src/components/sd-live-dashboard.tsx` (lines ~1318-1338): keep the two-column date
sub-grid but add `w-full max-w-[180px]` to each date `Input`, and change the padding
utilities to `pr-2` with the webkit calendar indicator margin reset to `0` so the icon
is flush without clipping.

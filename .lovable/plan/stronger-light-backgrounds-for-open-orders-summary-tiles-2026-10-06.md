# Stronger light backgrounds for Open Orders summary tiles

## Changes
- Make the backgrounds of Total Open Orders, Open Order Value, and Open Quantity more noticeable while keeping them light.
- Preserve their existing blue, green, and violet colors, icons, borders, text, values, and layout.
- Apply the same appearance on screen and in the PDF; leave all other cards unchanged.

## Technical details
- Increase the three summary background tints from 5% to 15% using the existing semantic color tokens.
- Keep the existing text colors for readable contrast in light and dark themes.

## Verification
- Visually check the three stronger pastel backgrounds and text readability on screen and in the PDF.
- Confirm values, filtering, and surrounding cards remain unchanged.

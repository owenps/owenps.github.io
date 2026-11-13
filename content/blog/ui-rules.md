+++
title = "UI Rules"
date = "2026-11-13T14:21:25-05:00"
evergreen = true

#
# description is optional
#
# description = "An optional description for SEO. If not provided, an automatically created summary will be used."

tags = []
+++

My personal set of UI / design rules I apply across projects. You are welcome to use this to improve your own software.

```md {copy=true}
## Copy

- Copy must earn its place. Show only information users need that isn't already clear from the UI.
  - **WHY:** Unnecessary explanations adds noise and introduce doubts users didn't have.
- Prefer layout over character separators. Separate content with spacing, stacking, or text emphasis rather than dots, em dashes, or vertical bars.

## Fonts

- Reduce the font usage to a minimal set of sizes / weights / colours.
  - **WHY:** Less variety increases reading attention, improves design cohesion and generally looks better.

## Modals

- A button that opens a modal must keep it open on repeated clicks, not toggle it closed.
  - **WHY:** Repeated clicks should preserve the button's intent; closing should require an explicit dismissal action.

## Tooltips

-  Share hover intent across related targets. Delay the first tooltip; show subsequent ones immediately until the user leaves the group.
  - **WHY:** Once intent is established, repeated delays only slow exploration.
```

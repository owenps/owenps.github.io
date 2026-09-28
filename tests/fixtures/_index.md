+++
title = "Hover card examples"
[menu.main]
  name = "Home"
  weight = 1
+++

[Before examples](#examples)

I'm {{< hover-card label="Owen" >}}![Owen Smith](/images/owen-smith.jpg){{< /hover-card >}}, an engineer.

[After photo](#destination)

## Examples

Here is {{< hover-card label="an explanation" >}}A card with **bold text** and *emphasis*, not just a link preview.{{< /hover-card >}}.

Read {{< hover-card label="this project" href="#destination" >}}
### A project preview

A manually authored description.

[Read details](#destination) or [other details](#destination).
{{< /hover-card >}}.

[After project](#destination)

{{< hover-card label="a longer trigger to follow across the page" >}}
A card that trails the pointer while it moves across the trigger.
{{< /hover-card >}}

{{< hover-card label="Long card" >}}
## Lots to read

First paragraph. Long content should scroll inside its card rather than grow the page.

Second paragraph. The card stays within the visible viewport on a small screen.

Third paragraph. It remains readable while the pointer travels into the card.

Fourth paragraph. Touch readers can pin it for as long as they need.

Fifth paragraph. No short timeout interrupts reading.

Sixth paragraph. Keyboard readers can focus the card and scroll too.

Seventh paragraph. A final paragraph to make this deliberately tall.

[Last detail](#destination)
{{< /hover-card >}}

An existing {{< mark note="Original annotation note." >}}highlighted note{{< /mark >}} still works.

<div id="edge-host" style="position: fixed; top: 8px; right: 8px; transform: scale(.85); transform-origin: top right; z-index: 10">
{{< hover-card label="Edge preview" >}}![Photo near a viewport edge](/images/owen-smith.jpg){{< /hover-card >}}
</div>

## Destination

The original link still works.

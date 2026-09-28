# Hover cards

Use the `hover-card` shortcode inline. `label` is the visible trigger; inner Markdown is the card. `href` optionally makes the trigger a real link. `icon="ledge.jpg"` adds a trigger icon from `static/images/favicons/`. `width="209"` optionally sets the card width in pixels (default 232); it still fits within the viewport. Content is manually authored—no remote metadata fetching or React runtime.

## Photo

```go-html-template
I'm {{< hover-card label="Owen Smith" >}}![Owen Smith](/images/owen-smith.jpg){{< /hover-card >}}.
```

## Text

```go-html-template
Try {{< hover-card label="a small explanation" >}}A card with **bold**, *italic*, or longer prose.{{< /hover-card >}}.
```

## Link preview

```go-html-template
Read {{< hover-card label="this project" href="https://github.com/owenps/owenps.github.io" >}}
### Personal website

A Hugo site built on Bear Blog.

[View the source](https://github.com/owenps/owenps.github.io)
{{< /hover-card >}}.
```

## Multiple cards from one trigger

Set `group="true"` and separate each card's Markdown with a line containing `---`. Cards form a slightly overlapping fan with alternating tilts, shrinking together on narrow screens. `width` applies to each card; the whole group stays inside the viewport and shares the same hover, keyboard, and touch behavior.

```go-html-template
{{< hover-card label="with people we love" group="true" >}}
![Friends at home](/images/friends-at-home.webp)

---

![Friends outside](/images/friends-outside.webp)
{{< /hover-card >}}
```

Each card can contain images, text, or links. Omit `group` to keep ordinary Markdown horizontal rules inside a single card.

Images can use site-root paths or URLs relative to the current page bundle. Provide meaningful image alt text. Cards support headings, lists, and links; long content scrolls within the viewport.

- Pointer: hover to open; the card follows horizontally and leans. Moving into it keeps it open.
- Keyboard: focus opens it. Tab reaches card links; Escape closes. Arrow Down focuses the card for scrolling.
- Touch: tap to pin; tap a button trigger again or outside to close. For link triggers, the first tap previews and the second follows the link.
- Reduced motion: no spring, tilt, scale, or blur.
- Without JavaScript, links still navigate and button labels remain plain, disabled text. Keep essential information in the page, not solely in cards.

Assets load only on pages using the shortcode. If adding cards dynamically, include the same CSS/JS and call the exported `initHoverCards(container)` from `/js/hover-card.js`. Repeated initialization is safe.

Existing highlighted-note tooltips are unchanged.

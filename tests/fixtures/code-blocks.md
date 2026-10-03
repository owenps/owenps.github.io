+++
title = "Code blocks"
+++

An ordinary fence:

```tsx {filename="button.tsx"}
// A comment with 42 stays a comment.
export function Button() {
  return <button title="Save">Save</button>;
}
```

An unlabeled fence:

```
plain <text> & "quotes"

  indented
```

An unknown language:

```not-a-language
still readable
```

Inline `code` stays inline.

A visible header (default):

```js
const visible = 42;
```

An explicitly visible header:

```css {showheader=true}
.visible { color: red; }
```

A hidden header:

```python {showheader=false filename="hidden.py"}
print("hidden")
```

{{< code-tabs >}}
{{< code-file name="button.tsx" language="tsx" >}}
import { cn } from "@/lib/cn";

// A very long line, so horizontal scrolling stays inside the code panel rather than overflowing the entire page on narrow screens.
export function Button() {
  return <button className={cn("h-10 rounded-full px-4 transition-[scale] duration-150 active:scale-[0.96]")}>Save</button>;
}

// Preserve this blank line and indentation when copying.

  const message = "<script>window.codeExecuted = true</script> & </template>";
{{< /code-file >}}
{{< code-file name="styles.css" language="css" >}}
/* Strong ease-out: responds at once, then settles. */
.button {
  height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  transition: scale 150ms ease;
}

.button:active {
  scale: 0.96;
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
}
{{< /code-file >}}
{{< /code-tabs >}}

{{< code-tabs >}}
{{< code-file name="other.tsx" language="tsx" >}}
export const other = 42;
{{< /code-file >}}
{{< code-file name="other.css" language="css" >}}
.other { color: red; }
{{< /code-file >}}
{{< /code-tabs >}}

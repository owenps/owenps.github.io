# Code blocks

Markdown fences automatically get syntax highlighting, sticky line numbers, and a copy button. Line numbers are on by default; set `linenos=false` to omit them. An optional filename labels the header:

````markdown
```tsx {filename="button.tsx"}
export const Button = () => <button>Save</button>;
```
````

Headers show by default, labeled with the filename or language. `showheader=false` hides the whole header, including its controls, without affecting highlighting or line numbers:

````markdown
```js {showheader=false linenos=false}
const answer = 42;
```
````

Group related files with tabs:

```go-html-template
{{< code-tabs >}}
{{< code-file name="button.tsx" language="tsx" >}}
export const Button = () => <button>Save</button>;
{{< /code-file >}}
{{< code-file name="styles.css" language="css" >}}
button { border-radius: 999px; }
{{< /code-file >}}
{{< /code-tabs >}}
```

`code-tabs` also accepts `showheader=false`; without a header, all files display together instead of using tabs. Set `linenos=false` on `code-tabs` to omit numbers for all files; individual `code-file` entries can override it with `linenos=true` or `linenos=false`.

`code-file` requires `name`; `language` defaults to plain text. Hugo supports more than TSX/CSS. Left/Right and Home/End navigate tabs. Each file retains its scroll position. Copy excludes line numbers and preserves indentation and blank lines. Clipboard access requires HTTPS or localhost; failures are announced.

Without JavaScript, all files remain readable. Dark mode and reduced motion follow the site settings.

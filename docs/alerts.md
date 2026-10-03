# Alerts

Use the `alert` shortcode for GitHub-style callouts:

```markdown
{{< alert type="note" >}}
Useful **information** readers should know.
{{< /alert >}}
```

Types: `note` (default), `tip`, `important`, `warning`, `caution`. Type names are case-insensitive; unknown types fail the build.

Content supports Markdown, including paragraphs, links, lists, and code. Each type has a label, icon, and colored border that adapts to light/dark mode. Styles load only on pages using the shortcode; no JavaScript required.

This does not change Markdown parsing: GitHub's `> [!NOTE]` syntax is not supported by this shortcode.

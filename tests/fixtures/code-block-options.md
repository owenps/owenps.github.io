+++
title = "Code block options"
+++

```go {filename="plain.go" linenos=false}
func main() {
  run()
}
```

```text {filename="plain.txt" showheader=false linenos=false}
plain <text> & "quotes"

  indented
```

```css {filename="numbered.css" linenos=true}
.box { color: red; }
```

{{< code-tabs linenos=false >}}
{{< code-file name="unnumbered.js" language="js" >}}
export function run() {}
{{< /code-file >}}
{{< code-file name="numbered.css" language="css" linenos=true >}}
.box { color: red; }
{{< /code-file >}}
{{< /code-tabs >}}

+++
title = "Code operators"
+++

```text {filename="operators.txt" linenos=false}
a -> b
a != b
```

```rust {filename="operators.rs" linenos=false showheader=false}
fn differs(a: i32, b: i32) -> bool {
    a != b
}
```

{{< code-tabs >}}
{{< code-file name="operators.js" language="js" linenos=false >}}
const differs = a != b;
// a -> b
{{< /code-file >}}
{{< code-file name="operators.txt" language="text" linenos=false >}}
a -> b
a != b
{{< /code-file >}}
{{< /code-tabs >}}

Inline `a -> b` and `a != b` stay unchanged.

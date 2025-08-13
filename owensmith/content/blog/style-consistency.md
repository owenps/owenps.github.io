+++
title = "Style Consistency"
date = "2025-08-11T22:33:32-04:00"

#
# description is optional
#
# description = "An optional description for SEO. If not provided, an automatically created summary will be used."

tags = ["development", "principles"]
+++

Inspired by Michael Bryzek talk [here](https://www.youtube.com/watch?v=j6ow-UemzBc).

> It should feel like one person has written the entire code base

A core component of clean code and clean architecture is a consistent style. It minimizes cognitive friction, making the system easier to understand and work with, while naturally guiding future changes in the right direction.

Upholding style standards happens end-to-end, from how we name our variables and methods, to how we define our infrastructure.

```java
// ❌ Avoid - Inconsistent getter naming, abbreviations reduce clarity
public int getBalanceAmt() {}

public String accountNumber() {}
```

```java
// ✅ Good - Clear, full names, consistent style
public int getBalanceAmount() {}

public String getAccountNumber() {}
```

Scattered around our codebase at Amazon was parameters with suffix `ID` and (sometimes in the same class!!) other parameters with suffix `Id`. It looks sloppy and doesn't give direction to new contributers on how to name similar parameters.

If your team hasn't already, invest in automatated tooling that assists in checking and abstracting away code formatting and other naming conventions.

Linters like Flake8 (Python) or Checkstyle (Java) do a great job at this already. Some companies / teams go a step further and create an internal "dev" CLI that abstracts all the config and allows you to spin up resources under a common CLI for your company.

For example, [this talk](https://www.youtube.com/watch?v=j6ow-UemzBc) mentions an internal CLI that creates a database with pre-configured settings and a standard name. 

```sh {lineNos=false}
$ dev ddb --name test

Confirm settings:
 - name: testdb
 - storage: 100
 - read_capacity_units: 5
 - write_capacity_units: 5
Proceed? (y/n):
```

At Amazon, our team wrote an entire CLI to manage operations for our service. It wraps around some simple SQL commands but is the foundation to how we deep dive and expose issues.

Consistency might sound obvious, but in practice it’s surprisingly easy for teams to drift away from it. When joining an existing codebase, the best rule of thumb is to “respect what was there before you.” Even if you might write something differently from scratch, following the established patterns keeps the system coherent and predictable for everyone who works on it. Over time, that shared discipline is what makes the codebase feel like it was written by one thoughtful mind.
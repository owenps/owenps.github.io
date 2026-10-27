+++
title = "On Learning Functional Programming From First Principles"
date = "2026-07-31T15:16:48-04:00"
draft = true

#
# description is optional
#
# description = "An optional description for SEO. If not provided, an automatically created summary will be used."

tags = ["programming"]
+++

![Gon from Hunter x Hunter](/images/gon-think.webp)
{.wrap-left}

A common denominator of great software is ...

Thus at the heart of understanding functional programming from first principles, is the desire to write better software.

---

- We will start with our own set of claims and derive techniques from them instead of leaning on established conventions.

<!--

```text {linenos=false showheader = false}
  1. Substitution and algebraic reasoning
     - Substitution
     - Observable effects
     - Purity and local reasoning

  2. Make dependencies and change explicit
     - Hidden dependencies
     - Immutability
     - State transitions as values

  3. Functions as values and composition
     - Functions as values
     - Higher-order functions
     - Composition
     - Folds as composition derived from data shape

  4. Model alternatives and failure as data
     - Algebraic data
     - Total functions
     - Option and Result

  5. Contextual composition
     - Result.and_then
     - Monads as the general pattern
     - Identity and associativity laws

  6. Effect boundaries
     - Functional core / imperative shell
     - Clocks, databases, networks
     - Core decides; shell observes and executes
```
-->

## § 1. Substitution

> *“What we observe is not nature itself, but nature exposed to our method of questioning.”*
> — Werner Heisenberg

A fundamental reasoning rule of algebra is that equal terms may replace one another.

$$
9 = 3^2
$$

Substituting them within a larger expression has no impact on the result.
We can begin to reason about a simple program in the same way. Consider the function:

```h {linenos=false showheader = false}
square(x): x * x
```

So for every mention of `square(x)` we can substitute it for its evaluated result.

```h {linenos=false showheader = false}
square(2) + square(3)
=> (2 * 2) + (3 * 3)
=> (4) + (9)
=> 13
```

Each line replaces one expression with an equal expression. This lets us understand the program algebraically rather than by simulating lower level details.[^1]

A stronger reasoning model is to interpret the function's type.

```h {linenos=false showheader = false}
square(int) -> int
```

Therefore the implementation of `square` can change, but how we reason about the rest of the program is consistent.

```h {linenos=false showheader = false}
square(int) + square(int)
=> int + int
=> int
```

To reason about programs this way, it may feel more familar to consider functions not as a series of *statements* but rather as a *expression*.

### Effects and Observable Behaviour

Unfortunately substitution doesn't hold for all program shapes. Consider a function that marks a message as read.

<!-- needs updated example -->

```js {linenos=false showheader = false}
mark_as_read(message_id):
  database.update(message_id, is_read = true)
  return "ok"
```

Suppose we substitute the call with its returned value:

```js {linenos=false showheader = false}
result = mark_as_read(10)
result = "ok"
```

The variable `result` has the same value, but the program no longer writes to the database. The substitution changed the program's observable behaviour.

The database write is an _effect_: evaluation does something beyond producing a value. An effect is _observable_ when code outside the chosen abstraction boundary can detect that it happened (e.g. database writes, network requests, writing to stdout).

### Purity and local reasoning

This distinction gives us a way to classify functions. We can say a function is _pure_ when it satisfies two conditions.

1. Its result is determined solely by its explicit inputs.
2. Evaluating it produces no observable effects.

Together, these conditions mean that the function's arguments and return value capture its observable meaning.

```js {linenos=false showheader = false}
global x = 5
square(): // not pure by 1.
  return x * x

square(x): // not pure by 2.
  print("ok")
  return x * x

square(x): // pure
  return x * x
```

Pure functions support local reasoning, we can reason about parts of the program without always needing to understand the surrounding context. Under this model, substituting a pure function call with its value preserves the program’s meaning. This is also known as _referential transparency_.[^2]

Pure functions are therefore easier to test and refactor: their dependencies are explicit, they require fewer mocks, and their implementation can change without affecting callers so long as their input-output behaviour remains the same.

This does not mean that effects are unnecessary or inherently undesirable. Useful programs must interact with databases, networks, clocks, and users. The functional-programming question is not how to eliminate effects, but how to keep them explicit and controlled so that they do not obscure the program’s decision-making logic.

---

## § 2. Explicit Dependencies and Change

> “The art of progress is to preserve order amid change and to preserve change amid order.”
> — Alfred North Whitehead

Purity gives us a reasoning goal. The next question is how to redesign evaluations that do not yet satisfy it. A simple trick is to make its hidden dependencies explicit.

Consider a function that compares a deadline with the system clock:

```js {linenos=false showheader = false}
expired(deadline):
  return time.Now() > deadline
```

The result is not determined solely by `deadline`. Calling it twice with the same argument can produce different results.

A small change makes the dependency explicit.

```js {linenos=false showheader = false}
expired(now, deadline):
  return now > deadline
```

This works for read operations but what about effects like database writes? We'll need to revisit this once we have some more tools to work with.

### Immutability

Substitution relies on names standing for values.[^2] Mutations break that assumption,

```js {linenos=false showheader = false}
pay(order, payment):
  order.status = "paid"
  order.payment = payment
  return order
```

Other code may hold a reference to `order` and observe the change. The mutation is therefore an observable effect.

Instead, represent model changes by producing a new value instead of changing an old one.

```js
pay(pending_order, payment):
  return PaidOrder(
    id       = pending_order.id,
    customer = pending_order.customer,
    items    = pending_order.items,
    payment  = payment
  )
```

The pending and paid orders can now co-exist. The first remains a `PendingOrder` and the second is a new `PaidOrder`. So the state doesn't disappear but is now represented by an explicit transition:

```js {showheader = false}
PendingOrder × Payment → PaidOrder
```

So each input retains a stable meaning and the call can be reasoned about through substitution. Explicit values go in, and new values come out.

The next question is how those functions can themselves become values and be combined into larger programs.

---

## § 3. Functions as Values & Composition

> "How we can divide a problem depends on how we can glue the solutions back together"
> — John Hughes

Lets say we want to apply our `square(x)` to every element in a list.

```js
square_all(xs):
  temp = []
  for x in xs:
    append(temp, x*x)
  return temp
```

Now what if we wanted to double or cube every element instead? The function would generally stay the same except for the operation within the for-loop. Rather than defining a new loop for every operation, we can make the operation itself an input:

```js
transform_all(xs, transform):
  temp = []
  for x in xs:
    append(temp, transform(x))
  return temp
```

We've already explored passing values to functions, and functions themselves are just values. So `transform_all` is considered a _higher order function_: a function that accepts or returns another function.

In fact, we just reconstructed the operation commonly called `map: List<A> × (A → B) → List<B>`.

You'll find me using examples of iterative functions where tranditional functional programming will choose a recursive representation. This is intentional as I avoid recursion in nearly all real world programming, it keeps the control flow simple and ensures all executions that should be bounded are.


### Separating Mechanism from Policy

The key insight is not that higher-order functions shorten code, they create a seam between a stable mechanism and a variable policy:

```js
sort_by(comparison, items)
validate(rules, input)
retry(policy, operation)
on_event(handler, event)
````

In each case, the function owns the process, while the caller supplies the behaviour that guides it.

### Composition

For two functions `f: A → B` and `g: B → C` we can connect the output of `f` to `g`, `g(f(x)): C`. Together, they form a new function from `A` to `C`:

```js
compose(g, f): A → C
compose(g, f)(x) = g(f(x))
```

This is _function composition_. Note when `f` and `g` are pure, their composition must be pure too.

Functions are easier to compose when each performs one focused transformation and returns a value that another function can accept. Designing for composition means asking:

1. What concept does this function consume?
2. What concept does it produce?
3. Can the next function consume that output directly?

### Folds

Lets say we want to accumulate a result from elements in a list:

```js
sum(xs):
  temp = 0
  for x in xs:
    temp = temp + x
  return temp
```

It is very similar to the first higher-order function `map` we discovered earlier.

```js
sum(xs, operation):
  temp = 0
  for x in xs:
    temp = operation(temp, x)
  return temp
```

But here we are making an assumption about the basecase `temp = 0`. So we need to pass the basecase as an argument instead.

```js
fold(xs, start, operation):
  temp = start
  for x in xs:
    temp = operation(temp, x)
  return temp
```

A `fold` is more than a loop because its control structure is derived from the recursive shape of the data, while the caller supplies only how each case contributes to the result.

---

## § Final Thoughts

> “I'm not a great programmer. I'm a good programmer, with great habits.”
> — Martin Fowler

To me, functional programming is about minimizing hidden complexity. The paradigm enforces clarity by design.

I believe AI has all the tools capable of writing code that "does the thing". For large codebases I see AI with a heuristic. An engineer who lives in the

But for complex domains and sophisticated business logic, I find a more functional style approach to building software leads to a reduced surface area of side effects and a more simple and logical control flow. With a limited context window an agent within a single session.

If you are interested in writing functional style code in Go, checkout my toolkit {{< site-link url="https://github.com/owenps/gospel" icon="images/icons/github.svg" text="gospel" >}}

[^1]: [Abelson & Sussman, SICP, §1.1.5](https://web.mit.edu/6.001/6.037/sicp.pdf)

[^2]: [Abelson & Sussman, SICP, §3.1.3](https://web.mit.edu/6.001/6.037/sicp.pdf)

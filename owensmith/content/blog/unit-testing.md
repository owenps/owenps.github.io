+++
title = "On Unit Testing"
date = "2025-08-29T11:20:03-04:00"

tags = ["development","principles",]
+++

## The unit of a test is knowledge

We've come to know the term "unit testing" where we invision our system to be comprised of *units*. Developers are taught "a unit is a method", but really it is a question.

* "Does the code run?"
* "Does the method handle bad inputs?"
* "Does it interact with dependencies properly?"

Where the response to each is a simple "yes" or "no".
The better you get at asking questions the more confidence you have in the system's capabilities and understanding of what outcomes it performs.
Just like asking questions in school, we convert from suspicion and belief into knowledge. The more questions we ask, the more we can learn.

When you view code this way, the abstraction of a unit becomes a question, furthering your understanding and knowledge of the system behaviours.

### Exercise: which is better?

```python
# code under test
def full_name(first: str, last: str) -> str:
    return first + "_" + last
```

Which test is better?

```python
# Option A
def test_full_name_1():
    result = full_name("Owen", "Smith")
    assert result == "Owen_Smith"

# Option B
def test_full_name_2():
    result = full_name("Owen", "Smith")
    assert "Owen" in result
    assert "Smith" in result
```

The truth is that they answer two different questions about the system.

* Option A: I care about the exact output of `{first}_{last}`
* Option B: I care that `first` and `last` are included.

Even though Option A is tighly coupled with the implementation, that might be what we care about.
So the better question is "What is the behaviour we wish to validate?".
If we just care that both names appear (disregard any flair or prefix / suffix) then Option B would be preferred.
This way I can update my implementation later and not have to change my tests.

### What kinds of questions should I ask?

In other words: "what tests should I write?", here are a few things to think about.

* Every line of code should be covered by a test. If not, why does that code exist? Do not confuse this for meaning that every line should be validated.
* Avoid coupling tests unnecessarily with implementation details. Ask yourself, "would a client of this class care about this detail?". If not, the test may be too coupled.

Getting better at writing tests is not about covering more specific details. It's a balance of building a concise set of questions that validate the system's behaviour and reinforce your knowledge.

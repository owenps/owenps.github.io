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

### What kinds of questions should I ask?

In other words: "what tests should I write?", here are a few things to think about.

* Every line of code should be covered by a test. If not, why does that code exist?
* Avoid "Why ..." questions. We test behaviours not implementation details.

Getting better a writing tests is not about covering more specific details. It's a balance of building a concise set of questions that validate the system's behaviour and reinforce your knowledge.

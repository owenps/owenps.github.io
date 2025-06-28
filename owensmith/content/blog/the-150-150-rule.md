+++
title = "The 150-150 CR Rule"
date = "2025-06-28T12:31:43-04:00"
draft = false

#
# description is optional
#
# description = "An optional description for SEO. If not provided, an automatically created summary will be used."

tags = ['amazon']
+++

## The "Rule"

The 150-150 CR (a.k.a 'A Code Review A Day') Rule is a development philosophy at Amazon that helps teams ship code faster and at a higher quality.

The **rule is that each code review (CR) is at most 150 lines of changes to source code and 150 lines of changes to test code**. The guidline recommends:

1. Limiting total changes per CR to 150-150 lines or fewer.
1. Submitting at least one 150-150 CR a day.
1. Completing the code review cycle in a day (publish -> review -> push).

[300 lines of code seems to be the sweet spot](http://viewer.media.bitpipe.com/1253203751_753/1284482743_310/11_Best_Practices_for_Peer_Code_Review.pdf) in what a developer can develop and what a reviewer can confidently review in a short amount of time.

Smaller CRs are a win for everyone!

For reviewers: it takes much less energy to digest small changes and less likely to skip over critical defects due to review fatigue. 

For developers: quick turn around time for CRs and higher quality feedback. Features get shipped in incremental stages as opposed to all-or-nothing commits. It even gives you a bump in the number of CRs statistics if you're into that stuff ;).

We call it a *rule* but it more often referred to as a *guide*, use your best judgement on when to tweak it.

## Understanding Types of Code Changes

I generally break down my changes into three categories. Each of which should be implemented and submitted as separate CRs:

1. *New Interfaces* - Focus is purely on design and user experience. These CRs align on the customer experience before diving into implementation details.
1. *Implementation of Existing Interfaces* - Focus on the logic that support these interfaces and writing/validating unit tests that cover all paths.
1. *Refactoring* - Focus on the process and the methods used ([learn more](https://martinfowler.com/books/refactoring.html)). We should be leaning on unit tests to validate that logic is consistent between changes.

Keeping your CR within one category allows your reviewer(s) to better understand their role and expectation to review and provide proper feedback.




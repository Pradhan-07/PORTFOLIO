---
title: "What I learned from my first 50 DSA problems in C++"
date: "2026-10-18"
readTime: "4 min read"
tags: ["C++", "DSA", "LeetCode"]
summary: "Why memorizing solutions fails, how two pointers clicked, and the humility of runtime segmentation faults."
---

When I first started solving data structures and algorithms in C++, I assumed it was about memorizing patterns. I was wrong.

Here is what actually shifted my perspective across my first 50 problems and 69+ programs in my `DSA_CPP` repository:

### 1. Pointers make you understand memory for real
In higher-level languages, references feel abstract. In C++, when you pass a pointer or reference (`&`), you confront stack vs. heap allocation immediately. 

Dereferencing a `nullptr` or seeing `Segmentation fault (core dumped)` teaches you defensive programming faster than any textbook.

```cpp
// Always check boundaries before advancing pointers
ListNode* slow = head;
ListNode* fast = head;
while (fast != nullptr && fast->next != nullptr) {
    slow = slow->next;
    fast = fast->next->next;
}
```

### 2. The Two-Pointer pattern is everywhere
Once you realize sorted arrays or strings can be analyzed from both boundaries simultaneously, `O(n²)` brute force solutions drop to clean `O(n)` linear scans.

### 3. Consistency over marathons
Solving 2 problems every single day beats solving 14 problems on Sunday night. It's the compound effect that keeps problem patterns fresh in muscle memory.

### Next steps
Moving from linear structures into Trees, Graphs, and Dynamic Programming.


# DL Hints Module

This folder is Trinabh's part of the project: generating helpful hints for flashcards.

The goal is not to build the frontend or backend yet. The goal is to provide a small Python module that the backend can call later.

## Responsibility

Given a flashcard question and answer, return progressive hints that help the learner without immediately revealing the answer.

Example:

```python
from dl_hints import FlashcardPrompt, HintGenerator

generator = HintGenerator()
prompt = FlashcardPrompt(
    question="What process do plants use to convert sunlight into energy?",
    answer="photosynthesis",
    subject="biology",
)

hints = generator.generate_hints(prompt)
```

Expected output shape:

```python
[
    Hint(level=1, text="Think about how process, plants connects to the answer in biology.", hint_type="concept"),
    Hint(level=2, text="The answer is one word with 14 characters.", hint_type="structure"),
    Hint(level=3, text="The answer starts with: P.", hint_type="letter"),
]
```

## Backend Contract

The backend should eventually pass:

- `question`: the front of the flashcard
- `answer`: the correct answer
- `subject`: optional category, such as biology, history, or math

The module returns a list of `Hint` objects:

- `level`: hint difficulty/order
- `text`: hint shown to the user
- `hint_type`: category such as concept, structure, or letter

## DL Plan

The current implementation is a dependency-free prototype so the API is usable immediately.

Next deep learning steps:

1. Collect sample flashcards with good human-written hints.
2. Choose a text-generation model or sentence-transformer model.
3. Compare generated hints against the prototype output.
4. Keep the same `HintGenerator.generate_hints()` API so backend integration does not change.


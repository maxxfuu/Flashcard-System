# DL Hints Module

This folder is Trinabh's part of the project: generating helpful hints for flashcards.

The goal is not to build the frontend or backend yet. The goal is to provide a small Python module that the backend can call later.

## Responsibility

Given a flashcard question and answer, return progressive hints that help the learner without immediately revealing the answer.

This module also prepares the prompt context for the future deep learning model. That context can include the flashcard, deck name, and difficulty rating.

Example:

```python
from dl_hints import FlashcardPrompt, HintGenerator

generator = HintGenerator()
prompt = FlashcardPrompt(
    question="What process do plants use to convert sunlight into energy?",
    answer="photosynthesis",
    deck_name="Plant biology",
    difficulty=8,
)

hints = generator.generate_hints(prompt)
model_prompt = generator.build_model_prompt(prompt)
```

Expected output shape:

```python
[
    Hint(level=1, text="Think about how process, plants connects to the answer from the Plant biology deck.", hint_type="concept"),
    Hint(level=2, text="Use a more direct hint because this card is marked difficult.", hint_type="difficulty"),
    Hint(level=3, text="The answer starts with: P.", hint_type="letter"),
]
```

`build_model_prompt()` returns the prompt text that can be passed to a future DL text-generation model.

## Backend Contract

The backend should eventually pass:

- `question`: the front of the flashcard
- `answer`: the correct answer
- `deck_name`: optional deck name
- `difficulty`: card difficulty from 1 to 10

The module returns a list of `Hint` objects:

- `level`: hint difficulty/order
- `text`: hint shown to the user
- `hint_type`: category such as concept, difficulty, structure, or letter

## DL Plan

The current implementation is a dependency-free prototype so the API is usable immediately.

Next deep learning steps:

1. Collect sample flashcards with good human-written hints.
2. Use `build_model_prompt()` to format each training or inference example.
3. Choose a text-generation model or sentence-transformer model.
4. Compare generated hints against the prototype output.
5. Keep the same `HintGenerator.generate_hints()` API so backend integration does not change.

# DL Hints Module

This folder is Trinabh's part of the project: generating helpful hints for flashcards.

The goal is not to build the frontend or backend yet. The goal is to provide a small Python module that the backend can call later.

## Responsibility

Given a flashcard question and answer, return progressive hints that help the learner without immediately revealing the answer.

This module also prepares the prompt context for the future deep learning model. That context can include the flashcard, deck information, and frequency/performance data.

Example:

```python
from dl_hints import FlashcardPrompt, HintGenerator

generator = HintGenerator()
prompt = FlashcardPrompt(
    question="What process do plants use to convert sunlight into energy?",
    answer="photosynthesis",
    subject="biology",
    deck_name="Plant biology",
    deck_description="Photosynthesis and plant energy terms",
    times_seen=4,
    times_correct=1,
    times_incorrect=3,
)

hints = generator.generate_hints(prompt)
model_prompt = generator.build_model_prompt(prompt)
```

Expected output shape:

```python
[
    Hint(level=1, text="Think about how process, plants connects to the answer in biology.", hint_type="concept"),
    Hint(level=2, text="Use a more direct hint because the learner has struggled with this card.", hint_type="practice"),
    Hint(level=3, text="The answer starts with: P.", hint_type="letter"),
]
```

`build_model_prompt()` returns the prompt text that can be passed to a future DL text-generation model.

## Backend Contract

The backend should eventually pass:

- `question`: the front of the flashcard
- `answer`: the correct answer
- `subject`: optional category, such as biology, history, or math
- `deck_name`: optional deck name
- `deck_description`: optional deck-level context
- `times_seen`: how often the learner has seen the card
- `times_correct`: how often the learner answered correctly
- `times_incorrect`: how often the learner missed the card

The module returns a list of `Hint` objects:

- `level`: hint difficulty/order
- `text`: hint shown to the user
- `hint_type`: category such as concept, structure, or letter

## DL Plan

The current implementation is a dependency-free prototype so the API is usable immediately.

Next deep learning steps:

1. Collect sample flashcards with good human-written hints.
2. Use `build_model_prompt()` to format each training or inference example.
3. Choose a text-generation model or sentence-transformer model.
4. Compare generated hints against the prototype output.
5. Keep the same `HintGenerator.generate_hints()` API so backend integration does not change.

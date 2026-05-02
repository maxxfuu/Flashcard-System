"""Hint generation interface for the flashcard system.

This module intentionally has no frontend or backend dependencies. The backend
can later import HintGenerator and call generate_hints for each flashcard.
"""

from __future__ import annotations

from dataclasses import dataclass
import re


@dataclass(frozen=True)
class FlashcardPrompt:
    """Input needed to produce hints for one flashcard."""

    question: str
    answer: str
    subject: str | None = None


@dataclass(frozen=True)
class Hint:
    """One hint returned to a learner."""

    level: int
    text: str
    hint_type: str


class HintGenerator:
    """Generate progressive hints for a flashcard answer.

    Current status:
    - Provides a working, dependency-free prototype.
    - Keeps the API stable for backend integration.
    - Leaves room to replace the internals with a deep learning model later.
    """

    def generate_hints(self, prompt: FlashcardPrompt, max_hints: int = 3) -> list[Hint]:
        question = prompt.question.strip()
        answer = prompt.answer.strip()

        if not question:
            raise ValueError("question must not be empty")
        if not answer:
            raise ValueError("answer must not be empty")
        if max_hints < 1:
            return []

        candidates = [
            self._concept_hint(question, prompt.subject),
            self._shape_hint(answer),
            self._first_letter_hint(answer),
        ]

        return [
            Hint(level=index + 1, text=text, hint_type=hint_type)
            for index, (hint_type, text) in enumerate(candidates[:max_hints])
        ]

    def _concept_hint(self, question: str, subject: str | None) -> tuple[str, str]:
        keywords = self._extract_keywords(question)
        subject_text = f" in {subject}" if subject else ""

        if keywords:
            return (
                "concept",
                f"Think about how {', '.join(keywords[:2])} connects to the answer{subject_text}.",
            )

        return ("concept", f"Focus on the main concept being asked about{subject_text}.")

    def _shape_hint(self, answer: str) -> tuple[str, str]:
        words = answer.split()
        word_count = len(words)

        if word_count == 1:
            return ("structure", f"The answer is one word with {len(answer)} characters.")

        return ("structure", f"The answer has {word_count} words.")

    def _first_letter_hint(self, answer: str) -> tuple[str, str]:
        initials = " ".join(word[0].upper() for word in answer.split() if word)
        return ("letter", f"The answer starts with: {initials}.")

    def _extract_keywords(self, text: str) -> list[str]:
        stop_words = {
            "a",
            "an",
            "and",
            "are",
            "as",
            "for",
            "how",
            "in",
            "is",
            "of",
            "on",
            "or",
            "the",
            "to",
            "what",
            "when",
            "where",
            "which",
            "who",
            "why",
        }
        words = re.findall(r"[A-Za-z][A-Za-z'-]*", text.lower())
        return [word for word in words if word not in stop_words and len(word) > 2]


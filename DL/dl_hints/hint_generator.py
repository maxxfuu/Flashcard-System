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
    deck_name: str | None = None
    difficulty: int = 5


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
        self._validate_difficulty(prompt.difficulty)
        if max_hints < 1:
            return []

        candidates = [
            self._concept_hint(question, prompt.deck_name),
            self._difficulty_hint(prompt.difficulty),
            self._first_letter_hint(answer),
            self._shape_hint(answer),
        ]

        return [
            Hint(level=index + 1, text=text, hint_type=hint_type)
            for index, (hint_type, text) in enumerate(candidates[:max_hints])
        ]

    def generate_ai_hint(self, prompt: FlashcardPrompt) -> str:
        """Generate a single hint using Gemini 2.5 Flash Lite."""
        import os
        from google import genai

        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=self._single_hint_prompt(prompt),
        )
        return response.text.strip()

    def _single_hint_prompt(self, prompt: FlashcardPrompt) -> str:
        question = prompt.question.strip()
        answer = prompt.answer.strip()
        return "\n".join([
            "You are a flashcard study assistant.",
            "Give ONE short hint for this flashcard that helps the learner recall the answer.",
            "Mention the first letter of the answer without revealing it fully.",
            "Return only the hint text — no labels, no numbering, no explanation.",
            "",
            f"Front: {question}",
            f"Answer: {answer}",
        ])

    def build_model_prompt(self, prompt: FlashcardPrompt, max_hints: int = 3) -> str:
        """Create the text prompt a future DL model can use to generate hints."""

        question = prompt.question.strip()
        answer = prompt.answer.strip()

        if not question:
            raise ValueError("question must not be empty")
        if not answer:
            raise ValueError("answer must not be empty")
        self._validate_difficulty(prompt.difficulty)

        difficulty_note = self._difficulty_note(prompt.difficulty)
        deck_context = self._deck_context(prompt)

        return "\n".join(
            [
                "You are generating hints for a flashcard study app.",
                "Create progressive hints that guide the learner toward the back of the card without revealing it immediately.",
                "",
                f"Front of card: {question}",
                f"Back of card: {answer}",
                f"Deck context: {deck_context}",
                f"Difficulty: {prompt.difficulty}/10",
                f"Difficulty guidance: {difficulty_note}",
                "",
                f"Return {max_hints} hints.",
                "Hint 1 should be conceptual.",
                "Hint 2 should give more structure or context.",
                "Hint 3 may include a small clue such as initials, but should not print the full answer.",
            ]
        )

    def _concept_hint(self, question: str, deck_name: str | None) -> tuple[str, str]:
        keywords = self._extract_keywords(question)
        deck_text = f" from the {deck_name} deck" if deck_name else ""

        if keywords:
            return (
                "concept",
                f"Think about how {', '.join(keywords[:2])} connects to the answer{deck_text}.",
            )

        return ("concept", f"Focus on the main concept being asked about{deck_text}.")

    def _shape_hint(self, answer: str) -> tuple[str, str]:
        words = answer.split()
        word_count = len(words)

        if word_count == 1:
            return ("structure", f"The answer is one word with {len(answer)} characters.")

        return ("structure", f"The answer has {word_count} words.")

    def _difficulty_hint(self, difficulty: int) -> tuple[str, str]:
        return ("difficulty", self._difficulty_note(difficulty))

    def _first_letter_hint(self, answer: str) -> tuple[str, str]:
        initials = " ".join(word[0].upper() for word in answer.split() if word)
        return ("letter", f"The answer starts with: {initials}.")

    def _deck_context(self, prompt: FlashcardPrompt) -> str:
        if prompt.deck_name:
            return prompt.deck_name.strip()

        return "none provided"

    def _difficulty_note(self, difficulty: int) -> str:
        if difficulty <= 3:
            return "Use a light hint because this card is marked easy."
        if difficulty <= 7:
            return "Use a medium-strength hint because this card has moderate difficulty."

        return "Use a more direct hint because this card is marked difficult."

    def _validate_difficulty(self, difficulty: int) -> None:
        if not 1 <= difficulty <= 10:
            raise ValueError("difficulty must be between 1 and 10")

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

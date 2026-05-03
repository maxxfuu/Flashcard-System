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
    deck_name: str | None = None
    deck_description: str | None = None
    times_seen: int = 0
    times_correct: int = 0
    times_incorrect: int = 0


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
            self._practice_hint(prompt),
            self._first_letter_hint(answer),
            self._shape_hint(answer),
        ]

        return [
            Hint(level=index + 1, text=text, hint_type=hint_type)
            for index, (hint_type, text) in enumerate(candidates[:max_hints])
        ]

    def build_model_prompt(self, prompt: FlashcardPrompt, max_hints: int = 3) -> str:
        """Create the text prompt a future DL model can use to generate hints."""

        question = prompt.question.strip()
        answer = prompt.answer.strip()

        if not question:
            raise ValueError("question must not be empty")
        if not answer:
            raise ValueError("answer must not be empty")

        difficulty_note = self._difficulty_note(prompt)
        deck_context = self._deck_context(prompt)

        return "\n".join(
            [
                "You are generating hints for a flashcard study app.",
                "Create progressive hints that guide the learner toward the back of the card without revealing it immediately.",
                "",
                f"Front of card: {question}",
                f"Back of card: {answer}",
                f"Subject: {prompt.subject or 'unknown'}",
                f"Deck context: {deck_context}",
                "",
                "Learner history:",
                f"- Times seen: {prompt.times_seen}",
                f"- Times correct: {prompt.times_correct}",
                f"- Times incorrect: {prompt.times_incorrect}",
                f"- Difficulty guidance: {difficulty_note}",
                "",
                f"Return {max_hints} hints.",
                "Hint 1 should be conceptual.",
                "Hint 2 should give more structure or context.",
                "Hint 3 may include a small clue such as initials, but should not print the full answer.",
            ]
        )

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

    def _practice_hint(self, prompt: FlashcardPrompt) -> tuple[str, str]:
        difficulty_note = self._difficulty_note(prompt)

        if prompt.times_seen == 0:
            return ("practice", "This looks new, so start with the broad idea before checking details.")

        return ("practice", difficulty_note)

    def _first_letter_hint(self, answer: str) -> tuple[str, str]:
        initials = " ".join(word[0].upper() for word in answer.split() if word)
        return ("letter", f"The answer starts with: {initials}.")

    def _deck_context(self, prompt: FlashcardPrompt) -> str:
        context_parts = []

        if prompt.deck_name:
            context_parts.append(prompt.deck_name.strip())
        if prompt.deck_description:
            context_parts.append(prompt.deck_description.strip())

        return " - ".join(part for part in context_parts if part) or "none provided"

    def _difficulty_note(self, prompt: FlashcardPrompt) -> str:
        if prompt.times_seen <= 0:
            return "Use a gentle first-time hint because the learner has not practiced this card yet."

        incorrect_rate = prompt.times_incorrect / prompt.times_seen

        if incorrect_rate >= 0.5:
            return "Use a more direct hint because the learner has struggled with this card."
        if prompt.times_correct > prompt.times_incorrect:
            return "Use a lighter hint because the learner has usually answered this correctly."

        return "Use a medium-strength hint because the learner's history is mixed."

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

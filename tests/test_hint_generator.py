import unittest

from dl_hints import FlashcardPrompt, HintGenerator


class HintGeneratorTest(unittest.TestCase):
    def test_generates_progressive_hints(self):
        generator = HintGenerator()
        prompt = FlashcardPrompt(
            question="What process do plants use to convert sunlight into energy?",
            answer="photosynthesis",
            deck_name="Plant biology",
            difficulty=8,
        )

        hints = generator.generate_hints(prompt)

        self.assertEqual(len(hints), 3)
        self.assertEqual(hints[0].level, 1)
        self.assertEqual(hints[1].hint_type, "difficulty")
        self.assertIn("marked difficult", hints[1].text)
        self.assertEqual(hints[2].text, "The answer starts with: P.")

    def test_builds_model_prompt_with_deck_and_difficulty_context(self):
        generator = HintGenerator()
        prompt = FlashcardPrompt(
            question="What process do plants use to convert sunlight into energy?",
            answer="photosynthesis",
            deck_name="Plant biology",
            difficulty=8,
        )

        model_prompt = generator.build_model_prompt(prompt)

        self.assertIn("Front of card: What process", model_prompt)
        self.assertIn("Back of card: photosynthesis", model_prompt)
        self.assertIn("Deck context: Plant biology", model_prompt)
        self.assertIn("Difficulty: 8/10", model_prompt)
        self.assertIn("marked difficult", model_prompt)

    def test_rejects_invalid_difficulty(self):
        generator = HintGenerator()
        prompt = FlashcardPrompt(
            question="What process do plants use to convert sunlight into energy?",
            answer="photosynthesis",
            difficulty=11,
        )

        with self.assertRaises(ValueError):
            generator.generate_hints(prompt)

    def test_rejects_empty_answer(self):
        generator = HintGenerator()
        prompt = FlashcardPrompt(question="What is the capital of France?", answer="")

        with self.assertRaises(ValueError):
            generator.generate_hints(prompt)


if __name__ == "__main__":
    unittest.main()

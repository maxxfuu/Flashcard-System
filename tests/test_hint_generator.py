import unittest

from dl_hints import FlashcardPrompt, HintGenerator


class HintGeneratorTest(unittest.TestCase):
    def test_generates_progressive_hints(self):
        generator = HintGenerator()
        prompt = FlashcardPrompt(
            question="What process do plants use to convert sunlight into energy?",
            answer="photosynthesis",
            subject="biology",
            deck_name="Plant biology",
            times_seen=4,
            times_correct=1,
            times_incorrect=3,
        )

        hints = generator.generate_hints(prompt)

        self.assertEqual(len(hints), 3)
        self.assertEqual(hints[0].level, 1)
        self.assertEqual(hints[1].hint_type, "practice")
        self.assertIn("struggled", hints[1].text)
        self.assertEqual(hints[2].text, "The answer starts with: P.")

    def test_builds_model_prompt_with_deck_and_frequency_context(self):
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

        model_prompt = generator.build_model_prompt(prompt)

        self.assertIn("Front of card: What process", model_prompt)
        self.assertIn("Back of card: photosynthesis", model_prompt)
        self.assertIn("Deck context: Plant biology", model_prompt)
        self.assertIn("Times incorrect: 3", model_prompt)
        self.assertIn("struggled", model_prompt)

    def test_rejects_empty_answer(self):
        generator = HintGenerator()
        prompt = FlashcardPrompt(question="What is the capital of France?", answer="")

        with self.assertRaises(ValueError):
            generator.generate_hints(prompt)


if __name__ == "__main__":
    unittest.main()

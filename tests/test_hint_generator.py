import unittest

from dl_hints import FlashcardPrompt, HintGenerator


class HintGeneratorTest(unittest.TestCase):
    def test_generates_progressive_hints(self):
        generator = HintGenerator()
        prompt = FlashcardPrompt(
            question="What process do plants use to convert sunlight into energy?",
            answer="photosynthesis",
            subject="biology",
        )

        hints = generator.generate_hints(prompt)

        self.assertEqual(len(hints), 3)
        self.assertEqual(hints[0].level, 1)
        self.assertEqual(hints[1].hint_type, "structure")
        self.assertIn("14 characters", hints[1].text)
        self.assertEqual(hints[2].text, "The answer starts with: P.")

    def test_rejects_empty_answer(self):
        generator = HintGenerator()
        prompt = FlashcardPrompt(question="What is the capital of France?", answer="")

        with self.assertRaises(ValueError):
            generator.generate_hints(prompt)


if __name__ == "__main__":
    unittest.main()

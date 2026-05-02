# Flashcard SRS MVP

FastAPI + SQLite flashcard reviewer with a small FSRS-inspired scheduler and a Tailwind single-page UI.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

Open http://127.0.0.1:8000.

## API

- `GET /review` returns the next due card, or `null` when caught up.
- `POST /submit` accepts `{ "card_id": 1, "rating": "again" | "hard" | "good" | "easy" }`.

The SQLite database is created automatically at `flashcards.db` and seeded with sample cards.

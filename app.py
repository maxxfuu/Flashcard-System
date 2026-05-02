from __future__ import annotations

import math
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "flashcards.db"
STATIC_DIR = BASE_DIR / "static"

Rating = Literal["again", "hard", "good", "easy"]
RATING_VALUES: dict[Rating, int] = {
    "again": 1,
    "hard": 2,
    "good": 3,
    "easy": 4,
}


app = FastAPI(title="Flashcard SRS MVP")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


class SubmitRequest(BaseModel):
    card_id: int = Field(gt=0)
    rating: Rating


class ReviewCard(BaseModel):
    id: int
    front: str
    back: str
    due_at: str
    stability: float
    difficulty: float
    review_count: int
    struggle: str


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def parse_dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def serialize_dt(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                front TEXT NOT NULL,
                back TEXT NOT NULL,
                stability REAL NOT NULL DEFAULT 0,
                difficulty REAL NOT NULL DEFAULT 5,
                due_at TEXT NOT NULL,
                review_count INTEGER NOT NULL DEFAULT 0,
                last_rating INTEGER
            )
            """
        )
        existing = conn.execute("SELECT COUNT(*) FROM cards").fetchone()[0]
        if existing:
            return

        now = utcnow()
        cards = [
            ("What does SRS stand for?", "Spaced Repetition System"),
            ("What does FSRS track?", "Memory stability and difficulty."),
            ("What does FastAPI use for data validation?", "Pydantic models."),
            ("Which SQLite type stores timestamps in this app?", "ISO-8601 text in UTC."),
            ("What color means struggle in this MVP?", "Warm colors mean more struggle; cool colors mean less."),
        ]
        conn.executemany(
            """
            INSERT INTO cards (front, back, stability, difficulty, due_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            [(front, back, 0.0, 5.0, serialize_dt(now)) for front, back in cards],
        )


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


def initial_stability(rating: int) -> float:
    # FSRS-inspired first-review stability. Low ratings stay near-term.
    return {
        1: 0.15,
        2: 0.5,
        3: 2.0,
        4: 4.0,
    }[rating]


def update_difficulty(difficulty: float, rating: int) -> float:
    # Lower rating increases difficulty; higher rating relaxes it.
    next_difficulty = difficulty + (3 - rating) * 0.8
    return min(10.0, max(1.0, next_difficulty))


def retrievability(stability: float, elapsed_days: float) -> float:
    if stability <= 0:
        return 0.0
    # FSRS forgetting curve shape, simplified for an MVP.
    return math.pow(1 + elapsed_days / (9 * stability), -1)


def update_stability(stability: float, difficulty: float, rating: int, elapsed_days: float) -> float:
    if rating == 1:
        return max(0.1, stability * 0.35)
    if stability <= 0:
        return initial_stability(rating)

    recall = retrievability(stability, elapsed_days)
    rating_bonus = {
        2: 0.55,
        3: 1.0,
        4: 1.7,
    }[rating]
    difficulty_penalty = 1 + (10 - difficulty) / 10
    growth = 1 + rating_bonus * difficulty_penalty * max(0.2, 1 - recall)
    return min(36500.0, max(0.1, stability * growth))


def interval_for(rating: int, stability: float) -> timedelta:
    if rating == 1:
        return timedelta(minutes=10)
    if rating == 2:
        return timedelta(days=max(1, round(stability * 0.6)))
    if rating == 3:
        return timedelta(days=max(1, round(stability)))
    return timedelta(days=max(2, round(stability * 1.5)))


def struggle_level(row: sqlite3.Row) -> str:
    if row["review_count"] == 0:
        return "new"
    difficulty = row["difficulty"]
    last_rating = row["last_rating"] or 3
    if difficulty >= 7 or last_rating <= 2:
        return "warm"
    if difficulty <= 4 and last_rating >= 3:
        return "cool"
    return "mixed"


def card_payload(row: sqlite3.Row) -> ReviewCard:
    return ReviewCard(
        id=row["id"],
        front=row["front"],
        back=row["back"],
        due_at=row["due_at"],
        stability=round(row["stability"], 2),
        difficulty=round(row["difficulty"], 2),
        review_count=row["review_count"],
        struggle=struggle_level(row),
    )


@app.get("/review", response_model=ReviewCard | None)
def review() -> ReviewCard | None:
    now = serialize_dt(utcnow())
    with connect() as conn:
        row = conn.execute(
            """
            SELECT * FROM cards
            WHERE due_at <= ?
            ORDER BY due_at ASC, difficulty DESC
            LIMIT 1
            """,
            (now,),
        ).fetchone()
        if row is None:
            return None
        return card_payload(row)


@app.post("/submit", response_model=ReviewCard)
def submit(payload: SubmitRequest) -> ReviewCard:
    rating = RATING_VALUES[payload.rating]
    now = utcnow()

    with connect() as conn:
        row = conn.execute("SELECT * FROM cards WHERE id = ?", (payload.card_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Card not found")

        due_at = parse_dt(row["due_at"])
        elapsed_days = max(0.0, (now - due_at).total_seconds() / 86400)
        difficulty = update_difficulty(row["difficulty"], rating)
        stability = update_stability(row["stability"], difficulty, rating, elapsed_days)
        next_due = now + interval_for(rating, stability)

        conn.execute(
            """
            UPDATE cards
            SET stability = ?,
                difficulty = ?,
                due_at = ?,
                review_count = review_count + 1,
                last_rating = ?
            WHERE id = ?
            """,
            (stability, difficulty, serialize_dt(next_due), rating, payload.card_id),
        )
        updated = conn.execute("SELECT * FROM cards WHERE id = ?", (payload.card_id,)).fetchone()

    return card_payload(updated)

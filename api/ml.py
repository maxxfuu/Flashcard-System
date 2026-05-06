from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Union, List
from datetime import datetime, timezone
from pathlib import Path
import sys
import fsrs

sys.path.insert(0, str(Path(__file__).parent.parent / "DL"))
from dl_hints import HintGenerator, FlashcardPrompt

app = FastAPI(
    title="FSRS Microservice",
    description="Spaced repetition intervals via FSRS with round-based frequencies.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = fsrs.Scheduler()


class FSRSRequest(BaseModel):
    card_id: Union[str, int]
    due: Optional[str] = Field(default=None)
    stability: Optional[float] = Field(default=None)
    difficulty: Optional[float] = Field(default=None)
    state: Optional[int] = Field(default=None)
    correctness: int = Field(..., ge=0, le=1)
    confidence: str = Field(..., description='"Low", "Medium", or "High".')
    current_time: float = Field(...)
    avg_time: Optional[float] = Field(default=None)
    used_hint: bool = Field(default=False)


class FSRSResponse(BaseModel):
    card_id: Union[str, int]
    due: str
    stability: float
    difficulty: float
    state: int
    instances_for_next_round: int


def build_card_from_request(request: FSRSRequest) -> fsrs.Card:
    card = fsrs.Card()
    try:
        if request.due:
            card.due = datetime.fromisoformat(request.due.replace("Z", "+00:00"))
        if request.stability is not None:
            card.stability = float(request.stability)
        if request.difficulty is not None:
            card.difficulty = float(request.difficulty)
        if request.state is not None and request.state != 0:
            card.state = fsrs.State(request.state)
    except Exception as e:
        raise ValueError(f"Failed to parse FSRS properties: {str(e)}")
    return card


def process_single_card(request: FSRSRequest) -> FSRSResponse:
    if request.correctness == 0:
        rating = fsrs.Rating.Again
    elif request.correctness == 1:
        confidence = request.confidence.lower()
        if confidence == "low":
            rating = fsrs.Rating.Hard
        elif confidence == "medium":
            rating = fsrs.Rating.Good
        elif confidence == "high":
            rating = fsrs.Rating.Easy
        else:
            raise HTTPException(status_code=422, detail="confidence must be 'Low', 'Medium', or 'High'")
    else:
        raise HTTPException(status_code=422, detail="correctness must be 0 or 1")

    if request.used_hint:
        if rating == fsrs.Rating.Easy:
            rating = fsrs.Rating.Hard
        else:
            rating = fsrs.Rating.Again

    if request.avg_time and request.avg_time > 0:
        time_ratio = request.current_time / request.avg_time
        if time_ratio > 1.5:
            if rating == fsrs.Rating.Easy:
                rating = fsrs.Rating.Good
            elif rating == fsrs.Rating.Good:
                rating = fsrs.Rating.Hard
            elif rating == fsrs.Rating.Hard:
                rating = fsrs.Rating.Again

    try:
        card = build_card_from_request(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    now = datetime.now(timezone.utc)
    result = scheduler.review_card(card, rating, now)
    updated_card = result[0] if isinstance(result, tuple) else result

    if rating == fsrs.Rating.Again:
        instances = 3
    elif rating == fsrs.Rating.Hard:
        instances = 2
    else:
        instances = 1

    if request.used_hint:
        instances += 1

    return FSRSResponse(
        card_id=request.card_id,
        due=updated_card.due.isoformat(),
        stability=float(updated_card.stability),
        difficulty=float(updated_card.difficulty),
        state=int(updated_card.state),
        instances_for_next_round=instances,
    )


@app.post("/api/ml/update-fsrs-state", response_model=List[FSRSResponse])
async def update_fsrs_state(requests: List[FSRSRequest]):
    return [process_single_card(req) for req in requests]


class HintRequest(BaseModel):
    front: str
    back: str


@app.post("/api/ml/generate-hint")
async def generate_hint(req: HintRequest):
    if not req.back:
        return {"hint": "No answer provided to generate hint from."}
    generator = HintGenerator()
    prompt = FlashcardPrompt(question=req.front, answer=req.back)
    hint = generator.generate_ai_hint(prompt)
    return {"hint": hint}

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Any, Union, List
from datetime import datetime, timezone
from pathlib import Path
import sys
import fsrs

sys.path.insert(0, str(Path(__file__).parent.parent / 'DL'))
from dl_hints import HintGenerator, FlashcardPrompt

app = FastAPI(
    title="FSRS Microservice",
    description="Microservice to calculate spaced repetition intervals using FSRS with round-based frequencies.",
    version="1.0.0"
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
    
    # Flattened FSRS State inputs
    due: Optional[str] = Field(default=None, description="The card's existing due date (ISO-8601).")
    stability: Optional[float] = Field(default=None, description="The card's existing FSRS stability.")
    difficulty: Optional[float] = Field(default=None, description="The card's existing FSRS difficulty.")
    state: Optional[int] = Field(default=None, description="The card's existing FSRS state (0=New, 1=Learning, 2=Review, 3=Relearning).")
    
    correctness: int = Field(..., ge=0, le=1, description="1 for correct, 0 for incorrect.")
    confidence: str = Field(..., description='"Low", "Medium", or "High".')
    current_time: float = Field(..., description="Time taken to answer in seconds.")
    avg_time: Optional[float] = Field(default=None, description="Historical average time taken for this card.")
    used_hint: bool = Field(default=False, description="Did the user use a hint?")

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
            card.due = datetime.fromisoformat(request.due.replace('Z', '+00:00'))
        if request.stability is not None:
            card.stability = float(request.stability)
        if request.difficulty is not None:
            card.difficulty = float(request.difficulty)
        # fsrs 6.x uses State 1-3 (Learning/Review/Relearning); 0 ("New") no longer exists.
        # Treat 0 or None as a fresh card (default state).
        if request.state is not None and request.state != 0:
            card.state = fsrs.State(request.state)
    except Exception as e:
        raise ValueError(f"Failed to parse FSRS properties: {str(e)}")
    return card

def process_single_card(request: FSRSRequest) -> FSRSResponse:
    # 1. Baseline Rating
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

    # 2. Hint Penalty
    if request.used_hint:
        # Heavily penalize: drop rating down significantly
        if rating == fsrs.Rating.Easy:
            rating = fsrs.Rating.Hard
        else:
            rating = fsrs.Rating.Again

    # 3. Time Penalty Adjustment
    if request.avg_time and request.avg_time > 0:
        time_ratio = request.current_time / request.avg_time
        if time_ratio > 1.5:
            if rating == fsrs.Rating.Easy:
                rating = fsrs.Rating.Good
            elif rating == fsrs.Rating.Good:
                rating = fsrs.Rating.Hard
            elif rating == fsrs.Rating.Hard:
                rating = fsrs.Rating.Again

    # 4. Processing the Review
    try:
        card = build_card_from_request(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    now = datetime.now(timezone.utc)
    
    # Review
    result = scheduler.review_card(card, rating, now)
    
    # FSRS returns (Card, ReviewLog) in newer versions
    if isinstance(result, tuple):
        updated_card = result[0]
    else:
        updated_card = result 

    # 5. Determine Frequency (Instances for next round)
    # The harder the card, the more instances it gets in the next round.
    if rating == fsrs.Rating.Again:
        instances = 3
    elif rating == fsrs.Rating.Hard:
        instances = 2
    else:
        # Good or Easy means it's learned for today, remove from session rounds.
        instances = 1
        
    # Extra hint penalty for frequency
    if request.used_hint:
        instances += 1

    return FSRSResponse(
        card_id=request.card_id,
        due=updated_card.due.isoformat(),
        stability=float(updated_card.stability),
        difficulty=float(updated_card.difficulty),
        state=int(updated_card.state),
        instances_for_next_round=instances
    )

@app.post("/update-fsrs-state", response_model=List[FSRSResponse])
async def update_fsrs_state(requests: List[FSRSRequest]):
    responses = []
    for req in requests:
        responses.append(process_single_card(req))
    return responses

class HintRequest(BaseModel):
    front: str
    back: str

@app.post("/generate-hint")
async def generate_hint(req: HintRequest):
    if not req.back:
        return {"hint": "No answer provided to generate hint from."}
    generator = HintGenerator()
    prompt = FlashcardPrompt(question=req.front, answer=req.back)
    hints = generator.generate_hints(prompt, max_hints=3)
    if not hints:
        return {"hint": "No hint available."}
    return {"hint": " • ".join(h.text for h in hints)}

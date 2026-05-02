# Flashcard-System: FSRS Microservice

This repository contains a standalone FastAPI microservice that handles spaced repetition mathematics for a dynamic, round-based flashcard game. It wraps the official Free Spaced Repetition Scheduler (FSRS) and adapts it for both **intra-session cramming** and **multi-day long-term retention**.

## Quick Start
```bash
# Install dependencies
pip install -r requirements.txt

# Run the server locally
uvicorn main:app --reload
```

---

## API Endpoint
**`POST /update-fsrs-state`**  
Accepts a JSON array (`List[FSRSRequest]`) of flashcards that were completed during a round, processes their intervals, and returns a JSON array (`List[FSRSResponse]`).

---

### 📥 1. Input Variables (Request Payload)
When sending a request at the end of a round, aggregate the flips for each card. Send exactly one JSON object per unique card.

* **`card_id`** *(String/Int)*: The unique identifier for the flashcard.
* **`due`** *(String/Null)*: The FSRS ISO-8601 timestamp saved from their last session. Send `null` if the card is brand new.
* **`stability`** *(Float/Null)*: The memory strength in days saved from their last session. Send `null` if new.
* **`difficulty`** *(Float/Null)*: The inherent complexity scale (1.0 to 10.0) saved from their last session. Send `null` if new.
* **`state`** *(Int/Null)*: The FSRS lifecycle phase (`0`=New, `1`=Learning, `2`=Review, `3`=Relearning). Send `null` if new.
* **`correctness`** *(Int: 0 or 1)*: The final outcome of the card for the round (`1` for correct, `0` for incorrect).
* **`confidence`** *(String: "Low", "Medium", "High")*: How easily the user remembered the answer on their successful flip.
* **`current_time`** *(Float)*: The average time taken to answer this card (in seconds) during this round.
* **`avg_time`** *(Float/Null)*: The historical average time it takes the user to answer this card across all past sessions.
* **`used_hint`** *(Boolean)*: Set to `true` if the user used a hint on *any* flip during the round.

---

### ⚙️ 2. Internal Logic (How it works)
The microservice performs several custom adjustments before calculating the FSRS math:

1. **Baseline Rating Conversion**: It maps your custom `correctness` and `confidence` strings directly into an `fsrs.Rating` (e.g. Correct + Medium = `Good`).
2. **The Hint Penalty**: If `used_hint` is true, the algorithm drops the rating down to `Again` (or `Hard`), severely penalizing the card's long-term `difficulty` metric and forcing more repetitions.
3. **The Time Penalty**: If the user took significantly longer than usual (`current_time / avg_time > 1.5`), the algorithm automatically downgrades the rating by one level (e.g., stripping an `Easy` rating down to `Good`).
4. **FSRS Processing**: The service feeds these modified ratings into the official `fsrs.Scheduler()` to exponentially grow or shrink the intervals based on human memory decay models.
5. **Round Frequency Calculation**: It mathematically determines how many times this card should appear in the immediate *next* round (`instances_for_next_round`).

---

### 📤 3. Output Variables (Response Payload)
Your backend must use these variables to build the next round **and** save them to the database for future sessions.

* **`card_id`** *(String/Int)*: Use this to update the correct row in your DB.
* **`instances_for_next_round`** *(Int)*: Tells you how many times to inject this card into the active deck for the very next round. If it returns `2`, `push` the card into the upcoming round's array twice. 
* **`due`** *(String)*: **Save to DB.** The optimal timestamp for long-term memory. Query `WHERE due <= NOW()` to build the first round on a different day.
* **`stability`** *(Float)*: **Save to DB.** The strength of the user's memory (in days).
* **`difficulty`** *(Float)*: **Save to DB.** The complexity scale (1.0 to 10.0).
* **`state`** *(Int)*: **Save to DB.** The new FSRS phase (`0`, `1`, `2`, or `3`).

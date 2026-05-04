import { Router, Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/drizzle";
import { cardProgress } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// Shape the frontend POSTs after a round finishes.
interface RoundCardResult {
  card_id: string;
  correctness: 0 | 1;
  confidence: "Low" | "Medium" | "High";
  current_time: number;   // seconds this round (averaged if flipped multiple times)
  used_hint: boolean;
}

// POST /sessions/round
// Accepts the round results, enriches them with stored FSRS state,
// forwards to the ML microservice, then persists the returned state.
router.post("/round", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const results: RoundCardResult[] = req.body;

  if (!Array.isArray(results) || results.length === 0) {
    res.status(400).json({ error: "Body must be a non-empty array of card results" });
    return;
  }

  // Load existing FSRS state for every card in one query.
  const cardIds = results.map((r) => r.card_id);
  const progressRows = await db
    .select()
    .from(cardProgress)
    .where(and(eq(cardProgress.userId, userId)));

  const progressByCardId = new Map(progressRows.map((p) => [p.cardId, p]));

  // Build the payload for the ML microservice.
  const mlPayload = results.map((r) => {
    const prog = progressByCardId.get(r.card_id);
    return {
      card_id: r.card_id,
      due: prog?.due?.toISOString() ?? null,
      stability: prog?.stability ?? null,
      difficulty: prog?.difficulty ?? null,
      state: prog?.state ?? null,
      correctness: r.correctness,
      confidence: r.confidence,
      current_time: r.current_time,
      avg_time: prog?.avgTime ?? null,
      used_hint: r.used_hint,
    };
  });

  // Forward to ML microservice.
  const mlUrl = `${process.env.ML_SERVICE_URL}/update-fsrs-state`;
  let mlResults: Array<{
    card_id: string;
    due: string;
    stability: number;
    difficulty: number;
    state: number;
    instances_for_next_round: number;
  }>;

  try {
    const mlRes = await fetch(mlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mlPayload),
    });
    if (!mlRes.ok) {
      const detail = await mlRes.text();
      console.error("ML service error:", detail);
      res.status(502).json({ error: "ML service returned an error", detail });
      return;
    }
    mlResults = await mlRes.json() as Array<{
      card_id: string;
      due: string;
      stability: number;
      difficulty: number;
      state: number;
      instances_for_next_round: number;
    }>;
  } catch (err) {
    console.error("Failed to reach ML service:", err);
    res.status(502).json({ error: "Could not reach ML service" });
    return;
  }

  // Persist updated FSRS state and update rolling avg_time.
  await Promise.all(
    mlResults.map(async (ml) => {
      const roundResult = results.find((r) => r.card_id === ml.card_id)!;
      const existing = progressByCardId.get(ml.card_id);
      const totalReviews = (existing?.totalReviews ?? 0) + 1;

      // Rolling average: new_avg = old_avg + (current - old_avg) / total
      const prevAvg = existing?.avgTime ?? roundResult.current_time;
      const newAvg = prevAvg + (roundResult.current_time - prevAvg) / totalReviews;

      await db
        .insert(cardProgress)
        .values({
          userId,
          cardId: ml.card_id,
          due: new Date(ml.due),
          stability: ml.stability,
          difficulty: ml.difficulty,
          state: ml.state,
          avgTime: newAvg,
          totalReviews,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [cardProgress.userId, cardProgress.cardId],
          set: {
            due: new Date(ml.due),
            stability: ml.stability,
            difficulty: ml.difficulty,
            state: ml.state,
            avgTime: newAvg,
            totalReviews,
            updatedAt: new Date(),
          },
        });
    })
  );

  res.json(mlResults);
});

export { router as sessionsRoutes };

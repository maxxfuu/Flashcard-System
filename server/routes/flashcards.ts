import { Router, Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/drizzle";
import { decks, cards } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

// GET /flashcards/decks
router.get("/decks", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const userDecks = await db
    .select()
    .from(decks)
    .where(eq(decks.userId, userId))
    .orderBy(decks.createdAt);

  res.json(userDecks);
});

// POST /flashcards/decks
router.post("/decks", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { title, description } = req.body as { title?: string; description?: string };

  if (!title || typeof title !== "string" || title.trim() === "") {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const [newDeck] = await db
    .insert(decks)
    .values({
      userId,
      title: title.trim(),
      description: description?.trim() ?? null,
    })
    .returning();

  res.status(201).json(newDeck);
});

// GET /flashcards/decks/:deckId
router.get("/decks/:deckId", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { deckId } = req.params;

  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);

  if (!deck) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }

  const deckCards = await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(cards.createdAt);

  res.json({ ...deck, cards: deckCards });
});

// PUT /flashcards/decks/:deckId
router.put("/decks/:deckId", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { deckId } = req.params;
  const { title, description } = req.body as { title?: string; description?: string };

  if (title === undefined && description === undefined) {
    res.status(400).json({ error: "At least one of title or description must be provided" });
    return;
  }

  if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
    res.status(400).json({ error: "title must be a non-empty string" });
    return;
  }

  const [existing] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }

  const updates: Partial<{ title: string; description: string | null; updatedAt: Date }> = {
    updatedAt: new Date(),
  };
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim() || null;

  const [updatedDeck] = await db
    .update(decks)
    .set(updates)
    .where(eq(decks.id, deckId))
    .returning();

  res.json(updatedDeck);
});

// DELETE /flashcards/decks/:deckId
router.delete("/decks/:deckId", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { deckId } = req.params;

  const [existing] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }

  await db.delete(decks).where(eq(decks.id, deckId));

  res.status(204).send();
});

// POST /flashcards/decks/:deckId/cards
router.post("/decks/:deckId/cards", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { deckId } = req.params;
  const { front, back, hint } = req.body as { front?: string; back?: string; hint?: string };

  if (!front || typeof front !== "string" || front.trim() === "") {
    res.status(400).json({ error: "front is required" });
    return;
  }
  if (!back || typeof back !== "string" || back.trim() === "") {
    res.status(400).json({ error: "back is required" });
    return;
  }

  const [deck] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);

  if (!deck) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }

  const [newCard] = await db
    .insert(cards)
    .values({
      deckId,
      front: front.trim(),
      back: back.trim(),
      hint: hint?.trim() ?? null,
    })
    .returning();

  res.status(201).json(newCard);
});

// PUT /flashcards/cards/:cardId
router.put("/cards/:cardId", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { cardId } = req.params;
  const { front, back, hint } = req.body as { front?: string; back?: string; hint?: string };

  if (front === undefined && back === undefined && hint === undefined) {
    res.status(400).json({ error: "At least one of front, back, or hint must be provided" });
    return;
  }

  if (front !== undefined && (typeof front !== "string" || front.trim() === "")) {
    res.status(400).json({ error: "front must be a non-empty string" });
    return;
  }
  if (back !== undefined && (typeof back !== "string" || back.trim() === "")) {
    res.status(400).json({ error: "back must be a non-empty string" });
    return;
  }

  const [card] = await db
    .select({ cardId: cards.id })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(and(eq(cards.id, cardId), eq(decks.userId, userId)))
    .limit(1);

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  const updates: Partial<{ front: string; back: string; hint: string | null }> = {};
  if (front !== undefined) updates.front = front.trim();
  if (back !== undefined) updates.back = back.trim();
  if (hint !== undefined) updates.hint = hint.trim() || null;

  const [updatedCard] = await db
    .update(cards)
    .set(updates)
    .where(eq(cards.id, cardId))
    .returning();

  res.json(updatedCard);
});

// DELETE /flashcards/cards/:cardId
router.delete("/cards/:cardId", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { cardId } = req.params;

  const [card] = await db
    .select({ cardId: cards.id })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(and(eq(cards.id, cardId), eq(decks.userId, userId)))
    .limit(1);

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  await db.delete(cards).where(eq(cards.id, cardId));

  res.status(204).send();
});

export { router as flashcardsRoutes };

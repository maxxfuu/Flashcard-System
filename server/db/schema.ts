import {
  pgTable,
  uuid,
  text,
  timestamp,
  real,
  integer,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

// Mirrors auth.users — created automatically via a Supabase trigger (see below).
// Only stores public-facing profile data; auth lives in auth.users.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // same UUID as auth.users.id
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// A deck is a named set of flashcards owned by one user.
export const decks = pgTable("decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(), // FK → auth.users.id (enforced via RLS, not FK)
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// A single flashcard belonging to a deck.
export const cards = pgTable("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  deckId: uuid("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  front: text("front").notNull(),   // question / prompt side
  back: text("back").notNull(),     // answer side
  hint: text("hint"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Per-user FSRS memory state for each card.
// One row per (user, card) pair; updated after every study round.
export const cardProgress = pgTable(
  "card_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),   // FK → auth.users.id
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),

    // --- FSRS state fields (null = card has never been reviewed) ---
    due: timestamp("due", { withTimezone: true }),
    stability: real("stability"),        // memory strength in days
    difficulty: real("difficulty"),      // inherent complexity 1.0–10.0
    state: integer("state"),             // 0=New 1=Learning 2=Review 3=Relearning

    // --- Aggregated timing ---
    avgTime: real("avg_time"),           // rolling average seconds per review
    totalReviews: integer("total_reviews").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserCard: unique().on(table.userId, table.cardId),
  })
);

// ── Type helpers ──────────────────────────────────────────────────────────────
export type Profile = typeof profiles.$inferSelect;
export type Deck = typeof decks.$inferSelect;
export type NewDeck = typeof decks.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type CardProgress = typeof cardProgress.$inferSelect;

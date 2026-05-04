import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/drizzle";
import { profiles } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

// GET /user/me
router.get("/me", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(profile);
});

// PUT /user/me
router.put("/me", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { displayName, avatarUrl } = req.body as {
    displayName?: string;
    avatarUrl?: string;
  };

  if (displayName === undefined && avatarUrl === undefined) {
    res.status(400).json({ error: "At least one of displayName or avatarUrl must be provided" });
    return;
  }

  const updates: Partial<{ displayName: string | null; avatarUrl: string | null }> = {};
  if (displayName !== undefined) updates.displayName = displayName.trim() || null;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl.trim() || null;

  const [updatedProfile] = await db
    .update(profiles)
    .set(updates)
    .where(eq(profiles.id, userId))
    .returning();

  if (!updatedProfile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(updatedProfile);
});

export { router as userRoutes };

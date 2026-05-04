import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";

// Augment Express's Request type so downstream handlers get req.user typed.
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email?: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = { id: data.user.id, email: data.user.email };
  next();
}

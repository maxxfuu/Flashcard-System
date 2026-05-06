import "dotenv/config";
import express from "express";
import cors from "cors";
import { flashcardsRoutes } from "../server/routes/flashcards";
import { userRoutes } from "../server/routes/user";
import { sessionsRoutes } from "../server/routes/sessions";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/api/flashcards", flashcardsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/sessions", sessionsRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

export default app;

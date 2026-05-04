import "dotenv/config";
import express from "express";
import cors from "cors";
import { flashcardsRoutes } from "../routes/flashcards";
import { userRoutes } from "../routes/user";
import { sessionsRoutes } from "../routes/sessions";

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = ["http://localhost:3000"];

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

app.use("/flashcards", flashcardsRoutes);
app.use("/user", userRoutes);
app.use("/sessions", sessionsRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

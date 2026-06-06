import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";

import { env } from "./config/env.js";
import { auth } from "./lib/auth.js";
import { authProtection } from "./middlewares/arcjet.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { healthRouter } from "./routes/health.routes.js";
import { apiRouter } from "./routes/index.routes.js";

export const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);
app.use("/api/health", healthRouter);
app.all("/api/auth/*splat", authProtection, toNodeHandler(auth));
app.use(express.json());

app.use("/api", apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

import { Router } from "express";

import { getAiServiceHealthController } from "../controllers/ai.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.get("/health", getAiServiceHealthController);

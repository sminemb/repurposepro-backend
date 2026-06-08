import { Router } from "express";

import { getAiServiceHealthController } from "../controllers/ai.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const aiRouter = Router();

// User authentication is the current internal-route guard. Use service-level
// authorization before exposing internal routes in production.
aiRouter.use(requireAuth);

aiRouter.get("/health", getAiServiceHealthController);

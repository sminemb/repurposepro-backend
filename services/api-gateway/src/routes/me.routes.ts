import { Router } from "express";

import { getMe } from "../controllers/me.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const meRouter = Router();

meRouter.get("/", requireAuth, getMe);

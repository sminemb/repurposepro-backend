import { Router } from "express";

import { uploadProjectVideo } from "../controllers/videos.controller.js";
import { uploadProtection } from "../middlewares/arcjet.middleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { uploadSingleVideo } from "../middlewares/upload.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { projectIdParamSchema } from "../validators/project.validator.js";

export const videosRouter = Router();

videosRouter.post(
  "/:id/upload",
  uploadProtection,
  requireAuth,
  validate({
    params: projectIdParamSchema,
  }),
  uploadSingleVideo,
  uploadProjectVideo,
);

import { Router } from "express";

import {
  cancelJobController,
  getJobController,
  listProjectJobsController,
  startProjectProcessingController,
} from "../controllers/jobs.controller.js";
import {
  generalApiProtection,
  processingProtection,
} from "../middlewares/arcjet.middleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  jobIdParamSchema,
  listProjectJobsQuerySchema,
  projectJobIdParamSchema,
} from "../validators/job.validator.js";

export const jobsRouter = Router();

jobsRouter.post(
  "/projects/:id/process",
  processingProtection,
  requireAuth,
  validate({
    params: projectJobIdParamSchema,
  }),
  startProjectProcessingController,
);

jobsRouter.get(
  "/jobs/:id",
  generalApiProtection,
  requireAuth,
  validate({
    params: jobIdParamSchema,
  }),
  getJobController,
);

jobsRouter.get(
  "/projects/:id/jobs",
  generalApiProtection,
  requireAuth,
  validate({
    params: projectJobIdParamSchema,
    query: listProjectJobsQuerySchema,
  }),
  listProjectJobsController,
);

jobsRouter.post(
  "/jobs/:id/cancel",
  generalApiProtection,
  requireAuth,
  validate({
    params: jobIdParamSchema,
  }),
  cancelJobController,
);

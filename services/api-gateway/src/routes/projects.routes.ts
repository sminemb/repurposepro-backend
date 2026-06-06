import { Router } from "express";

import {
  createProjectController,
  deleteProjectController,
  getProjectController,
  listProjectsController,
  updateProjectController,
} from "../controllers/projects.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createProjectBodySchema,
  projectIdParamSchema,
  updateProjectBodySchema,
} from "../validators/project.validator.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.post(
  "/",
  validate({
    body: createProjectBodySchema,
  }),
  createProjectController,
);

projectsRouter.get("/", listProjectsController);

projectsRouter.get(
  "/:id",
  validate({
    params: projectIdParamSchema,
  }),
  getProjectController,
);

projectsRouter.patch(
  "/:id",
  validate({
    params: projectIdParamSchema,
    body: updateProjectBodySchema,
  }),
  updateProjectController,
);

projectsRouter.delete(
  "/:id",
  validate({
    params: projectIdParamSchema,
  }),
  deleteProjectController,
);
